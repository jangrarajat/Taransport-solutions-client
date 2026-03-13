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
            const res = await axios.put(`${backendUrl}/bill/update-maintenance/${bill._id}`,
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-lg font-black text-white uppercase">Vehicle Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer text-white/50 hover:text-white" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-white/50 uppercase">Maintenance Amount (₹)</label>
                        <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-400" placeholder="e.g. 2000" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-white/50 uppercase">Remark / Reason</label>
                        <input required type="text" value={remark} onChange={(e) => setRemark(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-400" placeholder="Tyre change, Oil, etc." />
                    </div>
                    <button disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loading ? <ButtonLoaders /> : "Save & Update Balance"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceModal;