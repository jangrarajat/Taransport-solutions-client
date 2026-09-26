import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
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
                <h1 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">Privacy Policy</h1>
                <p className="text-sm text-slate-400 mb-8 border-b border-slate-800/80 pb-4">Last updated: September 26, 2026</p>

                <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
                        <p>We collect information you provide directly when registering for RM Smart Tms, such as your company name, email address, phone number, and transport-related transaction data.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Data</h2>
                        <p>Your data is used to provide, maintain, and improve our software services, manage your subscriptions, and offer technical support when requested.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2">3. Data Security</h2>
                        <p>We implement robust security measures and cloud backups to protect your business records from unauthorized access or loss.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;