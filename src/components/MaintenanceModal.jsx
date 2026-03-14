import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../api/api";
import { backendUrl } from "../utils/backendUrl";
import ButtonLoaders from "./loaders/ButtonLoaders";

const MaintenanceModal = ({ isOpen, onClose, bill, onUpdate, showNotification }) => {
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${backendUrl}/api/bill/update-maintenance/${bill._id}`,
                { amount, remark }, { withCredentials: true });

            if (res.data.success) {
                onUpdate();
                showNotification(true, "Maintenance Added! 🚛");
                onClose();
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleSubmit();
            }
            showNotification(false, error.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Vehicle Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Maintenance Amount (₹)</label>
                        <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" placeholder="e.g. 2000" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Remark / Reason</label>
                        <input required type="text" value={remark} onChange={(e) => setRemark(e.target.value)}
                            className="w-full border rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-orange-400" placeholder="Tyre change, Oil, etc." />
                    </div>
                    <button disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-100 dark:shadow-orange-900/50 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loading ? <ButtonLoaders /> : "Save & Update Balance"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceModal;