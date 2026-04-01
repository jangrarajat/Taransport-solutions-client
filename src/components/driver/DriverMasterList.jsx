import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Eye, Phone, User, MapPin, IdCard, Calendar, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
import { backendUrl } from "../../utils/backendUrl";
import ButtonLoaders from "../loaders/ButtonLoaders";
import AddDriverModal from "./AddDriverModal";
import { refreshToken } from "../../api/api";

const DriverMasterList = ({ showNotification, onSelectDriver }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/driver-master`, { withCredentials: true });
      if (res.data.success) setDrivers(res.data.drivers);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchDrivers();
      }
      showNotification(false, "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this driver? All associated transactions will also be deleted.")) return;
    try {
      await axios.delete(`${backendUrl}/api/driver-master/${id}`, { withCredentials: true });
      showNotification(true, "Driver deleted");
      fetchDrivers();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDelete(id);
      }
      showNotification(false, "Delete failed");
    }
  };

  const onSuccess = () => {
    fetchDrivers();
    showNotification(true, "Driver saved");
  };

  const exportToExcel = () => {
    const exportData = drivers.map(d => ({
      Name: d.name,
      Aadhar: d.adharNo,
      License: d.licenseNo || '',
      Phone: d.phone || '',
      'Joining Date': d.joiningDate ? new Date(d.joiningDate).toLocaleDateString('en-GB') : '',
      Address: d.address || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drivers');
    XLSX.writeFile(wb, `drivers_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Drivers</title><style>
        body { font-family:Arial; margin:20px; }
        table { border-collapse:collapse; width:100%; }
        th,td { border:1px solid #ddd; padding:8px; text-align:left; }
        th { background-color:#f2f2f2; }
      </style></head>
      <body><h1>Drivers</h1>
      <table><thead><tr><th>Name</th><th>Aadhar</th><th>License</th><th>Phone</th><th>Joining Date</th><th>Address</th></tr></thead>
      <tbody>
        ${drivers.map(d => `<tr><td>${d.name}</td><td>${d.adharNo}</td><td>${d.licenseNo || '-'}</td><td>${d.phone || '-'}</td><td>${d.joiningDate ? new Date(d.joiningDate).toLocaleDateString('en-GB') : '-'}</td><td>${d.address || '-'}</td></tr>`).join('')}
      </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4 dark:text-white pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-tighter">Drivers</h2>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Export to Excel"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={handlePrint} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Print"><Printer size={14} /> Print</button>
          <button onClick={() => { setEditingDriver(null); setModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95"><Plus size={16} /> Add Driver</button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><ButtonLoaders /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(driver => (
            <div key={driver._id} className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">{driver.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><IdCard size={12} /> {driver.adharNo}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onSelectDriver(driver)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded" title="View Ledger"><Eye size={16} /></button>
                  <button onClick={() => { setEditingDriver(driver); setModalOpen(true); }} className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(driver._id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {driver.licenseNo && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><IdCard size={12} className="text-slate-400" /> {driver.licenseNo}</p>}
                {driver.phone && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone size={12} className="text-slate-400" /> {driver.phone}</p>}
                {driver.joiningDate && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Calendar size={12} className="text-slate-400" /> {new Date(driver.joiningDate).toLocaleDateString('en-GB')}</p>}
                {driver.address && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin size={12} className="text-slate-400" /> {driver.address}</p>}
              </div>
            </div>
          ))}
          {drivers.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 dark:text-slate-500 italic">No drivers added yet.</p>
            </div>
          )}
        </div>
      )}

      <AddDriverModal isOpen={modalOpen} onClose={() => setModalOpen(false)} driver={editingDriver} onSuccess={onSuccess} showNotification={showNotification} />
    </div>
  );
};

export default DriverMasterList;