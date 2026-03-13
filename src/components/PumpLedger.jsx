import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, RotateCcw, Plus, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from "lucide-react";
import { backendUrl } from "../utils/backendUrl";
import ButtonLoaders from "./loaders/ButtonLoaders";
import AddPaymentModal from "./AddPaymentModal";

const PumpLedger = ({ pumpId, pumpName, onBack, showNotification }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [pumpDetails, setPumpDetails] = useState(null);
    const [totals, setTotals] = useState({ totalPurchases: 0, totalPayments: 0 });
    const [openingBefore, setOpeningBefore] = useState(0);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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
        if (pumpId) fetchLedger();
    }, [pumpId, page, startDate, endDate]);

    const handleAddPayment = async (paymentData) => {
        try {
            await axios.post(`${backendUrl}/api/pump-transactions/payment`, { pumpId, ...paymentData }, { withCredentials: true });
            showNotification(true, "Payment added");
            fetchLedger();
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleAddPayment();
            }
            showNotification(false, "Payment failed");
        }
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB');

    const closingBalance = openingBefore + totals.totalPurchases - totals.totalPayments;

    if (!pumpId) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">
                    ← Back to pumps
                </button>
                <h2 className="text-xl font-black uppercase text-gray-800 dark:text-white">{pumpName} - Ledger</h2>
            </div>

            {/* Filter and Add Payment */}
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
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    title="Reset to all dates"
                >
                    <RotateCcw size={12} className="text-slate-700 dark:text-white" />
                </button>
                <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="ml-auto flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                >
                    <Plus size={12} /> Add Payment
                </button>
            </div>

            {/* Summary Cards */}
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

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Amount (₹)</th>
                                <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{formatDate(t.date)}</td>
                                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                                            {t.description || '-'}
                                            {t.type === 'purchase' && <span className="ml-2 text-[8px] text-red-400">(diesel)</span>}
                                        </td>
                                        <td className={`px-4 py-2 font-black text-right ${t.type === 'purchase' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {t.type === 'purchase' ? '−' : '+'} ₹{t.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-2 font-black text-right text-slate-900 dark:text-white">
                                            ₹{t.runningBalance.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                                        No transactions in this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {transactions.length > 0 && (
                            <tfoot className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-black">
                                <tr>
                                    <td colSpan="2" className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 uppercase">Period Totals</td>
                                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                                        Purchases: ₹{(totals.totalPurchases || 0).toLocaleString('en-IN')}<br />
                                        Payments: ₹{(totals.totalPayments || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                                        {closingBalance.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                showNotification={showNotification}
            />
        </div>
    );
};

export default PumpLedger;