import { Contact, Printer, TruckElectric, X } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import PrintBilty from "./PrintBilty";
import SuccessToster from "./toster/SuccessToster"; 
import { refreshToken } from "../api/api";

// --- Maintenance Modal Component ---
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
                // onUpdate yahan refreshData function ko call karega
                onUpdate(); 
                showNotification(true, "Maintenance Updated! 🚛");
                onClose();
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const isRefreshed = await refreshToken();
                if (isRefreshed) return handleSubmit();
            }
            showNotification(false, error.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Vehicle Maintenance</h2>
                    <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 font-bold">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Maintenance Amount (₹)</label>
                        <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:border-orange-400 mt-1" placeholder="e.g. 2000" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Remark / Reason</label>
                        <input required type="text" value={remark} onChange={(e) => setRemark(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:border-orange-400 mt-1" placeholder="Tyre change, Oil, etc." />
                    </div>
                    <button disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all mt-2">
                        {loading ? "Updating..." : "Save & Update Balance"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main BiltyTable Component ---
const BiltyTable = ({ data, loading, refreshData }) => {
    const [printBityBtn, setPrintBityBtn] = useState(false);
    const [pData, setPData] = useState([]);
    const [isMaintOpen, setIsMaintOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const setPrintData = (bill) => {
        setPrintBityBtn(!printBityBtn);
        setPData(bill);
    };

    const openMaintenance = (bill) => {
        setSelectedBill(bill);
        setIsMaintOpen(true);
    };

    if (loading) return <div className="h-64 flex items-center justify-center bg-white rounded-xl font-black uppercase text-slate-400 tracking-widest">Loading Records...</div>;

    return (
        <>
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden rounded-xl">
                <div className="overflow-x-auto overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-800 text-white">
                            <tr>
                                {["Invoice No", "Date", "LR NO.", "DI No.", "DO No.", "Name Of Recipient",
                                    "Destination", "Vehicle", "Qty", "Packages", "GSTINNo",
                                    "Total Invoice Value", "Print bilty", "fright Amount", "desil", "commeion", "advance Cash", "trip Balance Ammount", "Vehicle Maintenance", "faynal Ammount",
                                ].map((h) => (
                                    <th key={h} className="px-4 text-center py-4 text-[11px] uppercase tracking-wider font-bold border-r border-slate-700 last:border-0 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase">
                            {data.map((bill) => (
                                <tr key={bill._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 text-center py-3 text-sm text-blue-600">{bill.InvoiceNo}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-500 whitespace-nowrap">{bill.DateOfIssueOfInvoice}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-700 min-w-[180px]">{bill.LRNO}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-700 min-w-[150px]">{bill.DINo}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-700 min-w-[150px]">{bill.DONo}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-700 min-w-[200px] uppercase">{bill.NameOfRecipient}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-600 uppercase">{bill.Destination}</td>
                                    <td className="px-4 text-center py-3 text-sm font-mono text-slate-700 whitespace-nowrap">{bill.VehicleNo}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-600">{bill.Quantity}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-600">{bill.Packages}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-700 min-w-[180px]">{bill.GSTINNo}</td>
                                    <td className="px-4 text-center py-3 text-sm text-green-600 whitespace-nowrap font-black">₹{bill.TotalInvoiceValue || "0"}</td>
                                    <td className="px-4 text-center py-3 text-sm text-blue-600 flex items-center justify-center">
                                        <Printer className="cursor-pointer hover:scale-110 transition-transform" onClick={() => setPrintData(bill)} />
                                    </td>
                                    <td className="px-4 text-center py-3 text-sm text-blue-500 whitespace-nowrap font-black">₹{bill.frightAmount || "0"}</td>
                                    <td className="px-4 text-center py-3 text-sm text-red-500 whitespace-nowrap font-black">₹{bill.desil || "0"}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-600 whitespace-nowrap">₹{bill.commeion || "0"}</td>
                                    <td className="px-4 text-center py-3 text-sm text-slate-600 whitespace-nowrap">₹{bill.advanceCash || "0"}</td>
                                    <td className="px-4 text-center py-3 text-sm text-green-600 whitespace-nowrap font-black">₹{bill.tripBalanceAmmount || "0"}</td>
                                    
                                    <td className="px-4 py-3 text-sm whitespace-nowrap border-x border-slate-50">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-orange-600 font-black">₹{bill.vehicalPayedAmount || "0"}</span>
                                                <span className="text-[9px] text-slate-400 italic truncate max-w-[80px] leading-none uppercase">{bill.vehicalPayedremark || "No Remark"}</span>
                                            </div>
                                            <button 
                                                onClick={() => openMaintenance(bill)} 
                                                className="p-1.5 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-90"
                                            >
                                                <TruckElectric size={18} />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-4 text-center py-3 text-sm text-blue-700 whitespace-nowrap font-black">₹{bill.faynalAmmount || "0"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {printBityBtn && <PrintBilty pData={pData} setPrintBityBtn={setPrintBityBtn} />}

            <MaintenanceModal 
                isOpen={isMaintOpen} 
                onClose={() => setIsMaintOpen(false)} 
                bill={selectedBill} 
                onUpdate={refreshData} 
                showNotification={showNotification}
            />
        </>
    );
};

export default BiltyTable;