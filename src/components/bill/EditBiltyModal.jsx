import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../../api/api";
import { backendUrl } from "../../utils/backendUrl";
import AddPumpModal from "../pump/AddPumpModal";
import SuccessToster from "../toster/SuccessToster";
import ButtonLoaders from "../loaders/ButtonLoaders";

// FIXED: Manual string manipulation to prevent Date/Month swap
const convertToInputDate = (dateStr) => {
  if (!dateStr) return "";
  
  // 1. Agar date already YYYY-MM-DD hai (HTML5 date input format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // 2. Agar date DD-MM-YYYY format mein hai (Jaise table se aa rahi hai)
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // Agar pehla part 2 digits ka hai, matlab ye DD-MM-YYYY hai
      if (parts[0].length === 2) {
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
      }
    }
  }

  // 3. Fallback for ISO strings (agar backend se ISO format aaye)
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("Date error:", e);
  }

  return "";
};

const EditBiltyModal = ({ isOpen, onClose, bill, onSuccess, showNotification }) => {
  const initialState = {
    InvoiceNo: "",
    DateOfIssueOfInvoice: "",
    NameOfRecipient: "",
    GSTINNo: "",
    Quantity: "",
    Packages: "",
    LRNO: "",
    VehicleNo: "",
    Destination: "",
    challanNO: "",
    ratePMT: "",
    advanceCash: "",
    desilOnRent: "",
    petrolPump: "",
    DONo: "",
    DINo: "",
    TotalInvoiceValue: ""
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [pumpList, setPumpList] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [fetchingPumps, setFetchingPumps] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [showAddPumpModal, setShowAddPumpModal] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
  const [originalPumpData, setOriginalPumpData] = useState({ 
    pumpName: null, 
    desilAmount: null,
    pumpId: null 
  });

  useEffect(() => {
    if (bill && isOpen) {
      // FIXED: Humne convertToInputDate ko upgrade kiya hai
      const formattedDate = convertToInputDate(bill.DateOfIssueOfInvoice);

      setFormData({
        InvoiceNo: bill.InvoiceNo || "",
        DateOfIssueOfInvoice: formattedDate,
        NameOfRecipient: bill.NameOfRecipient || "",
        GSTINNo: bill.GSTINNo || "",
        Quantity: bill.Quantity || "",
        Packages: bill.Packages || "",
        LRNO: bill.LRNO || "",
        VehicleNo: bill.VehicleNo || "",
        Destination: bill.Destination || "",
        challanNO: bill.challanNO || "",
        ratePMT: bill.pmt || bill.ratePMT || "",
        advanceCash: bill.advanceCash || "",
        desilOnRent: bill.desil || bill.desilOnRent || "",
        petrolPump: bill.petrolPump || "",
        DONo: bill.DONo || "",
        DINo: bill.DINo || "",
        TotalInvoiceValue: bill.TotalInvoiceValue || ""
      });

      setOriginalPumpData({
        pumpName: bill.petrolPump || null,
        desilAmount: bill.desil || bill.desilOnRent || null,
        pumpId: bill.pumpId || null
      });

      fetchPumps();
      fetchVehicles();
    }
  }, [bill, isOpen]);

  const showInternalNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchPumps = async () => {
    setFetchingPumps(true);
    try {
      const res = await axios.get(`${backendUrl}/api/pump-master`, { withCredentials: true });
      if (res.data.success) {
        setPumpList(res.data.pumps);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchPumps();
      }
    } finally {
      setFetchingPumps(false);
    }
  };

  const fetchVehicles = async () => {
    setFetchingVehicles(true);
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master`, { withCredentials: true });
      if (res.data.success) {
        setVehicleList(res.data.vehicles);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchVehicles();
      }
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const vehicleExists = vehicleList.some(v => v.vehicleNo.toUpperCase() === formData.VehicleNo.toUpperCase());
    if (!vehicleExists) {
      showInternalNotification(false, "Vehicle number not registered.");
      return;
    }

    setLoading(true);
    try {
      const pumpChanged = formData.petrolPump !== originalPumpData.pumpName;
      const amountChanged = Number(formData.desilOnRent) !== Number(originalPumpData.desilAmount);

      if (pumpChanged || amountChanged) {
        if (originalPumpData.pumpName && originalPumpData.desilAmount) {
          try {
            await axios.delete(`${backendUrl}/api/pump-transactions/by-reference/${bill._id}`, { 
              withCredentials: true 
            });
          } catch (deleteError) {}
        }
        
        if (formData.petrolPump && formData.desilOnRent && Number(formData.desilOnRent) > 0) {
          const selectedPump = pumpList.find(p => p.name === formData.petrolPump);
          
          const pumpTransactionData = {
            pumpId: selectedPump?._id,
            pumpName: formData.petrolPump,
            amount: Number(formData.desilOnRent),
            date: formData.DateOfIssueOfInvoice,
            description: `Bilty #${formData.LRNO || formData.InvoiceNo}`,
            reference: bill._id,
            vehicleNo: formData.VehicleNo
          };
          
          await axios.post(`${backendUrl}/api/pump-transactions/purchase`, pumpTransactionData, { 
            withCredentials: true 
          });
        }
      }

      const response = await axios.put(`${backendUrl}/api/bill/update-bilty/${bill._id}`, formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        showInternalNotification(true, "Bilty updated successfully ✨");
        setTimeout(() => {
          onSuccess("Bilty updated successfully ✨");
          onClose();
        }, 1000);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleSubmit();
      }
      showInternalNotification(false, error.response?.data?.message || "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPumpSuccess = () => fetchPumps();

  if (!isOpen || !bill) return null;

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300 rounded-xl">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10 rounded-t-xl">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
              Edit Bilty: {bill.LRNO}
            </h2>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg disabled:opacity-50"
            >
              <X size={24} className="dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vehicle Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Vehicle Number *
                </label>
                <input
                  list="vehicleList"
                  name="VehicleNo"
                  value={formData.VehicleNo}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter vehicle number"
                  required
                />
                <datalist id="vehicleList">
                  {vehicleList.map(v => <option key={v._id} value={v.vehicleNo} />)}
                </datalist>
              </div>

              {/* Dynamic Fields */}
              {Object.keys(formData).map((key) => {
                if (key === "VehicleNo") return null;
                
                const label = key.replace(/([A-Z])/g, ' $1').trim();

                if (key === "petrolPump") {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        {label}
                      </label>
                      <div className="flex gap-2">
                        <select
                          name={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Pump (optional)</option>
                          {pumpList.map(pump => (
                            <option key={pump._id} value={pump.name}>
                              {pump.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddPumpModal(true)}
                          disabled={loading}
                          className="px-3 py-2 bg-blue-600 text-white text-xs font-black flex items-center gap-1 whitespace-nowrap rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          <Plus size={14} /> New
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                      {label}
                    </label>
                    <input
                      required={!["petrolPump", "advanceCash", "desilOnRent", "challanNO"].includes(key)}
                      type={key === "DateOfIssueOfInvoice" ? "date" : "text"}
                      name={key}
                      value={formData[key] || ""}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={`Enter ${label}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t dark:border-slate-700 font-bold">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 rounded-lg disabled:opacity-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className=" bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 font-black shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-70 duration-200 order-1 sm:order-2 uppercase text-xs tracking-widest rounded-lg flex items-center justify-center gap-2 min-w-[160px]"
              >
                {loading ? (
                 <ButtonLoaders/>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddPumpModal
        isOpen={showAddPumpModal}
        onClose={() => setShowAddPumpModal(false)}
        pump={null}
        onSuccess={handleAddPumpSuccess}
        showNotification={showInternalNotification}
      />
    </>
  );
};

export default EditBiltyModal;