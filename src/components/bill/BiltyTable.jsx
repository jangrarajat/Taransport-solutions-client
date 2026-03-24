import { Printer, TruckElectric, X, Trash2, Edit3, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import PrintBilty from "../PrintBilty";
import SuccessToster from "../toster/SuccessToster";
import ButtonLoaders from "../loaders/ButtonLoaders";
import EditBiltyModal from "./EditBiltyModal";
import DeleteConfirmModal from "../DeleteConfirmModal";
import * as XLSX from 'xlsx';
import { refreshToken } from "../../api/api";
import { backendUrl } from "../../utils/backendUrl";

// Helper to get sorting timestamp and LRNO for composite sorting
const getSortKey = (item) => {
  const date = item.DateOfIssueOfInvoice ? new Date(item.DateOfIssueOfInvoice) : new Date(0);
  const lrno = item.LRNO && item.LRNO !== "N/A" ? item.LRNO : "";
  return { date, lrno };
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
            const res = await axios.put(`${backendUrl}/api/bill/update-maintenance/${bill._id}`,
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg   shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Add Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer dark:text-white" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 font-bold">
                    <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 outline-none focus:border-orange-500 dark:bg-slate-800 dark:text-white" />
                    <textarea required placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700   px-4 py-3 outline-none focus:border-orange-500 h-24 dark:bg-slate-800 dark:text-white" />
                    <button disabled={loading} className="w-full bg-orange-600 text-white py-4   font-black text-xs tracking-widest">{loading ? "Saving..." : "Save Entry"}</button>
                </form>
            </div>
        </div>
    );
};

const BiltyTable = ({ data, loading, refreshData, showNotification }) => {
    const [printBityBtn, setPrintBityBtn] = useState(false);
    const [pData, setPData] = useState([]);
    const [isMaintOpen, setIsMaintOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, ids: [] });

    const headerCheckboxRef = useRef(null);

    // Sort data by date then LRNO
    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => {
            const keyA = getSortKey(a);
            const keyB = getSortKey(b);
            // Compare dates
            if (keyA.date.getTime() !== keyB.date.getTime()) {
                return keyA.date - keyB.date;
            }
            // Same date, compare LRNO (as numbers if possible, else strings)
            const lrnoA = keyA.lrno;
            const lrnoB = keyB.lrno;
            if (!lrnoA && !lrnoB) return 0;
            if (!lrnoA) return 1; // entries without LRNO go after
            if (!lrnoB) return -1;
            // Try numeric comparison
            const numA = parseFloat(lrnoA);
            const numB = parseFloat(lrnoB);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return lrnoA.localeCompare(lrnoB);
        });
    }, [data]);

    useEffect(() => {
        if (headerCheckboxRef.current) {
            const allIds = sortedData.map(item => item._id);
            const someSelected = selectedIds.length > 0 && selectedIds.length < allIds.length;
            headerCheckboxRef.current.indeterminate = someSelected;
        }
    }, [selectedIds, sortedData]);

    const handleNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const downloadExcel = () => {
        const exportData = selectedIds.length > 0 ? sortedData.filter(b => selectedIds.includes(b._id)) : sortedData;
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bilty_Report");
        XLSX.writeFile(workbook, `Bilty_Records.xlsx`);
    };

    const handleDeleteClick = async () => {
        try {
            const deletePromises = deleteModal.ids.map(id => 
                axios.delete(`${backendUrl}/api/bill/delete-bilty/${id}`, { withCredentials: true })
            );
            
            await Promise.all(deletePromises);
            
            setSelectedIds([]);
            refreshData();
        } catch (error) { 
             if (error.response?.status === 401) {
                const isRefreshed = await refreshToken()
                if (isRefreshed) handleDeleteClick()
            }
            throw new Error(error.response?.data?.message || "Delete Failed");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(sortedData.map(item => item._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSingleDelete = (id) => {
        setDeleteModal({ open: true, ids: [id] });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) {
            handleNotification(false, "Please select records to delete");
            return;
        }
        setDeleteModal({ open: true, ids: selectedIds });
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

    return (
        <>
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

            <div className="mb-4 flex justify-between items-center bg-white dark:bg-slate-800 p-4   shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2   text-[10px] font-black uppercase"><FileSpreadsheet size={14} /> Export</button>
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2   text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
                        >
                            <Trash2 size={14} />{selectedIds.length} Delete Selected
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden  ">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-800 dark:bg-black text-white">
                            <tr>
                                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === sortedData.length && sortedData.length > 0}
                                        className="w-4 h-4   dark:bg-slate-700 dark:border-slate-600"
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
                            {sortedData.map((bill) => bill.LRNO ?  (
                                <tr key={bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-4 py-3 text-center border-r dark:border-slate-700">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4   dark:bg-slate-700 dark:border-slate-600"
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
                                            <button onClick={() => { setSelectedBill(bill); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 dark:bg-blue-900/30  "><Edit3 size={14} /></button>
                                        </div>
                                    </td>

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
                                    <td className="px-4 py-3 text-center text-green-700 dark:text-green-400 font-black">₹{bill.TotalInvoiceValue?.toLocaleString('en-IN')}</td>
                                </tr>
                            ) : null)}
                        </tbody>
                    </table>
                </div>
            </div>

            {printBityBtn && <PrintBilty pData={pData} setPrintBityBtn={setPrintBityBtn} />}
            <MaintenanceModal isOpen={isMaintOpen} onClose={() => setIsMaintOpen(false)} bill={selectedBill} onUpdate={refreshData} showNotification={handleNotification} />
            <EditBiltyModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} bill={selectedBill} onSuccess={(msg) => { refreshData(); handleNotification(true, msg); }} showNotification={handleNotification} />
            
            <DeleteConfirmModal 
                isOpen={deleteModal.open} 
                onClose={() => setDeleteModal({ open: false, ids: [] })} 
                onConfirm={handleDeleteClick} 
                title="Record"
                count={deleteModal.ids.length}
                showNotification={handleNotification}
            />
        </>
    );
};

export default BiltyTable;