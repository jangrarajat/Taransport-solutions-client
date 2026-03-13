import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle2 } from 'lucide-react';
import SuccessToster from './toster/SuccessToster';
import { backendUrl } from '../utils/backendUrl';

const Pricing = ({ isOpen, onClose }) => {
    const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

    if (!isOpen) return null;

    const showNotification = (success, msg) => {
        setToast({ show: true, success, msg, id: Date.now() });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    const plans = [
        { id: "monthly", name: "Silver", price: "2,999", duration: "1 Month", color: "from-slate-400 to-slate-500", btn: "from-slate-600 to-slate-700", features: ["5 Bilty Demo", "Basic Reports", "Expense Tracking"] },
        { id: "halfYearly", name: "Gold", price: "15,999", duration: "6 Months", popular: true, color: "from-cyan-400 to-blue-500", btn: "from-cyan-500 to-blue-600", features: ["Unlimited Bilty", "Priority Support", "Advanced Analytics"] },
        { id: "yearly", name: "Platinum", price: "31,999", duration: "1 Year", color: "from-orange-400 to-pink-500", btn: "from-orange-500 to-pink-600", features: ["Unlimited Everything", "Multi-device Sync", "24/7 Phone Support"] }
    ];

    const handlePayment = async (planId) => {
        try {
            const rzpKey = import.meta.env.VITE_APIKEY;
            if (!rzpKey) {
                showNotification(false, "Razorpay Key missing!");
                return;
            }

            const { data } = await axios.post(`${backendUrl}/user/create-order`, { planId }, { withCredentials: true });
            
            const options = {
                key: rzpKey,
                amount: data.order.amount,
                currency: "INR",
                name: "Sawariya Logistic",
                order_id: data.order.id,
                handler: async (response) => {
                    const verifyRes = await axios.post(`${backendUrl}/user/verify-payment`, { ...response, planId }, { withCredentials: true });
                    if (verifyRes.data.success) {
                        localStorage.setItem("transportUser", JSON.stringify(verifyRes.data.user));
                        showNotification(true, "Premium Activated! 🚛");
                        setTimeout(() => window.location.reload(), 2000);
                    }
                },
                theme: { color: "#1e293b" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            showNotification(false, "Payment Failed");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
            <div className="max-w-6xl w-full relative my-auto">
                <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white hover:rotate-90 transition-all"><X size={32}/></button>
                <div className="text-center mb-10 text-white">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Upgrade Your Business</h2>
                    <p className="opacity-60 font-medium">Select a plan to unlock full potential</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] relative flex flex-col transition-all hover:scale-[1.02] ${plan.popular ? 'ring-4 ring-cyan-500 shadow-2xl' : ''}`}>
                            {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</span>}
                            <h3 className={`text-xl font-black uppercase bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mt-4 mb-6 font-black">
                                <span className="text-4xl text-white">₹{plan.price}</span>
                                <span className="text-white/50 text-sm">/{plan.duration}</span>
                            </div>
                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/70"><CheckCircle2 size={18} className="text-green-500 shrink-0"/>{f}</li>
                                ))}
                            </ul>
                            <button onClick={() => handlePayment(plan.id)} className={`w-full py-4 bg-gradient-to-r ${plan.btn} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all`}>Activate Now</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;