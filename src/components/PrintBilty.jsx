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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] overflow-auto flex justify-center py-5 print:p-0 print:bg-white">
            <div className="relative overflow-auto">
                <div className="flex fixed md:relative w-full justify-between gap-5 items-center mb-4 bg-white/5 backdrop-blur-xl border border-white/10 p-3 shadow print-hidden rounded-2xl">
                    <button
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md font-bold shadow-md hover:shadow-cyan-500/50 transition-all"
                        onClick={handlePrint}
                    >
                        Print Bilty
                    </button>
                    <X
                        className="p-1 hover:bg-white/10 rounded-full duration-200 cursor-pointer text-white/70"
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