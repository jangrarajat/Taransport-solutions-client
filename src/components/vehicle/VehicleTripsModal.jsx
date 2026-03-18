import React, { useState, useEffect } from "react";
import { X, Printer, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { backendUrl } from "../../utils/backendUrl";
import { refreshToken } from "../../api/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let url = `${backendUrl}/api/bill/vehicle-trips?vehicleNo=${vehicle.vehicleNo}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setTrips(res.data.trips);
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
    const exportData = trips.map(t => ({
      Date: t.DateOfIssueOfInvoice,
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
    const headers = [["Date", "LR No.", "Challan", "Vehicle", "DI No.", "Recipient", "Dest.", "Qty", "Rate",
      "Freight", "Comm.", "Advance", "Diesel", "Pump", "Final", "Remark", "Balance"]];
    const rows = trips.map(t => [
      t.DateOfIssueOfInvoice,
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
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      theme: 'striped',
      styles: { fontSize: 7 }
    });
    doc.save(`Vehicle_${vehicle.vehicleNo}_Trips.pdf`);
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
          <div className="flex gap-2 mb-4 flex-wrap  dark:text-black">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-2 py-1 text-xs rounded" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-2 py-1 text-xs rounded" />
            <button onClick={fetchTrips} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Filter</button>
            <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><FileSpreadsheet size={14} /> Excel</button>
            <button onClick={printPDF} className="bg-purple-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Printer size={14} /> PDF</button>
          </div>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
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
                      <td className="px-2 py-2">{t.DateOfIssueOfInvoice}</td>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTripsModal;