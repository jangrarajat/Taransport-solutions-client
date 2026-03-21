import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Eye, Phone, User, MapPin, FileText, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from 'xlsx';
// import { backendUrl } from "../../../utils/backendUrl";
import ButtonLoaders from "../../loaders/ButtonLoaders";
import AddOtherPersonModal from "./AddOtherPersonModal";
import { backendUrl } from "../../../utils/backendUrl";
import { refreshToken } from "../../../api/api";

const OtherPersonList = ({ showNotification, onSelectPerson }) => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/other-persons`, { withCredentials: true });
      if (res.data.success) setPersons(res.data.persons);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchPersons();
      }
      showNotification(false, "Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this person? All associated transactions will also be deleted.")) return;
    try {
      await axios.delete(`${backendUrl}/api/other-persons/${id}`, { withCredentials: true });
      showNotification(true, "Person deleted");
      fetchPersons();
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleDelete(id);
      }
      showNotification(false, "Delete failed");
    }
  };

  const onSuccess = () => {
    fetchPersons();
    showNotification(true, "Saved");
  };

  const exportToExcel = () => {
    const exportData = persons.map(p => ({
      Name: p.name,
      Phone: p.phone || '',
      Address: p.address || '',
      Notes: p.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'People');
    XLSX.writeFile(wb, `other_people_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Other People</title><style>
        body { font-family: Arial; margin:20px; }
        table { border-collapse:collapse; width:100%; }
        th, td { border:1px solid #ddd; padding:8px; text-align:left; }
        th { background-color:#f2f2f2; }
      </style></head>
      <body><h1>Other People</h1>
       table
        <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Notes</th></tr></thead>
        <tbody>
          ${persons.map(p => `<tr><td>${p.name}</td><td>${p.phone || '-'}</td><td>${p.address || '-'}</td><td>${p.notes || '-'}</td></tr>`).join('')}
        </tbody>
       </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4  dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-tighter">Other People</h2>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Export to Excel"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={handlePrint} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95" title="Print"><Printer size={14} /> Print</button>
          <button onClick={() => { setEditingPerson(null); setModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95"><Plus size={16} /> Add Person</button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><ButtonLoaders /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map(person => (
            <div key={person._id} className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">{person.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onSelectPerson(person)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded" title="View Ledger"><Eye size={16} /></button>
                  <button onClick={() => { setEditingPerson(person); setModalOpen(true); }} className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(person._id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {person.phone && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone size={12} className="text-slate-400" /> {person.phone}</p>}
                {person.address && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin size={12} className="text-slate-400" /> {person.address}</p>}
                {person.notes && <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><FileText size={12} className="text-slate-400" /> {person.notes}</p>}
              </div>
            </div>
          ))}
          {persons.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 dark:text-slate-500 italic">No people added yet.</p>
            </div>
          )}
        </div>
      )}

      <AddOtherPersonModal isOpen={modalOpen} onClose={() => setModalOpen(false)} person={editingPerson} onSuccess={onSuccess} showNotification={showNotification} />
    </div>
  );
};

export default OtherPersonList;