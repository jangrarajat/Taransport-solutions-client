// Auth.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Login from '../components/authForm/Login';
import Registration from '../components/authForm/Registration';
import ForgetPassword from '../components/authForm/ForgetPassword';
import { Truck, ArrowRight, LogIn, UserPlus, Shield, Zap, BarChart3, X } from 'lucide-react';

function Auth() {
  const [showLanding, setShowLanding] = useState(true);
  const [authForm, setAuthForm] = useState("option");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Helmet>
        <title>RM Smart TMS | Transport Management Software</title>
        <meta name="description" content="Professional transport management software for fleet operators. Manage trips, track revenue, and optimize operations." />
        <meta name="keywords" content="transport management, fleet management, TMS, logistics software" />
      </Helmet>

      {/* Landing Page */}
      {showLanding ? (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
          <div className="max-w-6xl w-full mx-auto">
            {/* Logo Section */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-3">
                <img
                  src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774862288/Screenshot_2026-03-29_155255_r70pha-removebg-preview_rrdxac.png"
                  alt="RM Smart TMS Logo"
                  className="h-14 w-14 object-contain"
                />
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      RM
                    </span>
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">™</span>
                  </div>
                  <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase block">
                    SMART TMS
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-blue-400 text-sm">🚛</span>
                <span className="text-xs font-medium text-blue-400">Smart Transport Solution</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Drive Your{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Business Forward
                </span>
              </h1>

              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                Complete digital solution for transport businesses. Manage trips, track revenue,
                and optimize operations all in one place.
              </p>
            </div>
            {/* CTA Buttons */}
            <div className="flex justify-center gap-4 flex-wrap fixed bottom-10 translate-x-1/2  right-1/2">
              <button
                onClick={() => setShowLanding(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
              >
                Get Started <ArrowRight size={18} />
              </button>
              <button
                onClick={() => { setShowLanding(false); setAuthForm("login"); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 md:bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
              >
                <LogIn size={18} /> Sign In
              </button>
            </div>
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: Truck, title: "Trip Management", desc: "Track and manage all trips efficiently" },
                { icon: BarChart3, title: "Revenue Analytics", desc: "Real-time insights and reports" },
                { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade security" },
                { icon: Zap, title: "Fast Operations", desc: "Streamlined workflow" }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all hover:border-blue-500/30">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Stats Section */}
            <div className="flex justify-center gap-8 md:gap-16 mb-12 flex-wrap">
              {[
                { number: "500+", label: "Transport Companies" },
                { number: "50K+", label: "Trips Completed" },
                { number: "24/7", label: "Support Available" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-400">{stat.number}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>



            {/* Trust Badges */}
            <div className="flex justify-center gap-6 mt-12 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield size={12} />
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>🔐</span>
                <span>Secure Data</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>⚡</span>
                <span>Fast Support</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Auth Forms Overlay - Centered */
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            {/* Close Button - Top Right Corner */}
            <button
              onClick={() => setShowLanding(true)}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors p-2"
            >
              <X size={28} />
            </button>

            {/* Form Container */}
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 shadow-2xl">
              {authForm === "option" ? (
                <div className="p-8 md:p-10">
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                      <img
                        src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774862288/Screenshot_2026-03-29_155255_r70pha-removebg-preview_rrdxac.png"
                        alt="RM Smart TMS"
                        className="h-20 w-20 object-contain relative z-10"
                      />
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-white text-center mb-3">
                    Welcome to RM Smart TMS
                  </h2>
                  <p className="text-slate-400 text-center text-sm mb-8">
                    Sign in to your account or create a new one to start managing your transport operations.
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={() => setAuthForm("registration")}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
                    >
                      <UserPlus size={18} className="inline mr-2" />
                      Create Free Account
                    </button>
                    <button
                      onClick={() => setAuthForm("login")}
                      className="w-full py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                    >
                      <LogIn size={18} className="inline mr-2" />
                      Sign In to Dashboard
                    </button>
                  </div>

                  <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Shield size={12} />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>🚛</span>
                      <span>Transport Focused</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>⚡</span>
                      <span>Free to Start</span>
                    </div>
                  </div>
                </div>
              ) : authForm === "login" ? (
                <Login setAuthForm={setAuthForm} setInfo={setShowLanding} />
              ) : authForm === "registration" ? (
                <Registration setAuthForm={setAuthForm} />
              ) : (
                <ForgetPassword setAuthForm={setAuthForm} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;