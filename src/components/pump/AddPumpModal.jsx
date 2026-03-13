import React, { useState, useEffect } from "react";
import { X, User, Phone, MapPin, IndianRupee } from "lucide-react";
import axios from "axios";
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import { refreshToken } from "../../api/api";

const AddPumpModal = ({ isOpen, onClose, pump, onSuccess, showNotification }) => {
    const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", address: "", openingBalance: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (pump) {
            setForm({ ...pump, openingBalance: pump.openingBalance || 0 });
        } else {
            setForm({ name: "", contactPerson: "", phone: "", address: "", openingBalance: 0 });
        }
    }, [pump, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (pump) {
                await axios.put(`${backendUrl}/api/pump-master/${pump._id}`, form, { withCredentials: true });
            } else {
                await axios.post(`${backendUrl}/api/pump-master`, form, { withCredentials: true });
            }
            onSuccess();
            onClose();
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleSubmit();
            }
            showNotification(false, error.response?.data?.message || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-300 my-auto">
                <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-widest">
                        {pump ? "Edit Pump" : "Add Pump"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-white/70" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                            <User size={12} /> Pump Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-white"
                            placeholder="e.g., IOCL, BPCL, etc."
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                            <User size={12} /> Contact Person
                        </label>
                        <input
                            type="text"
                            value={form.contactPerson}
                            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-white"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                            <Phone size={12} /> Phone
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-white"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={12} /> Address
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-white"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                            <IndianRupee size={12} /> Opening Balance (₹)
                        </label>
                        <input
                            type="number"
                            value={form.openingBalance}
                            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-white"
                            placeholder="0"
                            min="0"
                            step="1"
                        />
                        <p className="text-[8px] text-white/30 mt-1">
                            Initial balance (if any) – can be negative
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-black uppercase text-xs tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <ButtonLoaders /> : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPumpModal;