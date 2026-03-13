import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Eye, Phone, User, MapPin } from "lucide-react";
import { backendUrl } from "../utils/backendUrl";
import ButtonLoaders from "./loaders/ButtonLoaders";
import AddPumpModal from "./AddPumpModal";

const PumpMasterList = ({ showNotification, onSelectPump }) => {
    const [pumps, setPumps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPump, setEditingPump] = useState(null);

    const fetchPumps = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/pump-master`, { withCredentials: true });
            if (res.data.success) setPumps(res.data.pumps);
        } catch (error) {
              if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return fetchPumps();
            }
            showNotification(false, "Failed to load pumps");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPumps();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this pump? All transactions will also be deleted.")) return;
        try {
            await axios.delete(`${backendUrl}/api/pump-master/${id}`, { withCredentials: true });
            showNotification(true, "Pump deleted");
            fetchPumps();
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleDelete();
            }
            showNotification(false, "Delete failed");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with title and add button */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-tighter">
                    Petrol Pumps
                </h2>
                <button
                    onClick={() => { setEditingPump(null); setModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Add Pump
                </button>
            </div>

            {/* Pump Grid */}
            {loading ? (
                <div className="h-40 flex items-center justify-center"><ButtonLoaders /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pumps.map(pump => (
                        <div
                            key={pump._id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">
                                        {pump.name}
                                    </h3>
                                    {pump.contactPerson && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                            <User size={12} /> {pump.contactPerson}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onSelectPump(pump)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="View Ledger"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setEditingPump(pump); setModalOpen(true); }}
                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pump._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                {pump.phone && (
                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Phone size={12} className="text-slate-400" /> {pump.phone}
                                    </p>
                                )}
                                {pump.address && (
                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <MapPin size={12} className="text-slate-400" /> {pump.address}
                                    </p>
                                )}
                                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                                    <p className="flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400">Opening Balance</span>
                                        <span className="font-black text-blue-600 dark:text-blue-400">
                                            ₹{pump.openingBalance?.toLocaleString('en-IN') || 0}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {pumps.length === 0 && !loading && (
                        <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-400 dark:text-slate-500 italic">No pumps added yet. Click "Add Pump" to create one.</p>
                        </div>
                    )}
                </div>
            )}

            <AddPumpModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                pump={editingPump}
                onSuccess={() => { fetchPumps(); showNotification(true, "Pump saved"); }}
                showNotification={showNotification}
            />
        </div>
    );
};

export default PumpMasterList;