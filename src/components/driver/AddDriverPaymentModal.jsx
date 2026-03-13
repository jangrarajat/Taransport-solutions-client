import React, { useState } from "react";
import { X, Calendar, IndianRupee, FileText } from "lucide-react";
import ButtonLoaders from "../loaders/ButtonLoaders";

const AddDriverPaymentModal = ({ isOpen, onClose, onSubmit, showNotification }) => {
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 uppercase tracking-widest">Add Payment to Driver</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-white/70" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1"><Calendar size={12} /> Date <span className="text-red-400">*</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-white" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1"><IndianRupee size={12} /> Amount (₹) <span className="text-red-400">*</span></label>
            <input type="number" placeholder="e.g., 5000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-white" required min="1" step="1" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1"><FileText size={12} /> Description (optional)</label>
            <input type="text" placeholder="e.g., Advance payment" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-white" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-black uppercase text-xs tracking-widest transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
              {loading ? <ButtonLoaders /> : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverPaymentModal;