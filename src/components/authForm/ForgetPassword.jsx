// components/authForm/ForgetPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../../utils/backendUrl';
import ButtonLoaders from '../loaders/ButtonLoaders';
import SuccessToster from '../toster/SuccessToster';
import {
  Mail, Lock, Key, ArrowLeft, CheckCircle, Send, Eye, EyeOff
} from 'lucide-react';

const ForgetPassword = ({ setAuthForm }) => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, message: '', id: 0 });

  const handleRequest = async () => {
    if (!email) {
      setToast({ show: true, success: false, message: 'Email is required', id: Date.now() });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/user/forgot-password`, { email });
      if (res.data.success) {
        setToast({ show: true, success: true, message: 'Reset link sent to your email', id: Date.now() });
        setStep('reset');
      } else {
        setToast({ show: true, success: false, message: res.data.message, id: Date.now() });
      }
    } catch (error) {
      setToast({ show: true, success: false, message: error.response?.data?.message || 'Something went wrong', id: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token || !newPassword || newPassword !== confirmPassword) {
      setToast({ show: true, success: false, message: 'Check all fields and ensure passwords match', id: Date.now() });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ show: true, success: false, message: 'Password must be at least 6 characters', id: Date.now() });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/user/reset-password`, { token, newPassword });
      if (res.data.success) {
        setToast({ show: true, success: true, message: 'Password reset successful! Please login.', id: Date.now() });
        setTimeout(() => setAuthForm('login'), 2000);
      } else {
        setToast({ show: true, success: false, message: res.data.message, id: Date.now() });
      }
    } catch (error) {
      setToast({ show: true, success: false, message: error.response?.data?.message || 'Reset failed', id: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9!@#$%^&*]/.test(pw)) score++;
    return Math.min(score, 3);
  };

  const strength = getPasswordStrength(newPassword);
  const strengthColor = strength === 0 ? 'bg-red-500' : strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : 'bg-green-500';

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
          <h2 className="text-3xl font-bold text-slate-900 mb-1">
            {step === 'request' ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {step === 'request'
              ? 'Enter your email to reset password'
              : 'Enter the token and new password'}
          </p>

          {step === 'request' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
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

              <button
                onClick={handleRequest}
                disabled={loading}
                className="w-full py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <ButtonLoaders /> : <><Send size={16} /> Send Reset Link</>}
              </button>

              <div className="text-center pt-3 border-t border-slate-200">
                <button
                  onClick={() => setAuthForm("login")}
                  className="text-sm font-medium text-[#1dbf73] hover:text-[#17a862] transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reset Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className={`${inputBase} pl-11`}
                    placeholder="Enter token from email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className={`${inputBase} pl-11 pr-12`}
                    placeholder="Create new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < getPasswordStrength(newPassword) ? strengthColor : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <CheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${inputBase} pl-11 pr-12`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full py-3.5 bg-[#1dbf73] hover:bg-[#17a862] text-white font-bold text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? <ButtonLoaders /> : "Reset Password"}
              </button>

              <div className="text-center pt-3 border-t border-slate-200">
                <button
                  onClick={() => setStep('request')}
                  className="text-sm font-medium text-[#1dbf73] hover:text-[#17a862] transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft size={14} /> Back to Email Entry
                </button>
              </div>
            </div>
          )}
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
};

export default ForgetPassword;