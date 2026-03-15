import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../api/api";
import { backendUrl } from "../utils/backendUrl";
import ButtonLoaders from "./loaders/ButtonLoaders";

const AddExpenseModal = ({ isOpen, onClose, onSuccess, onError }) => {
    const initialState = {
        title: "salary",
        payedAmount: "",
        paymentPurpes: "",
        expenseDate: new Date().toISOString().split('T')[0],
        descraption: ""
    };
    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title: formData.title,
            amount: [
                { payedAmount: Number(formData.payedAmount) },
                { paymentPurpes: formData.paymentPurpes }
            ],
            descraption: formData.descraption,
            expenseDate: formData.expenseDate
        };

        try {
            const response = await axios.post(`${backendUrl}/api/persnol/expantion`, payload, {
                withCredentials: true
            });
            if (response.data.success) {
                onSuccess("Expense added successfully 💰");
                setFormData(initialState);
                onClose();
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleSubmit();
            }
            onError(error.response?.data?.message || "Failed to record expense");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md   shadow-2xl p-8 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter decoration-blue-500 decoration-4 underline underline-offset-4">
                        Add Expense
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800   transition-colors">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 font-medium">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Category</label>
                        <select
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 duration-200 mt-2"
                        >
                            <option value="salary" className="dark:bg-slate-800">Salary</option>
                            <option value="bills" className="dark:bg-slate-800">Office Bills</option>
                            <option value="other" className="dark:bg-slate-800">Others</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</label>
                            <input required type="number" placeholder="0.00"
                                className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white mt-2 outline-none focus:border-blue-500"
                                value={formData.payedAmount} onChange={(e) => setFormData({ ...formData, payedAmount: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</label>
                            <input required type="date"
                                className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm mt-2 outline-none focus:border-blue-500"
                                value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Purpose / Recipient</label>
                        <input required type="text" placeholder="e.g., Staff Name or Rent"
                            className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white mt-2 outline-none focus:border-blue-500"
                            value={formData.paymentPurpes} onChange={(e) => setFormData({ ...formData, paymentPurpes: e.target.value })} />
                    </div>

                    <button disabled={loading}
                        className="w-full bg-slate-900 dark:bg-black text-white py-4   font-black shadow-xl active:scale-95 transition-all mt-4 tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                        {loading ? <ButtonLoaders /> : "Confirm Expense"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;