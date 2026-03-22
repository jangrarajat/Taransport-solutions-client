import React, { useState, useEffect } from 'react';
import Login from '../components/authForm/Login';
import Registration from '../components/authForm/Registration';
import ForgetPassword from '../components/authForm/ForgetPassword';

const AUTH_STYLE_ID = "auth-premium-styles";
const injectAuthStyles = () => {
  if (document.getElementById(AUTH_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = AUTH_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .auth-root {
      position: fixed; inset: 0; overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      background: #07090f;
      color: #fff;
    }

    .auth-bg {
      position: absolute; inset: 0; z-index: 0;
    }
    .auth-bg-img {
      position: absolute; inset: 0;
      background: url('https://images.pexels.com/photos/29057942/pexels-photo-29057942.jpeg') center/cover no-repeat;
      opacity: 0.18;
      filter: saturate(0.4) contrast(1.2);
    }
    .auth-bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
    }
    .auth-bg-glow-amber {
      position: absolute;
      width: 700px; height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%);
      top: -200px; right: -100px;
      pointer-events: none;
    }
    .auth-bg-glow-blue {
      position: absolute;
      width: 600px; height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(30,80,200,0.12) 0%, transparent 70%);
      bottom: -200px; left: -100px;
      pointer-events: none;
    }

    .auth-road-stripe {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        #f59e0b 0px, #f59e0b 60px,
        transparent 60px, transparent 90px
      );
      opacity: 0.5;
    }

    .auth-landing {
      position: absolute; inset: 0; z-index: 20;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 24px;
      transition: transform 0.7s cubic-bezier(0.76,0,0.24,1), opacity 0.5s ease;
    }
    .auth-landing.hidden {
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }

    .auth-landing-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(245,158,11,0.12);
      border: 1px solid rgba(245,158,11,0.3);
      border-radius: 100px;
      padding: 6px 16px;
      font-size: 11px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase;
      color: #f59e0b;
      margin-bottom: 24px;
      animation: fadeDown 0.6s 0.1s both;
    }

    .auth-landing-badge .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #f59e0b;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    .auth-hero-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(42px, 8vw, 88px);
      font-weight: 900;
      line-height: 0.92;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: -1px;
      max-width: 820px;
      animation: fadeDown 0.6s 0.2s both;
    }

    .auth-hero-title .line1 { display: block; color: #fff; }
    .auth-hero-title .line2 {
      display: block;
      -webkit-text-stroke: 2px rgba(245,158,11,0.8);
      color: transparent;
      position: relative;
    }
    .auth-hero-title .line2::after {
      content: attr(data-text);
      position: absolute; left: 0; top: 0;
      color: #f59e0b;
      clip-path: inset(0 60% 0 0);
      animation: revealText 3s 1s infinite alternate ease-in-out;
    }

    @keyframes revealText {
      0% { clip-path: inset(0 80% 0 0); }
      100% { clip-path: inset(0 0% 0 0); }
    }

    .auth-hero-sub {
      margin-top: 20px;
      font-size: clamp(13px, 2vw, 16px);
      font-weight: 300;
      color: rgba(255,255,255,0.5);
      text-align: center;
      max-width: 500px;
      line-height: 1.7;
      animation: fadeDown 0.6s 0.3s both;
    }

    .auth-features {
      display: flex; flex-wrap: wrap; gap: 10px;
      justify-content: center;
      margin-top: 32px;
      animation: fadeDown 0.6s 0.4s both;
    }

    .auth-feature-pill {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 100px;
      padding: 8px 16px;
      font-size: 12px; font-weight: 500;
      color: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      transition: all 0.3s;
    }
    .auth-feature-pill:hover {
      background: rgba(245,158,11,0.1);
      border-color: rgba(245,158,11,0.3);
      color: #f59e0b;
    }
    .auth-feature-pill .pill-icon {
      width: 20px; height: 20px; border-radius: 6px;
      background: rgba(245,158,11,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px;
    }

    .auth-cta-group {
      display: flex; gap: 12px; flex-wrap: wrap;
      justify-content: center;
      margin-top: 36px;
      animation: fadeDown 0.6s 0.5s both;
    }

    .auth-btn-primary {
      display: flex; align-items: center; gap: 9px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #07090f;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; font-weight: 700;
      padding: 13px 28px; border-radius: 10px;
      border: none; cursor: pointer;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 24px rgba(245,158,11,0.35);
      transition: all 0.25s;
    }
    .auth-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(245,158,11,0.5); }
    .auth-btn-primary:active { transform: translateY(0); }

    .auth-btn-outline {
      display: flex; align-items: center; gap: 9px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.8);
      font-family: 'DM Sans', sans-serif;
      font-size: 14px; font-weight: 600;
      padding: 13px 28px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.25s;
    }
    .auth-btn-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); }

    .auth-stats {
      display: flex; gap: 32px; flex-wrap: wrap;
      justify-content: center;
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.07);
      animation: fadeDown 0.6s 0.6s both;
    }
    .auth-stat-item { text-align: center; }
    .auth-stat-num { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 800; color: #f59e0b; line-height: 1; }
    .auth-stat-label { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.8px; }

    .auth-forms {
      position: absolute; inset: 0; z-index: 10;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }

    .auth-option-card {
      background: rgba(10,12,20,0.92);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 40px 32px;
      width: 100%; max-width: 400px;
      text-align: center;
      box-shadow: 0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.05);
      animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .auth-option-logo { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(245,158,11,0.35); font-size: 24px; }
    .auth-option-title { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; margin-bottom: 6px; }
    .auth-option-sub { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 300; margin-bottom: 28px; line-height: 1.5; }
    .auth-option-btns { display: flex; flex-direction: column; gap: 10px; }
    .auth-ob-register { height: 48px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #07090f; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(245,158,11,0.3); transition: all 0.25s; }
    .auth-ob-register:hover { box-shadow: 0 8px 28px rgba(245,158,11,0.45); transform: translateY(-1px); }
    .auth-ob-login { height: 48px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.25s; }
    .auth-ob-login:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }
    .auth-option-trust { margin-top: 20px; font-size: 11px; color: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; gap: 6px; }
    .auth-option-trust .shield { color: rgba(245,158,11,0.6); }

    .auth-scroll-form {
      width: 100%; max-height: 100vh;
      overflow-y: auto; display: flex;
      align-items: center; justify-content: center;
      padding: 16px;
      scrollbar-width: none;
    }
    .auth-scroll-form::-webkit-scrollbar { display: none; }

    .auth-truck-row {
      position: absolute; bottom: 40px; left: 0; right: 0;
      display: flex; align-items: center; gap: 0;
      pointer-events: none; overflow: hidden; height: 32px;
    }
    .auth-truck-line {
      position: absolute; bottom: 14px; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(245,158,11,0.3) 20%, rgba(245,158,11,0.3) 80%, transparent);
    }
    .auth-truck-icon {
      position: absolute; bottom: 10px;
      font-size: 22px;
      animation: truckRide 12s linear infinite;
      filter: drop-shadow(0 0 8px rgba(245,158,11,0.5));
    }
    @keyframes truckRide {
      0% { left: -60px; }
      100% { left: calc(100% + 60px); }
    }

    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
};

const FEATURES = [
  { icon: "🚛", label: "Trip Management" },
  { icon: "📊", label: "Revenue Analytics" },
  { icon: "⛽", label: "Fuel Tracking" },
  { icon: "📋", label: "Bilty Records" },
  { icon: "👨‍✈️", label: "Driver Payroll" },
  { icon: "📈", label: "Smart Reports" },
];

function Auth() {
  const [info, setInfo] = useState(true);
  const [authForm, setAuthForm] = useState("option");
  const [stylesLoaded, setStylesLoaded] = useState(false);

  useEffect(() => {
    injectAuthStyles();
    setStylesLoaded(true);
  }, []);

  if (!stylesLoaded) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>;
  }

  return (
    <div className="auth-root">
      {/* Background */}
      <div className="auth-bg">
        <div className="auth-bg-img" />
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow-amber" />
        <div className="auth-bg-glow-blue" />
        <div className="auth-road-stripe" />
      </div>

      {/* Truck animation */}
      <div className="auth-truck-row">
        <div className="auth-truck-line" />
        <span className="auth-truck-icon">🚛</span>
      </div>

      {/* Hero landing */}
      <div className={`auth-landing ${!info ? 'hidden' : ''}`}>
        <div className="auth-landing-badge">
          <span className="dot" />
          Transport Management Platform
        </div>

        <h1 className="auth-hero-title">
          <span className="line1">Drive Your</span>
          <span className="line2" data-text="Business Forward">Business Forward</span>
        </h1>

        <p className="auth-hero-sub">
          Complete digital solution for transport businesses. Manage trips, track revenue, monitor drivers and generate smart reports — all in one place.
        </p>

        <div className="auth-features">
          {FEATURES.map(f => (
            <div key={f.label} className="auth-feature-pill">
              <span className="pill-icon">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        <div className="auth-cta-group">
          <button className="auth-btn-primary" onClick={() => setInfo(false)}>
            <span>Get Started</span>
            <span>→</span>
          </button>
          <button className="auth-btn-outline" onClick={() => { setInfo(false); setAuthForm("login"); }}>
            <span>Sign In</span>
          </button>
        </div>

        <div className="auth-stats">
          {[
            { num: "500+", label: "Transport Firms" },
            { num: "50K+", label: "Trips Logged" },
            { num: "99.9%", label: "Uptime" },
            { num: "24/7", label: "Support" },
          ].map(s => (
            <div key={s.label} className="auth-stat-item">
              <div className="auth-stat-num">{s.num}</div>
              <div className="auth-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth forms */}
      <div className="auth-forms">
        <div className="auth-scroll-form">
          {authForm === "option" && !info && (
            <div className="auth-option-card">
              <div className="auth-option-logo">🚛</div>
              <div className="auth-option-title">FleetPro</div>
              <div className="auth-option-sub">
                Transport Management System<br />
                Sign in or create your account
              </div>
              <div className="auth-option-btns">
                <button className="auth-ob-register" onClick={() => setAuthForm("registration")}>
                  Create Free Account
                </button>
                <button className="auth-ob-login" onClick={() => setAuthForm("login")}>
                  Sign In to Dashboard
                </button>
              </div>
              <div className="auth-option-trust">
                <span className="shield">🛡</span>
                Secured · Encrypted · Transport Focused
              </div>
            </div>
          )}
          {authForm === "login" && <Login setAuthForm={setAuthForm} setInfo={setInfo} />}
          {authForm === "registration" && <Registration setAuthForm={setAuthForm} />}
          {authForm === "forget" && <ForgetPassword setAuthForm={setAuthForm} />}
        </div>
      </div>
    </div>
  );
}

export default Auth;