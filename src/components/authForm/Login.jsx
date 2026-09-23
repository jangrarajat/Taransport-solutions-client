// components/authForm/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { useNavigate } from "react-router-dom";
import { backendUrl } from '../../utils/backendUrl';
import { updateUserInStorage } from '../../utils/userUtils';
import { Eye, EyeOff } from 'lucide-react';

function Login({ setAuthForm, setInfo }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  const loginApi = async () => {
    if (!email || !password) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/login`,
        { email, password },
        { withCredentials: true }
      );
      const userData = response.data.responseUser;
      setUser(userData);
      updateUserInStorage(userData);
      setToast({ id: Date.now(), show: true, success: true, message: "Login Successful 🚛" });
      if (response.data.success) {
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      console.log(error.response);
      setToast({
        id: Date.now(),
        show: true,
        success: false,
        message: error.response?.data?.message || "Login failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') loginApi();
  };

  return (
    <div className="w-full h-screen flex bg-white">

      {toast.show && (
        <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />
      )}

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
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Welcome back
          </h2>

      

      

         

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-slate-300 rounded-md px-4 py-3 mb-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] transition-all"
          />

          {/* Password Input with Eye */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-slate-300 rounded-md px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] transition-all"
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

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1dbf73] focus:ring-[#1dbf73] cursor-pointer"
              />
              <span className="text-sm text-slate-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setAuthForm("forget")}
              className="text-sm font-medium text-[#1d50bf] hover:text-[#1770a8] transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            onClick={loginApi}
            disabled={loading}
            className="w-full bg-[#1d5ebf] hover:bg-[#123cbb] text-white font-bold text-sm py-3.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            {loading ? <ButtonLoaders /> : "Log in"}
          </button>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => setAuthForm("registration")}
              className="text-[#1d69bf] hover:text-[#173ba8] font-semibold"
            >
              Sign up
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

export default Login;