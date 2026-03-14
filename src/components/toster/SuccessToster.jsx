import React, { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";

const TOAST_STYLE_ID = "toast-premium-styles";
const injectToastStyles = () => {
  if (document.getElementById(TOAST_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = TOAST_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

    @keyframes toast-in {
      0%   { opacity: 0; transform: translateX(110%) scale(0.92); }
      60%  { transform: translateX(-6px) scale(1.01); }
      100% { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toast-out {
      0%   { opacity: 1; transform: translateX(0) scale(1); }
      100% { opacity: 0; transform: translateX(110%) scale(0.92); }
    }
    @keyframes toast-progress {
      from { width: 100%; }
      to   { width: 0%; }
    }
    @keyframes toast-icon-pop {
      0%   { transform: scale(0) rotate(-20deg); }
      60%  { transform: scale(1.2) rotate(4deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    .toast-wrap {
      position: fixed;
      top: 20px; right: 20px;
      z-index: 9999;
      font-family: 'DM Sans', sans-serif;
      pointer-events: none;
    }

    .toast-box {
      pointer-events: all;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 280px;
      max-width: 360px;
      padding: 14px 16px 16px;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      box-shadow:
        0 20px 50px rgba(0,0,0,0.18),
        0 4px 16px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .toast-box.toast-enter {
      animation: toast-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .toast-box.toast-exit {
      animation: toast-out 0.35s cubic-bezier(0.4,0,1,1) both;
    }

    /* success */
    .toast-box.success {
      background: linear-gradient(135deg, rgba(5,46,22,0.97) 0%, rgba(6,78,59,0.97) 100%);
      border: 1px solid rgba(52,211,153,0.25);
    }
    /* error */
    .toast-box.error {
      background: linear-gradient(135deg, rgba(69,10,10,0.97) 0%, rgba(127,29,29,0.97) 100%);
      border: 1px solid rgba(248,113,113,0.25);
    }

    /* icon circle */
    .toast-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      animation: toast-icon-pop 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .toast-icon.success {
      background: rgba(52,211,153,0.18);
      box-shadow: 0 0 0 1px rgba(52,211,153,0.3);
    }
    .toast-icon.error {
      background: rgba(248,113,113,0.18);
      box-shadow: 0 0 0 1px rgba(248,113,113,0.3);
    }

    /* text */
    .toast-content { flex: 1; min-width: 0; padding-top: 1px; }
    .toast-title {
      font-size: 13px; font-weight: 700;
      line-height: 1.2; margin-bottom: 3px;
    }
    .toast-title.success { color: #6ee7b7; }
    .toast-title.error   { color: #fca5a5; }

    .toast-msg {
      font-size: 12px; font-weight: 400; line-height: 1.5;
      color: rgba(255,255,255,0.65);
      word-break: break-word;
    }

    /* close btn */
    .toast-close {
      width: 22px; height: 22px; border-radius: 6px;
      background: rgba(255,255,255,0.07); border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: rgba(255,255,255,0.4);
      flex-shrink: 0; transition: all 0.18s; padding: 0;
      margin-top: -1px;
    }
    .toast-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

    /* progress bar */
    .toast-progress-track {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: rgba(255,255,255,0.06);
    }
    .toast-progress-fill {
      height: 100%; border-radius: 0 0 0 16px;
      animation: toast-progress 5s linear both;
    }
    .toast-progress-fill.success { background: linear-gradient(90deg, #34d399, #6ee7b7); }
    .toast-progress-fill.error   { background: linear-gradient(90deg, #f87171, #fca5a5); }

    /* glow blob */
    .toast-glow {
      position: absolute; width: 120px; height: 120px;
      border-radius: 50%; pointer-events: none;
      right: -30px; top: -30px; opacity: 0.1;
    }
    .toast-glow.success { background: radial-gradient(circle, #34d399, transparent); }
    .toast-glow.error   { background: radial-gradient(circle, #f87171, transparent); }
  `;
  document.head.appendChild(s);
};

function SuccessToster({ success, msg, id }) {
  const [phase, setPhase] = useState("enter"); // enter | exit | gone

  useEffect(() => {
    injectToastStyles();
    setPhase("enter");
    const exitTimer  = setTimeout(() => setPhase("exit"),  4700);
    const goneTimer  = setTimeout(() => setPhase("gone"),  5100);
    return () => { clearTimeout(exitTimer); clearTimeout(goneTimer); };
  }, [id]);

  if (phase === "gone") return null;

  const type  = success ? "success" : "error";
  const title = success ? "Success" : "Error";

  return (
    <div className="toast-wrap">
      <div className={`toast-box ${type} toast-${phase}`}>
        {/* glow blob */}
        <div className={`toast-glow ${type}`} />

        {/* icon */}
        <div className={`toast-icon ${type}`}>
          {success
            ? <Check size={18} style={{ color: "#34d399", strokeWidth: 2.5 }} />
            : <X     size={18} style={{ color: "#f87171", strokeWidth: 2.5 }} />
          }
        </div>

        {/* text */}
        <div className="toast-content">
          <div className={`toast-title ${type}`}>{title}</div>
          <div className="toast-msg">{msg}</div>
        </div>

        {/* close */}
        <button className="toast-close" onClick={() => setPhase("gone")}>
          <X size={12} />
        </button>

        {/* progress */}
        <div className="toast-progress-track">
          <div className={`toast-progress-fill ${type}`} />
        </div>
      </div>
    </div>
  );
}

export default SuccessToster;