import React from 'react';
import { useNavigate } from 'react-router-dom';

const Refund = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 py-12 px-4 sm:px-8 lg:px-16 flex flex-col items-center">
            <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-12 shadow-2xl shadow-indigo-500/10">
                <button 
                    onClick={() => navigate('/')} 
                    className="mb-8 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                    ← Back to Home
                </button>
                <h1 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">Refund & Cancellation Policy</h1>
                <p className="text-sm text-slate-400 mb-8 border-b border-slate-800/80 pb-4">Last updated: September 26, 2026</p>

                <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">1. Final Sale & Non-Refundable Terms</h2>
                        <p>All purchases and subscription plan activations (Silver, Gold, Platinum) made on RM Smart Tms are final. Once a plan is successfully activated, the amount paid is strictly <strong>non-refundable</strong> under any circumstances.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">2. Subscription Cancellation</h2>
                        <p>You may choose to discontinue using your subscription at any time. However, no partial or full refunds will be issued for the remaining unused period of your active plan.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">3. Duplicate Transactions</h2>
                        <p>In case of a technical error where a duplicate payment is charged for a single subscription order, please contact our support team immediately with transaction proof. Valid duplicate charges will be refunded to the original payment source within 5-7 business days.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Refund;