// components/authForm/Registration.jsx
import React, { useState, useEffect } from 'react'
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { backendUrl } from '../../utils/backendUrl';

/* ─── Inject styles ──────────────────────────────────────────── */
const REG_STYLE_ID = "reg-premium-styles";
const injectRegStyles = () => {
  if (document.getElementById(REG_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = REG_STYLE_ID;
  s.textContent = `
    .rf-card {
      background: rgba(8,10,18,0.95);
      backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 32px 32px 28px;
      width: 100%; max-width: 460px;
      box-shadow:
        0 0 0 1px rgba(245,158,11,0.06),
        0 32px 80px rgba(0,0,0,0.7),
        inset 0 1px 0 rgba(255,255,255,0.05);
      animation: rfSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      overflow: hidden;
    }

    .rf-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #f59e0b 50%, transparent);
      opacity: 0.8;
    }

    @keyframes rfSlideUp {
      from { opacity: 0; transform: translateY(32px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .rf-header {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 24px;
    }

    .rf-logo {
      width: 46px; height: 46px; border-radius: 13px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
      box-shadow: 0 6px 18px rgba(245,158,11,0.35);
    }

    .rf-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 26px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.3px;
      color: #fff; line-height: 1;
    }

    .rf-subtitle {
      font-size: 12px; color: rgba(255,255,255,0.35);
      font-weight: 400; margin-top: 3px;
    }

    .rf-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 20px;
    }

    /* ── Steps indicator ── */
    .rf-steps {
      display: flex; align-items: center; gap: 0;
      margin-bottom: 24px;
    }

    .rf-step {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; gap: 5px; position: relative;
    }

    .rf-step-dot {
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.3s;
      border: 2px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.3);
      z-index: 1;
    }

    .rf-step.active .rf-step-dot {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-color: #f59e0b;
      color: #07090f;
      box-shadow: 0 0 12px rgba(245,158,11,0.4);
    }

    .rf-step.done .rf-step-dot {
      background: rgba(245,158,11,0.15);
      border-color: rgba(245,158,11,0.4);
      color: #f59e0b;
    }

    .rf-step-label {
      font-size: 9px; text-transform: uppercase;
      letter-spacing: 0.5px; color: rgba(255,255,255,0.2);
      white-space: nowrap;
    }

    .rf-step.active .rf-step-label { color: #f59e0b; }
    .rf-step.done .rf-step-label { color: rgba(245,158,11,0.5); }

    .rf-step-line {
      flex: 1; height: 1px; margin-bottom: 16px;
      background: rgba(255,255,255,0.06);
      transition: background 0.3s;
    }

    .rf-step-line.done { background: rgba(245,158,11,0.3); }

    /* ── Fields ── */
    .rf-fields { display: flex; flex-direction: column; gap: 13px; }

    .rf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 420px) { .rf-row { grid-template-columns: 1fr; } }

    .rf-field { display: flex; flex-direction: column; gap: 6px; }

    .rf-label {
      font-size: 10px; font-weight: 600;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.8px; text-transform: uppercase;
      font-family: 'DM Sans', sans-serif;
    }

    .rf-input-wrap { position: relative; }

    .rf-input-icon {
      position: absolute; left: 12px; top: 50%;
      transform: translateY(-50%);
      font-size: 14px; opacity: 0.35;
      pointer-events: none;
    }

    .rf-input {
      width: 100%; height: 44px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 0 13px 0 38px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      color: #fff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .rf-input::placeholder { color: rgba(255,255,255,0.18); }

    .rf-input:focus {
      border-color: rgba(245,158,11,0.5);
      background: rgba(245,158,11,0.04);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.08);
    }

    .rf-input.valid {
      border-color: rgba(16,185,129,0.4);
    }

    /* ── Navigation buttons ── */
    .rf-nav { display: flex; gap: 10px; margin-top: 20px; }

    .rf-btn-back {
      height: 48px; flex: 0 0 48px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: rgba(255,255,255,0.6);
      font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }

    .rf-btn-back:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    .rf-btn-next {
      flex: 1; height: 48px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none; border-radius: 12px;
      color: #07090f;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.3px;
      box-shadow: 0 6px 20px rgba(245,158,11,0.3);
      transition: all 0.25s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    .rf-btn-next:hover:not(:disabled) {
      box-shadow: 0 10px 28px rgba(245,158,11,0.45);
      transform: translateY(-1px);
    }

    .rf-btn-next:disabled { opacity: 0.7; cursor: not-allowed; }

    .rf-btn-submit {
      flex: 1; height: 48px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none; border-radius: 12px;
      color: #07090f;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(245,158,11,0.3);
      transition: all 0.25s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    .rf-btn-submit:hover:not(:disabled) {
      box-shadow: 0 10px 28px rgba(245,158,11,0.45);
      transform: translateY(-1px);
    }

    .rf-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    .rf-switch {
      text-align: center; margin-top: 16px;
      font-size: 13px; color: rgba(255,255,255,0.3);
    }

    .rf-switch-btn {
      background: none; border: none; cursor: pointer;
      color: #f59e0b; font-weight: 600; font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      padding: 0; margin-left: 5px;
      text-decoration: underline; text-underline-offset: 3px;
      transition: opacity 0.2s;
    }

    .rf-switch-btn:hover { opacity: 0.7; }

    .rf-trust {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; margin-top: 16px; padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .rf-trust-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: rgba(255,255,255,0.2);
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .rf-back-btn {
      position: absolute; top: 14px; right: 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: rgba(255,255,255,0.4);
      font-size: 14px; transition: all 0.2s;
    }

    .rf-back-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    /* password strength */
    .rf-strength {
      margin-top: 4px;
      display: flex; gap: 4px;
    }

    .rf-strength-bar {
      flex: 1; height: 3px; border-radius: 10px;
      background: rgba(255,255,255,0.07);
      transition: background 0.3s;
    }

    .rf-strength-bar.filled-weak { background: #f43f5e; }
    .rf-strength-bar.filled-medium { background: #f59e0b; }
    .rf-strength-bar.filled-strong { background: #10b981; }
  `;
  document.head.appendChild(s);
};

/* ── Password strength helper ── */
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9!@#$%^&*]/.test(pw)) score++;
  return Math.min(score, 3);
};

const getStrengthClass = (i, strength) => {
  if (i >= strength) return '';
  if (strength === 1) return 'filled-weak';
  if (strength === 2) return 'filled-medium';
  return 'filled-strong';
};

function Registration({ setAuthForm }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  useEffect(() => { injectRegStyles(); }, []);

  const strength = getStrength(password);

  const registrationApi = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/user/registration`, { name, number, email, password, companyName });
      setToast({ id: Date.now(), show: true, success: true, message: "Registration Successful 🚛" });
      if (response.data.success) {
        setTimeout(() => setAuthForm("login"), 3000);
      }
    } catch (error) {
      setToast({ id: Date.now(), show: true, success: false, message: error.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const stepStatus = (s) => {
    if (s < step) return 'done';
    if (s === step) return 'active';
    return '';
  };

  return (
    <>
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}
      <div className="rf-card">
        {/* Close */}
        <button className="rf-back-btn" onClick={() => setAuthForm("option")}>✕</button>

        {/* Header */}
        <div className="rf-header">
          <div className="rf-logo">🚛</div>
          <div>
            <div className="rf-title">Create Account</div>
            <div className="rf-subtitle">FleetPro Transport Management</div>
          </div>
        </div>
        <div className="rf-divider" />

        {/* Steps */}
        <div className="rf-steps">
          <div className={`rf-step ${stepStatus(1)}`}>
            <div className="rf-step-dot">{step > 1 ? '✓' : '1'}</div>
            <div className="rf-step-label">Personal</div>
          </div>
          <div className={`rf-step-line ${step > 1 ? 'done' : ''}`} />
          <div className={`rf-step ${stepStatus(2)}`}>
            <div className="rf-step-dot">{step > 2 ? '✓' : '2'}</div>
            <div className="rf-step-label">Security</div>
          </div>
          <div className={`rf-step-line ${step > 2 ? 'done' : ''}`} />
          <div className={`rf-step ${stepStatus(3)}`}>
            <div className="rf-step-dot">3</div>
            <div className="rf-step-label">Company</div>
          </div>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="rf-fields">
            <div className="rf-row">
              <div className="rf-field">
                <label className="rf-label">Full Name</label>
                <div className="rf-input-wrap">
                  <span className="rf-input-icon">👤</span>
                  <input
                    type="text"
                    className={`rf-input ${name ? 'valid' : ''}`}
                    placeholder="Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="rf-field">
                <label className="rf-label">Phone Number</label>
                <div className="rf-input-wrap">
                  <span className="rf-input-icon">📱</span>
                  <input
                    type="text"
                    className={`rf-input ${number ? 'valid' : ''}`}
                    placeholder="98XXXXXXXX"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="rf-nav">
              <button
                className="rf-btn-next"
                onClick={() => {
                  if (!name || !number) {
                    setToast({ id: Date.now(), show: true, success: false, message: "Please fill name and number" });
                    return;
                  }
                  setStep(2);
                }}
              >
                Next <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Security */}
        {step === 2 && (
          <div className="rf-fields">
            <div className="rf-field">
              <label className="rf-label">Email Address</label>
              <div className="rf-input-wrap">
                <span className="rf-input-icon">✉</span>
                <input
                  type="email"
                  className={`rf-input ${email ? 'valid' : ''}`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="rf-field">
              <label className="rf-label">Password</label>
              <div className="rf-input-wrap">
                <span className="rf-input-icon">🔒</span>
                <input
                  type="password"
                  className={`rf-input ${password ? 'valid' : ''}`}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {password && (
                <div className="rf-strength">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`rf-strength-bar ${getStrengthClass(i, strength)}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="rf-nav">
              <button className="rf-btn-back" onClick={() => setStep(1)}>←</button>
              <button
                className="rf-btn-next"
                onClick={() => {
                  if (!email || !password) {
                    setToast({ id: Date.now(), show: true, success: false, message: "Please fill email and password" });
                    return;
                  }
                  setStep(3);
                }}
              >
                Next <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Company */}
        {step === 3 && (
          <div className="rf-fields">
            <div className="rf-field">
              <label className="rf-label">Company / Transport Name</label>
              <div className="rf-input-wrap">
                <span className="rf-input-icon">🏢</span>
                <input
                  type="text"
                  className={`rf-input ${companyName ? 'valid' : ''}`}
                  placeholder="e.g. Sharma Transport Co."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
            {/* Summary */}
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 12, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8
            }}>
              <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Account Summary</div>
              <div>👤 {name} · {number}</div>
              <div>✉ {email}</div>
            </div>
            <div className="rf-nav">
              <button className="rf-btn-back" onClick={() => setStep(2)}>←</button>
              <button
                className="rf-btn-submit"
                onClick={() => {
                  if (!companyName) {
                    setToast({ id: Date.now(), show: true, success: false, message: "Please enter company name" });
                    return;
                  }
                  registrationApi();
                }}
                disabled={loading}
              >
                {loading ? <ButtonLoaders /> : <><span>Create Account</span><span>🚀</span></>}
              </button>
            </div>
          </div>
        )}

        <div className="rf-switch">
          Already have an account?
          <button className="rf-switch-btn" onClick={() => setAuthForm("login")}>Sign In</button>
        </div>

        <div className="rf-trust">
          <div className="rf-trust-item"><span>🛡</span> Secure</div>
          <div className="rf-trust-item"><span>🚛</span> Transport Focus</div>
          <div className="rf-trust-item"><span>⚡</span> Free to Start</div>
        </div>
      </div>
    </>
  );
}

export default Registration;