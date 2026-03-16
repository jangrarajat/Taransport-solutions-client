// FrightTable.jsx
import { Printer, TruckElectric, X, Trash2, Edit3, FileSpreadsheet, AlertTriangle, FileText, ArrowDownToLine } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import EditBiltyModal from "./bill/EditBiltyModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import * as XLSX from 'xlsx';
import { refreshToken } from "../api/api";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { backendUrl } from "../utils/backendUrl";

// Maintenance Modal
const MaintenanceModal = ({ isOpen, onClose, bill, onUpdate, showNotification }) => {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(`${backendUrl}/api/bill/update-maintenance/${bill._id}`,
        { amount: Number(amount), remark }, { withCredentials: true });
      if (res.data.success) {
        onUpdate();
        showNotification(true, "Maintenance Added! 🚛");
        setAmount(""); setRemark("");
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken()
        if (isRefreshed) handleSubmit()
      }
      showNotification(false, "Update failed");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 uppercase">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md  shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Vehicle Maintenance</h2>
          <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" />
          <input required type="text" placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)}
            className="w-full border   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" />
          <button disabled={loading} className="w-full bg-orange-500 text-white py-4   font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
            {loading ? <ButtonLoaders /> : "Save & Update"}
          </button>
        </form>
      </div>
    </div>
  );
};

const FrightTable = ({
  data,
  loading,
  refreshData,
  showNotification,
  vehicleTotalBalance,
  openingBalance,
  closingBalance,
  vehicleList   // ← new prop
}) => {
  const [addPayment, setAddPayment] = useState(false);
  const [printBityBtn, setPrintBityBtn] = useState(false);
  const [pData, setPData] = useState([]);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [date, setDate] = useState();
  const [nameOfRecipient, setNameOfRecipient] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [amount, setAmount] = useState();
  const [remark, setRemark] = useState('');
  const [destination, setDestination] = useState('');

  const headerCheckboxRef = useRef(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.DateOfIssueOfInvoice);
      const dateB = new Date(b.DateOfIssueOfInvoice);
      return dateA - dateB;
    });
  }, [data]);

  const runningBalances = useMemo(() => {
    if (!sortedData.length) return [];
    const startBalance = openingBalance !== null ? openingBalance : vehicleTotalBalance;
    if (startBalance === null || startBalance === undefined) return [];
    let running = startBalance;
    return sortedData.map((bill) => {
      running = running - (bill.tripBalanceAmmount || 0);
      return running;
    });
  }, [sortedData, openingBalance, vehicleTotalBalance]);

  const startBalance = openingBalance !== null ? openingBalance : vehicleTotalBalance;
  const hasValidBalance = startBalance !== null && startBalance !== undefined;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const allIds = sortedData.map(item => item._id);
      const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, sortedData]);

  const getExportData = () => selectedIds.length > 0 ? sortedData.filter(b => selectedIds.includes(b._id)) : sortedData;

  const parseQty = (qty) => {
    if (qty === undefined || qty === null || qty === "") return 0;
    const num = Number(qty);
    return isNaN(num) ? 0 : num;
  };

  const calculateTotals = (exportData) => {
    return exportData.reduce((acc, bill) => {
      acc.qty += parseQty(bill.Quantity);
      acc.freight += bill.frightAmount || 0;
      acc.commission += bill.commeion || 0;
      acc.advance += bill.advanceCash || 0;
      acc.diesel += bill.desil || 0;
      acc.maintenance += (bill.maintenance?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);
      acc.balance += bill.tripBalanceAmmount || 0;
      acc.final += bill.faynalAmmount || 0;
      return acc;
    }, {
      qty: 0,
      freight: 0,
      commission: 0,
      advance: 0,
      diesel: 0,
      maintenance: 0,
      balance: 0,
      final: 0
    });
  };

  const downloadStyledExcel = () => {
    const exportData = getExportData();
    const totals = calculateTotals(exportData);

    const headers = [
      "Date", "LR No.", "Challan No", "Vehicle", "DI No.",
      "Recipient", "Destination", "Qty", "Rate PMT",
      "Freight (₹)", "Commission (₹)", "Advance (₹)", "Diesel (₹)", "Pump",
      "Final Amount (₹)", "Remark", "Balance (₹)"
    ];

    const rows = exportData.map((bill) => [
      bill.DateOfIssueOfInvoice || "",
      bill.LRNO || "",
      bill.challanNO || "",
      bill.VehicleNo || "",
      bill.DINo || "",
      bill.NameOfRecipient || "",
      bill.Destination || "",
      parseQty(bill.Quantity),
      bill.pmt || "",
      bill.frightAmount || 0,
      bill.commeion || 0,
      bill.advanceCash || 0,
      bill.desil || 0,
      bill.petrolPump || "N/A",
      bill.faynalAmmount || 0,
      bill.remark || "",
      bill.tripBalanceAmmount || 0
    ]);

    const totalsRow = [
      "TOTAL", "", "", "", "", "", "",
      totals.qty,
      "",
      totals.freight,
      totals.commission,
      totals.advance,
      totals.diesel,
      "",
      totals.final,
      "",
      totals.balance
    ];

    const summaryLine = hasValidBalance
      ? `<p style="font-weight: bold; margin-bottom: 8px;">Opening Balance: ₹${runningBalances.length ? runningBalances[runningBalances.length - 1] : '-'} | Closing Balance: ₹${startBalance !== null ? startBalance : '-'}</p>`
      : '';

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Fright Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #1e293b; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th { background-color: #1e293b; color: white; font-weight: bold; padding: 8px; text-align: center; border: 1px solid #334155; }
            td { padding: 6px; text-align: center; border: 1px solid #cbd5e1; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .totals-row { background-color: #fef9c3; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Sawariya Logistic Statement</h2>
          <p>Contact No: 9992269616 & 7027400769</p>
          <p>Generated: ${new Date().toLocaleDateString('en-IN')} | Records: ${exportData.length} (${selectedIds.length ? 'Selected' : 'All'})</p>
          ${summaryLine}
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              <tr class="totals-row">${totalsRow.map(cell => `<td>${cell}</td>`).join('')}</tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fright_Report_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);
    showNotification(true, "Excel downloaded with styling! 📊");
  };

  const downloadPDF = () => {
    try {
      const exportData = getExportData();
      const totals = calculateTotals(exportData);

      const headers = [
        ["Date", "LR No.", "Challan", "Vehicle", "DI No.", "Recipient", "Dest.", "Qty", "Rate",
          "Freight", "Comm.", "Advance", "Diesel", "Pump", "Final", "Remark", "Balance"]
      ];

      const rows = exportData.map((bill) => [
        bill.DateOfIssueOfInvoice || "",
        bill.LRNO || "",
        bill.challanNO || "",
        bill.VehicleNo || "",
        bill.DINo || "",
        bill.NameOfRecipient || "",
        bill.Destination || "",
        String(parseQty(bill.Quantity)),
        bill.pmt || "",
        String(bill.frightAmount || 0),
        String(bill.commeion || 0),
        String(bill.advanceCash || 0),
        String(bill.desil || 0),
        bill.petrolPump || "N/A",
        String(bill.faynalAmmount || 0),
        bill.remark || "",
        String(bill.tripBalanceAmmount || 0)
      ]);

      const totalsRow = [
        "TOTAL", "", "", "", "", "", "",
        String(totals.qty),
        "",
        String(totals.freight),
        String(totals.commission),
        String(totals.advance),
        String(totals.diesel),
        "",
        String(totals.final),
        "",
        String(totals.balance)
      ];

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fright Report", 14, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 15);

      let startY = 20;

      if (hasValidBalance) {
        const summaryY = 20;
        const margin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const summaryWidth = pageWidth - 2 * margin;
        const summaryText = `Opening Balance: ₹${runningBalances.length ? runningBalances[runningBalances.length - 1].toLocaleString('en-IN') : '-'}   |   Closing Balance: ₹${startBalance.toLocaleString('en-IN')}`;

        doc.setFillColor(219, 234, 254);
        doc.rect(margin, summaryY - 3, summaryWidth, 6, 'F');
        doc.setDrawColor(147, 197, 253);
        doc.setLineWidth(0.3);
        doc.rect(margin, summaryY - 3, summaryWidth, 6, 'S');
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 64, 175);
        doc.text(summaryText, margin + 2, summaryY);

        startY = summaryY + 5;
      }

      autoTable(doc, {
        head: headers,
        body: [...rows, totalsRow],
        startY: startY,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
      });

      doc.save(`Fright_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      showNotification(true, "PDF downloaded successfully! 📄");
    } catch (error) {
      console.error("PDF generation failed", error);
      showNotification(false, "PDF download failed. Make sure jspdf and jspdf-autotable are installed.");
    }
  };

  const printData = () => {
    const exportData = getExportData();
    const totals = calculateTotals(exportData);

    const headers = [
      "Date", "LR No.", "Challan No", "Vehicle", "DI No.",
      "Recipient", "Destination", "Qty", "Rate PMT",
      "Freight (₹)", "Commission (₹)", "Advance (₹)", "Diesel (₹)", "Pump",
      "Final Amount (₹)", "Remark", "Balance (₹)"
    ];

    const rows = exportData.map((bill) => [
      bill.DateOfIssueOfInvoice || "",
      bill.LRNO || "",
      bill.challanNO || "",
      bill.VehicleNo || "",
      bill.DINo || "",
      bill.NameOfRecipient || "",
      bill.Destination || "",
      parseQty(bill.Quantity),
      bill.pmt || "",
      bill.frightAmount || 0,
      bill.commeion || 0,
      bill.advanceCash || 0,
      bill.desil || 0,
      bill.petrolPump || "N/A",
      bill.faynalAmmount || 0,
      bill.remark || "",
      bill.tripBalanceAmmount || 0
    ]);

    const totalsRow = [
      "TOTAL", "", "", "", "", "", "",
      totals.qty,
      "",
      totals.freight,
      totals.commission,
      totals.advance,
      totals.diesel,
      "",
      totals.final,
      "",
      totals.balance
    ];

    const summaryLine = hasValidBalance
      ? `<p style="font-weight: bold; margin-bottom: 8px;">Opening Balance: ₹${runningBalances.length ? runningBalances[runningBalances.length - 1] : '-'} | Closing Balance: ₹${startBalance}</p>`
      : '';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Fright Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #1e293b; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th { background-color: #1e293b; color: white; font-weight: bold; padding: 6px; text-align: center; border: 1px solid #334155; }
            td { padding: 4px; text-align: center; border: 1px solid #cbd5e1; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .totals-row { background-color: #fef9c3; font-weight: bold; }
            @media print { body { margin: 0.5in; } table { font-size: 9px; } }
          </style>
        </head>
        <body>
          <h2>Fright Report</h2>
          <p>Generated: ${new Date().toLocaleDateString('en-IN')} | Records: ${exportData.length} (${selectedIds.length ? 'Selected' : 'All'})</p>
          ${summaryLine}
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              <tr class="totals-row">${totalsRow.map(cell => `<td>${cell}</td>`).join('')}</tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSingleDelete = (id) => {
    setDeleteModal({ open: true, ids: [id] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      showNotification(false, "Please select records to delete");
      return;
    }
    setDeleteModal({ open: true, ids: selectedIds });
  };

  const handleDeleteClick = async () => {
    try {
      const deletePromises = deleteModal.ids.map(id => 
        axios.delete(`${backendUrl}/api/bill/delete-bilty/${id}`, { withCredentials: true })
      );
      
      await Promise.all(deletePromises);
      
      setSelectedIds([]);
      refreshData();
    } catch (error) { 
      throw new Error(error.response?.data?.message || "Delete Failed");
    }
  };

  // Updated handleAddPayment with vehicle validation
  const handleAddPayment = async () => {
    // Check if vehicle number exists in master list (case‑insensitive)
    const vehicleExists = vehicleList?.some(
      v => v.vehicleNo.toUpperCase() === vehicleNo.toUpperCase()
    );
    if (!vehicleExists) {
      showNotification(false, "Vehicle number not registered. Please add it first.");
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/bill/add-tranjaction-entry`,
        { DateOfIssueOfInvoice: date, NameOfRecipient: nameOfRecipient, VehicleNo: vehicleNo, Amount: amount, remark: remark, Destination: destination },
        { withCredentials: true }
      );
      showNotification(true, "Record Added ");
      refreshData();
    } catch (error) {
      showNotification(false, error.response?.message);
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) handleAddPayment();
      }
    } finally {
      setAddPayment(false);
    }
  };

  const totals = calculateTotals(sortedData);
  const mainHeaders = [
    "Date", "LR NO.", "Challan NO", "Vehicle", "DI No.",
    "Recipient", "Destination", "Qty", "Rate PMT",
    "Freight", "Commission", "Advance", "Diesel", "Pump",
    "Amount", "Remark", "Balance"
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

  return (
    <>
      {/* Add Payment Modal */}
      {addPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto  shadow-2xl animate-in zoom-in duration-300 my-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">Add New Payment</h2>
              <button onClick={() => setAddPayment(!addPayment)} type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800  transition-colors">
                <X size={24} className="dark:text-white" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <input type="date" placeholder="Date" name="DateOfIssueOfInvoice" onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
                <input type="text" placeholder="Name" name="NameOfRecipient" onChange={(e) => setNameOfRecipient(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
                {/* Vehicle input with datalist */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Vehicle No"
                    list="vehicleAddList"
                    name="VehicleNo"
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium"
                  />
                  <datalist id="vehicleAddList">
                    {vehicleList?.map(v => (
                      <option key={v._id} value={v.vehicleNo} />
                    ))}
                  </datalist>
                </div>
                <input type="number" placeholder="Amount" name="Amount" onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
                <input type="text" placeholder="Remark" name="remark" onChange={(e) => setRemark(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
                <input type="text" placeholder="Destination" name="Destination" onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t dark:border-slate-700 font-bold">
                <button type="button" onClick={() => setAddPayment(!addPayment)} className="px-6 py-3  text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 order-2 sm:order-1">Cancel</button>
                <button type="submit" onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3  font-black shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 duration-200 order-1 sm:order-2 uppercase text-xs tracking-widest flex items-center justify-center">
                  {loading ? (<ButtonLoaders/>) : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

      <div className="mb-4 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800 p-4 shadow-sm dark:border-slate-700">
        <div className="flex gap-2">
          <button onClick={downloadStyledExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2   text-[10px] font-black uppercase hover:bg-green-700 transition-colors">
            <ArrowDownToLine size={15} /> Excel
          </button>
          <button onClick={printData} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2   text-[10px] font-black uppercase hover:bg-purple-700 transition-colors">
            <Printer size={15} /> Print
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2   text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
            >
              <Trash2 size={14} />{selectedIds.length} Delete Selected
            </button>
          )}
        </div>
        <div>
          <button className="uppercase text-white bg-yellow-600 p-2 " onClick={() => setAddPayment(!addPayment)}>
            Add Payments
          </button>
        </div>
      </div>

      {sortedData.length > 0 && hasValidBalance && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800  text-center font-bold text-sm">
          <span className="mr-6 text-slate-700 dark:text-slate-300">
            Opening Balance:{' '}
            <span className={
                runningBalances.length
                  ? runningBalances[runningBalances.length - 1] < 0
                    ? 'text-red-600 dark:text-red-400'
                    : runningBalances[runningBalances.length - 1] > 0
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                  : ''
              }>
              ₹{runningBalances.length ? runningBalances[runningBalances.length - 1] : '-'}
            </span>
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            Closing Balance:{' '}
            <span className={
                startBalance < 0
                  ? 'text-red-600 dark:text-red-400'
                  : startBalance > 0
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              }>
              ₹{startBalance}
            </span>
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden  ">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-800 dark:bg-black text-white">
              <tr>
                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    onChange={(e) => setSelectedIds(e.target.checked ? sortedData.map(b => b._id) : [])}
                    checked={sortedData.length > 0 && selectedIds.length === sortedData.length}
                    className="dark:bg-slate-700 dark:border-slate-600"
                  />
                </th>
                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">Actions</th>
                {mainHeaders.map((h) => (
                  <th key={h} className="px-4 text-center py-4 text-[11px] uppercase tracking-wider font-bold border-r border-slate-700 dark:border-slate-800 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
              {sortedData.map((bill) => (
                <tr key={bill._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedIds.includes(bill._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-4 py-3 text-center border-r dark:border-slate-700">
                    <input type="checkbox" checked={selectedIds.includes(bill._id)}
                      onChange={() => setSelectedIds(prev => prev.includes(bill._id) ? prev.filter(i => i !== bill._id) : [...prev, bill._id])}
                      className="dark:bg-slate-700 dark:border-slate-600" />
                  </td>
                  <td className="px-4 py-3 border-r dark:border-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setSelectedBill(bill); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 dark:bg-blue-900/30 "><Edit3 size={14} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.DateOfIssueOfInvoice}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{bill.LRNO}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{bill.challanNO}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-800 dark:text-white">{bill.VehicleNo}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.DINo}</td>
                  <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200 min-w-[150px]">{bill.NameOfRecipient}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.Destination}</td>
                  <td className="px-4 py-3 text-center dark:text-slate-200">{parseQty(bill.Quantity)}</td>
                  <td className="px-4 py-3 text-center dark:text-slate-200">{parseQty(bill.pmt)}</td>
                  <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">₹{bill.frightAmount || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">₹{bill.commeion || 0}</td>
                  <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">₹{bill.advanceCash || 0}</td>
                  <td className="px-4 py-3 text-center text-red-500 dark:text-red-400">₹{bill.desil || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 uppercase">{bill.petrolPump || "N/A"}</td>
                  <td className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-black bg-blue-50 dark:bg-blue-900/20">₹{bill.faynalAmmount || 0}</td>
                  <td className="px-4 py-3 text-center text-nowrap">{bill.remark}</td>
                  <td className={`px-4 py-3 text-center font-black border-x dark:border-slate-700 ${bill.tripBalanceAmmount < 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"}`}>
                    ₹{bill.tripBalanceAmmount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-600">
              <tr>
                {(() => {
                  const cells = [
                    { colSpan: 2, content: "Totals", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: "", className: "px-4 py-3 text-center text-slate-700 dark:text-slate-200" },
                    { content: totals.qty, className: "px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-black" },
                    { content: "", className: "px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-black" },
                    { content: `₹${totals.freight}`, className: "px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-black" },
                    { content: `₹${totals.commission}`, className: "px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-black" },
                    { content: `₹${totals.advance}`, className: "px-4 py-3 text-center text-red-600 dark:text-red-400 font-black" },
                    { content: `₹${totals.diesel}`, className: "px-4 py-3 text-center text-red-500 dark:text-red-400 font-black" },
                    { content: "", className: "px-4 py-3 text-center text-slate-500 dark:text-slate-400" },
                    { content: `₹${totals.final}`, className: "px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-black" },
                    { content: "", className: "px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-black" },
                    { content: `₹${totals.balance}`, className: `px-4 py-3 text-center font-black ${totals.balance < 0 ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}` },
                  ];
                  return cells.map((cell, idx) => {
                    if (cell.colSpan) {
                      return <td key={idx} colSpan={cell.colSpan} className={cell.className}>{cell.content}</td>;
                    }
                    return <td key={idx} className={cell.className}>{cell.content}</td>;
                  });
                })()}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {printBityBtn && <PrintBilty pData={pData} setPrintBityBtn={setPrintBityBtn} />}
      <MaintenanceModal isOpen={isMaintOpen} onClose={() => setIsMaintOpen(false)} bill={selectedBill} onUpdate={refreshData} showNotification={showNotification} />
      <EditBiltyModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} bill={selectedBill} onSuccess={(msg) => { refreshData(); showNotification(true, msg); }} showNotification={showNotification} />
      
      <DeleteConfirmModal 
        isOpen={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, ids: [] })} 
        onConfirm={handleDeleteClick} 
        title="Record"
        count={deleteModal.ids.length}
        showNotification={showNotification}
      />
    </>
  );
};

export default FrightTable;