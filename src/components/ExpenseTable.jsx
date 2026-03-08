import React from "react";

const ExpenseTable = ({ data, loading, filterTerm = "" }) => {
  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-300 tracking-widest italic animate-pulse">Fetching Expenses...</div>;

  // Manual Filter for Title (salary, other, bills etc)
  const filteredData = data.filter(ex => 
    ex.title?.toLowerCase().includes(filterTerm.toLowerCase()) || 
    ex.amount[1]?.paymentPurpes?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden font-bold uppercase tracking-tighter">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 font-black italic">
            <tr>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Date</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Title</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest border-r">Purpose</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px]">
            {filteredData.length > 0 ? filteredData.map((ex) => (
              <tr key={ex._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-500 border-r">
                  {new Date(ex.expenseDate).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4 border-r">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                    ex.title === 'salary' ? 'bg-purple-100 text-purple-700' : 
                    ex.title === 'bills' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ex.title}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-800 font-black border-r">
                  {ex.amount[1]?.paymentPurpes || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-black text-xs italic">
                    ₹{ex.amount[0]?.payedAmount?.toLocaleString('en-IN') || 0}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="p-16 text-center text-slate-300 italic">No matching expenses found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;