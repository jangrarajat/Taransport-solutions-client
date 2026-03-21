import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { RotateCcw, Plus, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../../utils/backendUrl";
import ButtonLoaders from "../../loaders/ButtonLoaders";
import AddOtherPersonTransactionModal from "./AddOtherPersonTransactionModal";
import DeleteConfirmModal from "../../DeleteConfirmModal";
import { refreshToken } from "../../../api/api";

const OtherPersonLedger = ({ personId, personName, onBack, showNotification }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalGiven, setTotalGiven] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [netChange, setNetChange] = useState(0);
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

  useEffect(() => {
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
  }, []);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const allIds = transactions.map(t => t._id);
      const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, transactions]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/other-person-transactions/ledger`, {
        params: { personId, page, startDate, endDate, limit: 50 },
        withCredentials: true
      });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setTotalPages(res.data.totalPages || 1);
        setOpeningBalance(res.data.openingBalance || 0);
        setClosingBalance(res.data.closingBalance || 0);
        setTotalGiven(res.data.totalGiven || 0);
        setTotalReceived(res.data.totalReceived || 0);
        setNetChange(res.data.netChange || 0);
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
    if (personId) fetchLedger();
  }, [personId, page, startDate, endDate]);

  const handleAddTransaction = async (data) => {
    try {
      await axios.post(`${backendUrl}/api/other-person-transactions/transaction`, { personId, ...data }, { withCredentials: true });
      showNotification(true, "Transaction added");
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAddTransaction(data);
      }
      showNotification(false, error.response?.data?.message || "Transaction failed");
    }
  };

  const handleSingleDelete = (id) => setDeleteModal({ open: true, ids: [id] });
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      showNotification(false, "Please select transactions to delete");
      return;
    }
    setDeleteModal({ open: true, ids: selectedIds });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(transactions.map(t => t._id));
    else setSelectedIds([]);
  };

  const handleDeleteConfirm = async () => {
    try {
      const deletePromises = deleteModal.ids.map(id => 
        axios.delete(`${backendUrl}/api/other-person-transactions/${id}`, { withCredentials: true })
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
      Type: t.type === 'given' ? 'Given (I lent)' : 'Received (I borrowed)',
      Description: t.description || '-',
      'Amount (₹)': t.type === 'given' ? -t.amount : t.amount,
      'Running Balance (₹)': t.runningBalance
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    const summaryData = [
      { Item: 'Person', Value: personName },
      { Item: 'Period', Value: `${startDate || 'Start'} to ${endDate || 'End'}` },
      { Item: 'Opening Balance', Value: openingBalance },
      { Item: 'Total Given (I lent)', Value: totalGiven },
      { Item: 'Total Received (I borrowed)', Value: totalReceived },
      { Item: 'Net Change', Value: netChange },
      { Item: 'Closing Balance', Value: closingBalance }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.writeFile(wb, `${personName}_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${personName} - Ledger</title>
      <style>
        body { font-family: Arial; margin:20px; }
        table { border-collapse:collapse; width:100%; }
        th, td { border:1px solid #ddd; padding:8px; text-align:left; }
        th { background-color:#f2f2f2; }
        .summary { background:#f9f9f9; padding:15px; border-radius:5px; margin-bottom:15px; }
        .given { color:#dc2626; }
        .received { color:#10b981; }
      </style>
      </head><body>
      <h1>${personName} - Ledger</h1>
      <p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>
      <div class="summary">
        <p><strong>Opening Balance:</strong> ₹${openingBalance.toLocaleString('en-IN')}</p>
        <p><strong>Total Given (I lent):</strong> ₹${totalGiven.toLocaleString('en-IN')}</p>
        <p><strong>Total Received (I borrowed):</strong> ₹${totalReceived.toLocaleString('en-IN')}</p>
        <p><strong>Net Change:</strong> ₹${netChange.toLocaleString('en-IN')}</p>
        <p><strong>Closing Balance:</strong> ₹${closingBalance.toLocaleString('en-IN')}</p>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount (₹)</th><th>Balance (₹)</th></tr></thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
              <td class="${t.type}">${t.type === 'given' ? 'Given (I lent)' : 'Received (I borrowed)'}</td>
              <td>${t.description || '-'}</td>
              <td class="${t.type}">${t.type === 'given' ? '-' : '+'} ₹${t.amount.toLocaleString('en-IN')}</td>
              <td>₹${t.runningBalance.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resetToCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');

  if (!personId) return null;

  return (
    <div className="space-y-4 dark:text-white pb-20">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">
          ← Back to list
        </button>
        <h2 className="text-xl font-black uppercase text-gray-800 dark:text-white">{personName} - Ledger</h2>
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
        <button onClick={resetToCurrentMonth}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opening Balance</p>
            <p className={`text-xl font-black ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{openingBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Given (I lent)</p>
            <p className="text-xl font-black text-red-600 dark:text-red-400">₹{totalGiven.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Received (I borrowed)</p>
            <p className="text-xl font-black text-green-600 dark:text-green-400">₹{totalReceived.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Closing Balance</p>
            <p className={`text-xl font-black ${closingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{closingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance</th><th>Action</th></tr>
              </thead>
              <tbody>{[...Array(5)].map((_,i) => <tr key={i} className="animate-pulse"><td colSpan="6">Loading...</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" ref={headerCheckboxRef} onChange={handleSelectAll} checked={transactions.length > 0 && selectedIds.length === transactions.length} /></th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 text-right">Balance (₹)</th>
                  <th className="px-4 py-3 text-center">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map(t => (
                  <tr key={t._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(t._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(t._id)} onChange={() => setSelectedIds(prev => prev.includes(t._id) ? prev.filter(i => i !== t._id) : [...prev, t._id])} /></td>
                    <td className="px-4 py-2">{formatDate(t.date)}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${t.type === 'given' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{t.type === 'given' ? 'Given' : 'Received'}</span></td>
                    <td className="px-4 py-2">{t.description || '-'}</td>
                    <td className={`px-4 py-2 font-black text-right ${t.type === 'given' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'given' ? '-' : '+'} ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">₹{t.runningBalance.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleSingleDelete(t._id)} className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No transactions in this period</td></tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 font-black">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 uppercase">Period Totals</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                      Given: ₹{totalGiven.toLocaleString('en-IN')}<br />
                      Received: ₹{totalReceived.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">₹{closingBalance.toLocaleString('en-IN')}</td>
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
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 border border-slate-300 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronLeft size={14} className="text-slate-700 dark:text-white" />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1 border border-slate-300 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronRight size={14} className="text-slate-700 dark:text-white" />
            </button>
          </div>
        </div>
      )}

      <AddOtherPersonTransactionModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddTransaction}
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

export default OtherPersonLedger;