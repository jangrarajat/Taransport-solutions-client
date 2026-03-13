import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Eye, Phone, User, Truck, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import AddVehicleModal from "./AddVehicleModal";
import { refreshToken } from "../../api/api";

const VehicleMasterList = ({ showNotification, onSelectVehicle }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master`, { withCredentials: true });
      if (res.data.success) setVehicles(res.data.vehicles);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchVehicles();
      }
      showNotification(false, "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

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
    const exportData = vehicles.map(v => ({
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
          body { font-family: Arial; margin:20px; background:#0f172a; color:white; }
          table { border-collapse: collapse; width:100%; }
          th, td { border:1px solid #334155; padding:8px; text-align:left; }
          th { background-color:#1e293b; }
        </style>
        </head>
        <body>
          <h1>Vehicles</h1>
          <table>
            <thead><tr><th>Vehicle No</th><th>Owner</th><th>Phone</th></tr></thead>
            <tbody>
              ${vehicles.map(v => `<tr><td>${v.vehicleNo}</td><td>${v.ownerName || '-'}</td><td>${v.phone || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter">Vehicles</h2>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-green-500/30 transition-all active:scale-95" title="Export to Excel"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={handlePrint} className="flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-purple-500/30 transition-all active:scale-95" title="Print"><Printer size={14} /> Print</button>
          <button onClick={() => { setEditingVehicle(null); setModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95"><Plus size={16} /> Add Vehicle</button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><ButtonLoaders /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-base text-white uppercase tracking-tight">{vehicle.vehicleNo}</h3>
                  {vehicle.ownerName && <p className="text-xs text-white/50 flex items-center gap-1 mt-1"><User size={12} /> {vehicle.ownerName}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onSelectVehicle && onSelectVehicle(vehicle)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg" title="View"><Eye size={16} /></button>
                  <button onClick={() => { setEditingVehicle(vehicle); setModalOpen(true); }} className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(vehicle._id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              {vehicle.phone && <p className="flex items-center gap-2 text-xs text-white/70"><Phone size={12} className="text-white/50" /> {vehicle.phone}</p>}
            </div>
          ))}
          {vehicles.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
              <p className="text-white/50 italic">No vehicles added yet.</p>
            </div>
          )}
        </div>
      )}

      <AddVehicleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} vehicle={editingVehicle} onSuccess={onSuccess} showNotification={showNotification} />
    </div>
  );
};

export default VehicleMasterList;