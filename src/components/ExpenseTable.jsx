import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../api/api";
import DeleteConfirmModal from "./DeleteConfirmModal";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import { backendUrl } from "../utils/backendUrl";

const ExpenseTable = ({ data, loading, refreshData, filterTerm = "" }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
  
  const headerCheckboxRef = useRef(null);

  // Filter data based on search term (title/purpose)
  const filteredData = data.filter(ex => 
    ex.title?.toLowerCase().includes(filterTerm.toLowerCase()) || 
    ex.amount[1]?.paymentPurpes?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, ex) => {
    return sum + (ex.amount[0]?.payedAmount || 0);
  }, 0);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const allIds = filteredData.map(item => item._id);
      const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, filteredData]);

  const showNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(item => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSingleDelete = (id) => {
    setDeleteModal({ open: true, ids: [id] });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      showNotification(false, "Please select expenses to delete");
      return;
    }
    setDeleteModal({ open: true, ids: selectedIds });
  };

  const handleDeleteConfirm = async () => {
    try {
      const deletePromises = deleteModal.ids.map(id => 
        axios.delete(`${backendUrl}/persnol/delete-expense/${id}`, { 
          withCredentials: true 
        })
      );
      
      await Promise.all(deletePromises);
      
      showNotification(true, `${deleteModal.ids.length} Expense${deleteModal.ids.length > 1 ? 's' : ''} deleted successfully 🗑️`);
      setSelectedIds([]);
      refreshData();
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

  if (loading) {
    return <div className=" w-full flex justify-center p-10 text-center font-black uppercase text-slate-300 dark:text-slate-600 tracking-widest italic animate-pulse"><ButtonLoaders/></div>;
  }

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      {/* Selection Controls */}
      {filteredData.length > 0 && (
        <div className="mb-4 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
              {selectedIds.length} Selected
            </span>
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden font-bold uppercase tracking-tighter">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-black italic">
              <tr>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    onChange={handleSelectAll}
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                    className="rounded dark:bg-slate-700 dark:border-slate-600"
                  />
                </th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Date</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Title</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Purpose</th>
                <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Amount</th>
                {/* <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Action</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {filteredData.length > 0 ? filteredData.map((ex) => (
                <tr key={ex._id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(ex._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4 border-r dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ex._id)}
                      onChange={() => setSelectedIds(prev => 
                        prev.includes(ex._id) 
                          ? prev.filter(i => i !== ex._id) 
                          : [...prev, ex._id]
                      )}
                      className="rounded dark:bg-slate-700 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r dark:border-slate-700">
                    {ex.expenseDate || new Date(ex.createdAt).toLocaleDateString('en-GB')}
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
                  {/* <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleSingleDelete(ex._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td> */}
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-16 text-center text-slate-300 dark:text-slate-600 italic">No matching expenses found</td></tr>
              )}
            </tbody>
            {/* Total Row */}
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="px-6 py-4"></td>
                  <td colSpan="3" className="px-6 py-4 text-right text-slate-700 dark:text-slate-300 uppercase text-xs">
                    Total Amount:
                  </td>
                  <td className="px-6 py-4 border-r dark:border-slate-700">
                    <span className="text-blue-700 dark:text-blue-300 font-black text-sm">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4"></td> */}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, ids: [] })}
        onConfirm={handleDeleteConfirm}
        title="Expense"
        count={deleteModal.ids.length}
        showNotification={showNotification}
      />
    </>
  );
};

export default ExpenseTable;