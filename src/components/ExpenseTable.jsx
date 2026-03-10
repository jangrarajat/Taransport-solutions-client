import React from "react";

const ExpenseTable = ({ data, loading, filterTerm = "" }) => {
  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-300 dark:text-slate-600 tracking-widest italic animate-pulse">Fetching Expenses...</div>;

  // Manual Filter for Title (salary, other, bills etc)
  const filteredData = data.filter(ex => 
    ex.title?.toLowerCase().includes(filterTerm.toLowerCase()) || 
    ex.amount[1]?.paymentPurpes?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden font-bold uppercase tracking-tighter">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-black italic">
            <tr>
              <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Date</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Title</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r dark:border-slate-700">Purpose</th>
              <th className="px-6 py-5 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filteredData.length > 0 ? filteredData.map((ex) => (
              <tr key={ex._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r dark:border-slate-700">
                  {new Date(ex.expenseDate).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4 border-r dark:border-slate-700">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                    ex.title === 'salary' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                    ex.title === 'bills' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {ex.title}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-black border-r dark:border-slate-700">
                  {ex.amount[1]?.paymentPurpes || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs italic">
                    ₹{ex.amount[0]?.payedAmount?.toLocaleString('en-IN') || 0}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="p-16 text-center text-slate-300 dark:text-slate-600 italic">No matching expenses found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;