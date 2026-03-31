// components/authForm/ForgetPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../../utils/backendUrl';
import ButtonLoaders from '../loaders/ButtonLoaders';
import SuccessToster from '../toster/SuccessToster';
import { Mail, Lock, Key, ArrowLeft, X, CheckCircle, Send } from 'lucide-react';

const ForgetPassword = ({ setAuthForm }) => {
  const [step, setStep] = useState('request'); // request, reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  return (
    <div className="p-8 md:p-10">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}
      
   

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Key size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
        <p className="text-slate-400 text-sm mt-2">
          {step === 'request' ? 'Enter your email to reset password' : 'Enter the token and new password'}
        </p>
      </div>

      {step === 'request' && (
        <div className="space-y-5">
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
            <p className="text-xs text-slate-500 mt-2">
              We'll send a reset token to this email address
            </p>
          </div>

          <button
            onClick={handleRequest}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r flex flex-row justify-center items-center from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <ButtonLoaders /> : (
              <>
                <Send size={18} className="inline mr-2" />
                Send Reset Link
              </>
            )}
          </button>

          <div className="text-center pt-4">
            <button
              onClick={() => setAuthForm("login")}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={14} className="inline mr-1" />
              Back to Login
            </button>
          </div>
        </div>
      )}

      {step === 'reset' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reset Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter token from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Check your email for the reset token
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < getPasswordStrength(newPassword) ? strengthColor : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Use at least 6 characters with letters and numbers
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword && (
              <p className="text-xs text-green-400 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full flex flex-row justify-center items-center py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <ButtonLoaders /> : "Reset Password"}
          </button>

          <div className="text-center pt-4">
            <button
              onClick={() => setStep('request')}
              className="text-sm  text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={14} className="inline mr-1" />
          Back to Email Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgetPassword;