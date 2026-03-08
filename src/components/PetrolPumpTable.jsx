import React from "react";
import { CheckCircle, Clock, RefreshCw } from "lucide-react";

const PetrolPumpTable = ({ data, loading, onUpdatePayment }) => {
  if (loading) return <div className="p-20 text-center font-black uppercase text-slate-400 tracking-widest italic">Loading Records...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 font-black">
            <tr>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Pump Station</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Amount</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Date</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r text-center">Status</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold uppercase text-[11px] tracking-tight">
            {data && data.length > 0 ? data.map((pump) => (
              <tr key={pump._id} className="hover:bg-slate-50 transition-all duration-200">
                <td className="px-6 py-4 border-r">
                  <p className="text-slate-800">{pump.petrolPumpName}</p>
                </td>
                <td className="px-6 py-4 border-r">
                  <p className="text-blue-600 font-black">₹{pump.amount?.toLocaleString('en-IN')}</p>
                </td>
                <td className="px-6 py-4 border-r">
                  <p className="text-slate-400">{new Date(pump.createdAt).toLocaleDateString('en-GB')}</p>
                </td>
                <td className="px-6 py-4 border-r text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-tighter ${
                    pump.payment === "payed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {pump.payment === "payed" ? <CheckCircle size={10}/> : <Clock size={10}/>}
                    {pump.payment}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onUpdatePayment && onUpdatePayment(pump._id, pump.payment)} 
                    className={`p-2 rounded-xl transition-all active:scale-90 shadow-md border ${
                      pump.payment === "payed" 
                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200" 
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                    }`}
                  >
                    <RefreshCw size={14} className={`${pump.payment !== "payed" ? "animate-pulse" : ""}`} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-16 text-center text-slate-300 italic">No records found for this period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PetrolPumpTable;