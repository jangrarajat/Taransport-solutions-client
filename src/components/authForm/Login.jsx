// components/authForm/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { useNavigate } from "react-router-dom";
import { backendUrl } from '../../utils/backendUrl';
import { updateUserInStorage } from '../../utils/userUtils';
import { Mail, Lock, X, LogIn } from 'lucide-react';

function Login({ setAuthForm, setInfo }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

  const loginApi = async () => {
    if (!email || !password) {
      setToast({ id: Date.now(), show: true, success: false, message: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/user/login`, { email, password }, { withCredentials: true });
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
    <div className="p-8 md:p-10">
      {toast.show && <SuccessToster key={toast.id} success={toast.success} msg={toast.message} />}
      
     

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🚛</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
        <p className="text-slate-400 text-sm mt-2">Sign in to your account</p>
      </div>

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
              onKeyDown={handleKeyDown}
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={() => setAuthForm("forget")}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <button
          onClick={loginApi}
          disabled={loading}
          className="w-full py-3.5 flex flex-row justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <ButtonLoaders /> : "Sign In"}
        </button>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => setAuthForm("registration")}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Register Free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;