import React, { useState } from "react";
import { X, Calendar, IndianRupee, FileText, Briefcase } from "lucide-react";
import ButtonLoaders from "../loaders/ButtonLoaders";

const AddDriverPaymentModal = ({ isOpen, onClose, onSubmit, showNotification, driverMonthlySalary, currentMonthSalary = 0 }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [paymentType, setPaymentType] = useState("payment");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const remainingSalary = driverMonthlySalary - currentMonthSalary;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      showNotification(false, "Enter valid amount");
      return;
    }

    if (paymentType === "salary" && Number(amount) > remainingSalary) {
      showNotification(false, `Amount exceeds remaining salary for this month. Remaining: ₹${remainingSalary}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ 
        amount: Number(amount), 
        date, 
        description,
        type: paymentType,
        month: selectedMonth,
        year: selectedYear
      });
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentType("payment");
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md   shadow-2xl animate-in zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center  ">
          <h2 className="text-xl font-black text-slate-800 dark:text-white underline decoration-green-500 decoration-4 underline-offset-8 uppercase tracking-widest">
            Add Driver Transaction
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800   transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Briefcase size={12} /> Transaction Type <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
            >
              <option value="payment">Payment (Extra/Advance)</option>
              <option value="salary">Monthly Salary</option>
            </select>
          </div>

          {paymentType === "salary" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{new Date(2000, m-1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3   border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Monthly Salary:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">₹{driverMonthlySalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Paid This Month:</span>
                  <span className="font-black text-green-600 dark:text-green-400">₹{currentMonthSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-blue-200 dark:border-blue-800 pt-1 mt-1">
                  <span className="text-slate-700 dark:text-slate-200">Remaining:</span>
                  <span className={remainingSalary > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                    ₹{remainingSalary.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} /> Date <span className="text-red-500">*</span>
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} 
              className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <IndianRupee size={12} /> Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              placeholder={paymentType === "salary" ? `Enter amount (Max: ₹${remainingSalary})` : "e.g., 5000"} 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" 
              required 
              min="1" 
              step="1" 
              max={paymentType === "salary" ? remainingSalary : undefined}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <FileText size={12} /> Description (optional)
            </label>
            <input 
              type="text" 
              placeholder={paymentType === "salary" ? "Monthly salary payment" : "e.g., Advance payment"} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white" 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300   font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white   font-black uppercase text-xs tracking-widest shadow-lg shadow-green-200 dark:shadow-green-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
              {loading ? <ButtonLoaders /> : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverPaymentModal;