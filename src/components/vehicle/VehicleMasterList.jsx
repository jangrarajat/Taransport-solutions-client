import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Eye, Phone, User, Truck, FileSpreadsheet, Printer, Search, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import AddVehicleModal from "./AddVehicleModal";
import VehicleTripsModal from "./VehicleTripsModal";
import { refreshToken } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const VehicleMasterList = ({ showNotification }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicleForTrips, setSelectedVehicleForTrips] = useState(null);
  const [tripsModalOpen, setTripsModalOpen] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master`, { withCredentials: true });
      if (res.data.success) {
        setVehicles(res.data.vehicles);
        setFilteredVehicles(res.data.vehicles);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchVehicles();
      }
      console.error("Full error:", error);
      showNotification(false, "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle => 
        vehicle.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.ownerName && vehicle.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.phone && vehicle.phone.includes(searchTerm))
      );
      setFilteredVehicles(filtered);
    }
  }, [searchTerm, vehicles]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle? This may affect existing bilty records.")) return;
    try {
      await axios.delete(`${backendUrl}/api/vehicle-master/${id}`, { withCredentials: true });
      showNotification(true, "Vehicle deleted");
      fetchVehicles();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDelete(id);
      }
      showNotification(false, "Delete failed");
    }
  };

  const onSuccess = () => {
    fetchVehicles();
    showNotification(true, "Vehicle saved");
  };

  const exportToExcel = () => {
    const exportData = filteredVehicles.map(v => ({
      'Vehicle Number': v.vehicleNo,
      'Owner Name': v.ownerName || '',
      'Phone': v.phone || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    XLSX.writeFile(wb, `vehicles_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Vehicles</title>
        <style>
          body { font-family: Arial; margin:20px; }
          table { border-collapse: collapse; width:100%; }
          th, td { border:1px solid #ddd; padding:8px; text-align:left; }
          th { background-color:#f2f2f2; }
        </style>
        </head>
        <body>
          <h1>Vehicles</h1>
          <p>Total Vehicles: ${filteredVehicles.length}</p>
          <table>
            <thead><tr><th>Vehicle No</th><th>Owner</th><th>Phone</th></tr></thead>
            <tbody>
              ${filteredVehicles.map(v => `<tr><td>${v.vehicleNo}</td><td>${v.ownerName || '-'}</td><td>${v.phone || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-tighter">
          Vehicles ({filteredVehicles.length})
        </h2>
        <div className="flex gap-2 mt-3 md:mt-0">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Export to Excel">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Print">
            <Printer size={14} /> Print
          </button>
          <button onClick={() => { setEditingVehicle(null); setModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Vehicle Number, Owner Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-slate-500 mt-2">
            Found {filteredVehicles.length} vehicle(s) matching "{searchTerm}"
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><ButtonLoaders /></div>
      ) : (
        <>
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              {searchTerm ? (
                <>
                  <p className="text-slate-400 dark:text-slate-500 italic mb-2">No vehicles found matching "{searchTerm}"</p>
                  <button 
                    onClick={clearSearch}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">No vehicles added yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map(vehicle => (
                <div 
                  key={vehicle._id} 
                  className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => { setSelectedVehicleForTrips(vehicle); setTripsModalOpen(true); }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">{vehicle.vehicleNo}</h3>
                      {vehicle.ownerName && <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><User size={12} /> {vehicle.ownerName}</p>}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingVehicle(vehicle); setModalOpen(true); }} className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(vehicle._id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {vehicle.phone && <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><Phone size={12} className="text-slate-400" /> {vehicle.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <AddVehicleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} vehicle={editingVehicle} onSuccess={onSuccess} showNotification={showNotification} />
      
      <VehicleTripsModal
        isOpen={tripsModalOpen}
        onClose={() => { setTripsModalOpen(false); setSelectedVehicleForTrips(null); }}
        vehicle={selectedVehicleForTrips}
        user={user}
        showNotification={showNotification}
      />
    </div>
  );
};

export default VehicleMasterList;