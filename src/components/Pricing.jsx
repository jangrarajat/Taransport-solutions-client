import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, ShieldCheck, Zap, Crown } from 'lucide-react';
import SuccessToster from './toster/SuccessToster';
import { backendUrl } from '../utils/backendUrl';
import { getUserFromStorage } from "../utils/userUtils";

const Pricing = ({ isOpen, onClose }) => {
    const [companyName, setCompanyName] = useState('RM Smart Tms');
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

    useEffect(() => {
        const user = getUserFromStorage();
        if (user && user.companyName) {
            setCompanyName(user.companyName);
        }
    }, []);

    if (!isOpen) return null;

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    // Aapke bataye gaye features ke sath updated plans
    const plans = [
        { 
            id: "monthly", 
            name: "Silver Plan", 
            price: "1,000", 
            duration: "1 Month", 
            icon: <ShieldCheck className="w-6 h-6 text-slate-400" />,
            badgeBg: "bg-slate-800 text-slate-200 border border-slate-700",
            btnBg: "bg-slate-800 hover:bg-slate-700 text-white",
            features: [
                "Bilty Generation Features", 
                "Vehicle-wise Report Tracking",
                "Trip Record Management",
                "Basic Expense Tracking"
            ] 
        },
        { 
            id: "halfYearly", 
            name: "Gold Plan", 
            price: "6,000", 
            duration: "6 Months", 
            icon: <Zap className="w-6 h-6 text-blue-400" />,
            badgeBg: "bg-blue-600 text-white shadow-lg shadow-blue-500/30",
            btnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25",
            features: [
                "Unlimited Bilty Features", 
                "Petrol Pump Udhari Tracker (Oil & Payment History)",
                "Full Dashboard Access",
                "Export All Data to Excel in 1-Click",
                "Auto Opening & Closing Balance Calculation"
            ] 
        },
        { 
            id: "yearly", 
            name: "Platinum Plan", 
            price: "12,000", 
            duration: "1 Year", 
             popular: true,
            icon: <Crown className="w-6 h-6 text-amber-400" />,
            badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30",
            btnBg: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25",
            features: [
                "Everything in Gold Plan Included", 
                "Dedicated Account Manager",
                "24/7 Priority Help & Support",
                "100% Secure Data & Cloud Backup",
                "Multi-device Sync & Multi-user Access"
            ] 
        }
    ];

    const handlePayment = async (planId) => {
        try {
            const rzpKey = import.meta.env.VITE_APIKEY;
            if (!rzpKey) {
                showNotification(false, "Razorpay Key missing in environment!");
                return;
            }

            const { data } = await axios.post(`${backendUrl}/api/user/create-order`, { planId }, { withCredentials: true });

            const options = {
                key: rzpKey,
                amount: data.order.amount,
                currency: "INR",
                name: companyName,
                description: "Transport Management Software Subscription",
                order_id: data.order.id,
                handler: async (response) => {
                    const verifyRes = await axios.post(`${backendUrl}/api/user/verify-payment`, { ...response, planId }, { withCredentials: true });
                    if (verifyRes.data.success) {
                        localStorage.setItem("transportUser", JSON.stringify(verifyRes.data.user));
                        showNotification(true, "Premium Subscription Activated! 🚛🎉");
                        setTimeout(() => {
                            onClose();
                            window.location.reload();
                        }, 2000);
                    }
                },
                theme: { color: "#2563eb" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            showNotification(false, "Payment Initialization Failed");
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-cover bg-center bg-no-repeat backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            style={{
                backgroundImage: `linear-gradient(rgba(3, 7, 18, 0.90), rgba(3, 7, 18, 0.92)), url('https://www.f-cdn.com/assets/main/en/assets/job-post/redesign/bird.jpg')`
            }}
        >
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
            
            <div className="max-w-6xl w-full relative my-auto py-8">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-0 right-0 sm:-top-4 sm:right-0 p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-all duration-300 hover:rotate-90 shadow-lg border border-slate-700 z-10"
                >
                    <X size={22} />
                </button>

                {/* Header Title */}
                <div className="text-center mb-10 text-white px-4">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block mb-3">
                        {companyName} - Upgrade Hub
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Choose Your Power Plan
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 font-medium max-w-lg mx-auto">
                        Automate bilties, track diesel expenses, and manage your transport business effortlessly without manual calculations.
                    </p>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                    {plans.map(plan => (
                        <div 
                            key={plan.id} 
                            className={`rounded-3xl p-6 sm:p-8 relative flex flex-col transition-all duration-300 hover:translate-y-[-4px] backdrop-blur-xl bg-slate-900/80 border ${
                                plan.popular 
                                    ? 'border-blue-500/80 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500/40 lg:-translate-y-2' 
                                    : 'border-slate-800 hover:border-slate-700 shadow-xl'
                            }`}
                        >
                            {/* Most Popular Badge */}
                            {plan.popular && (
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                                    🔥 Most Popular Choice
                                </span>
                            )}

                            {/* Plan Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-wide">{plan.name}</h3>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1.5 my-4 pb-6 border-b border-slate-800">
                                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">₹{plan.price}</span>
                                <span className="text-slate-400 text-sm font-medium">/{plan.duration}</span>
                            </div>

                            {/* Features List */}
                            <ul className="flex-1 space-y-3.5 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-normal leading-snug">
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Action Button */}
                            <button 
                                onClick={() => handlePayment(plan.id)} 
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all duration-200 cursor-pointer ${plan.btnBg}`}
                            >
                                Activate Plan Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;