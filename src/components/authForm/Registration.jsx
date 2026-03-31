// components/authForm/Registration.jsx
import React, { useState, useEffect } from 'react';
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { backendUrl } from '../../utils/backendUrl';
import { Mail, Lock, User, Phone, Building, MapPin, FileText, Hash, X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

function Registration({ setAuthForm }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [headOfficeAddress, setHeadOfficeAddress] = useState("");
  const [gstinNo, setGstinNo] = useState("");
  const [sapCode, setSapCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  useEffect(() => {
    // Clean up function
    return () => {};
  }, []);

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

  return (
    <div className="p-8 md:p-10">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}
      
      

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <User size={24} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Create Account</h2>
        <p className="text-slate-400 text-sm mt-1">Join RM Smart TMS today</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800' : 'bg-slate-700 text-slate-400'}`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                {s === 1 ? 'Personal' : s === 2 ? 'Security' : s === 3 ? 'Company' : 'Tax Info'}
              </span>
            </div>
            {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-green-500' : 'bg-slate-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="tel"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={nextStep}
            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all mt-4"
          >
            Next <ArrowRight size={16} className="inline ml-1" />
          </button>
        </div>
      )}

      {/* Step 2: Security */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < strength ? strengthColor : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${strength === 0 ? 'text-red-400' : strength === 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                  Password Strength: {strengthText}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={nextStep}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Next <ArrowRight size={16} className="inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Company Details */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Company / Transport Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Sharma Transport Co."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Office Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Office Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Head Office Address
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Head Office Address"
                value={headOfficeAddress}
                onChange={(e) => setHeadOfficeAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={nextStep}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Next <ArrowRight size={16} className="inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Tax Information */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              GSTIN Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="GSTIN Number"
                value={gstinNo}
                onChange={(e) => setGstinNo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              SAP Code
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="SAP Code"
                value={sapCode}
                onChange={(e) => setSapCode(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={registrationApi}
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r flex flex-row justify-center items-center from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <ButtonLoaders /> : "Create Account"}
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-6 pt-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => setAuthForm("login")}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Registration;