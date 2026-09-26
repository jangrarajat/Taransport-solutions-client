// components/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { X, User, Building, Mail,ShieldCheck ,CheckCircle2 , Crown, Calendar, Edit2, Save, Clock, LogOut, CheckCircle, Truck, Shield, Zap, ArrowLeft, MapPin, Home, FileText, Hash, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../utils/backendUrl";
import { updateUserInStorage, getSubscriptionRemaining, getUserFromStorage } from "../utils/userUtils";
import ButtonLoaders from "./loaders/ButtonLoaders";
import SuccessToster from "./toster/SuccessToster";
import { refreshToken } from "../api/api";

/* ─── Inject Styles ──────────────────────────────────────────────── */
const PP_STYLE_ID = "profile-page-styles";
const injectStyles = () => {
  if (document.getElementById(PP_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = PP_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

    .pp-root {
      min-height: 100vh;
      background: var(--bg-base, #f0f2f7);
      font-family: 'DM Sans', sans-serif;
      padding: 0;
      position: relative;
      overflow-x: hidden;
    }

    .dark .pp-root { background: var(--bg-base, #080b14); }

    .pp-root::before {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 70% 50% at 15% 0%, rgba(79,110,247,0.1) 0%, transparent 65%),
        radial-gradient(ellipse 55% 40% at 85% 100%, rgba(139,92,246,0.08) 0%, transparent 65%);
    }
    .dark .pp-root::before {
      background:
        radial-gradient(ellipse 70% 50% at 15% 0%, rgba(79,110,247,0.18) 0%, transparent 65%),
        radial-gradient(ellipse 55% 40% at 85% 100%, rgba(139,92,246,0.13) 0%, transparent 65%);
    }

    .pp-topbar {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px;
      background: rgba(240,242,247,0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .dark .pp-topbar {
      background: rgba(8,11,20,0.85);
      border-bottom-color: rgba(255,255,255,0.06);
    }

    .pp-topbar-left { display: flex; align-items: center; gap: 14px; }

    .pp-back-btn {
      width: 38px; height: 38px; border-radius: 11px;
      background: rgba(255,255,255,0.8);
      border: 1px solid rgba(0,0,0,0.07);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6b7280;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .pp-back-btn:hover { background: #4f6ef7; color: #fff; border-color: #4f6ef7; box-shadow: 0 4px 14px rgba(79,110,247,0.3); }
    .dark .pp-back-btn { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.08); color: #94a3b8; }

    .pp-page-title {
      font-family: 'Syne', sans-serif;
      font-size: 18px; font-weight: 800;
      color: #0d0f1c; letter-spacing: -0.3px;
    }
    .dark .pp-page-title { color: #f0f2ff; }

    .pp-page-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }

    .pp-content {
      position: relative; z-index: 1;
      max-width: 860px; margin: 0 auto;
      padding: 28px 20px 60px;
      display: flex; flex-direction: column; gap: 20px;
    }
    @media (max-width: 640px) { .pp-content { padding: 20px 14px 60px; } }

    .pp-hero-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(79,110,247,0.08), 0 1px 4px rgba(0,0,0,0.06);
      animation: ppFadeUp 0.4s ease both;
    }
    .dark .pp-hero-card {
      background: rgba(17,24,39,0.9);
      border-color: rgba(255,255,255,0.07);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }

    .pp-cover {
      height: 120px;
      position: relative;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
      overflow: hidden;
    }

    .pp-cover::before {
      content: '';
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 60% 80% at 20% 50%, rgba(79,110,247,0.35) 0%, transparent 60%),
        radial-gradient(ellipse 50% 70% at 80% 50%, rgba(139,92,246,0.25) 0%, transparent 60%);
    }

    .pp-cover::after {
      content: '';
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .pp-cover-truck {
      position: absolute; right: 24px; bottom: 14px;
      font-size: 40px; opacity: 0.18; z-index: 1;
      animation: ppTruckFloat 4s ease-in-out infinite;
    }

    @keyframes ppTruckFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    .pp-amber-line {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #f59e0b 40%, #d97706 60%, transparent 100%);
    }

    .pp-hero-body { padding: 0 24px 24px; }

    .pp-avatar-row {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-top: -30px; margin-bottom: 20px;
    }

    .pp-avatar {
      width: 72px; height: 72px;
      border-radius: 18px;
      background: linear-gradient(135deg, #4f6ef7, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
      color: #fff; text-transform: uppercase;
      box-shadow: 0 8px 24px rgba(79,110,247,0.45);
      border: 3px solid rgba(255,255,255,0.9);
      flex-shrink: 0;
      position: relative; z-index: 1;
    }
    .dark .pp-avatar { border-color: rgba(17,24,39,0.95); }

    .pp-avatar-ring {
      position: absolute; inset: -5px;
      border-radius: 22px;
      border: 2px dashed rgba(79,110,247,0.3);
      animation: ppSpin 12s linear infinite;
    }
    @keyframes ppSpin { to { transform: rotate(360deg); } }

    .pp-action-btns { display: flex; gap: 8px; padding-bottom: 4px; }

    .pp-btn-edit {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border-radius: 11px;
      background: linear-gradient(135deg, #4f6ef7, #6b85f8);
      color: #fff; border: none; cursor: pointer;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
      letter-spacing: 0.4px; text-transform: uppercase;
      box-shadow: 0 4px 14px rgba(79,110,247,0.35);
      transition: all 0.25s;
    }
    .pp-btn-edit:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(79,110,247,0.5); }

    .pp-btn-save {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border-radius: 11px;
      background: linear-gradient(135deg, #10b981, #34d399);
      color: #fff; border: none; cursor: pointer;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
      letter-spacing: 0.4px; text-transform: uppercase;
      box-shadow: 0 4px 14px rgba(16,185,129,0.35);
      transition: all 0.25s;
    }
    .pp-btn-save:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16,185,129,0.5); }
    .pp-btn-save:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    .pp-btn-cancel {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 11px;
      background: rgba(0,0,0,0.05); color: #6b7280;
      border: 1px solid rgba(0,0,0,0.08); cursor: pointer;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
      text-transform: uppercase; transition: all 0.2s;
    }
    .pp-btn-cancel:hover { background: rgba(0,0,0,0.09); }
    .dark .pp-btn-cancel { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: #94a3b8; }

    .pp-user-name {
      font-family: 'Syne', sans-serif;
      font-size: 20px; font-weight: 800;
      color: #0d0f1c; letter-spacing: -0.3px;
    }
    .dark .pp-user-name { color: #f0f2ff; }

    .pp-user-company { font-size: 13px; color: #9ca3af; margin-top: 2px; }

    .pp-plan-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 100px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
      margin-top: 8px;
    }
    .pp-plan-badge.premium {
      background: rgba(245,158,11,0.12);
      color: #f59e0b;
      border: 1px solid rgba(245,158,11,0.25);
    }
    .pp-plan-badge.free {
      background: rgba(107,114,128,0.1);
      color: #9ca3af;
      border: 1px solid rgba(107,114,128,0.15);
    }

    .pp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 640px) { .pp-grid { grid-template-columns: 1fr; } }

    .pp-section-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      animation: ppFadeUp 0.4s ease both;
    }
    .dark .pp-section-card {
      background: rgba(17,24,39,0.9);
      border-color: rgba(255,255,255,0.07);
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }

    .pp-section-label {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1px;
      color: #9ca3af; margin-bottom: 14px;
      display: flex; align-items: center; gap: 7px;
    }
    .pp-section-label::after {
      content: ''; flex: 1; height: 1px;
      background: rgba(0,0,0,0.07);
    }
    .dark .pp-section-label::after { background: rgba(255,255,255,0.06); }

    .pp-field {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      background: rgba(0,0,0,0.025);
      border: 1px solid rgba(0,0,0,0.05);
      border-radius: 12px;
      margin-bottom: 10px;
    }
    .dark .pp-field {
      background: rgba(255,255,255,0.03);
      border-color: rgba(255,255,255,0.05);
    }
    .pp-field:last-child { margin-bottom: 0; }

    .pp-field-icon {
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pp-field-icon.blue { background: rgba(79,110,247,0.1); color: #4f6ef7; }
    .pp-field-icon.amber { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .pp-field-icon.emerald { background: rgba(16,185,129,0.1); color: #10b981; }
    .pp-field-icon.purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
    .pp-field-icon.rose { background: rgba(244,63,94,0.1); color: #f43f5e; }
    .pp-field-icon.slate { background: rgba(100,116,139,0.1); color: #64748b; }

    .pp-field-label {
      font-size: 10px; font-weight: 600;
      color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;
      margin-bottom: 2px;
    }

    .pp-field-value { font-size: 13px; font-weight: 600; color: #0d0f1c; }
    .dark .pp-field-value { color: #e2e8f0; }

    .pp-field-input {
      flex: 1; background: transparent; border: none; outline: none;
      font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
      color: #0d0f1c;
      border-bottom: 2px solid rgba(79,110,247,0.3);
      padding-bottom: 2px;
    }
    .dark .pp-field-input { color: #e2e8f0; }

    .pp-timer { display: flex; gap: 8px; margin-top: 4px; }
    .pp-timer-block {
      display: flex; flex-direction: column; align-items: center;
      background: rgba(79,110,247,0.08);
      border: 1px solid rgba(79,110,247,0.15);
      border-radius: 9px; padding: 6px 10px; min-width: 46px;
    }
    .pp-timer-num { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; line-height: 1; color: #4f6ef7; }
    .pp-timer-num.warn { color: #f59e0b; }
    .pp-timer-num.crit { color: #f43f5e; }
    .pp-timer-unit { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-top: 2px; }

    .pp-usage-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(79,110,247,0.15);
      border-radius: 18px; padding: 20px;
      box-shadow: 0 4px 20px rgba(79,110,247,0.06);
    }
    .dark .pp-usage-card { background: rgba(17,24,39,0.9); border-color: rgba(79,110,247,0.2); }

    .pp-logout-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(244,63,94,0.12);
      border-radius: 18px; padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .dark .pp-logout-card { background: rgba(17,24,39,0.9); border-color: rgba(244,63,94,0.15); }

    .pp-logout-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .pp-logout-text-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #0d0f1c; }
    .dark .pp-logout-text-title { color: #f0f2ff; }
    .pp-logout-text-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }

    .pp-logout-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 22px; border-radius: 12px;
      background: rgba(244,63,94,0.1); color: #f43f5e;
      border: 1px solid rgba(244,63,94,0.2); cursor: pointer;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px;
      transition: all 0.25s;
    }
    .pp-logout-btn:hover { background: #f43f5e; color: #fff; box-shadow: 0 6px 18px rgba(244,63,94,0.35); }

    @keyframes ppFadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
};

/* ─── ProfilePage ─────────────────────────────────────────────── */
const ProfilePage = ({ user: initialUser, onClose, showNotification: parentNotification }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || getUserFromStorage() || {});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    email: user?.email || "",
    address: user?.address || "",
    headOfficeAddress: user?.headOfficeAddress || "",
    gstinNo: user?.gstinNo || "",
    sapCode: user?.sapCode || ""
  });
  
  const WHATSAPP_NUMBER = "7357167649";
  const WHATSAPP_MESSAGE = "Hi this message from RM Smart Tms software enqueary!";

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (!user?.subscriptionEndDate) return;
    const updateRemaining = () => setTimeRemaining(getSubscriptionRemaining(user.subscriptionEndDate));
    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      setUser(event.detail);
      setFormData({
        name: event.detail?.name || "",
        companyName: event.detail?.companyName || "",
        email: event.detail?.email || "",
        address: event.detail?.address || "",
        headOfficeAddress: event.detail?.headOfficeAddress || "",
        gstinNo: event.detail?.gstinNo || "",
        sapCode: event.detail?.sapCode || ""
      });
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const internalShowNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    if (parentNotification) parentNotification(success, msg);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${backendUrl}/api/user/update-profile`, formData, { withCredentials: true });
      if (res.data.success) {
        const updatedUser = updateUserInStorage(res.data.user);
        setUser(updatedUser);
        internalShowNotification(true, "Profile Updated! ✨");
        setIsEditing(false);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const ok = await refreshToken(); if (ok) return handleSave();
      }
      internalShowNotification(false, error.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      companyName: user?.companyName || "",
      email: user?.email || "",
      address: user?.address || "",
      headOfficeAddress: user?.headOfficeAddress || "",
      gstinNo: user?.gstinNo || "",
      sapCode: user?.sapCode || ""
    });
    setIsEditing(false);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/auth"); };

  const handlePayment = async (planId) => {
    try {
      setLoadingPlanId(planId);
      const rzpKey = import.meta.env.VITE_APIKEY;
      if (!rzpKey) {
        internalShowNotification(false, "Razorpay Key missing in environment!");
        setLoadingPlanId(null);
        return;
      }

      const { data } = await axios.post(`${backendUrl}/api/user/create-order`, { planId }, { withCredentials: true });

      const options = {
        key: rzpKey,
        amount: data.order.amount,
        currency: "INR",
        name: user?.companyName || "RM Smart Tms",
        description: "Transport Management Software Subscription",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${backendUrl}/api/user/verify-payment`, { ...response, planId }, { withCredentials: true });
            if (verifyRes.data.success) {
              const updatedUser = updateUserInStorage(verifyRes.data.user);
              setUser(updatedUser);
              internalShowNotification(true, "Premium Subscription Activated! 🚛🎉");
              setTimeout(() => { window.location.reload(); }, 2000);
            }
          } catch (err) {
            console.error(err);
            internalShowNotification(false, "Payment Verification Failed");
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
      internalShowNotification(false, "Payment Initialization Failed");
      setLoadingPlanId(null);
    }
  };

  const plans = [
    { 
      id: "monthly", 
      name: "Silver Plan", 
      price: "1,000", 
      duration: "1 Month", 
      versionName: "Silver",
      icon: <ShieldCheck className="w-6 h-6 text-slate-300" />,
      cardStyle: "bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-slate-700/60 shadow-slate-900/50",
      btnBg: "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white shadow-md shadow-slate-700/30",
      features: ["Bilty Generation Features", "Vehicle-wise Report Tracking", "Trip Record Management", "Basic Expense Tracking"] 
    },
    { 
      id: "halfYearly", 
      name: "Gold Plan", 
      price: "6,000", 
      duration: "6 Months", 
      versionName: "Gold",
      icon: <Zap className="w-6 h-6 text-amber-300" />,
      cardStyle: "bg-gradient-to-b from-amber-950/30 via-slate-900/95 to-slate-950 border-amber-500/40 shadow-amber-500/10",
      btnBg: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/25",
      features: ["Unlimited Bilty Features", "Petrol Pump Udhari Tracker", "Full Dashboard Access", "Export All Data to Excel in 1-Click", "Auto Balance Calculation"] 
    },
    { 
      id: "yearly", 
      name: "Platinum Plan", 
      price: "12,000", 
      duration: "1 Year", 
      versionName: "Platinum",
      popular: true,
      icon: <Crown className="w-6 h-6 text-cyan-300" />,
      cardStyle: "bg-gradient-to-b from-cyan-950/40 via-slate-900/95 to-slate-950 border-cyan-400/60 shadow-cyan-500/20 ring-2 ring-cyan-500/30",
      btnBg: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30",
      features: ["Everything in Gold Plan Included", "Dedicated Account Manager", "24/7 Priority Support", "100% Secure Data & Cloud Backup", "Multi-device Sync"] 
    }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const timerColor = !timeRemaining ? 'neutral' : timeRemaining.expired ? 'crit' : timeRemaining.days <= 7 ? 'warn' : '';
  const usagePct = Math.min(((user?.biltyCount || 0) / 5) * 100, 100);

  return (
    <div className="pp-root">
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

      {/* Top Bar */}
      <div className="pp-topbar">
        <div className="pp-topbar-left">
          <button className="pp-back-btn" onClick={onClose}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="pp-page-title">My Profile</div>
            <div className="pp-page-sub">Manage your account details</div>
          </div>
        </div>
      </div>

      <div className="pp-content">

        {/* Hero Card */}
        <div className="pp-hero-card">
          <div className="pp-cover">
            <span className="pp-cover-truck">🚛</span>
            <div className="pp-amber-line" />
          </div>

          <div className="pp-hero-body">
            <div className="pp-avatar-row">
              <div style={{ position: 'relative' }}>
                <div className="pp-avatar">
                  {user?.companyName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U'}
                  <div className="pp-avatar-ring" />
                </div>
              </div>

              <div className="pp-action-btns">
                {!isEditing ? (
                  <button className="pp-btn-edit" onClick={() => setIsEditing(true)}>
                    <Edit2 size={13} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="pp-btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="pp-btn-save" onClick={handleSave} disabled={loading}>
                      {loading ? <ButtonLoaders /> : <><Save size={13} /> Save</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pp-user-name">{user?.name || 'User'}</div>
            <div className="pp-user-company">{user?.companyName || '—'}</div>
            <div className={`pp-plan-badge ${user?.isPremium ? 'premium' : 'free'}`}>
              {user?.isPremium ? <><Crown size={11} /> {user?.premiumVersion || 'Premium'} Plan</> : <><Zap size={11} /> Free Trial</>}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="pp-grid">
          <div className="pp-section-card">
            <div className="pp-section-label">Personal Info</div>
            
            <div className="pp-field">
              <div className="pp-field-icon blue"><User size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">Full Name</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.name || '—'}</div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon purple"><Building size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">Company Name</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.companyName || '—'}</div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon emerald"><Mail size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">Email Address</div>
                {isEditing ? (
                  <input className="pp-field-input" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                ) : (
                  <div className="pp-field-value" style={{ fontSize: 12 }}>{user?.email || '—'}</div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon slate"><MapPin size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">Address</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.address || '—'}</div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon slate"><Home size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">Head Office Address</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.headOfficeAddress} onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.headOfficeAddress || '—'}</div>
                )}
              </div>
            </div>
          </div>

          <div className="pp-section-card">
            <div className="pp-section-label">Subscription & Tax Info</div>

            <div className="pp-field">
              <div className="pp-field-icon amber"><Crown size={15} /></div>
              <div>
                <div className="pp-field-label">Current Plan</div>
                <div className="pp-field-value" style={{ color: user?.isPremium ? '#f59e0b' : '#9ca3af' }}>
                  {user?.isPremium ? user?.premiumVersion || 'Premium' : 'Free Trial'}
                </div>
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon slate"><FileText size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">GSTIN No.</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.gstinNo} onChange={(e) => setFormData({ ...formData, gstinNo: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.gstinNo || '—'}</div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <div className="pp-field-icon slate"><Hash size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pp-field-label">SAP Code</div>
                {isEditing ? (
                  <input className="pp-field-input" type="text" value={formData.sapCode} onChange={(e) => setFormData({ ...formData, sapCode: e.target.value })} />
                ) : (
                  <div className="pp-field-value">{user?.sapCode || '—'}</div>
                )}
              </div>
            </div>

            {user?.isPremium && (
              <>
                <div className="pp-field">
                  <div className="pp-field-icon blue"><Calendar size={15} /></div>
                  <div>
                    <div className="pp-field-label">Expires On</div>
                    <div className="pp-field-value">{formatDate(user?.subscriptionEndDate)}</div>
                  </div>
                </div>

                <div className="pp-field" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div className="pp-field-icon rose"><Clock size={15} /></div>
                    <div className="pp-field-label" style={{ marginBottom: 0 }}>Time Remaining</div>
                  </div>
                  {timeRemaining && !timeRemaining.expired ? (
                    <div className="pp-timer">
                      {timeRemaining.days > 0 && (
                        <div className="pp-timer-block">
                          <span className={`pp-timer-num ${timerColor}`}>{timeRemaining.days}</span>
                          <span className="pp-timer-unit">Days</span>
                        </div>
                      )}
                      <div className="pp-timer-block">
                        <span className={`pp-timer-num ${timerColor}`}>{timeRemaining.hours}</span>
                        <span className="pp-timer-unit">Hrs</span>
                      </div>
                      <div className="pp-timer-block">
                        <span className={`pp-timer-num ${timerColor}`}>{timeRemaining.minutes}</span>
                        <span className="pp-timer-unit">Min</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: '#f43f5e' }}>
                      Subscription Expired
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bilty Usage */}
        {!user?.isPremium && (
          <div className="pp-usage-card">
            <div className="pp-usage-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>📋 Bilty Usage</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Free plan allows 5 bilty entries</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4f6ef7' }}>{user?.biltyCount || 0}/5</div>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(79,110,247,0.1)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${usagePct}%`, background: '#4f6ef7', borderRadius: 100 }} />
            </div>
          </div>
        )}

        {/* ── Pricing Cards Section (Added above Logout) ── */}
        <div style={{ marginTop: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'inherit' }}>Upgrade Your Plan</h3>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>Choose a plan below to power up your transport software</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map(plan => {
              const isCurrentPlan = user?.isPremium && user?.premiumVersion?.toLowerCase() === plan.versionName.toLowerCase();
              return (
                <div 
                  key={plan.id} 
                  className={`rounded-3xl p-6 relative flex flex-col backdrop-blur-xl border shadow-xl ${plan.cardStyle}`}
                >
                  {isCurrentPlan && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      ✅ Current Active Plan
                    </span>
                  )}
                  {plan.popular && !isCurrentPlan && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      ✨ Most Popular
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        {plan.icon}
                      </div>
                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 my-3 pb-4 border-b border-slate-800">
                    <span className="text-3xl font-black text-white">₹{plan.price}</span>
                    <span className="text-slate-400 text-xs font-medium">/{plan.duration}</span>
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handlePayment(plan.id)} 
                    disabled={loadingPlanId !== null || isCurrentPlan}
                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${plan.btnBg} ${loadingPlanId !== null || isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingPlanId === plan.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Active Plan"
                    ) : (
                      "Activate Now"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logout Card */}
        <div className="pp-logout-card">
          <div className="pp-logout-inner">
            <div>
              <div className="pp-logout-text-title">Sign Out</div>
              <div className="pp-logout-text-sub">You'll be redirected to the login screen</div>
            </div>
            <button className="pp-logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* Footer with Policy Links */}
        <footer className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-xs">
              © {new Date().getFullYear()} <span className="font-bold text-slate-200">RM SMART TMS</span>. All Rights Reserved.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">Terms</a>
              <span>•</span>
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">Privacy</a>
              <span>•</span>
              <a href="/refund" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline">Refund</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default ProfilePage;