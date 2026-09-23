// components/authForm/Registration.jsx
import React, { useState } from 'react';
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { backendUrl } from '../../utils/backendUrl';
import {
  Mail, Lock, User, Phone, Building, MapPin, FileText, Hash,
  ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff
} from 'lucide-react';

function Registration({ setAuthForm }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [headOfficeAddress, setHeadOfficeAddress] = useState("");
  const [gstinNo, setGstinNo] = useState("");
  const [sapCode, setSapCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9!@#$%^&*]/.test(pw)) score++;
    return Math.min(score, 3);
  };

  const strength = getStrength(password);
  const strengthText = strength === 0 ? 'Weak' : strength === 1 ? 'Weak' : strength === 2 ? 'Medium' : 'Strong';
  const strengthColor = strength === 0 ? 'bg-red-500' : strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : 'bg-green-500';

  const registrationApi = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/user/registration`, {
        name, number, email, password, companyName, address, headOfficeAddress, gstinNo, sapCode
      });
      setToast({ id: Date.now(), show: true, success: true, message: "Registration Successful! Please login 🚛" });
      if (response.data.success) {
        setTimeout(() => setAuthForm("login"), 2000);
      }
    } catch (error) {
      setToast({ id: Date.now(), show: true, success: false, message: error.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!name || !number)) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill name and phone number" });
      return;
    }
    if (step === 2 && (!email || !password)) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill email and password" });
      return;
    }
    if (step === 3 && !companyName) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill company name" });
      return;
    }
    setStep(step + 1);
  };

  const inputBase =
    "w-full border border-slate-300 rounded-md px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] transition-all";

  return (
    <div className="w-full h-screen flex bg-white">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}

      {/* LEFT SIDE — FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">

        {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
           <img src="https://res.cloudinary.com/dfqsa6hoc/image/upload/v1774862288/Screenshot_2026-03-29_155255_r70pha-removebg-preview_rrdxac.png" alt="logo"  className='h-10'/>
            <span className="text-2xl font-black text-slate-900 italic tracking-tight">
              RM SMART TMS<span className="text-[#1dbf73]">.</span>
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Create Account</h2>
          <p className="text-sm text-slate-500 mb-6">Join RM Smart TMS today</p>

          {/* Steps Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all
                    ${step > s ? 'bg-[#1dbf73] text-white' : step === s ? 'bg-[#1dbf73] text-white ring-2 ring-[#1dbf73]/30' : 'bg-slate-200 text-slate-500'}`}>
                    {step > s ? <CheckCircle size={14} /> : s}
                  </div>
                  <span className="text-[9px] font-medium text-slate-500 mt-1">
                    {s === 1 ? 'Personal' : s === 2 ? 'Security' : s === 3 ? 'Company' : 'Tax'}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 mx-1.5 ${step > s ? 'bg-[#1dbf73]' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    className={`${inputBase} pl-11`}
                    placeholder="Phone Number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={nextStep}
                className="w-full py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Security */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    className={`${inputBase} pl-11`}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputBase} pl-11 pr-12`}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < strength ? strengthColor : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Strength: {strengthText}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Company Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="Transport Co."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="Office Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Head Office Address</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="Head Office"
                    value={headOfficeAddress}
                    onChange={(e) => setHeadOfficeAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Tax Information */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GSTIN Number</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="GSTIN Number"
                    value={gstinNo}
                    onChange={(e) => setGstinNo(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SAP Code</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="SAP Code"
                    value={sapCode}
                    onChange={(e) => setSapCode(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={registrationApi}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center"
                >
                  {loading ? <ButtonLoaders /> : "Create Account"}
                </button>
              </div>
            </div>
          )}

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-600 mt-6 pt-4 border-t border-slate-200">
            Already have an account?{' '}
            <button
              onClick={() => setAuthForm("login")}
              className="text-[#1dbf73] hover:text-[#17a862] font-semibold"
            >
              Sign In
            </button>
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
  );
}

export default Registration;