import React, { useState, useEffect } from "react";
import { X, User, Phone, MapPin, FileText } from "lucide-react";
import axios from "axios";
import { backendUrl } from "../../../utils/backendUrl";
import ButtonLoaders from "../../loaders/ButtonLoaders";
import { refreshToken } from "../../../api/api";

const AddOtherPersonModal = ({ isOpen, onClose, person, onSuccess, showNotification }) => {
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name || "",
        phone: person.phone || "",
        address: person.address || "",
        notes: person.notes || ""
      });
    } else {
      setForm({ name: "", phone: "", address: "", notes: "" });
    }
  }, [person, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showNotification(false, "Name is required");
      return;
    }
    setLoading(true);
    try {
      if (person) {
        await axios.put(`${backendUrl}/api/other-persons/${person._id}`, form, { withCredentials: true });
      } else {
        await axios.post(`${backendUrl}/api/other-persons`, form, { withCredentials: true });
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl animate-in zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
            {person ? "Edit Person" : "Add Person"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <User size={12} /> Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Phone size={12} /> Phone (optional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <MapPin size={12} /> Address (optional)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <FileText size={12} /> Notes (optional)
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
              {loading ? <ButtonLoaders /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOtherPersonModal;