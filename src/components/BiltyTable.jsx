import { Printer, TruckElectric, X, Trash2, Edit3, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import EditBiltyModal from "./EditBiltyModal";
import * as XLSX from 'xlsx';
import { refreshToken } from "../api/api";
import { backendUrl } from "../utils/backendUrl";

// Delete Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300 font-bold uppercase">
                <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle size={28} /></div>
                    <h2 className="text-xl font-black tracking-tighter dark:text-white">Confirm Delete</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Kya aap sach mein ye {title} delete karna chahte hain?</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs tracking-widest">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs tracking-widest shadow-lg shadow-red-200 dark:shadow-red-900/50">Yes, Delete</button>
                </div>
            </div>
        </div>
    );
};

// Maintenance Modal
const MaintenanceModal = ({ isOpen, onClose, bill, onUpdate, showNotification }) => {
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const [loading, setLoading] = useState(false);
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${backendUrl}/bill/update-maintenance/${bill._id}`,
                { amount: Number(amount), remark }, { withCredentials: true });
            if (res.data.success) {
                onUpdate();
                showNotification(true, "Maintenance Added! 🚛");
                setAmount(""); setRemark("");
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
        <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 uppercase">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Add Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer dark:text-white" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 font-bold">
                    <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 dark:bg-slate-800 dark:text-white" />
                    <textarea required placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 h-24 dark:bg-slate-800 dark:text-white" />
                    <button disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-xs tracking-widest">{loading ? "Saving..." : "Save Entry"}</button>
                </form>
            </div>
        </div>
    );
};

const BiltyTable = ({ data, loading, refreshData }) => {
    const [printBityBtn, setPrintBityBtn] = useState(false);
    const [pData, setPData] = useState([]);
    const [isMaintOpen, setIsMaintOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

    // Refs for header checkbox
    const headerCheckboxRef = useRef(null);

    // Effect to handle indeterminate state of header checkbox
    useEffect(() => {
        if (headerCheckboxRef.current) {
            const allIds = data.map(item => item._id);
            const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
            headerCheckboxRef.current.indeterminate = someSelected;
        }
    }, [selectedIds, data]);

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const downloadExcel = () => {
        const exportData = selectedIds.length > 0 ? data.filter(b => selectedIds.includes(b._id)) : data;
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bilty_Report");
        XLSX.writeFile(workbook, `Bilty_Records.xlsx`);
    };

    const handleDeleteClick = async () => {
        try {
            const res = await axios.delete(`${backendUrl}/bill/delete-bilty/${deleteModal.id}`, { withCredentials: true });

            if (res.data.success) {
                showNotification(true, "Bilty Deleted! 🗑️");
                refreshData();
            }
        } catch (error) { showNotification(false, "Delete Failed"); }
        setDeleteModal({ open: false, id: null });
    };

    // Select all handler
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(data.map(item => item._id));
        } else {
            setSelectedIds([]);
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

    return (
        <>
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

            <div className="mb-4 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">{selectedIds.length} Selected</span>
                    <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"><FileSpreadsheet size={14} /> Export</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-800 dark:bg-black text-white">
                            <tr>
                                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === data.length && data.length > 0}
                                        className="w-4 h-4 rounded dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </th>
                                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">Actions</th>
                                {[
                                    "Date", "LR NO.", "Vehicle", "Invoice No", "DI No.", "DO No.",
                                    "Recipient", "Destination", "Qty", "Packages", "GSTIN No",
                                    "Total Value", 
                                ].map((h) => (
                                    <th key={h} className="px-4 text-center py-4 text-[11px] uppercase tracking-wider font-bold border-r border-slate-700 dark:border-slate-800 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                            {data.map((bill) => bill.LRNO ?  (
                                <tr key={bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-4 py-3 text-center border-r dark:border-slate-700">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded dark:bg-slate-700 dark:border-slate-600"
                                            checked={selectedIds.includes(bill._id)}
                                            onChange={() => setSelectedIds(prev => 
                                                prev.includes(bill._id) 
                                                    ? prev.filter(i => i !== bill._id) 
                                                    : [...prev, bill._id]
                                            )}
                                        />
                                    </td>
                                    <td className="px-4 py-3 border-r dark:border-slate-700">
                                        <div className="flex items-center justify-center gap-2">
                                            <Printer className="mx-auto cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => { setPData(bill); setPrintBityBtn(true); }} size={18} />
                                            <button onClick={() => { setSelectedBill(bill); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => setDeleteModal({ open: true, id: bill._id })} className="text-red-400 p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </td>

                                    {/* Main Data Fields */}
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.DateOfIssueOfInvoice}</td>
                                    <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{bill.LRNO}</td>
                                    <td className="px-4 py-3 text-center font-mono text-slate-800 dark:text-white">{bill.VehicleNo}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.InvoiceNo}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.DINo}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.DONo || "0"}</td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200 min-w-[150px]">{bill.NameOfRecipient}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.Destination}</td>
                                    <td className="px-4 py-3 text-center dark:text-slate-200">{bill.Quantity}</td>
                                    <td className="px-4 py-3 text-center dark:text-slate-200">{bill.Packages}</td>
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-[10px]">{bill.GSTINNo}</td>

                                    {/* Financials */}
                                    <td className="px-4 py-3 text-center text-green-700 dark:text-green-400 font-black">₹{bill.TotalInvoiceValue?.toLocaleString('en-IN')}</td>
                                </tr>
                            ) :null)}
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

export default BiltyTable;