import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";

import { refreshToken } from "../api/api";
import DeleteConfirmModal from "./DeleteConfirmModal";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import { backendUrl } from "../utils/backendUrl";

const ExpenseTable = ({ data, loading, refreshData, filterTerm = "" }) => {
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-300 dark:text-slate-600 tracking-widest italic animate-pulse">Fetching Expenses...</div>;

  const filteredData = data.filter(ex => 
    ex.title?.toLowerCase().includes(filterTerm.toLowerCase()) || 
    ex.amount[1]?.paymentPurpes?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, ex) => {
    return sum + (ex.amount[0]?.payedAmount || 0);
  }, 0);

  const showNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  const handleDeleteClick = async () => {
    try {
      await axios.delete(`${backendUrl}/persnol/delete-expense/${deleteModal.id}`, { 
        withCredentials: true 
      });
      showNotification(true, "Expense deleted successfully 🗑️");
      refreshData();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDeleteClick();
      }
      showNotification(false, error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden font-bold uppercase tracking-tighter">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-black italic">
              <tr>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Date</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Title</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Purpose</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Amount</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {filteredData.length > 0 ? filteredData.map((ex) => (
                <tr key={ex._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r dark:border-slate-700">
                    {new Date(ex.expenseDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 border-r dark:border-slate-700">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                      ex.title === 'salary' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                      ex.title === 'bills' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {ex.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-black border-r dark:border-slate-700">
                    {ex.amount[1]?.paymentPurpes || "N/A"}
                  </td>
                  <td className="px-6 py-4 border-r dark:border-slate-700">
                    <span className="text-blue-600 dark:text-blue-400 font-black text-xs italic">
                      ₹{ex.amount[0]?.payedAmount?.toLocaleString('en-IN') || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setDeleteModal({ open: true, id: ex._id })}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-16 text-center text-slate-300 dark:text-slate-600 italic">No matching expenses found</td></tr>
              )}
            </tbody>
            {/* Total Row */}
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-slate-700 dark:text-slate-300 uppercase text-xs">
                    Total Amount:
                  </td>
                  <td className="px-6 py-4 border-r dark:border-slate-700">
                    <span className="text-blue-700 dark:text-blue-300 font-black text-sm">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDeleteClick}
        title="Expense"
        count={1}
        showNotification={showNotification}
      />
    </>
  );
};

export default ExpenseTable;