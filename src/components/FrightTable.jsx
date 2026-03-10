import { Printer, TruckElectric, X, Trash2, Edit3, FileSpreadsheet, AlertTriangle, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster";
import ButtonLoaders from "./loaders/ButtonLoaders";
import EditBiltyModal from "./EditBiltyModal";
import * as XLSX from 'xlsx';
import { refreshToken } from "../api/api";
// PDF libraries – make sure to install: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. Delete Confirmation Modal (Definition with dark mode) ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle size={28} /></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Confirm Delete</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6 uppercase">
                    Kya aap sach mein ye {title} delete karna chahte hain? Ye data permanently delete ho jayega.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 dark:shadow-red-900/50">Yes, Delete</button>
                </div>
            </div>
        </div>
    );
};

// --- 2. Maintenance Modal (with dark mode) ---
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
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 uppercase">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Vehicle Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} 
                        className="w-full border rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none" />
                    <input required type="text" placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} 
                        className="w-full border rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none" />
                    <button disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">
                        {loading ? "Saving..." : "Save & Update"}
                    </button>
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

    // Helper to get export data (selected or all)
    const getExportData = () => selectedIds.length > 0 ? data.filter(b => selectedIds.includes(b._id)) : data;

    // Helper to parse quantity as number
    const parseQty = (qty) => {
        if (qty === undefined || qty === null || qty === "") return 0;
        const num = Number(qty);
        return isNaN(num) ? 0 : num;
    };

    // Calculate totals for a given dataset
    const calculateTotals = (exportData) => {
        return exportData.reduce((acc, bill) => {
            acc.qty += parseQty(bill.Quantity);
            acc.freight += bill.frightAmount || 0;
            acc.commission += bill.commeion || 0;
            acc.advance += bill.advanceCash || 0;
            acc.diesel += bill.desil || 0;
            acc.maintenance += (bill.maintenance?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);
            acc.balance += bill.tripBalanceAmmount || 0;
            acc.final += bill.faynalAmmount || 0;
            return acc;
        }, {
            qty: 0,
            freight: 0,
            commission: 0,
            advance: 0,
            diesel: 0,
            maintenance: 0,
            balance: 0,
            final: 0
        });
    };

    // Excel export with totals row
    const downloadExcel = () => {
        const exportData = getExportData();
        const totals = calculateTotals(exportData);

        const headers = [
            "Date", "LR No.", "Vehicle", "DI No.",
            "Recipient", "Destination", "Qty",
            "Freight (₹)", "Commission (₹)", "Advance (₹)", "Diesel (₹)", "Pump",
            "Maintenance (₹)", "Balance (₹)", "Final Amount (₹)"
        ];

        const rows = exportData.map(bill => [
            bill.DateOfIssueOfInvoice || "",
            bill.LRNO || "",
            bill.VehicleNo || "",
            bill.DINo || "",
            bill.NameOfRecipient || "",
            bill.Destination || "",
            parseQty(bill.Quantity),
            bill.frightAmount || 0,
            bill.commeion || 0,
            bill.advanceCash || 0,
            bill.desil || 0,
            bill.petrolPump || "N/A",
            (bill.maintenance?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0),
            bill.tripBalanceAmmount || 0,
            bill.faynalAmmount || 0
        ]);

        const totalsRow = [
            "TOTAL", "", "", "", "", "",
            totals.qty,
            totals.freight,
            totals.commission,
            totals.advance,
            totals.diesel,
            "",
            totals.maintenance,
            totals.balance,
            totals.final
        ];

        const sheetData = [headers, ...rows, totalsRow];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fright_Report");
        XLSX.writeFile(workbook, `Fright_Records_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // PDF export using jspdf and jspdf-autotable – fixed number formatting and text wrapping
    const downloadPDF = () => {
        try {
            const exportData = getExportData();
            const totals = calculateTotals(exportData);

            // Prepare headers
            const headers = [
                ["Date", "LR No.", "Vehicle", "DI No.", "Recipient", "Destination", "Qty", 
                 "Freight", "Commission", "Advance", "Diesel", "Pump", "Maintenance", "Balance", "Final"]
            ];

            // Build data rows – all values as plain strings (no special formatting)
            const rows = exportData.map(bill => [
                bill.DateOfIssueOfInvoice || "",
                bill.LRNO || "",
                bill.VehicleNo || "",
                bill.DINo || "",
                bill.NameOfRecipient || "",
                bill.Destination || "",
                String(parseQty(bill.Quantity)), // plain number
                String(bill.frightAmount || 0),
                String(bill.commeion || 0),
                String(bill.advanceCash || 0),
                String(bill.desil || 0),
                bill.petrolPump || "N/A",
                String((bill.maintenance?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0)),
                String(bill.tripBalanceAmmount || 0),
                String(bill.faynalAmmount || 0)
            ]);

            // Totals row (also plain strings)
            const totalsRow = [
                "TOTAL", "", "", "", "", "",
                String(totals.qty),
                String(totals.freight),
                String(totals.commission),
                String(totals.advance),
                String(totals.diesel),
                "",
                String(totals.maintenance),
                String(totals.balance),
                String(totals.final)
            ];

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Fright Report", 14, 10);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 15);

            autoTable(doc, {
                head: headers,
                body: [...rows, totalsRow],
                startY: 20,
                theme: 'striped',
                styles: { 
                    fontSize: 7, 
                    cellPadding: 1.5,
                    halign: 'center',
                    valign: 'middle',
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                    overflow: 'linebreak'  // Enable text wrapping
                },
                headStyles: { 
                    fillColor: [30, 41, 59], 
                    textColor: 255, 
                    fontStyle: 'bold',
                    halign: 'center',
                },
                footStyles: { 
                    fillColor: [241, 245, 249], 
                    textColor: [30, 41, 59], 
                    fontStyle: 'bold',
                    halign: 'center',
                },
                columnStyles: {
                    0: { cellWidth: 15 }, // Date
                    1: { cellWidth: 12 }, // LR No.
                    2: { cellWidth: 15 }, // Vehicle
                    3: { cellWidth: 10 }, // DI No.
                    4: { cellWidth: 25 }, // Recipient (wider)
                    5: { cellWidth: 18 }, // Destination
                    6: { cellWidth: 8 },  // Qty
                    7: { cellWidth: 12 }, // Freight
                    8: { cellWidth: 15 }, // Commission
                    9: { cellWidth: 12 }, // Advance
                    10: { cellWidth: 12 }, // Diesel
                    11: { cellWidth: 15 }, // Pump (wider for names)
                    12: { cellWidth: 15 }, // Maintenance
                    13: { cellWidth: 12 }, // Balance
                    14: { cellWidth: 15 }  // Final
                },
                didDrawPage: (data) => {
                    doc.setFontSize(6);
                    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 5);
                }
            });

            doc.save(`Fright_Report_${new Date().toISOString().slice(0,10)}.pdf`);
            showNotification(true, "PDF downloaded successfully! 📄");
        } catch (error) {
            console.error("PDF generation failed", error);
            showNotification(false, "PDF download failed. Make sure jspdf and jspdf-autotable are installed.");
        }
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

    const totals = calculateTotals(data);

    if (loading) return <div className="h-64 flex items-center justify-center"><ButtonLoaders /></div>;

    return (
        <>
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

            <div className="mb-4 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">{selectedIds.length} Selected</span>
                    <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-colors">
                        <FileSpreadsheet size={14} /> Excel
                    </button>
                    <button onClick={downloadPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-colors">
                        <FileText size={14} /> PDF
                    </button>
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
                                        onChange={(e) => setSelectedIds(e.target.checked ? data.map(b => b._id) : [])}
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        className="dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </th>
                                <th className="px-4 py-4 text-center border-r border-slate-700 dark:border-slate-800">Actions</th>
                                {[
                                    "Date", "LR NO.", "Vehicle", "DI No.",
                                    "Recipient", "Destination", "Qty",
                                    "Freight", "Commission", "Advance", "Diesel", "Pump",
                                  " Amount",   "Maintenance", "Final Balance",
                                ].map((h) => (
                                    <th key={h} className="px-4 text-center py-4 text-[11px] uppercase tracking-wider font-bold border-r border-slate-700 dark:border-slate-800 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                            {data.map((bill) => (
                                <tr key={bill._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedIds.includes(bill._id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="px-4 py-3 text-center border-r dark:border-slate-700">
                                        <input type="checkbox" checked={selectedIds.includes(bill._id)} 
                                            onChange={() => setSelectedIds(prev => prev.includes(bill._id) ? prev.filter(i => i !== bill._id) : [...prev, bill._id])} 
                                            className="dark:bg-slate-700 dark:border-slate-600" />
                                    </td>
                                    <td className="px-4 py-3 border-r dark:border-slate-700">
                                        <div className="flex items-center justify-center gap-2">
                                             <button onClick={() => { setSelectedBill(bill); setIsEditOpen(true); }} className="text-blue-500 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => setDeleteModal({ open: true, id: bill._id })} className="text-red-400 p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.DateOfIssueOfInvoice}</td>
                                    <td className="px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{bill.LRNO}</td>
                                    <td className="px-4 py-3 text-center font-mono text-slate-800 dark:text-white">{bill.VehicleNo}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.DINo}</td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200 min-w-[150px]">{bill.NameOfRecipient}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{bill.Destination}</td>
                                    <td className="px-4 py-3 text-center dark:text-slate-200">{parseQty(bill.Quantity)}</td>
                                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">₹{bill.frightAmount || 0}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">₹{bill.commeion || 0}</td>
                                    <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">₹{bill.advanceCash || 0}</td>
                                    <td className="px-4 py-3 text-center text-red-500 dark:text-red-400">₹{bill.desil || 0}</td>
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 uppercase">{bill.petrolPump || "N/A"}</td>
                                    

                                    <td className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-black bg-blue-50 dark:bg-blue-900/20">
                                        ₹{bill.faynalAmmount || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => { setSelectedBill(bill); setIsMaintOpen(true); }} className="flex items-center gap-1 mx-auto bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-lg">
                                            <TruckElectric size={12} />
                                            ₹{bill.maintenance?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0}
                                        </button>
                                    </td>
                                    <td className={`px-4 py-3 text-center font-black border-x dark:border-slate-700 ${bill.tripBalanceAmmount < 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"}`}>
                                        ₹{bill.tripBalanceAmmount || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Totals Footer */}
                        <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-600">
                            <tr>
                                <td colSpan="2" className="px-4 py-3 text-center text-slate-700 dark:text-slate-200">Totals</td>
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* Date */}
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* LR No */}
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* Vehicle */}
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* DI No */}
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* Recipient */}
                                <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200"></td> {/* Destination */}
                                <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-black">{totals.qty}</td> {/* Qty - without ₹ */}
                                <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-black">₹{totals.freight}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-black">₹{totals.commission}</td>
                                <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-black">₹{totals.advance}</td>
                                <td className="px-4 py-3 text-center text-red-500 dark:text-red-400 font-black">₹{totals.diesel}</td>
                                <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400"></td> {/* Pump (non-numeric) */}
                                <td className="px-4 py-3 text-center text-blue-800 dark:text-blue-300 font-black">₹{totals.final}</td>
                                <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400 font-black">₹{totals.maintenance}</td>
                                <td className={`px-4 py-3 text-center font-black ${totals.balance < 0 ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}>
                                    ₹{totals.balance}
                                </td>
                            </tr>
                        </tfoot>
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