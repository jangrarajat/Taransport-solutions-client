import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  RotateCcw, Plus, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet, Printer, 
  Fuel, Truck, Calendar, IndianRupee, X 
} from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import AddPaymentModal from "./AddPaymentModal";
import DeleteConfirmModal from "../DeleteConfirmModal";
import SuccessToster from "../toster/SuccessToster";
import { refreshToken } from "../../api/api";

// Direct Diesel Entry Modal
const AddDirectDieselModal = ({ isOpen, onClose, onSubmit, showNotification, pumpId, pumpName }) => {
  const [amount, setAmount] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

  const showInternalNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  const fetchVehicles = async () => {
    setFetchingVehicles(true);
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master`, { withCredentials: true });
      if (res.data.success) {
        setVehicleList(res.data.vehicles);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchVehicles();
      }
      console.error("Failed to fetch vehicles", error);
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      showInternalNotification(false, "Enter valid amount");
      return;
    }

    if (!vehicleNo) {
      showInternalNotification(false, "Please select a vehicle");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ 
        amount: Number(amount), 
        vehicleNo,
        date, 
        description,
        type: "purchase",
        pumpId
      });
      setAmount("");
      setVehicleNo("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error) {
      // handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-300 my-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
              Add Direct Diesel - {pumpName}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Truck size={12} /> Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                list="vehicleList"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
                placeholder="Select or enter vehicle number"
                required
              />
              <datalist id="vehicleList">
                {fetchingVehicles ? (
                  <option value="" disabled>Loading vehicles...</option>
                ) : (
                  vehicleList.map(v => <option key={v._id} value={v.vehicleNo} />)
                )}
              </datalist>
              {fetchingVehicles && (
                <p className="text-[8px] text-blue-500 mt-1">Loading vehicles...</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} /> Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <IndianRupee size={12} /> Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
                required
                min="1"
                step="1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Fuel size={12} /> Description (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Direct diesel purchase"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <ButtonLoaders /> : "Add Diesel Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const PumpLedger = ({ pumpId, pumpName, onBack, showNotification }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pumpDetails, setPumpDetails] = useState(null);
  const [totals, setTotals] = useState({ totalPurchases: 0, totalPayments: 0 });
  const [openingBefore, setOpeningBefore] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [directDieselModalOpen, setDirectDieselModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

  const headerCheckboxRef = useRef(null);

  const showInternalNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  // Helper to get current month range
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
      const res = await axios.get(`${backendUrl}/api/pump-transactions/ledger`, {
        params: { pumpId, page, startDate, endDate, limit: 50 },
        withCredentials: true
      });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setPumpDetails(res.data.pump);
        setTotalPages(res.data.totalPages || 1);
        setTotals(res.data.totals || { totalPurchases: 0, totalPayments: 0 });
        setOpeningBefore(res.data.openingBeforeRange || 0);
        setSelectedIds([]); // Clear selections on new data load
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchLedger();
      }
      showInternalNotification(false, "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pumpId) fetchLedger();
  }, [pumpId, page, startDate, endDate]);

  const handleAddPayment = async (paymentData) => {
    try {
      await axios.post(`${backendUrl}/api/pump-transactions/payment`, { pumpId, ...paymentData }, { withCredentials: true });
      showInternalNotification(true, "Payment added");
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAddPayment(paymentData);
      }
      showInternalNotification(false, error.response?.data?.message || "Payment failed");
    }
  };

  const handleAddDirectDiesel = async (dieselData) => {
    try {
      await axios.post(`${backendUrl}/api/pump-transactions/purchase`, {
        pumpId: dieselData.pumpId,
        amount: dieselData.amount,
        date: dieselData.date,
        description: dieselData.description || "Direct diesel purchase",
        vehicleNo: dieselData.vehicleNo,
        reference: null
      }, { withCredentials: true });
      showInternalNotification(true, "Direct diesel entry added");
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleAddDirectDiesel(dieselData);
      }
      showInternalNotification(false, error.response?.data?.message || "Failed to add diesel entry");
    }
  };

  const handleSingleDelete = (id) => {
    setDeleteModal({ open: true, ids: [id] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      showInternalNotification(false, "Please select transactions to delete");
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
        axios.delete(`${backendUrl}/api/pump-transactions/${id}`, { withCredentials: true })
      );
      
      await Promise.all(deletePromises);
      
      showInternalNotification(true, `${deleteModal.ids.length} Transaction${deleteModal.ids.length > 1 ? 's' : ''} deleted successfully`);
      setSelectedIds([]);
      fetchLedger();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDeleteConfirm();
      }
      showInternalNotification(false, error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteModal({ open: false, ids: [] });
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-GB'),
      'Vehicle No': t.vehicleNo || '-',
      Description: t.description || '-',
      Type: t.type === 'purchase' ? 'Purchase (Diesel)' : 'Payment',
      'Amount (₹)': t.amount,
      'Running Balance (₹)': t.runningBalance
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    // Add summary sheet
    const summaryData = [
      { Item: 'Pump Name', Value: pumpName },
      { Item: 'Period', Value: `${startDate || 'Start'} to ${endDate || 'End'}` },
      { Item: 'Opening Balance', Value: openingBefore },
      { Item: 'Total Purchases', Value: totals.totalPurchases },
      { Item: 'Total Payments', Value: totals.totalPayments },
      { Item: 'Closing Balance', Value: openingBefore + totals.totalPurchases - totals.totalPayments }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    XLSX.writeFile(wb, `${pumpName}_ledger_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Print
  const handlePrint = () => {
    const closingBalance = openingBefore + totals.totalPurchases - totals.totalPayments;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${pumpName} - Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            h2 { font-size: 16px; margin: 15px 0 5px; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin: 10px 0; }
            .summary p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>${pumpName} - Ledger</h1>
          <p>Period: ${startDate || 'Start'} to ${endDate || 'End'}</p>
          
          <h2>Summary</h2>
          <div class="summary">
            <p><strong>Opening Balance:</strong> ₹${openingBefore.toLocaleString('en-IN')}</p>
            <p><strong>Total Purchases:</strong> ₹${totals.totalPurchases.toLocaleString('en-IN')}</p>
            <p><strong>Total Payments:</strong> ₹${totals.totalPayments.toLocaleString('en-IN')}</p>
            <p><strong>Closing Balance:</strong> ₹${closingBalance.toLocaleString('en-IN')}</p>
          </div>

          <h2>Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle No</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount (₹)</th>
                <th>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
                  <td>${t.vehicleNo || '-'}</td>
                  <td>${t.description || '-'}</td>
                  <td>${t.type === 'purchase' ? 'Purchase' : 'Payment'}</td>
                  <td>${t.amount.toLocaleString('en-IN')}</td>
                  <td>${t.runningBalance.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');

  const closingBalance = openingBefore + totals.totalPurchases - totals.totalPayments;

  // Skeleton loaders
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
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Vehicle No</th>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Amount (₹)</th>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Balance (₹)</th>
              <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
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

  if (!pumpId) return null;

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">
            ← Back to pumps
          </button>
          <h2 className="text-xl font-black uppercase text-gray-800 dark:text-white">{pumpName} - Ledger</h2>
        </div>

        {/* Filter and Actions */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-2 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          />
          <button
            onClick={fetchLedger}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => {
              const range = getCurrentMonthRange();
              setStartDate(range.start);
              setEndDate(range.end);
            }}
            className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
            title="Reset to current month"
          >
            <RotateCcw size={12} className="text-slate-700 dark:text-white" />
          </button>
          
          {/* Export/Print Buttons */}
          <button
            onClick={exportToExcel}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export to Excel"
          >
            <FileSpreadsheet size={14} />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Print"
          >
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

          {/* Action Buttons */}
          <button
            onClick={() => setDirectDieselModalOpen(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            title="Add direct diesel entry without trip"
          >
            <Fuel size={12} /> Add Diesel
          </button>
          
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
          >
            <Plus size={12} /> Add Payment
          </button>
        </div>

        {/* Summary Cards */}
        {loading ? <SummarySkeleton /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opening Balance (before {startDate || 'start'})</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">₹{openingBefore.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Purchases</p>
              <p className="text-xl font-black text-red-600 dark:text-red-400">₹{(totals.totalPurchases || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Payments</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400">₹{(totals.totalPayments || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Closing Balance</p>
              <p className={`text-xl font-black ${closingBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                ₹{closingBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {loading ? <TableSkeleton /> : (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        ref={headerCheckboxRef}
                        onChange={handleSelectAll}
                        checked={transactions.length > 0 && selectedIds.length === transactions.length}
                        className="rounded dark:bg-slate-700 dark:border-slate-600"
                      />
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Vehicle No</th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Amount (₹)</th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Balance (₹)</th>
                    <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.length > 0 ? (
                    transactions.map((t) => (
                      <tr key={t._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(t._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
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
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{t.vehicleNo || '-'}</td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          {t.description || '-'}
                          {t.type === 'purchase' && !t.reference && <span className="ml-2 text-[8px] text-blue-400">(direct)</span>}
                          {t.type === 'purchase' && t.reference && <span className="ml-2 text-[8px] text-purple-400">(trip)</span>}
                        </td>
                        <td className={`px-4 py-2 font-black text-right ${t.type === 'purchase' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {t.type === 'purchase' ? '−' : '+'} ₹{t.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">
                          ₹{t.runningBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleSingleDelete(t._id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                        No transactions in this period
                      </td>
                    </tr>
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-black">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 uppercase">Period Totals</td>
                      <td></td>
                      <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                        Purchases: ₹{(totals.totalPurchases || 0).toLocaleString('en-IN')}<br />
                        Payments: ₹{(totals.totalPayments || 0).toLocaleString('en-IN')}
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={14} className="text-slate-700 dark:text-white" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={14} className="text-slate-700 dark:text-white" />
              </button>
            </div>
          </div>
        )}

        <AddPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handleAddPayment}
          showNotification={showInternalNotification}
        />

        <AddDirectDieselModal
          isOpen={directDieselModalOpen}
          onClose={() => setDirectDieselModalOpen(false)}
          onSubmit={handleAddDirectDiesel}
          showNotification={showInternalNotification}
          pumpId={pumpId}
          pumpName={pumpName}
        />

        <DeleteConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, ids: [] })}
          onConfirm={handleDeleteConfirm}
          title="Transaction"
          count={deleteModal.ids.length}
          showNotification={showInternalNotification}
        />
      </div>
    </>
  );
};

export default PumpLedger;