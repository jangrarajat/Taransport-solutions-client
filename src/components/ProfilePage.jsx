import React, { useState } from "react";
import { X, User, Building, Mail, Crown, Calendar, Edit2, Save } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../utils/backendUrl";
import ButtonLoaders from "./loaders/ButtonLoaders";
import SuccessToster from "./toster/SuccessToster";
import { refreshToken } from "../api/api";

const ProfilePage = ({ user, onClose, showNotification }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });
  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    email: user?.email || ""
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      companyName: user?.companyName || "",
      email: user?.email || ""
    });
    setIsEditing(false);
  };

  const internalShowNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${backendUrl}/user/update-profile`, formData, { withCredentials: true });
      if (res.data.success) {
        localStorage.setItem("transportUser", JSON.stringify(res.data.user));
        internalShowNotification(true, "Profile Updated Successfully! ✨");
        setIsEditing(false);
        // Update user object in parent
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return handleSave();
      }
      internalShowNotification(false, error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const getRemainingDays = () => {
    if (!user?.subscriptionEndDate) return null;
    const endDate = new Date(user.subscriptionEndDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">
            My Profile
          </h1>
          <button
            onClick={onClose}
            className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="flex justify-between items-end -mt-10 m-6 ">
              <div className="w-24 h-24 bg-gradient-to-br uppercase from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white dark:border-slate-900">
                {user?.companyName?.[0] || user?.name?.[0] || 'U'}
              </div>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2  px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-black text-xs uppercase hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <ButtonLoaders /> : <><Save size={14} /> Save</>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Personal Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <User size={18} className="text-slate-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 py-1 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="Your Name"
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{user?.name || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Building size={18} className="text-slate-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 py-1 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="Company Name"
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Company Name</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{user?.companyName || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Mail size={18} className="text-slate-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 py-1 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="Email Address"
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Email Address</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{user?.email || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subscription Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Crown size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Current Plan</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {user?.isPremium ? user?.premiumVersion || 'Premium' : 'Free Trial'}
                      </p>
                    </div>
                  </div>

                  {user?.isPremium && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Calendar size={18} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Expires On</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {formatDate(user?.subscriptionEndDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {user?.isPremium && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className={`p-1 rounded-full ${getRemainingDays() <= 7 ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <div className={`w-2 h-2 rounded-full ${getRemainingDays() <= 7 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Days Remaining</p>
                        <p className={`text-sm font-black ${getRemainingDays() <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                          {getRemainingDays()} days
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bilty Count (for free users) */}
            {!user?.isPremium && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-black uppercase">Bilty Usage</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      You have created {user?.biltyCount || 0} out of 5 free bilty entries
                    </p>
                  </div>
                  <div className="w-24 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                      style={{ width: `${((user?.biltyCount || 0) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {user?.biltyCount >= 5 && (
                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('openPricing'));
                    }}
                    className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-colors"
                  >
                    Upgrade to Continue
                  </button>
                )}
              </div>
            )}

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;