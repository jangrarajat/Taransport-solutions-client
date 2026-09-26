import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, ShieldCheck, Zap, Crown, Loader2 } from 'lucide-react';
import SuccessToster from './toster/SuccessToster';
import { backendUrl } from '../utils/backendUrl';
import { getUserFromStorage } from "../utils/userUtils";

const Pricing = ({ isOpen, onClose }) => {
    const [companyName, setCompanyName] = useState('RM Smart Tms');
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    useEffect(() => {
        const data = getUserFromStorage();
        console.log("from pricing page ");
        console.log(data);
        if (data && data.companyName) {
            setCompanyName(data.companyName);
        }
    }, []);

    if (!isOpen) return null;

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const plans = [
        { 
            id: "monthly", 
            name: "Silver Plan", 
            price: "1,000", 
            duration: "1 Month", 
            icon: <ShieldCheck className="w-6 h-6 text-slate-300" />,
            cardStyle: "bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-slate-700/60 shadow-slate-900/50",
            badgeBg: "bg-slate-800 text-slate-200 border border-slate-600",
            btnBg: "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white shadow-md shadow-slate-700/30",
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
            icon: <Zap className="w-6 h-6 text-amber-300" />,
            cardStyle: "bg-gradient-to-b from-amber-950/30 via-slate-900/95 to-slate-950 border-amber-500/40 shadow-amber-500/10",
            badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/30",
            btnBg: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/25",
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
            icon: <Crown className="w-6 h-6 text-cyan-300" />,
            cardStyle: "bg-gradient-to-b from-cyan-950/40 via-slate-900/95 to-slate-950 border-cyan-400/60 shadow-cyan-500/20 ring-2 ring-cyan-500/30 lg:-translate-y-2",
            badgeBg: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30",
            btnBg: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30",
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
            setLoadingPlanId(planId);
            const rzpKey = import.meta.env.VITE_APIKEY;
            if (!rzpKey) {
                showNotification(false, "Razorpay Key missing in environment!");
                setLoadingPlanId(null);
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
                    try {
                        const verifyRes = await axios.post(`${backendUrl}/api/user/verify-payment`, { ...response, planId }, { withCredentials: true });
                        if (verifyRes.data.success) {
                            localStorage.setItem("transportUser", JSON.stringify(verifyRes.data.user));
                            showNotification(true, "Premium Subscription Activated! 🚛🎉");
                            setTimeout(() => {
                                onClose();
                                window.location.reload();
                            }, 2000);
                        }
                    } catch (err) {
                        console.error(err);
                        showNotification(false, "Payment Verification Failed");
                    } finally {
                        setLoadingPlanId(null);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoadingPlanId(null);
                    }
                },
                theme: { color: "#2563eb" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            showNotification(false, "Payment Initialization Failed");
            setLoadingPlanId(null);
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
                    className="absolute top-0 right-0 sm:-top-4 sm:right-0 p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-all duration-300 hover:rotate-90 shadow-lg border border-slate-700 z-10 cursor-pointer"
                >
                    <X size={22} />
                </button>

                {/* Header Title */}
                <div className="text-center mb-10 text-white px-4">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-block mb-3">
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
                            className={`rounded-3xl p-6 sm:p-6 relative flex flex-col transition-all duration-300 hover:translate-y-[-4px] backdrop-blur-xl border shadow-xl ${plan.cardStyle}`}
                        >
                            {/* Most Popular / Platinum Badge */}
                            {plan.popular && (
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest shadow-lg">
                                    ✨ Ultimate Platinum Choice
                                </span>
                            )}

                            {/* Plan Header */}
                            <div className="flex items-center text-sm justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-wide">{plan.name}</h3>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1.5 my-4 pb-6 border-b border-slate-800/80">
                                <span className="text-2 sm:text-3xl font-black text-white tracking-tight">₹{plan.price}</span>
                                <span className="text-slate-400 text-sm font-medium">/{plan.duration}</span>
                            </div>

                            {/* Features List */}
                            <ul className="flex-1  space-y-3.5 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-normal leading-snug">
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Action Button */}
                            <button 
                                onClick={() => handlePayment(plan.id)} 
                                disabled={loadingPlanId !== null}
                                className={`w-full py-4 rounded-sm font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${plan.btnBg} ${loadingPlanId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loadingPlanId === plan.id ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Activate Plan Now"
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Policy & Non-Refundable Disclaimer */}
                <div className="mt-10 text-center space-y-3">
                    <p className="text-slate-400 text-xs">
                        ⚠️ <span className="font-semibold text-slate-300">Note:</span> All subscription purchases are final and <strong className="text-slate-200">non-refundable</strong>. Please review plan features before making a payment.
                    </p>
                    <div className="flex justify-center items-center gap-4 text-xs text-slate-400 font-medium">
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">
                            Terms & Conditions
                        </a>
                        <span>•</span>
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">
                            Privacy Policy
                        </a>
                        <span>•</span>
                        <a href="/refund" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">
                            Refund Policy
                        </a>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                        Secure payments powered by Razorpay.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;