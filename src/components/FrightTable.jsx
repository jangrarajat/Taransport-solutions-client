// FrightTable.jsx – sorted by createdAt and LRNO
import { Printer, X, Trash2, Edit3, ArrowDownToLine } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import EditBiltyModal from "./bill/EditBiltyModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { refreshToken } from "../api/api";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { backendUrl } from "../utils/backendUrl";

// Helper to get sorting timestamp and LRNO for composite sorting
const getSortKey = (item) => {
  let date = null;
  if (item.createdAt) date = new Date(item.createdAt);
  else if (item.DateOfIssueOfInvoice) date = new Date(item.DateOfIssueOfInvoice);
  else date = new Date(0);
  
  let lrno = "";
  if (!item.isDesil && item.LRNO && item.LRNO !== "N/A") {
    lrno = item.LRNO;
  }
  return { date, lrno };
};

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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Vehicle Maintenance</h2>
          <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" />
          <input required type="text" placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)}
            className="w-full border rounded px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" />
          <button disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
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
  vehicleList,
  startDate,
  endDate,
  searchTerm,
  isVehicleFilter
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
  const [date, setDate] = useState("");
  const [nameOfRecipient, setNameOfRecipient] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [destination, setDestination] = useState("");
  const [paymentType, setPaymentType] = useState("credit");
  const [pumpList, setPumpList] = useState([]);
  const [fetchingPumps, setFetchingPumps] = useState(false);
  const [desilEntries, setDesilEntries] = useState([]);
  const [loadingDesil, setLoadingDesil] = useState(false);

  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    if (addPayment) {
      fetchPumps();
    }
  }, [addPayment]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchDesilEntries();
    }
  }, [startDate, endDate, searchTerm]);

  const fetchPumps = async () => {
    setFetchingPumps(true);
    try {
      const res = await axios.get(`${backendUrl}/api/pump-master`, { withCredentials: true });
      if (res.data.success) {
        setPumpList(res.data.pumps);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchPumps();
      }
      console.error("Failed to fetch pumps", error);
    } finally {
      setFetchingPumps(false);
    }
  };

  const fetchDesilEntries = async () => {
    setLoadingDesil(true);
    try {
      let url = `${backendUrl}/api/pump-transactions/purchases?startDate=${startDate}&endDate=${endDate}&unlinked=true`;
      if (searchTerm) {
        url += `&vehicleNo=${searchTerm}`;
      }
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setDesilEntries(res.data.purchases);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchDesilEntries();
      }
      console.error("Failed to fetch desil entries", error);
    } finally {
      setLoadingDesil(false);
    }
  };

  // Merge and sort by date then LRNO
  const sortedData = useMemo(() => {
    const all = [...data, ...desilEntries];
    return all.sort((a, b) => {
      const keyA = getSortKey(a);
      const keyB = getSortKey(b);
      // Compare dates
      if (keyA.date.getTime() !== keyB.date.getTime()) {
        return keyA.date - keyB.date;
      }
      // Same date, compare LRNO (if both have it)
      const lrnoA = keyA.lrno;
      const lrnoB = keyB.lrno;
      if (!lrnoA && !lrnoB) return 0;
      if (!lrnoA) return 1;
      if (!lrnoB) return -1;
      // Numeric comparison if possible
      const numA = parseFloat(lrnoA);
      const numB = parseFloat(lrnoB);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return lrnoA.localeCompare(lrnoB);
    });
  }, [data, desilEntries]);

  const startBalance = useMemo(() => {
    if (searchTerm && openingBalance !== null && openingBalance !== undefined) return openingBalance;
    if (openingBalance !== null && openingBalance !== undefined) return openingBalance;
    if (vehicleTotalBalance !== null && vehicleTotalBalance !== undefined) return vehicleTotalBalance;
    return 0;
  }, [searchTerm, openingBalance, vehicleTotalBalance]);

  const runningBalances = useMemo(() => {
    if (!sortedData.length) return [];
    let running = startBalance;
    return sortedData.map((item) => {
      if (item.isDesil) {
        running = running - (item.desil || 0);
      } else {
        running = running + (item.tripBalanceAmmount || 0);
      }
      return running;
    });
  }, [sortedData, startBalance]);

  const closingBalanceValue = runningBalances.length ? runningBalances[runningBalances.length - 1] : startBalance;

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
    return exportData.reduce((acc, item) => {
      if (item.isDesil) {
        acc.diesel += item.desil || 0;
        acc.balance += item.tripBalanceAmmount || 0;
      } else {
        acc.qty += parseQty(item.Quantity);
        acc.freight += item.frightAmount || 0;
        acc.commission += item.commeion || 0;
        acc.advance += item.advanceCash || 0;
        acc.diesel += item.desil || 0;
        acc.maintenance += (item.maintenance?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0);
        acc.balance += item.tripBalanceAmmount || 0;
        acc.final += item.faynalAmmount || 0;
      }
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

    const rows = exportData.map((item) => [
      item.DateOfIssueOfInvoice || "",
      item.LRNO || "",
      item.challanNO || "",
      item.VehicleNo || "",
      item.DINo || "",
      item.NameOfRecipient || "",
      item.Destination || "",
      parseQty(item.Quantity),
      item.pmt || "",
      item.frightAmount || 0,
      item.commeion || 0,
      item.advanceCash || 0,
      item.desil || 0,
      item.petrolPump || "N/A",
      item.faynalAmmount || 0,
      item.remark || "",
      item.tripBalanceAmmount || 0
    ]);

    const totalsRow = [
      "TOTAL", "", "", "", "", "", "", totals.qty, "",
      totals.freight, totals.commission, totals.advance, totals.diesel, "",
      totals.final, "", totals.balance
    ];

    const summaryLine = isVehicleFilter
      ? `<p style="font-weight: bold; margin-bottom: 8px;">Opening Balance: ₹${startBalance} | Closing Balance: ₹${closingBalanceValue}</p>`
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
            <thead>${headers.map(h => `<th>${h}</th>`).join('')}</thead>
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

      const rows = exportData.map((item) => [
        item.DateOfIssueOfInvoice || "",
        item.LRNO || "",
        item.challanNO || "",
        item.VehicleNo || "",
        item.DINo || "",
        item.NameOfRecipient || "",
        item.Destination || "",
        String(parseQty(item.Quantity)),
        item.pmt || "",
        String(item.frightAmount || 0),
        String(item.commeion || 0),
        String(item.advanceCash || 0),
        String(item.desil || 0),
        item.petrolPump || "N/A",
        String(item.faynalAmmount || 0),
        item.remark || "",
        String(item.tripBalanceAmmount || 0)
      ]);

      const totalsRow = [
        "TOTAL", "", "", "", "", "", "", String(totals.qty), "",
        String(totals.freight), String(totals.commission), String(totals.advance), String(totals.diesel), "",
        String(totals.final), "", String(totals.balance)
      ];

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fright Report", 14, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 15);

      let startY = 20;

      if (isVehicleFilter) {
        const summaryY = 20;
        const margin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const summaryWidth = pageWidth - 2 * margin;
        const summaryText = `Opening Balance: ₹${startBalance.toLocaleString('en-IN')}   |   Closing Balance: ₹${closingBalanceValue.toLocaleString('en-IN')}`;

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

    const rows = exportData.map((item) => [
      item.DateOfIssueOfInvoice || "",
      item.LRNO || "",
      item.challanNO || "",
      item.VehicleNo || "",
      item.DINo || "",
      item.NameOfRecipient || "",
      item.Destination || "",
      parseQty(item.Quantity),
      item.pmt || "",
      item.frightAmount || 0,
      item.commeion || 0,
      item.advanceCash || 0,
      item.desil || 0,
      item.petrolPump || "N/A",
      item.faynalAmmount || 0,
      item.remark || "",
      item.tripBalanceAmmount || 0
    ]);

    const totalsRow = [
      "TOTAL", "", "", "", "", "", "", totals.qty, "",
      totals.freight, totals.commission, totals.advance, totals.diesel, "",
      totals.final, "", totals.balance
    ];

    const summaryLine = isVehicleFilter
      ? `<p style="font-weight: bold; margin-bottom: 8px;">Opening Balance: ₹${startBalance} | Closing Balance: ₹${closingBalanceValue}</p>`
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
            <thead>${headers.map(h => `<th>${h}</th>`).join('')}</thead>
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
      const biltyIds = deleteModal.ids.filter(id => {
        const item = sortedData.find(d => d._id === id);
        return item && !item.isDesil;
      });
      const desilIds = deleteModal.ids.filter(id => {
        const item = sortedData.find(d => d._id === id);
        return item && item.isDesil;
      });

      const promises = [];
      if (biltyIds.length > 0) {
        promises.push(...biltyIds.map(id => 
          axios.delete(`${backendUrl}/api/bill/delete-bilty/${id}`, { withCredentials: true })
        ));
      }
      if (desilIds.length > 0) {
        promises.push(...desilIds.map(id => 
          axios.delete(`${backendUrl}/api/pump-transactions/${id}`, { withCredentials: true })
        ));
      }
      
      await Promise.all(promises);
      
      setSelectedIds([]);
      refreshData();
      fetchDesilEntries();
    } catch (error) { 
      throw new Error(error.response?.data?.message || "Delete Failed");
    }
  };

  const handleAddPayment = async () => {
    const vehicleExists = vehicleList?.some(
      v => v.vehicleNo.toUpperCase() === vehicleNo.toUpperCase()
    );
    if (!vehicleExists) {
      showNotification(false, "Vehicle number not registered. Please add it first.");
      return;
    }

    try {
      if (paymentType === "credit") {
        await axios.post(`${backendUrl}/api/bill/add-tranjaction-entry`,
          { DateOfIssueOfInvoice: date, NameOfRecipient: nameOfRecipient, VehicleNo: vehicleNo, Amount: Number(amount), remark: remark, Destination: destination },
          { withCredentials: true }
        );
        showNotification(true, "Credit Entry Added");
        refreshData();
      } else if (paymentType === "debit") {
        await axios.post(`${backendUrl}/api/bill/add-tranjaction-entry`,
          { DateOfIssueOfInvoice: date, NameOfRecipient: nameOfRecipient, VehicleNo: vehicleNo, Amount: -Number(amount), remark: remark, Destination: destination },
          { withCredentials: true }
        );
        showNotification(true, "Debit Entry Added");
        refreshData();
      }
    } catch (error) {
      showNotification(false, error.response?.data?.message || "Failed");
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

  if (loading || loadingDesil) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

  return (
    <>
      {addPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded shadow-2xl animate-in zoom-in duration-300 my-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">Add New Entry</h2>
              <button onClick={() => setAddPayment(!addPayment)} type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors">
                <X size={24} className="dark:text-white" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex gap-4 mb-4">
                <label className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer transition-colors ${paymentType === "credit" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                  <input type="radio" value="credit" checked={paymentType === "credit"} onChange={() => setPaymentType("credit")} className="hidden" />
                  <span className="text-xs font-black">💰 Credit (+)</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer transition-colors ${paymentType === "debit" ? "bg-red-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                  <input type="radio" value="debit" checked={paymentType === "debit"} onChange={() => setPaymentType("debit")} className="hidden" />
                  <span className="text-xs font-black">💸 Debit (-)</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input type="date" placeholder="Date" name="DateOfIssueOfInvoice" onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />

                <input type="text" placeholder="Name/Party" name="NameOfRecipient" onChange={(e) => setNameOfRecipient(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Vehicle No"
                    list="vehicleAddList"
                    name="VehicleNo"
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium"
                  />
                  <datalist id="vehicleAddList">
                    {vehicleList?.map(v => (
                      <option key={v._id} value={v.vehicleNo} />
                    ))}
                  </datalist>
                </div>

                <input type="number" placeholder="Amount (₹)" name="Amount" onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />

                <input type="text" placeholder="Remark" name="remark" onChange={(e) => setRemark(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />

                <input type="text" placeholder="Destination" name="Destination" onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t dark:border-slate-700 font-bold">
                <button type="button" onClick={() => setAddPayment(!addPayment)} className="px-6 py-3 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 order-2 sm:order-1">Cancel</button>
                <button type="submit" onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded font-black shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 duration-200 order-1 sm:order-2 uppercase text-xs tracking-widest flex items-center justify-center">
                  {loading ? (<ButtonLoaders/>) : "Save Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

      <div className="mb-4 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800 p-4 shadow-sm dark:border-slate-700">
        <div className="flex gap-2">
          <button onClick={downloadStyledExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase hover:bg-green-700 transition-colors">
            <ArrowDownToLine size={15} /> Excel
          </button>
          <button onClick={printData} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase hover:bg-purple-700 transition-colors">
            <Printer size={15} /> Print
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
            >
              <Trash2 size={14} />{selectedIds.length} Delete Selected
            </button>
          )}
        </div>
        <div>
          <button className="uppercase text-white bg-yellow-600 p-2 rounded" onClick={() => setAddPayment(!addPayment)}>
            Add Entry
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden rounded">
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
              {sortedData.map((item) => (
                <tr key={item._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedIds.includes(item._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''} ${item.isDesil ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                  <td className="px-4 py-3 text-center border-r dark:border-slate-700">
                    <input type="checkbox" checked={selectedIds.includes(item._id)}
                      onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(i => i !== item._id) : [...prev, item._id])}
                      className="dark:bg-slate-700 dark:border-slate-600" />
                  </td>
                  <td className="px-4 py-3 border-r dark:border-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      {!item.isDesil && (
                        <button onClick={() => { setSelectedBill(item); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded"><Edit3 size={14} /></button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.DateOfIssueOfInvoice}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{item.LRNO}</td>
                  <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{item.challanNO}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-800 dark:text-white">{item.VehicleNo}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.DINo}</td>
                  <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200 min-w-[150px]">{item.NameOfRecipient}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.Destination}</td>
                  <td className="px-4 py-3 text-center dark:text-slate-200">{parseQty(item.Quantity)}</td>
                  <td className="px-4 py-3 text-center dark:text-slate-200">{parseQty(item.pmt)}</td>
                  <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">₹{item.frightAmount || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">₹{item.commeion || 0}</td>
                  <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">₹{item.advanceCash || 0}</td>
                  <td className="px-4 py-3 text-center text-red-500 dark:text-red-400">₹{item.desil || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 uppercase">{item.petrolPump || "N/A"}</td>
                  <td className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-black bg-blue-50 dark:bg-blue-900/20">₹{item.faynalAmmount || 0}</td>
                  <td className="px-4 py-3 text-center text-nowrap">{item.remark}</td>
                  <td className={`px-4 py-3 text-center font-black border-x dark:border-slate-700 ${item.tripBalanceAmmount < 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"}`}>
                    ₹{item.tripBalanceAmmount || 0}
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