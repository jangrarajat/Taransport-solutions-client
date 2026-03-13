import React, { useState, useEffect } from "react";
import axios from "axios";
import { RotateCcw, Plus, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import AddDriverPaymentModal from "./AddDriverPaymentModal";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { refreshToken } from "../../api/api";

const DriverLedger = ({ driverId, driverName, onBack, showNotification }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [driverDetails, setDriverDetails] = useState(null);
  const [totalPayments, setTotalPayments] = useState(0);
  const [openingBefore, setOpeningBefore] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const getCurrentMonthRange = () => {
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
    return { start: format(firstDay), end: format(lastDay) };
  };

  const initialRange = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/driver-transactions/ledger`, {
        params: { driverId, page, startDate, endDate, limit: 50 },
        withCredentials: true
      });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setDriverDetails(res.data.driver);
        setTotalPages(res.data.totalPages || 1);
        setTotalPayments(res.data.totalPayments || 0);
        setOpeningBefore(res.data.openingBeforeRange || 0);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchLedger();
      }
      showNotification(false, "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetchLedger();
  }, [driverId, page, startDate, endDate]);

  const handleAddPayment = async (paymentData) => {
    try {
      await axios.post(`${backendUrl}/api/driver-transactions/payment`, { driverId, ...paymentData }, { withCredentials: true });
      showNotification(true, "Payment added");
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAddPayment(paymentData);
      }
      showNotification(false, error.response?.data?.message || "Payment failed");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await axios.delete(`${backendUrl}/api/driver-transactions/${transactionId}`, { withCredentials: true });
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDeleteTransaction(transactionId);
      }
      throw new Error(error.response?.data?.message || "Delete failed");
    }
  };

  const exportToExcel = () => {
    const exportData = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-GB'),
      Description: t.description || '-',
      'Amount (₹)': t.amount,
      'Running Balance (₹)': t.runningBalance
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const summaryData = [
      { Item: 'Driver Name', Value: driverName },
      { Item: 'Period', Value: `${startDate || 'Start'} to ${endDate || 'End'}` },
      { Item: 'Opening Balance', Value: openingBefore },
      { Item: 'Total Payments', Value: totalPayments },
      { Item: 'Closing Balance', Value: openingBefore + totalPayments }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.writeFile(wb, `${driverName}_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const closingBalance = openingBefore + totalPayments;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${driverName} - Ledger</title>
      <style>
        body { font-family: Arial; margin:20px; background:#0f172a; color:white; }
        table { border-collapse:collapse; width:100%; }
        th, td { border:1px solid #334155; padding:8px; text-align:left; }
        th { background-color:#1e293b; }
        .summary { margin:10px 0; }
      </style>
      </head><body>
      <h1>${driverName} - Ledger</h1>
      <p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>
      <h2>Summary</h2>
      <div class="summary">
        <p><strong>Opening Balance:</strong> ₹${openingBefore.toLocaleString('en-IN')}</p>
        <p><strong>Total Payments:</strong> ₹${totalPayments.toLocaleString('en-IN')}</p>
        <p><strong>Closing Balance:</strong> ₹${closingBalance.toLocaleString('en-IN')}</p>
      </div>
      <h2>Transactions</h2>
      <table><thead><tr><th>Date</th><th>Description</th><th>Amount (₹)</th><th>Balance (₹)</th></tr></thead>
      <tbody>
        ${transactions.map(t => `<tr><td>${new Date(t.date).toLocaleDateString('en-GB')}</td><td>${t.description || '-'}</td><td>₹${t.amount.toLocaleString('en-IN')}</td><td>₹${t.runningBalance.toLocaleString('en-IN')}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');
  const closingBalance = openingBefore + totalPayments;

  const SummarySkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-sm animate-pulse">
          <div className="h-3 bg-white/10 rounded w-24 mb-2"></div>
          <div className="h-6 bg-white/10 rounded w-16"></div>
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-white/50">Date</th>
              <th className="px-4 py-3 text-white/50">Description</th>
              <th className="px-4 py-3 text-white/50 text-right">Amount (₹)</th>
              <th className="px-4 py-3 text-white/50 text-right">Balance (₹)</th>
              <th className="px-4 py-3 text-white/50 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-2"><div className="h-3 bg-white/10 rounded w-16"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-white/10 rounded w-32"></div></td>
                <td className="px-4 py-2 text-right"><div className="h-3 bg-white/10 rounded w-12 ml-auto"></div></td>
                <td className="px-4 py-2 text-right"><div className="h-3 bg-white/10 rounded w-12 ml-auto"></div></td>
                <td className="px-4 py-2 text-center"><div className="h-3 bg-white/10 rounded w-6 mx-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!driverId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm underline text-cyan-400 hover:text-cyan-300">
          ← Back to drivers
        </button>
        <h2 className="text-xl font-black uppercase text-white">{driverName} - Ledger</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-sm">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white flex-1 min-w-[120px]" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white flex-1 min-w-[120px]" />
        <button onClick={fetchLedger}
          className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-cyan-600 hover:to-blue-700">
          Apply
        </button>
        <button onClick={() => { const range = getCurrentMonthRange(); setStartDate(range.start); setEndDate(range.end); }}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg" title="Reset">
          <RotateCcw size={12} className="text-white/70" />
        </button>
        <button onClick={exportToExcel}
          className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg border border-green-500/30" title="Excel">
          <FileSpreadsheet size={14} />
        </button>
        <button onClick={handlePrint}
          className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30" title="Print">
          <Printer size={14} />
        </button>
        <button onClick={() => setPaymentModalOpen(true)}
          className="ml-auto flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold">
          <Plus size={12} /> Add Payment
        </button>
      </div>

      {loading ? <SummarySkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider">Opening Balance (before {startDate || 'start'})</p>
            <p className="text-xl font-black text-white">₹{openingBefore.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider">Total Payments</p>
            <p className="text-xl font-black text-green-400">₹{totalPayments.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider">Closing Balance</p>
            <p className={`text-xl font-black ${closingBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ₹{closingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {loading ? <TableSkeleton /> : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-black text-white/50 uppercase">Date</th>
                  <th className="px-4 py-3 font-black text-white/50 uppercase">Description</th>
                  <th className="px-4 py-3 font-black text-white/50 uppercase text-right">Amount (₹)</th>
                  <th className="px-4 py-3 font-black text-white/50 uppercase text-right">Balance (₹)</th>
                  <th className="px-4 py-3 font-black text-white/50 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length > 0 ? transactions.map(t => (
                  <tr key={t._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2 text-white/70">{formatDate(t.date)}</td>
                    <td className="px-4 py-2 text-white/70">{t.description || '-'}</td>
                    <td className="px-4 py-2 font-black text-right text-green-400">+ ₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 font-black text-right text-white">₹{t.runningBalance.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => { setTransactionToDelete(t); setDeleteModalOpen(true); }}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-white/30 italic">No transactions in this period</td></tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="bg-white/5 border-t border-white/10 font-black">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right text-white/70 uppercase">Period Totals</td>
                    <td className="px-4 py-3 text-right text-cyan-400">₹{totalPayments.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-cyan-400">{closingBalance.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl shadow-sm">
          <p className="text-xs text-white/50">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="p-1 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5">
              <ChevronLeft size={14} className="text-white/70" />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5">
              <ChevronRight size={14} className="text-white/70" />
            </button>
          </div>
        </div>
      )}

      <AddDriverPaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment} showNotification={showNotification} />
      <DeleteConfirmModal isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTransactionToDelete(null); }}
        onConfirm={async () => await handleDeleteTransaction(transactionToDelete._id)}
        title="payment" showNotification={showNotification} />
    </div>
  );
};

export default DriverLedger;