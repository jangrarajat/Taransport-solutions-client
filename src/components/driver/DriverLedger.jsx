import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { RotateCcw, Plus, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet, Printer, CheckSquare } from "lucide-react";
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
  const [totalSalary, setTotalSalary] = useState(0);
  const [openingBefore, setOpeningBefore] = useState(0);
  const [currentMonthSalary, setCurrentMonthSalary] = useState(0);
  const [pendingSalary, setPendingSalary] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [salarySummary, setSalarySummary] = useState({
    monthlySalary: 0,
    salaryPaid: 0,
    pendingSalary: 0,
    extraPayments: 0
  });
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
        setDriverDetails(res.data.driver);
        setTotalPages(res.data.totalPages || 1);
        setTotalPayments(res.data.totalPayments || 0);
        setTotalSalary(res.data.totalSalary || 0);
        setOpeningBefore(res.data.openingBeforeRange || 0);
        setCurrentMonthSalary(res.data.currentMonthSalary || 0);
        setPendingSalary(res.data.pendingSalary || 0);
        setSalarySummary({
          monthlySalary: res.data.driver?.monthlySalary || 0,
          salaryPaid: res.data.salaryPaid || 0,
          pendingSalary: res.data.pendingSalary || 0,
          extraPayments: res.data.extraPayments || 0
        });
        setSelectedIds([]); // Clear selections on new data load
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
      Type: t.type === 'salary' ? 'Salary' : 'Payment',
      Description: t.description || '-',
      Month: t.month ? `${t.month}/${t.year}` : '-',
      'Amount (₹)': t.amount,
      'Running Balance (₹)': t.runningBalance
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const summaryData = [
      { Item: 'Driver Name', Value: driverName },
      { Item: 'Monthly Salary', Value: salarySummary.monthlySalary },
      { Item: 'Salary Paid (This Period)', Value: salarySummary.salaryPaid },
      { Item: 'Pending Salary', Value: salarySummary.pendingSalary },
      { Item: 'Extra Payments', Value: salarySummary.extraPayments },
      { Item: 'Period', Value: `${startDate || 'Start'} to ${endDate || 'End'}` },
      { Item: 'Opening Balance', Value: openingBefore },
      { Item: 'Total Transactions', Value: totalPayments + totalSalary },
    ];
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.writeFile(wb, `${driverName}_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const closingBalance = openingBefore + totalPayments + totalSalary;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${driverName} - Ledger</title>
      <style>
        body { font-family: Arial; margin:20px; }
        table { border-collapse:collapse; width:100%; }
        th, td { border:1px solid #ddd; padding:8px; text-align:left; }
        th { background-color:#f2f2f2; }
        .summary { margin:10px 0; background:#f9f9f9; padding:15px; border-radius:5px; }
        .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .summary-item { padding:10px; background:white; border-radius:5px; }
        .summary-label { font-size:12px; color:#666; }
        .summary-value { font-size:18px; font-weight:bold; }
        .salary { color:#2563eb; }
        .payment { color:#16a34a; }
      </style>
      </head><body>
      <h1>${driverName} - Ledger</h1>
      <p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>
      
      <div class="summary">
        <h3>Salary Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Monthly Salary</div>
            <div class="summary-value salary">₹${salarySummary.monthlySalary.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Salary Paid (This Period)</div>
            <div class="summary-value">₹${salarySummary.salaryPaid.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Pending Salary</div>
            <div class="summary-value" style="color:${salarySummary.pendingSalary > 0 ? '#dc2626' : '#16a34a'}">
              ₹${salarySummary.pendingSalary.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <div class="summary">
        <h3>Balance Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Opening Balance</div>
            <div class="summary-value">₹${openingBefore.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Transactions</div>
            <div class="summary-value">₹${(totalPayments + totalSalary).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <h2>Transactions</h2>
      <table>
        <thead><tr>
          <th>Date</th>
          <th>Type</th>
          <th>Description</th>
          <th>Month</th>
          <th>Amount (₹)</th>
          <th>Balance (₹)</th>
        </tr></thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
              <td class="${t.type}">${t.type === 'salary' ? 'Salary' : 'Payment'}</td>
              <td>${t.description || '-'}</td>
              <td>${t.month ? `${t.month}/${t.year}` : '-'}</td>
              <td>₹${t.amount.toLocaleString('en-IN')}</td>
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

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');
  const closingBalance = openingBefore + totalPayments + totalSalary;

  const SummarySkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-16"></div>
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                <td className="px-4 py-2 text-right"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto"></div></td>
                <td className="px-4 py-2 text-right"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto"></div></td>
                <td className="px-4 py-2 text-center"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-6 mx-auto"></div></td>
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
        <button onClick={onBack} className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">
          ← Back to drivers
        </button>
        <h2 className="text-xl font-black uppercase text-gray-800 dark:text-white">{driverName} - Ledger</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border rounded-lg px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 flex-1 min-w-[120px]" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border rounded-lg px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 flex-1 min-w-[120px]" />
        <button onClick={fetchLedger}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
          Apply
        </button>
        <button onClick={() => { const range = getCurrentMonthRange(); setStartDate(range.start); setEndDate(range.end); }}
          className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500" title="Reset">
          <RotateCcw size={12} className="text-slate-700 dark:text-white" />
        </button>
        <button onClick={exportToExcel}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700" title="Excel">
          <FileSpreadsheet size={14} />
        </button>
        <button onClick={handlePrint}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" title="Print">
          <Printer size={14} />
        </button>
        
        {/* Selection Controls */}
        {selectedIds.length > 0 && (
          <>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-black">
              {selectedIds.length} Selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-700"
            >
              <Trash2 size={12} /> Delete Selected
            </button>
          </>
        )}

        <button onClick={() => setPaymentModalOpen(true)}
          className="ml-auto flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700">
          <Plus size={12} /> Add Transaction
        </button>
      </div>

      {/* Salary Summary Cards */}
      {loading ? <SummarySkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Salary</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">₹{salarySummary.monthlySalary.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salary Paid (This Month)</p>
            <p className="text-xl font-black text-green-600 dark:text-green-400">₹{currentMonthSalary.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Salary</p>
            <p className={`text-xl font-black ${pendingSalary > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              ₹{pendingSalary.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Extra Payments</p>
            <p className="text-xl font-black text-orange-600 dark:text-orange-400">₹{salarySummary.extraPayments.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Balance Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opening Balance (before {startDate || 'start'})</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₹{openingBefore.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Transactions</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">₹{(totalPayments + totalSalary).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {loading ? <TableSkeleton /> : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">
                    <input
                      type="checkbox"
                      ref={headerCheckboxRef}
                      onChange={handleSelectAll}
                      checked={transactions.length > 0 && selectedIds.length === transactions.length}
                      className="rounded dark:bg-slate-700 dark:border-slate-600"
                    />
                  </th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Date</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Type</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Description</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Month</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Amount (₹)</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Balance (₹)</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length > 0 ? transactions.map(t => (
                  <tr key={t._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(t._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t._id)}
                        onChange={() => setSelectedIds(prev => 
                          prev.includes(t._id) 
                            ? prev.filter(i => i !== t._id) 
                            : [...prev, t._id]
                        )}
                        className="rounded dark:bg-slate-700 dark:border-slate-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{formatDate(t.date)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        t.type === 'salary' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {t.type === 'salary' ? 'Salary' : 'Payment'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{t.description || '-'}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      {t.month ? `${t.month}/${t.year}` : '-'}
                    </td>
                    <td className={`px-4 py-2 font-black text-right ${
                      t.type === 'salary' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      + ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">
                      ₹{t.runningBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleSingleDelete(t._id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No transactions in this period</td></tr>
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 font-black">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 uppercase">Period Totals</td>
                    <td colSpan="2"></td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                      Salary: ₹{totalSalary.toLocaleString('en-IN')}<br />
                      Payments: ₹{totalPayments.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                      {closingBalance.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="p-1 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronLeft size={14} className="text-slate-700 dark:text-white" />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700">
              <ChevronRight size={14} className="text-slate-700 dark:text-white" />
            </button>
          </div>
        </div>
      )}

      <AddDriverPaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment} 
        showNotification={showNotification}
        driverMonthlySalary={driverDetails?.monthlySalary || 0}
        currentMonthSalary={currentMonthSalary}
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