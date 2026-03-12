import React, { useEffect, useState, useCallback } from "react";
import {
  Truck, FileText, Fuel, BarChart3, Menu, X, CircleUserRound, ClipboardPlus,
  ChevronLeft, ChevronRight, Plus, LogOut,
  TrendingUp, Wallet, Receipt, Search, User as UserIcon, Settings, FileSpreadsheet,
  Sun, Moon, RotateCcw
} from "lucide-react";
import axios from "axios";
import { refreshToken } from "../api/api";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

// Components
import BiltyTable from "../components/BiltyTable";
import AddBiltyModal from "../components/AddBiltyModal";
import PetrolPumpTable from "../components/PetrolPumpTable";
import ExpenseTable from "../components/ExpenseTable";
import AddExpenseModal from "../components/AddExpenseModal";
import SuccessToster from "../components/toster/SuccessToster";
import Pricing from "../components/Pricing";
import FrightTable from "../components/FrightTable";

// --- Profile Edit Modal Component ---
const ProfileModal = ({ isOpen, onClose, user, showNotification }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    email: user?.email || ""
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${import.meta.env.VITE_URL}/user/update-profile`, formData, { withCredentials: true });
      if (res.data.success) {
        localStorage.setItem("transportUser", JSON.stringify(res.data.user));
        showNotification(true, "Profile Updated Successfully! ✨");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      showNotification(false, error.response?.data?.message || "Update failed");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter underline decoration-blue-500 decoration-4 dark:text-white">My Profile</h2>
          <X onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white" />
        </div>
        <div className="space-y-4 font-bold text-xs uppercase tracking-widest text-slate-900 dark:text-white">
          <div>
            <label className="text-slate-400 dark:text-slate-500">Owner Name</label>
            <input className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-slate-400 dark:text-slate-500">Company Name</label>
            <input className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
          </div>
          <div>
            <label className="text-slate-400 dark:text-slate-500">Email Address</label>
            <input className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </div>
        <button className="w-full bg-slate-900 dark:bg-black text-white py-4 rounded-2xl mt-8 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Save Changes</button>
      </form>
    </div>
  );
};

function Home() {
  const navigate = useNavigate();
  const [menuOption, setMenuOption] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

  const [biltyData, setBiltyData] = useState([]);
  const [pumpData, setPumpData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [dashData, setDashData] = useState({ totalRevenue: 0, totalTripBalance: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dashFilter, setDashFilter] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Existing state for vehicle total balance (from backend)
  const [vehicleTotalBalance, setVehicleTotalBalance] = useState(null);

  // ✅ NEW: state for opening and closing balances
  const [openingBalance, setOpeningBalance] = useState(null);
  const [closingBalance, setClosingBalance] = useState(null);

  // Helper to get current month's date range (YYYY-MM-DD)
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    return {
      start: format(firstDay),
      end: format(lastDay)
    };
  };

  const initialRange = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const user = JSON.parse(localStorage.getItem("transportUser")) || {};

  const showNotification = (success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  // Reset to current month and trigger search
  const resetToCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setCurrentPage(1);
    handleSearch(); // auto search after reset
  };

  // Date formatter for DD-MM-YYYY (used in tables)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDashboardData = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_URL}/user/dashbord?filter=${dashFilter}`, { withCredentials: true });
      if (response.data.success) setDashData(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getDashboardData();
      }
    }
  }, [dashFilter]);

  const getBilty = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_URL}/bill/get-bills?page=${page}&limit=50&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url, { withCredentials: true });
      console.log(response);
      if (response.data.success) {
        const formattedBills = response.data.bills.map(bill => ({
          ...bill,
          createdAt: formatDate(bill.createdAt),
          DateOfIssueOfInvoice: formatDate(bill.DateOfIssueOfInvoice),
          updatedAt: formatDate(bill.updatedAt)
        }));
        setBiltyData(formattedBills);
        setTotalPages(response.data.totalPage);
        setCurrentPage(response.data.page);
        // ✅ Save vehicleTotalBalance if present (from backend)
        setVehicleTotalBalance(response.data.vehicleTotalBalance || null);
        // ✅ NEW: Save opening and closing balances
        setOpeningBalance(response.data.openingBalance ?? null);
        setClosingBalance(response.data.closingBalance ?? null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getBilty(page);
      }
    } finally { setLoading(false); }
  }, [searchTerm, startDate, endDate]);

  const getPetrolPumps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_URL}/bill/get-petrolPumps?page=${page}&startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        const formattedPumps = response.data.pumpData.map(pump => ({
          ...pump,
          createdAt: formatDate(pump.createdAt),
          updatedAt: formatDate(pump.updatedAt)
        }));
        setPumpData(formattedPumps);
        setTotalPages(response.data.totalPage);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getPetrolPumps(page);
      }
    } finally { setLoading(false); }
  }, [startDate, endDate]);

  const getExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_URL}/persnol/get-expantion?page=${page}&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        const formattedExpenses = response.data.expantions.map(exp => ({
          ...exp,
          createdAt: formatDate(exp.createdAt),
          updatedAt: formatDate(exp.updatedAt),
          date: formatDate(exp.date)
        }));
        setExpenseData(formattedExpenses);
        setTotalPages(response.data.totalPage);
        setCurrentPage(response.data.page);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getExpenses(page);
      }
    } finally { setLoading(false); }
  }, [searchTerm, startDate, endDate]);

  // Handle search button click
  const handleSearch = () => {
    setCurrentPage(1); // reset to first page on new search
    if (menuOption === "biltiy" || menuOption === "accounts") {
      getBilty(1);
    } else if (menuOption === "petrolPump") {
      getPetrolPumps(1);
    } else if (menuOption === "expantion") {
      getExpenses(1);
    }
  };

  // Handle Enter key in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Load data when menu changes (with current filters)
  useEffect(() => {
    if (menuOption === "home") {
      getDashboardData();
    } else {
      handleSearch(); // use same search logic
    }
  }, [menuOption]); // only on menu change, not on filter changes

  const handleUpdatePumpPayment = async (pumpId, currentStatus) => {
    try {
      const newStatus = currentStatus === "payed" ? "unpayed" : "payed";
      const res = await axios.put(`${import.meta.env.VITE_URL}/bill/update-petrolpump-payment/${pumpId}?payment=${newStatus}`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        showNotification(true, "Payment Status Updated! ✅");
        getPetrolPumps(currentPage);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) handleUpdatePumpPayment(pumpId, currentStatus);
      }
      showNotification(false, "Update failed");
    }
  };

  return (
    <div className="flex fixed h-screen w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden uppercase font-bold text-xs">
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

      <AddBiltyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={(msg) => { getBilty(1); showNotification(true, msg); }} onError={(msg) => showNotification(false, msg)} />
      <AddExpenseModal isOpen={isExModalOpen} onClose={() => setIsExModalOpen(false)} onSuccess={(msg) => { getExpenses(1); showNotification(true, msg); }} onError={(msg) => showNotification(false, msg)} />
      <Pricing isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} showNotification={showNotification} />

      <aside className={`${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0 md:translate-x-0 md:w-20"} fixed md:relative z-50 h-full bg-slate-900 dark:bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800 dark:border-slate-900">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-800 dark:hover:bg-slate-900 rounded-lg transition-colors"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-2 tracking-widest text-[10px]">
          {[
            { name: "home", icon: <BarChart3 size={20} />, label: "Dashboard" },
            { name: "accounts", icon: <CircleUserRound size={20} />, label: "Accounts" },
            { name: "biltiy", icon: <FileText size={20} />, label: "Bilty Records" },
            { name: "expantion", icon: <Receipt size={20} />, label: "Expenses" },
            { name: "Reports", icon: <ClipboardPlus size={20} />, label: "Reports" },
            { name: "petrolPump", icon: <Fuel size={20} />, label: "Petrol Pump" },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => { setMenuOption(item.name); setCurrentPage(1); setSearchTerm(""); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${menuOption === item.name ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" : "text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900"}`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
          <button onClick={() => setIsProfileOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900 mt-10">
            <Settings size={20} /> {sidebarOpen && "Edit Profile"}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 dark:border-slate-900">
          <button onClick={() => { localStorage.clear(); navigate("/auth") }} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-400 font-bold hover:bg-red-500/10"><LogOut size={20} /> {sidebarOpen && "Logout"}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm uppercase italic">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg" onClick={() => setSidebarOpen(true)}><Menu size={20} className="dark:text-white"/></button>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter">{menuOption} Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700 dark:text-white" />}
            </button>
            <div onClick={() => setIsProfileOpen(true)} className="cursor-pointer group flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[8px] text-blue-500 dark:text-blue-400">{user?.companyName}</p>
              </div>
              <div className="w-10 h-10 bg-slate-900 dark:bg-black rounded-xl flex items-center justify-center text-white font-black group-hover:bg-blue-600 dark:group-hover:bg-blue-700 transition-colors shadow-lg">
                {user?.companyName?.[0] || <UserIcon size={18} />}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 overflow-y-auto grow bg-gray-50/50 dark:bg-slate-900">
          {menuOption === "home" && (
            <div className="space-y-8 animate-in fade-in duration-500 font-black">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl text-slate-900 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 tracking-tighter">Revenue Overview</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-6 hover:shadow-xl transition-all group">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg group-hover:scale-110 duration-300"><TrendingUp size={24} /></div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest leading-none">Total Revenue</p>
                    <h3 className="text-3xl text-slate-900 dark:text-white mt-2 tracking-tighter">₹{dashData.totalRevenue?.toLocaleString('en-IN')}</h3>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-6 hover:shadow-xl transition-all group">
                  <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg group-hover:scale-110 duration-300"><Wallet size={24} /></div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest leading-none">Trip Balance</p>
                    <h3 className="text-3xl text-slate-900 dark:text-white mt-2 tracking-tighter">₹{dashData.totalTripBalance?.toLocaleString('en-IN')}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(menuOption === "biltiy" || menuOption === "accounts") && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex flex-col xl:flex-row justify-between items-stretch gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-stretch gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search LR, Vehicle No..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-xs font-bold outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-xs font-black shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search size={16} /> Search
                    </button>
                    <button
                      onClick={resetToCurrentMonth}
                      className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                      title="Reset to current month"
                    >
                      <RotateCcw size={16} className="text-slate-700 dark:text-white" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-blue-100 dark:shadow-blue-900/50"><Plus size={18} /> New Bilty</button>
              </div>
              {menuOption === "biltiy" ? (
                <BiltyTable
                  data={biltyData}
                  loading={loading}
                  refreshData={() => getBilty(currentPage)}
                  showNotification={showNotification}
                  vehicleTotalBalance={vehicleTotalBalance}
                  // ✅ NEW: pass openingBalance and closingBalance
                  openingBalance={openingBalance}
                  closingBalance={closingBalance}
                />
              ) : (
                <FrightTable
                  data={biltyData}
                  loading={loading}
                  refreshData={() => getBilty(currentPage)}
                  showNotification={showNotification}
                  vehicleTotalBalance={vehicleTotalBalance}
                  // ✅ NEW: pass openingBalance and closingBalance
                  openingBalance={openingBalance}
                  closingBalance={closingBalance}
                />
              )}
            </div>
          )}

          {menuOption === "petrolPump" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-xs font-black shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Search size={16} /> Search
                </button>
                <button
                  onClick={resetToCurrentMonth}
                  className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  title="Reset to current month"
                >
                  <RotateCcw size={16} className="text-slate-700 dark:text-white" />
                </button>
              </div>
              <PetrolPumpTable data={pumpData} loading={loading} onUpdatePayment={handleUpdatePumpPayment} />
            </div>
          )}

          {menuOption === "expantion" && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex flex-col xl:flex-row justify-between items-stretch gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-stretch gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search by Title or Purpose..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-xs font-bold outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-xs font-black shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search size={16} /> Search
                    </button>
                    <button
                      onClick={resetToCurrentMonth}
                      className="p-2 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                      title="Reset to current month"
                    >
                      <RotateCcw size={16} className="text-slate-700 dark:text-white" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsExModalOpen(true)} className="bg-slate-900 dark:bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-xl"><Plus size={18} /> New Expense</button>
              </div>
              <ExpenseTable data={expenseData} loading={loading} filterTerm={searchTerm} />
            </div>
          )}

          {menuOption !== "home" && totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 mt-6 rounded-2xl border dark:border-slate-700 shadow-sm">
              <p className="text-[10px] p-2 uppercase text-gray-500 dark:text-slate-400 font-sans font-bold">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"><ChevronLeft size={18} className="dark:text-white"/></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"><ChevronRight size={18} className="dark:text-white"/></button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Home;