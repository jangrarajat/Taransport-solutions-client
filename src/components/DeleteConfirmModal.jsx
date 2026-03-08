// components/DeleteConfirmModal.jsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex items-center gap-4 text-orange-600 mb-4">
          <div className="p-3 bg-orange-100 rounded-full"><AlertTriangle size={24} /></div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Are you sure?</h2>
        </div>
        <p className="text-slate-500 font-bold text-sm mb-6">
          Kya aap sach mein ye {title} delete karna chahte hain? Ye data permanently delete ho jayega aur wapas nahi aayega.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-red-200">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
};
export default DeleteConfirmModal;