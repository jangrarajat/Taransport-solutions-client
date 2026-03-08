import { Printer, TruckElectric, X, Trash2, Edit3, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import EditBiltyModal from "./EditBiltyModal";
import * as XLSX from 'xlsx';
import { refreshToken } from "../api/api";

// --- 1. Delete Confirmation Modal (Definition add kar di h) ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex items-center gap-4 text-red-600 mb-4">
                    <div className="p-3 bg-red-100 rounded-full"><AlertTriangle size={28} /></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Confirm Delete</h2>
                </div>
                <p className="text-slate-500 font-bold text-sm mb-6 uppercase">
                    Kya aap sach mein ye {title} delete karna chahte hain? Ye data permanently delete ho jayega.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200">Yes, Delete</button>
                </div>
            </div>
        </div>
    );
};

// --- 2. Maintenance Modal ---
const MaintenanceModal = ({ isOpen, onClose, bill, onUpdate, showNotification }) => {
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const [loading, setLoading] = useState(false);
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`http://localhost:5000/bill/update-maintenance/${bill._id}`,
                { amount: Number(amount), remark }, { withCredentials: true });
            if (res.data.success) {
                onUpdate();
                showNotification(true, "Maintenance Added! 🚛");
                setAmount(""); setRemark("");
                onClose();
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken()
                if (isRefreshed) handleSubmit()
            }
            showNotification(false, "Update failed");
        }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 uppercase">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-lg font-black text-slate-800 uppercase">Vehicle Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-slate-50 outline-none" />
                    <input required type="text" placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-slate-50 outline-none" />
                    <button disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">{loading ? "Saving..." : "Save & Update"}</button>
                </form>
            </div>
        </div>
    );
};

const FrightTable = ({ data, loading, refreshData }) => {
    const [printBityBtn, setPrintBityBtn] = useState(false);
    const [pData, setPData] = useState([]);
    const [isMaintOpen, setIsMaintOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const downloadExcel = () => {
        const exportData = selectedIds.length > 0 ? data.filter(b => selectedIds.includes(b._id)) : data;
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fright_Report");
        XLSX.writeFile(workbook, `Fright_Records.xlsx`);
    };

    const handleDeleteClick = async () => {
        try {
            const res = await axios.delete(`http://localhost:5000/bill/delete-bilty/${deleteModal.id}`, { withCredentials: true });
            if (res.data.success) {
                showNotification(true, "Record Deleted! 🗑️");
                refreshData();
            }
        } catch (error) { showNotification(false, "Delete Failed"); }
        setDeleteModal({ open: false, id: null });
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

    return (
        <>
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">{selectedIds.length} Selected</span>
                    <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"><FileSpreadsheet size={14} /> Export</button>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-800 text-white">
                            <tr>
                                <th className="px-4 py-4 text-center border-r border-slate-700">
                                    <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? data.map(b => b._id) : [])} checked={data.length > 0 && selectedIds.length === data.length} />
                                </th>
                                <th className="px-4 py-4 text-center border-r border-slate-700">Actions</th>
                                {[
                                    "Date", "LR NO.", "Vehicle", "DI No.",
                                    "Recipient", "Destination", "Qty",
                                    "Freight", "Commission", "Advance", "Diesel", "Pump",
                                    "Maintenance", "Balance", "Final Amount"
                                ].map((h) => (
                                    <th key={h} className="px-4 text-center py-4 text-[11px] uppercase tracking-wider font-bold border-r border-slate-700 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase text-[11px] text-slate-700">
                            {data.map((bill) => (
                                <tr key={bill._id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(bill._id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-4 py-3 text-center border-r">
                                        <input type="checkbox" checked={selectedIds.includes(bill._id)} onChange={() => setSelectedIds(prev => prev.includes(bill._id) ? prev.filter(i => i !== bill._id) : [...prev, bill._id])} />
                                    </td>
                                    <td className="px-4 py-3 border-r">
                                        <div className="flex items-center justify-center gap-2">
                                            <Printer className="cursor-pointer hover:text-blue-600" onClick={() => { setPData(bill); setPrintBityBtn(true); }} size={16} />
                                            <button onClick={() => { setSelectedBill(bill); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => setDeleteModal({ open: true, id: bill._id })} className="text-red-400 p-1.5 bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">{bill.DateOfIssueOfInvoice}</td>
                                    <td className="px-4 py-3 text-center font-medium text-blue-600">{bill.LRNO}</td>
                                    <td className="px-4 py-3 text-center font-mono text-slate-800">{bill.VehicleNo}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{bill.DINo}</td>
                                    <td className="px-4 py-3 text-center text-slate-700 min-w-[150px]">{bill.NameOfRecipient}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{bill.Destination}</td>
                                    <td className="px-4 py-3 text-center">{bill.Quantity}</td>
                                    <td className="px-4 py-3 text-center text-blue-600">₹{bill.frightAmount || 0}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">₹{bill.commeion || 0}</td>
                                    <td className="px-4 py-3 text-center text-red-600">₹{bill.advanceCash || 0}</td>
                                    <td className="px-4 py-3 text-center text-red-500">₹{bill.desil || 0}</td>
                                    <td className="px-4 py-3 text-center text-slate-500 uppercase">{bill.petrolPump || "N/A"}</td>
                                    
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => { setSelectedBill(bill); setIsMaintOpen(true); }} className="flex items-center gap-1 mx-auto bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg">
                                            <TruckElectric size={12} />
                                            ₹{bill.maintenance?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0}
                                        </button>
                                    </td>

                                    <td className={`px-4 py-3 text-center font-black border-x ${bill.tripBalanceAmmount < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                                        ₹{bill.tripBalanceAmmount || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center text-blue-800 font-black bg-blue-50">
                                        ₹{bill.faynalAmmount || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {printBityBtn && <PrintBilty pData={pData} setPrintBityBtn={setPrintBityBtn} />}
            <MaintenanceModal isOpen={isMaintOpen} onClose={() => setIsMaintOpen(false)} bill={selectedBill} onUpdate={refreshData} showNotification={showNotification} />
            <EditBiltyModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} bill={selectedBill} onSuccess={(msg) => { refreshData(); showNotification(true, msg); }} />
            <DeleteConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })} onConfirm={handleDeleteClick} title="Bilty Record" />
        </>
    );
};

export default FrightTable;