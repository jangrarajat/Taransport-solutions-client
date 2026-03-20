import React, { useState, useEffect } from "react";
import { X, Printer, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { backendUrl } from "../../utils/backendUrl";
import { refreshToken } from "../../api/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format date as DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const VehicleTripsModal = ({ isOpen, onClose, vehicle, user, showNotification }) => {
  const [trips, setTrips] = useState([]);
  const [totals, setTotals] = useState({
    qty: 0,
    freight: 0,
    commission: 0,
    advance: 0,
    desil: 0,
    final: 0,
    balance: 0
  });
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set default date range to current month when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const format = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };
      setStartDate(format(firstDay));
      setEndDate(format(lastDay));
    }
  }, [isOpen]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let url = `${backendUrl}/api/bill/vehicle-trips?vehicleNo=${vehicle.vehicleNo}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setTrips(res.data.trips);
        setOpeningBalance(res.data.openingBalance || 0);
        setClosingBalance(res.data.closingBalance || 0);
        // Calculate totals
        const t = res.data.trips.reduce((acc, trip) => {
          acc.qty += Number(trip.Quantity) || 0;
          acc.freight += trip.frightAmount || 0;
          acc.commission += trip.commeion || 0;
          acc.advance += trip.advanceCash || 0;
          acc.desil += trip.desil || 0;
          acc.final += trip.faynalAmmount || 0;
          acc.balance += trip.tripBalanceAmmount || 0;
          return acc;
        }, { qty: 0, freight: 0, commission: 0, advance: 0, desil: 0, final: 0, balance: 0 });
        setTotals(t);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchTrips();
      }
      showNotification(false, "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vehicle) fetchTrips();
  }, [isOpen, vehicle, startDate, endDate]);

  const exportExcel = () => {
    // Prepare data rows with formatted date
    const exportData = trips.map(t => ({
      Date: formatDate(t.DateOfIssueOfInvoice),
      'LR No.': t.LRNO,
      'Challan No': t.challanNO,
      Vehicle: t.VehicleNo,
      'DI No.': t.DINo,
      Recipient: t.NameOfRecipient,
      Destination: t.Destination,
      Qty: t.Quantity,
      'Rate PMT': t.pmt,
      Freight: t.frightAmount,
      Commission: t.commeion,
      Advance: t.advanceCash,
      Diesel: t.desil,
      Pump: t.petrolPump,
      'Final Amount': t.faynalAmmount,
      Remark: t.remark,
      Balance: t.tripBalanceAmmount
    }));

    // Add totals row
    const totalsRow = {
      Date: 'TOTAL',
      'LR No.': '',
      'Challan No': '',
      Vehicle: '',
      'DI No.': '',
      Recipient: '',
      Destination: '',
      Qty: totals.qty,
      'Rate PMT': '',
      Freight: totals.freight,
      Commission: totals.commission,
      Advance: totals.advance,
      Diesel: totals.desil,
      Pump: '',
      'Final Amount': totals.final,
      Remark: '',
      Balance: totals.balance
    };
    exportData.push(totalsRow);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trips");
    XLSX.writeFile(wb, `Vehicle_${vehicle.vehicleNo}_Trips.xlsx`);
  };

  const printPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Vehicle Trips: ${vehicle.vehicleNo}`, 14, 10);
    doc.setFontSize(8);
    doc.text(`Company: ${user?.companyName} | Period: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 15);
    // Add opening/closing balance
    doc.setFontSize(9);
    doc.text(`Opening Balance: ₹${openingBalance}`, 14, 22);
    doc.text(`Closing Balance: ₹${closingBalance}`, 14, 28);

    const headers = [["Date", "LR No.", "Challan", "Vehicle", "DI No.", "Recipient", "Dest.", "Qty", "Rate",
      "Freight", "Comm.", "Advance", "Diesel", "Pump", "Final", "Remark", "Balance"]];
    const rows = trips.map(t => [
      formatDate(t.DateOfIssueOfInvoice),
      t.LRNO,
      t.challanNO,
      t.VehicleNo,
      t.DINo,
      t.NameOfRecipient,
      t.Destination,
      t.Quantity,
      t.pmt,
      t.frightAmount,
      t.commeion,
      t.advanceCash,
      t.desil,
      t.petrolPump,
      t.faynalAmmount,
      t.remark,
      t.tripBalanceAmmount
    ]);

    // Add totals row
    const totalsRow = [
      "TOTAL", "", "", "", "", "", "", totals.qty, "",
      totals.freight, totals.commission, totals.advance, totals.desil, "",
      totals.final, "", totals.balance
    ];

    autoTable(doc, {
      head: headers,
      body: rows,
      foot: [totalsRow],
      startY: 32,
      theme: 'striped',
      styles: { fontSize: 7 },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' }
    });
    doc.save(`Vehicle_${vehicle.vehicleNo}_Trips.pdf`);
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Vehicle Trips: ${vehicle.vehicleNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #1e293b; }
            .summary { margin: 10px 0; padding: 10px; background: #e6f0fa; border-radius: 5px; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th { background-color: #1e293b; color: white; font-weight: bold; padding: 6px; text-align: center; border: 1px solid #334155; }
            td { padding: 4px; text-align: center; border: 1px solid #cbd5e1; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .totals-row { background-color: #fef9c3; font-weight: bold; }
            @media print { body { margin: 0.5in; } }
          </style>
        </head>
        <body>
          <h2>Vehicle Trips: ${vehicle.vehicleNo}</h2>
          <p>Company: ${user?.companyName} | Period: ${startDate || 'All'} to ${endDate || 'All'}</p>
          <div class="summary">
            <strong>Opening Balance: ₹${openingBalance}</strong> | <strong>Closing Balance: ₹${closingBalance}</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>LR No.</th><th>Challan</th><th>Vehicle</th><th>DI No.</th>
                <th>Recipient</th><th>Dest.</th><th>Qty</th><th>Rate</th><th>Freight</th>
                <th>Comm.</th><th>Advance</th><th>Diesel</th><th>Pump</th><th>Final</th>
                <th>Remark</th><th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${trips.map(t => `
                <tr>
                  <td>${formatDate(t.DateOfIssueOfInvoice)}</td>
                  <td>${t.LRNO}</td>
                  <td>${t.challanNO}</td>
                  <td>${t.VehicleNo}</td>
                  <td>${t.DINo}</td>
                  <td>${t.NameOfRecipient}</td>
                  <td>${t.Destination}</td>
                  <td>${t.Quantity}</td>
                  <td>${t.pmt}</td>
                  <td>${t.frightAmount}</td>
                  <td>${t.commeion}</td>
                  <td>${t.advanceCash}</td>
                  <td>${t.desil}</td>
                  <td>${t.petrolPump}</td>
                  <td>${t.faynalAmmount}</td>
                  <td>${t.remark}</td>
                  <td>${t.tripBalanceAmmount}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="totals-row">
                <td colspan="7">TOTAL</td>
                <td>${totals.qty}</td><td></td>
                <td>${totals.freight}</td><td>${totals.commission}</td>
                <td>${totals.advance}</td><td>${totals.desil}</td><td></td>
                <td>${totals.final}</td><td></td><td>${totals.balance}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] text-black bg-black/50 dark:bg-black/70 dark:text-white backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Trips for {vehicle.vehicleNo}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-4 flex-wrap dark:text-black">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-2 py-1 text-xs rounded" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-2 py-1 text-xs rounded" />
            <button onClick={fetchTrips} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Filter</button>
            <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><FileSpreadsheet size={14} /> Excel</button>
            <button onClick={printPDF} className="bg-purple-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Printer size={14} /> PDF</button>
            <button onClick={handlePrint} className="bg-orange-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Printer size={14} /> Print</button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <>
              {/* Opening/Closing Balance Display */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-center font-bold text-sm">
                <span className="mr-6 text-slate-700 dark:text-slate-300">
                  Opening Balance: <span className="text-blue-600 dark:text-blue-400">₹{openingBalance}</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  Closing Balance: <span className="text-green-600 dark:text-green-400">₹{closingBalance}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">LR No.</th>
                      <th className="px-2 py-2">Challan</th>
                      <th className="px-2 py-2">Vehicle</th>
                      <th className="px-2 py-2">DI No.</th>
                      <th className="px-2 py-2">Recipient</th>
                      <th className="px-2 py-2">Dest.</th>
                      <th className="px-2 py-2">Qty</th>
                      <th className="px-2 py-2">Rate</th>
                      <th className="px-2 py-2">Freight</th>
                      <th className="px-2 py-2">Comm.</th>
                      <th className="px-2 py-2">Advance</th>
                      <th className="px-2 py-2">Diesel</th>
                      <th className="px-2 py-2">Pump</th>
                      <th className="px-2 py-2">Final</th>
                      <th className="px-2 py-2">Remark</th>
                      <th className="px-2 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t._id} className="border-b dark:border-slate-700">
                        <td className="px-2 py-2">{formatDate(t.DateOfIssueOfInvoice)}</td>
                        <td className="px-2 py-2">{t.LRNO}</td>
                        <td className="px-2 py-2">{t.challanNO}</td>
                        <td className="px-2 py-2">{t.VehicleNo}</td>
                        <td className="px-2 py-2">{t.DINo}</td>
                        <td className="px-2 py-2">{t.NameOfRecipient}</td>
                        <td className="px-2 py-2">{t.Destination}</td>
                        <td className="px-2 py-2">{t.Quantity}</td>
                        <td className="px-2 py-2">{t.pmt}</td>
                        <td className="px-2 py-2">{t.frightAmount}</td>
                        <td className="px-2 py-2">{t.commeion}</td>
                        <td className="px-2 py-2">{t.advanceCash}</td>
                        <td className="px-2 py-2">{t.desil}</td>
                        <td className="px-2 py-2">{t.petrolPump}</td>
                        <td className="px-2 py-2">{t.faynalAmmount}</td>
                        <td className="px-2 py-2">{t.remark}</td>
                        <td className="px-2 py-2">{t.tripBalanceAmmount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <tr>
                      <td colSpan="7" className="px-2 py-2 text-right">Totals</td>
                      <td className="px-2 py-2">{totals.qty}</td>
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2">{totals.freight}</td>
                      <td className="px-2 py-2">{totals.commission}</td>
                      <td className="px-2 py-2">{totals.advance}</td>
                      <td className="px-2 py-2">{totals.desil}</td>
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2">{totals.final}</td>
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2">{totals.balance}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTripsModal;