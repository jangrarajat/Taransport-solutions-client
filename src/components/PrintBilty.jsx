import React, { useEffect } from 'react'
import { X } from "lucide-react"
import Bilty from './bill/Bilty';

function PrintBilty({ pData, setPrintBityBtn }) {
    useEffect(() => {
        console.log("print data", pData)
    }, [pData])

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-[100] overflow-auto flex justify-center py-5 print:p-0 print:bg-white">
            <div className="relative overflow-auto">
                <div className="flex fixed md:relative w-full justify-between gap-5 items-center mb-4 bg-white dark:bg-slate-900 p-3 shadow print-hidden rounded-md">
                    <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold shadow-md hover:bg-blue-700 transition-all"
                        onClick={handlePrint}
                    >
                        Print Bilty
                    </button>
                    <X
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full duration-200 cursor-pointer dark:text-white"
                        size={32}
                        onClick={() => setPrintBityBtn(false)}
                    />
                </div>

                <Bilty pData={pData} />
                <Bilty pData={pData} />
            </div>
        </div>
    )
}

export default PrintBilty