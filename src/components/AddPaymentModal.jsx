import React, { useState } from "react";
import { X, Calendar, IndianRupee, FileText } from "lucide-react";
import ButtonLoaders from "./loaders/ButtonLoaders";

const AddPaymentModal = ({ isOpen, onClose, onSubmit, showNotification }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showNotification(false, "Enter valid amount");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ amount: Number(amount), date, description });
      setAmount("");
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
    <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-300 my-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-black text-slate-800 dark:text-white underline decoration-green-500 decoration-4 underline-offset-8 uppercase tracking-widest">
            Add Payment to Pump
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} /> Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <IndianRupee size={12} /> Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
              min="1"
              step="1"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <FileText size={12} /> Description (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Cash paid"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Buttons */}
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
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-200 dark:shadow-green-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <ButtonLoaders /> : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;