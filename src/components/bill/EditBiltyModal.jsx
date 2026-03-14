import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../../api/api";
import { backendUrl } from "../../utils/backendUrl";
import AddPumpModal from "../pump/AddPumpModal";
import SuccessToster from "../toster/SuccessToster"; // Add this import

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
      console.log("Bill data received:", bill);
      
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = "";
      if (bill.DateOfIssueOfInvoice) {
        const date = new Date(bill.DateOfIssueOfInvoice);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }

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
        console.log("Pump list fetched:", res.data.pumps);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchPumps();
      }
      console.error("Failed to fetch pumps", error);
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
      console.error("Failed to fetch vehicles", error);
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate vehicle exists
    const vehicleExists = vehicleList.some(v => v.vehicleNo.toUpperCase() === formData.VehicleNo.toUpperCase());
    if (!vehicleExists) {
      showInternalNotification(false, "Vehicle number not registered. Please add it in Reports > Vehicles first.");
      return;
    }

    setLoading(true);
    try {
      // Check if pump or desil amount changed
      const pumpChanged = formData.petrolPump !== originalPumpData.pumpName;
      const amountChanged = Number(formData.desilOnRent) !== Number(originalPumpData.desilAmount);
      
      console.log("Pump changed:", pumpChanged, "Amount changed:", amountChanged);
      console.log("Original pump:", originalPumpData.pumpName, "New pump:", formData.petrolPump);
      console.log("Original amount:", originalPumpData.desilAmount, "New amount:", formData.desilOnRent);

      // If pump data changed, update pump transactions
      if (pumpChanged || amountChanged) {
        
        // Delete old pump transaction if it existed
        if (originalPumpData.pumpName && originalPumpData.desilAmount) {
          console.log("Deleting old pump transaction for reference:", bill._id);
          try {
            await axios.delete(`${backendUrl}/api/pump-transactions/by-reference/${bill._id}`, { 
              withCredentials: true 
            });
          } catch (deleteError) {
            console.log("No existing transaction to delete or delete failed:", deleteError);
          }
        }
        
        // Create new pump transaction if pump and amount exist and amount > 0
        if (formData.petrolPump && formData.desilOnRent && Number(formData.desilOnRent) > 0) {
          console.log("Creating new pump transaction for pump:", formData.petrolPump);
          
          // Find pump ID from pumpList
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
          
          console.log("Sending pump transaction data:", pumpTransactionData);
          
          await axios.post(`${backendUrl}/api/pump-transactions/purchase`, pumpTransactionData, { 
            withCredentials: true 
          });
        }
      }

      // Update the bilty
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
      console.error("Update error:", error);
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleSubmit();
      }
      showInternalNotification(false, error.response?.data?.message || "Failed to update Bilty");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPumpSuccess = () => {
    fetchPumps();
  };

  if (!isOpen || !bill) return null;

  return (
    <>
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in duration-300">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
              Edit Bilty: {bill.LRNO}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={24} className="dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vehicle Number with datalist */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Vehicle Number *
                </label>
                <input
                  list="vehicleList"
                  name="VehicleNo"
                  value={formData.VehicleNo}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium"
                  placeholder="Enter vehicle number"
                  required
                />
                <datalist id="vehicleList">
                  {fetchingVehicles ? (
                    <option value="" disabled>Loading vehicles...</option>
                  ) : (
                    vehicleList.map(v => <option key={v._id} value={v.vehicleNo} />)
                  )}
                </datalist>
              </div>

              {/* All fields */}
              {Object.keys(formData).map((key) => {
                if (key === "VehicleNo") return null;
                if (key === "petrolPump") {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex gap-2">
                        <select
                          name={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium"
                        >
                          <option value="">Select Pump (optional)</option>
                          {fetchingPumps ? (
                            <option disabled>Loading pumps...</option>
                          ) : (
                            pumpList.map(pump => (
                              <option key={pump._id} value={pump.name}>
                                {pump.name}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddPumpModal(true)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1 whitespace-nowrap"
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
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      required={key !== "petrolPump" && key !== "advanceCash"}
                      type={key === "DateOfIssueOfInvoice" ? "date" : "text"}
                      name={key}
                      value={formData[key] || ""}
                      onChange={handleChange}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all bg-slate-50 dark:bg-slate-800 dark:text-white font-medium"
                      placeholder={`Enter ${key}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t dark:border-slate-700 font-bold">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 order-2 sm:order-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-95 disabled:opacity-50 duration-200 order-1 sm:order-2 uppercase text-xs tracking-widest"
              >
                {loading ? "Updating..." : "Update Bilty"}
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