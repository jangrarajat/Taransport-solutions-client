// components/authForm/ForgetPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../../utils/backendUrl';
import ButtonLoaders from '../loaders/ButtonLoaders';
import SuccessToster from '../toster/SuccessToster';

const FORGET_STYLE_ID = "forget-premium-styles";
const injectForgetStyles = () => {
  if (document.getElementById(FORGET_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = FORGET_STYLE_ID;
  s.textContent = `
    .ff-card {
      background: rgba(8,10,18,0.95);
      backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 36px 32px 32px;
      width: 100%; max-width: 420px;
      box-shadow: 0 0 0 1px rgba(245,158,11,0.06), 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
      animation: lfSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      overflow: hidden;
    }
    .ff-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #f59e0b 50%, transparent);
      opacity: 0.8;
    }
    @keyframes lfSlideUp {
      from { opacity: 0; transform: translateY(32px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .ff-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
    .ff-logo { width: 46px; height: 46px; border-radius: 13px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; box-shadow: 0 6px 18px rgba(245,158,11,0.35); }
    .ff-title { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: #fff; line-height: 1; }
    .ff-subtitle { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 400; margin-top: 3px; }
    .ff-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 24px; }
    .ff-field { margin-bottom: 16px; }
    .ff-label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 7px; font-family: 'DM Sans', sans-serif; }
    .ff-input-wrap { position: relative; }
    .ff-input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 15px; opacity: 0.4; pointer-events: none; }
    .ff-input { width: 100%; height: 46px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 11px; padding: 0 14px 0 40px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
    .ff-input::placeholder { color: rgba(255,255,255,0.2); }
    .ff-input:focus { border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.04); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .ff-submit { width: 100%; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 12px; color: #07090f; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(245,158,11,0.3); transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
    .ff-submit:hover:not(:disabled) { box-shadow: 0 10px 28px rgba(245,158,11,0.45); transform: translateY(-1px); }
    .ff-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .ff-switch { text-align: center; margin-top: 18px; font-size: 13px; color: rgba(255,255,255,0.35); }
    .ff-switch-btn { background: none; border: none; cursor: pointer; color: #f59e0b; font-weight: 600; font-size: 13px; font-family: 'DM Sans', sans-serif; padding: 0; margin-left: 5px; text-decoration: underline; text-underline-offset: 3px; transition: opacity 0.2s; }
    .ff-switch-btn:hover { opacity: 0.7; }
    .ff-back-btn { position: absolute; top: 14px; right: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 14px; transition: all 0.2s; }
    .ff-back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  `;
  document.head.appendChild(s);
};

const ForgetPassword = ({ setAuthForm }) => {
  const [step, setStep] = useState('request'); // request, reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, message: '', id: 0 });

  React.useEffect(() => { injectForgetStyles(); }, []);

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
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/user/reset-password`, { token, newPassword });
      if (res.data.success) {
        setToast({ show: true, success: true, message: 'Password reset successful. Please login.', id: Date.now() });
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

  return (
    <div className="ff-card">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}
      <button className="ff-back-btn" onClick={() => setAuthForm('login')}>←</button>

      <div className="ff-header">
        <div className="ff-logo">🔐</div>
        <div>
          <div className="ff-title">Forgot Password</div>
          <div className="ff-subtitle">Reset your account password</div>
        </div>
      </div>
      <div className="ff-divider" />

      {step === 'request' && (
        <>
          <div className="ff-field">
            <label className="ff-label">Email Address</label>
            <div className="ff-input-wrap">
              <span className="ff-input-icon">✉</span>
              <input type="email" className="ff-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <button className="ff-submit" onClick={handleRequest} disabled={loading}>
            {loading ? <ButtonLoaders /> : 'Send Reset Link'}
          </button>
        </>
      )}

      {step === 'reset' && (
        <>
          <div className="ff-field">
            <label className="ff-label">Reset Token</label>
            <div className="ff-input-wrap">
              <span className="ff-input-icon">🔑</span>
              <input type="text" className="ff-input" placeholder="Enter token from email" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
          </div>
          <div className="ff-field">
            <label className="ff-label">New Password</label>
            <div className="ff-input-wrap">
              <span className="ff-input-icon">🔒</span>
              <input type="password" className="ff-input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <div className="ff-field">
            <label className="ff-label">Confirm Password</label>
            <div className="ff-input-wrap">
              <span className="ff-input-icon">✓</span>
              <input type="password" className="ff-input" placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <button className="ff-submit" onClick={handleReset} disabled={loading}>
            {loading ? <ButtonLoaders /> : 'Reset Password'}
          </button>
        </>
      )}

      <div className="ff-switch">
        Remember your password?
        <button className="ff-switch-btn" onClick={() => setAuthForm('login')}>Back to Login</button>
      </div>
    </div>
  );
};

export default ForgetPassword;