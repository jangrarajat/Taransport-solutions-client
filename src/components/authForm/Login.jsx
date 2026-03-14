// components/authForm/Login.jsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { useNavigate } from "react-router-dom";
import { backendUrl } from '../../utils/backendUrl';
import { updateUserInStorage } from '../../utils/userUtils';

/* ─── Inject styles ──────────────────────────────────────────── */
const LOGIN_STYLE_ID = "login-premium-styles";
const injectLoginStyles = () => {
  if (document.getElementById(LOGIN_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = LOGIN_STYLE_ID;
  s.textContent = `
    .lf-card {
      background: rgba(8,10,18,0.95);
      backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 36px 32px 32px;
      width: 100%; max-width: 420px;
      box-shadow:
        0 0 0 1px rgba(245,158,11,0.06),
        0 32px 80px rgba(0,0,0,0.7),
        inset 0 1px 0 rgba(255,255,255,0.05);
      animation: lfSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      overflow: hidden;
    }

    .lf-card::before {
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

    .lf-header {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 28px;
    }

    .lf-logo {
      width: 46px; height: 46px; border-radius: 13px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
      box-shadow: 0 6px 18px rgba(245,158,11,0.35);
    }

    .lf-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 26px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.3px;
      color: #fff; line-height: 1;
    }

    .lf-subtitle {
      font-size: 12px; color: rgba(255,255,255,0.35);
      font-weight: 400; margin-top: 3px;
    }

    .lf-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 24px;
    }

    .lf-field { margin-bottom: 16px; }

    .lf-label {
      display: block;
      font-size: 11px; font-weight: 600;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.8px; text-transform: uppercase;
      margin-bottom: 7px;
      font-family: 'DM Sans', sans-serif;
    }

    .lf-input-wrap { position: relative; }

    .lf-input-icon {
      position: absolute; left: 13px; top: 50%;
      transform: translateY(-50%);
      font-size: 15px; opacity: 0.4;
      pointer-events: none;
    }

    .lf-input {
      width: 100%; height: 46px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 11px;
      padding: 0 14px 0 40px;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      color: #fff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .lf-input::placeholder { color: rgba(255,255,255,0.2); }

    .lf-input:focus {
      border-color: rgba(245,158,11,0.5);
      background: rgba(245,158,11,0.04);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
    }

    .lf-submit {
      width: 100%; height: 50px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none; border-radius: 12px;
      color: #07090f;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.3px;
      box-shadow: 0 6px 20px rgba(245,158,11,0.3);
      transition: all 0.25s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 8px;
    }

    .lf-submit:hover:not(:disabled) {
      box-shadow: 0 10px 28px rgba(245,158,11,0.45);
      transform: translateY(-1px);
    }

    .lf-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    .lf-switch {
      text-align: center; margin-top: 18px;
      font-size: 13px; color: rgba(255,255,255,0.35);
    }

    .lf-switch-btn {
      background: none; border: none; cursor: pointer;
      color: #f59e0b; font-weight: 600; font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      padding: 0; margin-left: 5px;
      text-decoration: underline; text-underline-offset: 3px;
      transition: opacity 0.2s;
    }

    .lf-switch-btn:hover { opacity: 0.7; }

    .lf-trust {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; margin-top: 20px; padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .lf-trust-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: rgba(255,255,255,0.2);
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .lf-back-btn {
      position: absolute; top: 14px; right: 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: rgba(255,255,255,0.4);
      font-size: 14px; transition: all 0.2s;
    }

    .lf-back-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }
  `;
  document.head.appendChild(s);
};

function Login({ setAuthForm, setInfo }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  React.useEffect(() => { injectLoginStyles(); }, []);

  const loginApi = async () => {
    if (!email || !password) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/user/login`, { email, password }, { withCredentials: true });
      const userData = response.data.responseUser;
      setUser(userData);
      updateUserInStorage(userData);
      setToast({ id: Date.now(), show: true, success: true, message: "Login Successful 🚛" });
      if (response.data.success) {
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      setToast({ id: Date.now(), show: true, success: false, message: error.response?.data?.message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') loginApi(); };

  return (
    <div className="lf-card">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}

      {/* Back button */}
      <button className="lf-back-btn" onClick={() => setAuthForm("option")}>✕</button>

      {/* Header */}
      <div className="lf-header">
        <div className="lf-logo">🚛</div>
        <div>
          <div className="lf-title">Welcome Back</div>
          <div className="lf-subtitle">FleetPro Transport Management</div>
        </div>
      </div>
      <div className="lf-divider" />

      {/* Fields */}
      <div className="lf-field">
        <label className="lf-label">Email Address</label>
        <div className="lf-input-wrap">
          <span className="lf-input-icon">✉</span>
          <input
            type="email"
            className="lf-input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <div className="lf-field">
        <label className="lf-label">Password</label>
        <div className="lf-input-wrap">
          <span className="lf-input-icon">🔒</span>
          <input
            type="password"
            className="lf-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <button className="lf-submit" onClick={loginApi} disabled={loading}>
        {loading ? <ButtonLoaders /> : <><span>Sign In to Dashboard</span><span>→</span></>}
      </button>

      <div className="lf-switch">
        Don't have an account?
        <button className="lf-switch-btn" onClick={() => setAuthForm("registration")}>Register Free</button>
      </div>

      <div className="lf-trust">
        <div className="lf-trust-item"><span>🛡</span> Secure</div>
        <div className="lf-trust-item"><span>🔐</span> Encrypted</div>
        <div className="lf-trust-item"><span>⚡</span> Instant Access</div>
      </div>
    </div>
  );
}

export default Login;