import React, { useState, useEffect, useRef } from "react";
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
  const [totalAmount, setTotalAmount] = useState(0);
  const [openingBefore, setOpeningBefore] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  const headerCheckboxRef = useRef(null);

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

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const allIds = transactions.map(item => item._id);
      const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, transactions]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/driver-transactions/ledger`, {
        params: { driverId, page, startDate, endDate, limit: 50 },
        withCredentials: true
      });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalAmount(res.data.totalAmount || 0);
        setOpeningBefore(res.data.openingBeforeRange || 0);
        setSelectedIds([]);
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
      await axios.post(`${backendUrl}/api/driver-transactions/payment`, { 
        driverId, 
        ...paymentData 
      }, { withCredentials: true });
      showNotification(true, "Transaction added successfully");
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAddPayment(paymentData);
      }
      showNotification(false, error.response?.data?.message || "Transaction failed");
    }
  };

  const handleSingleDelete = (id) => {
    setDeleteModal({ open: true, ids: [id] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      showNotification(false, "Please select transactions to delete");
      return;
    }
    setDeleteModal({ open: true, ids: selectedIds });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map(t => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const deletePromises = deleteModal.ids.map(id => 
        axios.delete(`${backendUrl}/api/driver-transactions/${id}`, { withCredentials: true })
      );
      await Promise.all(deletePromises);
      showNotification(true, `${deleteModal.ids.length} Transaction${deleteModal.ids.length > 1 ? 's' : ''} deleted successfully`);
      setSelectedIds([]);
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDeleteConfirm();
      }
      showNotification(false, error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteModal({ open: false, ids: [] });
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
      { Item: 'Total Transactions', Value: totalAmount },
      { Item: 'Closing Balance', Value: openingBefore + totalAmount }
    ];
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.writeFile(wb, `${driverName}_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const closingBalance = openingBefore + totalAmount;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${driverName} - Ledger</title>
      <style>
        body { font-family: Arial; margin:20px; }
        table { border-collapse:collapse; width:100%; }
        th, td { border:1px solid #ddd; padding:8px; text-align:left; }
        th { background-color:#f2f2f2; }
        .summary { margin:10px 0; background:#f9f9f9; padding:15px; border-radius:5px; }
      </style>
      </head><body>
      <h1>${driverName} - Ledger</h1>
      <p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>
      
      <div class="summary">
        <p><strong>Opening Balance:</strong> ₹${openingBefore.toLocaleString('en-IN')}</p>
        <p><strong>Total Transactions:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
        <p><strong>Closing Balance:</strong> ₹${closingBalance.toLocaleString('en-IN')}</p>
      </div>

      <h2>Transactions</h2>
       table
        <thead>
          <tr><th>Date</th><th>Description</th><th>Amount (₹)</th><th>Balance (₹)</th></tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
              <td>${t.description || '-'}</td>
              <td>${t.amount.toLocaleString('en-IN')}</td>
              <td>${t.runningBalance.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
       </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');

  if (!driverId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">
          ← Back to drivers
        </button>
        <h2 className="text-xl font-black uppercase text-gray-800 dark:text-white">{driverName} - Ledger</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-3 shadow-sm border border-slate-200 dark:border-slate-700">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 flex-1 min-w-[120px]" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 flex-1 min-w-[120px]" />
        <button onClick={fetchLedger}
          className="px-3 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">
          Apply
        </button>
        <button onClick={() => { const range = getCurrentMonthRange(); setStartDate(range.start); setEndDate(range.end); }}
          className="p-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500" title="Reset">
          <RotateCcw size={12} className="text-slate-700 dark:text-white" />
        </button>
        <button onClick={exportToExcel}
          className="p-2 bg-green-600 text-white hover:bg-green-700" title="Excel">
          <FileSpreadsheet size={14} />
        </button>
        <button onClick={handlePrint}
          className="p-2 bg-purple-600 text-white hover:bg-purple-700" title="Print">
          <Printer size={14} />
        </button>
        
        {selectedIds.length > 0 && (
          <>
            <span className="bg-blue-600 text-white px-2 py-1 text-xs font-black">
              {selectedIds.length} Selected
            </span>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 text-xs font-bold hover:bg-red-700">
              <Trash2 size={12} /> Delete Selected
            </button>
          </>
        )}

        <button onClick={() => setPaymentModalOpen(true)}
          className="ml-auto flex items-center gap-1 bg-green-600 text-white px-3 py-2 text-xs font-bold hover:bg-green-700">
          <Plus size={12} /> Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opening Balance (before {startDate || 'start'})</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₹{openingBefore.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Transactions (this period)</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr><th>Date</th><th>Description</th><th className="text-right">Amount</th><th className="text-right">Balance</th><th>Action</th></tr>
              </thead>
              <tbody>{[...Array(5)].map((_,i) => <tr key={i} className="animate-pulse"><td colSpan="5">Loading...</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">
                    <input type="checkbox" ref={headerCheckboxRef} onChange={handleSelectAll}
                      checked={transactions.length > 0 && selectedIds.length === transactions.length} />
                  </th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Date</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Description</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Amount (₹)</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Balance (₹)</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length > 0 ? transactions.map(t => (
                  <tr key={t._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(t._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedIds.includes(t._id)}
                        onChange={() => setSelectedIds(prev => prev.includes(t._id) ? prev.filter(i => i !== t._id) : [...prev, t._id])} />
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{formatDate(t.date)}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{t.description || '-'}</td>
                    <td className="px-4 py-2 font-black text-right text-green-600 dark:text-green-400">+ ₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">₹{t.runningBalance.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleSingleDelete(t._id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No transactions in this period</td></tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 font-black">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 uppercase">Period Totals</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">₹{totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">₹{(openingBefore + totalAmount).toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 border dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="p-1 border border-slate-300 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronLeft size={14} />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1 border border-slate-300 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <AddDriverPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment}
        showNotification={showNotification}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, ids: [] })}
        onConfirm={handleDeleteConfirm}
        title="Transaction"
        count={deleteModal.ids.length}
        showNotification={showNotification}
      />
    </div>
  );
};

export default DriverLedger;