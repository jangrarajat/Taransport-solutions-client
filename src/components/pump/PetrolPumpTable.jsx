import React from "react";
import { CheckCircle, Clock, RefreshCw } from "lucide-react";

const PetrolPumpTable = ({ data, loading, onUpdatePayment }) => {
  if (loading) return <div className="p-20 text-center font-black uppercase text-white/30 tracking-widest italic animate-pulse">Loading Records...</div>;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10 font-black">
            <tr>
              <th className="px-6 py-5 text-[10px] text-white/50 uppercase tracking-widest border-r border-white/10">Pump Station</th>
              <th className="px-6 py-5 text-[10px] text-white/50 uppercase tracking-widest border-r border-white/10">Amount</th>
              <th className="px-6 py-5 text-[10px] text-white/50 uppercase tracking-widest border-r border-white/10">Date</th>
              <th className="px-6 py-5 text-[10px] text-white/50 uppercase tracking-widest border-r border-white/10 text-center">Status</th>
              <th className="px-6 py-5 text-[10px] text-white/50 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-bold uppercase text-[11px] tracking-tight">
            {data && data.length > 0 ? data.map((pump) => (
              <tr key={pump._id} className="hover:bg-white/5 transition-all duration-200">
                <td className="px-6 py-4 border-r border-white/10">
                  <p className="text-white">{pump.petrolPumpName}</p>
                </td>
                <td className="px-6 py-4 border-r border-white/10">
                  <p className="text-cyan-400 font-black">₹{pump.amount?.toLocaleString('en-IN')}</p>
                </td>
                <td className="px-6 py-4 border-r border-white/10">
                  <p className="text-white/50">{new Date(pump.createdAt).toLocaleDateString('en-GB')}</p>
                </td>
                <td className="px-6 py-4 border-r border-white/10 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-tighter ${
                    pump.payment === "payed" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
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
                      ? "bg-white/5 text-white/50 hover:bg-white/10 border-white/10" 
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-transparent"
                    }`}
                  >
                    <RefreshCw size={14} className={`${pump.payment !== "payed" ? "animate-pulse" : ""}`} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-16 text-center text-white/30 italic">No records found for this period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PetrolPumpTable;