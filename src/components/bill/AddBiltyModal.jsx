import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import axios from "axios";
import { refreshToken } from "../../api/api";
import { backendUrl } from "../../utils/backendUrl";
import AddPumpModal from "../pump/AddPumpModal";

const AddBiltyModal = ({ isOpen, onClose, onSuccess, onError }) => {
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

  const transportUser = JSON.parse(localStorage.getItem("transportUser")) || {};

  useEffect(() => {
    if (isOpen) {
      fetchPumps();
      fetchVehicles();
    } else {
      setFormData(initialState);
    }
  }, [isOpen]);

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
      onError("Vehicle number not registered. Please add it in Reports > Vehicles first.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/bill/add-bill-entry`, formData, {
        withCredentials: true
      });

      if (response.data.success) {
        const updatedUser = {
          ...transportUser,
          biltyCount: (transportUser.biltyCount || 0) + 1
        };
        localStorage.setItem("transportUser", JSON.stringify(updatedUser));

        onSuccess("Bilty added successfully 🚛");
        setFormData(initialState);
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleSubmit();
      }
      onError(error.response?.data?.message || "Failed to add Bilty");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPumpSuccess = () => {
    fetchPumps(); // refresh pump list after adding
  };

  const pumpNotification = (success, msg) => {
    if (success) onSuccess(msg);
    else onError(msg);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in duration-300 my-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-6 flex justify-between items-center z-10">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 uppercase tracking-widest">
              New Bilty & Trip Entry
            </h2>
            <button onClick={onClose} type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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

              {/* All other fields as before */}
              {Object.keys(formData).map((key) => {
                if (key === "VehicleNo") return null; // already handled above
                if (key === "petrolPump") {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex gap-2">
                        <select
                          name={key}
                          value={formData[key]}
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
                      value={formData[key]}
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
                {loading ? "Saving..." : "Save Bilty & Trip"}
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
        showNotification={pumpNotification}
      />
    </>
  );
};

export default AddBiltyModal;