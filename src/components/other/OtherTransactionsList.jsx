import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, FileSpreadsheet, Printer, RotateCcw, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { refreshToken } from "../../api/api";

const AddEditOtherModal = ({ isOpen, onClose, onSubmit, transaction, showNotification }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    description: "",
    type: "expense"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : "",
        amount: transaction.amount || "",
        description: transaction.description || "",
        type: transaction.type || "expense"
      });
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        type: "expense"
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      showNotification(false, "Enter valid amount");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      // handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl animate-in zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type *</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white">
              <option value="expense">Expense (Money Given)</option>
              <option value="income">Income (Money Received)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount (₹) *</label>
            <input type="number" placeholder="e.g., 5000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" required min="1" step="1" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description (optional)</label>
            <input type="text" placeholder="e.g., Loan to friend" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
              {loading ? <ButtonLoaders /> : (transaction ? "Update" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OtherTransactionsList = ({ showNotification }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/other-transactions`, {
        params: { page, limit: 50, search: searchTerm, startDate, endDate },
        withCredentials: true
      });
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages);
        setOpeningBalance(res.data.openingBalance || 0);
        setClosingBalance(res.data.closingBalance || 0);
        setSelectedIds([]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchTransactions();
      }
      showNotification(false, "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, searchTerm, startDate, endDate]);

  const handleAdd = async (data) => {
    try {
      await axios.post(`${backendUrl}/api/other-transactions`, data, { withCredentials: true });
      showNotification(true, "Transaction added");
      fetchTransactions();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAdd(data);
      }
      showNotification(false, error.response?.data?.message || "Failed");
      throw error;
    }
  };

  const handleEdit = async (data) => {
    try {
      await axios.put(`${backendUrl}/api/other-transactions/${editingTransaction._id}`, data, { withCredentials: true });
      showNotification(true, "Transaction updated");
      fetchTransactions();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleEdit(data);
      }
      showNotification(false, error.response?.data?.message || "Failed");
      throw error;
    }
  };

  const handleDelete = async (ids) => {
    try {
      const deletePromises = ids.map(id => axios.delete(`${backendUrl}/api/other-transactions/${id}`, { withCredentials: true }));
      await Promise.all(deletePromises);
      showNotification(true, `${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted`);
      fetchTransactions();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDelete(ids);
      }
      showNotification(false, error.response?.data?.message || "Delete failed");
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

  const exportToExcel = () => {
    // Prepare transaction data
    const transactionData = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-GB'),
      Type: t.type === 'income' ? 'Income (Received)' : 'Expense (Paid)',
      Description: t.description || '-',
      'Amount (₹)': t.type === 'income' ? t.amount : -t.amount,
      'Running Balance (₹)': t.runningBalance
    }));

    const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
    wsTransactions['!cols'] = [
      { wch: 12 }, // Date
      { wch: 15 }, // Type
      { wch: 30 }, // Description
      { wch: 12 }, // Amount
      { wch: 15 }, // Running Balance
    ];

    // Prepare summary data
    const netChange = closingBalance - openingBalance;
    const summaryData = [
      { Parameter: 'Period', Value: `${startDate || 'Start'} to ${endDate || 'End'}` },
      { Parameter: 'Opening Balance (before start)', Value: `₹${openingBalance.toLocaleString('en-IN')}` },
      { Parameter: 'Closing Balance (after end)', Value: `₹${closingBalance.toLocaleString('en-IN')}` },
      { Parameter: 'Net Change (Income – Expense)', Value: `₹${netChange.toLocaleString('en-IN')}` },
      { Parameter: 'Total Transactions', Value: transactions.length },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];

    // Create workbook with both sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

    XLSX.writeFile(wb, `other_transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const netChange = closingBalance - openingBalance;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cash Book</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 20px;
              line-height: 1.4;
            }
            h1 {
              color: #1e293b;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            .summary {
              background: #f1f5f9;
              border-left: 4px solid #3b82f6;
              padding: 12px 20px;
              margin: 20px 0;
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
            }
            .summary-item {
              flex: 1;
              min-width: 200px;
            }
            .summary-label {
              font-size: 12px;
              color: #475569;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #0f172a;
            }
            .positive {
              color: #10b981;
            }
            .negative {
              color: #ef4444;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #e2e8f0;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
            }
            td {
              font-size: 11px;
            }
            .income {
              color: #10b981;
              font-weight: 600;
            }
            .expense {
              color: #ef4444;
              font-weight: 600;
            }
            .footer {
              margin-top: 20px;
              font-size: 10px;
              text-align: center;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0.5in; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Cash Book</h1>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Period</div>
              <div class="summary-value">${startDate || 'Start'} to ${endDate || 'End'}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Opening Balance (before start)</div>
              <div class="summary-value ${openingBalance >= 0 ? 'positive' : 'negative'}">
                ₹${openingBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Closing Balance (after end)</div>
              <div class="summary-value ${closingBalance >= 0 ? 'positive' : 'negative'}">
                ₹${closingBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net Change (Income – Expense)</div>
              <div class="summary-value ${netChange >= 0 ? 'positive' : 'negative'}">
                ₹${netChange.toLocaleString('en-IN')}
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Transactions</div>
              <div class="summary-value">${transactions.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount (₹)</th>
                <th>Running Balance (₹)</th>
              </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
                  <td class="${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</td>
                  <td>${t.description || '-'}</td>
                  <td class="${t.type}">${t.type === 'income' ? '+' : '-'} ₹${Math.abs(t.amount).toLocaleString('en-IN')}</td>
                  <td>₹${(t.runningBalance || 0).toLocaleString('en-IN')}</td>
                 </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Transport Solutions
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const resetToCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');

  return (
    <div className="space-y-4 dark:text-white">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white" />
          <button onClick={fetchTransactions} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Apply</button>
          <button onClick={resetToCurrentMonth} className="p-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500"><RotateCcw size={12} /></button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Search description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 pr-2 py-1 text-black border rounded text-xs" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 text-xs font-black uppercase"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={handlePrint} className="flex items-center gap-1 bg-purple-600 text-white px-3 py-2 text-xs font-black uppercase"><Printer size={14} /> Print</button>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 text-xs font-black uppercase"><Trash2 size={14} /> Delete Selected</button>
          )}
          <button onClick={() => { setEditingTransaction(null); setModalOpen(true); }} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 text-xs font-black uppercase"><Plus size={14} /> Add</button>
        </div>
      </div>

      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opening Balance (before {startDate || 'start'})</p>
            <p className={`text-xl font-black ${openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{openingBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Closing Balance (after {endDate || 'end'})</p>
            <p className={`text-xl font-black ${closingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{closingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-center font-bold text-sm">
          <span className="text-slate-700 dark:text-slate-300">
            Net Change (Income – Expense):{' '}
            <span className={`${closingBalance - openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{(closingBalance - openingBalance).toLocaleString('en-IN')}
            </span>
          </span>
        </div>
      )}

      {loading ? (
        <div className="h-40 flex justify-center"><ButtonLoaders /></div>
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
                  <th className="px-4 py-3 text-right">Running Balance (₹)</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map(t => (
                  <tr key={t._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(t._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(t._id)} onChange={() => setSelectedIds(prev => prev.includes(t._id) ? prev.filter(i => i !== t._id) : [...prev, t._id])} /></td>
                    <td className="px-4 py-2">{formatDate(t.date)}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span></td>
                    <td className="px-4 py-2">{t.description || '-'}</td>
                    <td className={`px-4 py-2 font-black text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} ₹{Math.abs(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">
                      ₹{(t.runningBalance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2 text-center flex justify-center gap-1">
                      <button onClick={() => { setEditingTransaction(t); setModalOpen(true); }} className="p-1 text-amber-600 hover:bg-amber-50"><Edit2 size={14} /></button>
                      <button onClick={() => handleSingleDelete(t._id)} className="p-1 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 border dark:border-slate-700">
          <p className="text-xs">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 border disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1 border disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      <AddEditOtherModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingTransaction(null); }} onSubmit={editingTransaction ? handleEdit : handleAdd} transaction={editingTransaction} showNotification={showNotification} />

      <DeleteConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, ids: [] })} onConfirm={() => handleDelete(deleteModal.ids)} title="Transaction" count={deleteModal.ids.length} showNotification={showNotification} />
    </div>
  );
};

export default OtherTransactionsList;