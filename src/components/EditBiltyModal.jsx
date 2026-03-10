import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../api/api";

const EditBiltyModal = ({ isOpen, onClose, bill, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bill) {
      // Backend fields ke according data load ho raha h
      setFormData({
        InvoiceNo: bill.InvoiceNo || "",
        DateOfIssueOfInvoice: bill.DateOfIssueOfInvoice || "",
        NameOfRecipient: bill.NameOfRecipient || "",
        GSTINNo: bill.GSTINNo || "",
        Quantity: bill.Quantity || "",
        Packages: bill.Packages || "",
        LRNO: bill.LRNO || "",
        VehicleNo: bill.VehicleNo || "",
        Destination: bill.Destination || "",
        ratePMT: bill.ratePMT || "",
        advanceCash: bill.advanceCash || "",
        desilOnRent: bill.desilOnRent || "",
        petrolPump: bill.petrolPump || "",
        DONo: bill.DONo || "",
        DINo: bill.DINo || "",
        TotalInvoiceValue: bill.TotalInvoiceValue || ""
      });
    }
  }, [bill]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:5000/bill/update-bilty/${bill._id}`, formData, {
        withCredentials: true
      });
      if (response.data.success) {
        onSuccess("Bilty updated successfully ✨");
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleSubmit();
      }
      alert(error.response?.data?.message || "Failed to update Bilty");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10 uppercase font-black">
          <h2 className="text-xl md:text-2xl text-slate-800 dark:text-white tracking-tighter">Edit Bilty: {bill.LRNO}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={24} className="dark:text-white"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(formData).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  required={key !== "petrolPump" && key !== "advanceCash"}
                  type={key === "DateOfIssueOfInvoice" ? "date" : "text"}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-600 outline-none bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t dark:border-slate-700 font-black uppercase text-xs">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-600 dark:text-slate-400">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-10 py-3 rounded-xl shadow-lg active:scale-95 transition-all">
              {loading ? "Updating..." : "Update Bilty Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBiltyModal;