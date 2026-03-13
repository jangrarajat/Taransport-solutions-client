import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ButtonLoaders from './loaders/ButtonLoaders';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, showNotification }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const requiredText = 'DELETE';

  const handleConfirm = async () => {
    if (confirmText !== requiredText) {
      showNotification(false, `Please type "${requiredText}" to confirm`);
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      showNotification(true, `${title} deleted successfully`);
      onClose();
    } catch (error) {
      showNotification(false, error.message || `Failed to delete ${title}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex items-center gap-4 text-orange-600 dark:text-orange-400 mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">
            Confirm Delete
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-2">
          Kya aap sach mein ye <span className="text-orange-600 dark:text-orange-400">{title}</span> delete karna chahte hain? Ye data permanently delete ho jayega aur wapas nahi aayega.
        </p>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-4">
          Confirm karne ke liye neeche <span className="font-black text-red-600 dark:text-red-400">{requiredText}</span> likhein:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={`Type "${requiredText}"`}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || confirmText !== requiredText}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-red-200 dark:shadow-red-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ButtonLoaders /> : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;