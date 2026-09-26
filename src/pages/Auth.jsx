// Auth.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Login from '../components/authForm/Login';
import Registration from '../components/authForm/Registration';
import ForgetPassword from '../components/authForm/ForgetPassword';
import { Truck, ArrowRight, LogIn, UserPlus, Shield, Zap, BarChart3, X, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { getUserFromStorage } from '../utils/userUtils';
import Pricing from '../components/Pricing';

// 👇 Apna WhatsApp number yahan daalo (country code ke saath, bina + / space ke)
const WHATSAPP_NUMBER = "917357167649";
const WHATSAPP_MESSAGE = "Hello RM Smart TMS, I want to know more about your plans.";

// Inline WhatsApp brand icon (lucide-react me nahi hota)
const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function Auth() {
  const [showLanding, setShowLanding] = useState(true);
  const [authForm, setAuthForm] = useState("option");
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Plans data for landing page display
  const landingPlans = [
    {
      id: "free",
      name: "Free Trial",
      price: "0",
      duration: "Trial Version",
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      btnBg: "bg-slate-800 hover:bg-slate-700 text-white",
      features: [
        "5 Entries Free (Trial Version)",
        "Basic Bilty Creation",
        "Single Device Access",
        "Explore Dashboard"
      ],
      isFree: true
    },
    {
      id: "monthly",
      name: "Silver Plan",
      price: "1,000",
      duration: "1 Month",
      icon: <Shield className="w-5 h-5 text-slate-400" />,
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
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      badgeBg: "bg-blue-600 text-white",
      btnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25",
      features: [
        "Unlimited Bilty Features",
        "Petrol Pump Udhari Tracker",
        "Full Dashboard Access",
        "Export All Data to Excel in 1-Click",
        "Auto Balance Calculation"
      ]
    },
    {
      id: "yearly",
      name: "Platinum Plan",
      price: "12,000",
      duration: "1 Year",
      popular: true,
      icon: <Crown className="w-5 h-5 text-amber-400" />,
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      btnBg: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25",
      features: [
        "Everything in Gold Plan Included",
        "Dedicated Account Manager",
        "24/7 Priority Support",
        "100% Secure Data & Cloud Backup",
        "Multi-device Sync"
      ]
    }
  ];

  const handlePlanClick = (plan) => {
    const user = getUserFromStorage();
    if (!user) {
      setShowLanding(false);
      setAuthForm("login");
    } else {
      setShowPricingModal(true);
    }
  };

  // Close auth overlay handler (reset back to landing)
  const closeAuthOverlay = () => {
    setShowLanding(true);
    setAuthForm("option");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col justify-between"
      style={{
        backgroundImage: `linear-gradient(rgba(3, 7, 18, 0.90), rgba(3, 7, 18, 0.94)), url('https://www.f-cdn.com/assets/main/en/assets/job-post/redesign/bird.jpg')`
      }}
    >
      <Helmet>
        <title>RM Smart TMS | Transport Management Software</title>
        <meta name="description" content="Professional transport management software for fleet operators. Manage trips, track revenue, and optimize operations." />
      </Helmet>

      {/* Landing Page */}
      {showLanding ? (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl w-full mx-auto py-12">

            {/* Logo Section */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="flex items-center gap-3 backdrop-blur-md bg-slate-900/60 border border-slate-800 px-5 py-2.5 rounded-2xl shadow-xl">
                <img
                  src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774862288/Screenshot_2026-03-29_155255_r70pha-removebg-preview_rrdxac.png"
                  alt="RM Smart TMS Logo"
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      RM
                    </span>
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">™</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                    SMART TMS
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6 shadow-inner">
                <span className="text-blue-400 text-sm">🚛</span>
                <span className="text-xs font-bold text-blue-400 tracking-wide uppercase">Smart Transport Solution</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
                Drive Your{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  Business Forward
                </span>
              </h1>

              <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg font-normal leading-relaxed">
                Complete digital solution for transport businesses. Manage trips, track revenue,
                and optimize operations all in one place.
              </p>
            </div>

            {/* CTA Buttons at Bottom */}
            <div className="flex justify-center gap-4 flex-wrap pb-8 pt-4">
              <button
                onClick={() => setShowLanding(false)}
                className="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
              >
                Get Started Free <ArrowRight size={18} />
              </button>
              <button
                onClick={() => { setShowLanding(false); setAuthForm("login"); }}
                className="inline-flex items-center gap-2 px-7 py-4 backdrop-blur-md bg-slate-800/80 border border-slate-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-slate-700/80 transition-all cursor-pointer shadow-lg"
              >
                <LogIn size={18} /> Login
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[
                { icon: Truck, title: "Trip Management", desc: "Track and manage all trips efficiently" },
                { icon: BarChart3, title: "Revenue Analytics", desc: "Real-time insights and reports" },
                { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade security" },
                { icon: Zap, title: "Fast Operations", desc: "Streamlined workflow" }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="backdrop-blur-xl bg-slate-900/55 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
                    <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-white font-bold mb-1.5">{feature.title}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Pricing Section on Landing Page */}
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Transparent Pricing Plans</h2>
                <p className="text-slate-400 text-sm mt-1">Start with our free trial version or choose a plan that suits your fleet.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {landingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 relative flex flex-col backdrop-blur-xl bg-slate-900/80 border transition-all duration-300 hover:-translate-y-1 ${plan.popular
                      ? 'border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700 shadow-lg'
                      }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow">
                        Most Popular
                      </span>
                    )}

                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60">
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1 my-3 pb-4 border-b border-slate-800">
                      <span className="text-3xl font-black text-white">₹{plan.price}</span>
                      <span className="text-slate-400 text-xs font-medium">/{plan.duration}</span>
                    </div>

                    <ul className="flex-1 space-y-3 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${plan.isFree ? 'text-emerald-400' : 'text-blue-400'}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePlanClick(plan)}
                      className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer ${plan.btnBg}`}
                    >
                      {plan.isFree ? "Start Free Trial" : "Choose Plan"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

         

          </div>
        </div>
      ) : (
        /* Auth Forms */
        <>
          {authForm === "login" || authForm === "registration" || authForm === "forget" ? (
            /* ✅ FULL SCREEN WHITE — Login / Registration / ForgetPassword */
            <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
              <button
                onClick={closeAuthOverlay}
                className="absolute top-4 right-4 z-50 p-2 text-slate-600 hover:text-slate-900 transition-all bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-300"
                aria-label="Close"
              >
                <X size={22} />
              </button>

              {authForm === "login" && (
                <Login setAuthForm={setAuthForm} setInfo={setShowLanding} />
              )}
              {authForm === "registration" && (
                <Registration setAuthForm={setAuthForm} />
              )}
              {authForm === "forget" && (
                <ForgetPassword setAuthForm={setAuthForm} />
              )}
            </div>
          ) : (
            /* ✅ OPTION — Full screen white (Login-style UI) */
            <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
              <button
                onClick={() => setShowLanding(true)}
                className="absolute top-4 right-4 z-50 p-2 text-slate-600 hover:text-slate-900 transition-all bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-300"
                aria-label="Close"
              >
                <X size={22} />
              </button>

              <div className="w-full h-screen flex bg-white">
                {/* LEFT SIDE — OPTIONS */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 overflow-y-auto">
                  <div className="w-full max-w-md">

                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                      <img src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774862288/Screenshot_2026-03-29_155255_r70pha-removebg-preview_rrdxac.png" alt="logo" className='h-10' />
                      <span className="text-2xl font-black text-slate-900 italic tracking-tight">
                        RM SMART TMS<span className="text-[#1dbf73]">.</span>
                      </span>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      Welcome to RM Smart TMS
                    </h2>
                    <p className="text-sm text-slate-500 mb-8">
                      Sign in to your account or create a new one to manage your logistics seamlessly.
                    </p>

                    {/* Option Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setAuthForm("registration")}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors cursor-pointer"
                      >
                        <UserPlus size={18} />
                        Create Free Account
                      </button>

                      <button
                        onClick={() => setAuthForm("login")}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-md transition-colors cursor-pointer"
                      >
                        <LogIn size={18} />
                        Login to Dashboard
                      </button>
                    </div>



                    {/* Info text */}
                    <p className="text-center text-xs text-slate-500 leading-relaxed">
                      By continuing, you agree to our{' '}
                      <span className="text-[#1dbf73] font-semibold cursor-pointer hover:underline">Terms of Service</span>{' '}
                      and{' '}
                      <span className="text-[#1dbf73] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE — IMAGE */}
                <div className="hidden lg:block lg:w-1/2 relative">
                  <img
                    src="https://www.f-cdn.com/assets/main/en/assets/job-post/redesign/bird.jpg"
                    alt="Colorful bird"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-10 right-10 text-right">
                    <p className="text-white text-4xl font-bold italic drop-shadow-lg">
                      make it real.
                    </p>
                    <div className="w-full h-1 bg-white mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pricing / Payment Modal if logged in */}
      <Pricing isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />

      {/* ✅ NEW FOOTER */}
      <footer className="mt-12 p-20 border-t border-slate-800/80 ">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">

          {/* Left - Copyright */}
          <p className="text-slate-400 text-xs sm:text-sm text-center sm:text-left text-nowrap">
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-slate-200">RM SMART TMS</span>. All Rights Reserved.
          </p>

          {/* Center/Right - Policy Links */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors text-nowrap underline">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors text-nowrap underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/refund" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors text-nowrap underline">
              Refund Policy
            </a>
          </div>

          {/* Right - WhatsApp Button */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row  justify-center items-center gap-2 px-2 py-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-nowrap font-bold text-xs sm:text-sm rounded-lg transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5"
            aria-label="Chat on WhatsApp"
          >
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="currentColor"

              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>

        </div>
      </footer>
    </div>
  );
}

export default Auth;