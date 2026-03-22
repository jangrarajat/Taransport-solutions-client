// Home.jsx – with dashboard refresh after any operation
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Truck, FileText, Fuel, BarChart3, Menu, X, CircleUserRound, ClipboardPlus,
  ChevronLeft, ChevronRight, Plus, LogOut, Crown,
  TrendingUp, Wallet, Receipt, Search, User as UserIcon, Settings,
  RotateCcw, AlertCircle, RefreshCw, ListChecks
} from "lucide-react";
import axios from "axios";
import { refreshToken, fetchLatestUserData } from "../api/api";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../utils/backendUrl";
import { useAuth } from "../context/AuthContext";
import { getSubscriptionRemaining, updateUserInStorage } from "../utils/userUtils";

// Components
import BiltyTable from "../components/bill/BiltyTable";
import AddBiltyModal from "../components/bill/AddBiltyModal";
import ExpenseTable from "../components/ExpenseTable";
import AddExpenseModal from "../components/AddExpenseModal";
import SuccessToster from "../components/toster/SuccessToster";
import Pricing from "../components/Pricing";
import FrightTable from "../components/FrightTable";
import PumpMasterList from "../components/pump/PumpMasterList";
import PumpLedger from "../components/pump/PumpLedger";
import ReportsManager from "../components/ReportsManager";
import ButtonLoaders from "../components/loaders/ButtonLoaders";
import ProfilePage from "../components/ProfilePage";

// Skeleton Loaders
const DashboardCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="p-2 sm:p-3 bg-slate-200 dark:bg-slate-700 rounded w-10 h-10 sm:w-12 sm:h-12"></div>
      <div className="flex-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
      </div>
    </div>
  </div>
);

const TableRowSkeleton = ({ rows = 3 }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
        <td className="px-4 py-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
      </tr>
    ))}
  </>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="bg-white dark:bg-slate-800 rounded p-8 text-center border border-red-200 dark:border-red-900">
    <AlertCircle className="mx-auto mb-3 text-red-500" size={40} />
    <h3 className="text-lg font-black text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded font-black text-xs hover:bg-red-700 transition-colors"
      >
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="bg-white dark:bg-slate-800 rounded p-8 text-center border border-slate-200 dark:border-slate-700">
    <p className="text-slate-400 dark:text-slate-500 italic">{message}</p>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [menuOption, setMenuOption] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState({
    dashboard: false,
    bilty: false,
    expense: false,
    pumpSummary: false,
    stats: false
  });
  const [error, setError] = useState({
    dashboard: null,
    pumpSummary: null,
    stats: null
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, success: true, msg: "", id: 0 });

  const [biltyData, setBiltyData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [dashData, setDashData] = useState({ totalRevenue: 0, totalTripBalance: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleList, setVehicleList] = useState([]);
  const [vehicleTotalBalance, setVehicleTotalBalance] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(null);
  const [closingBalance, setClosingBalance] = useState(null);

  // Pump summary
  const [pumpSummary, setPumpSummary] = useState([]);
  const [totalPumpBalance, setTotalPumpBalance] = useState(0);

  // Vehicle & Driver stats
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [driverMonthlyPayments, setDriverMonthlyPayments] = useState([]);
  const [totalDriverPayments, setTotalDriverPayments] = useState(0);

  // New dashboard totals
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [driverPendingTotal, setDriverPendingTotal] = useState(0);

  // Pump ledger navigation
  const [selectedPump, setSelectedPump] = useState(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Subscription time remaining - real-time update
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Date helpers
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
    return { start: format(firstDay), end: format(lastDay) };
  };

  const initialRange = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  // Dashboard filter states
  const [dashFilterType, setDashFilterType] = useState("month");
  const [dashStartDate, setDashStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [dashEndDate, setDashEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  });

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Real-time countdown for subscription
  useEffect(() => {
    if (!user?.subscriptionEndDate) return;

    const updateRemaining = () => {
      const remaining = getSubscriptionRemaining(user.subscriptionEndDate);
      setTimeRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // User update events listen karein
  useEffect(() => {
    const handleUserUpdate = (event) => {
      setUser(event.detail);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [setUser]);

  // Notification & refresh dashboard when on home
  const showNotification = useCallback((success, msg) => {
    setToast({ show: true, success, msg, id: Date.now() });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);

    // If currently on home page, refresh dashboard data
    if (menuOption === "home") {
      getDashboardData(dashFilterType, dashStartDate, dashEndDate);
      fetchPumpSummary(dashStartDate, dashEndDate);
      fetchDriverMonthlyPayments(dashStartDate, dashEndDate);
      fetchExpenseTotal();
      fetchDriverPendingTotal();
    }
  }, [menuOption, dashFilterType, dashStartDate, dashEndDate]);

  const resetToCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setCurrentPage(1);
    handleSearch();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fetch vehicles for suggestions
  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master`, { withCredentials: true });
      if (res.data.success) {
        setVehicleList(res.data.vehicles);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchVehicles();
      }
      console.error("Failed to fetch vehicles", error);
    }
  };

  // Dashboard data fetch with new filter
  const getDashboardData = useCallback(async (type = dashFilterType, start = dashStartDate, end = dashEndDate) => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    setError(prev => ({ ...prev, dashboard: null }));
    try {
      let url = `${backendUrl}/api/user/dashbord?`;
      if (type === "custom") {
        url += `startDate=${start}&endDate=${end}`;
      } else {
        url += `filter=${type}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) setDashData(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return getDashboardData(type, start, end);
      }
      setError(prev => ({ ...prev, dashboard: error.response?.data?.message || "Failed to load dashboard data" }));
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [dashFilterType, dashStartDate, dashEndDate]);

  // Pump summary with date filter
  const fetchPumpSummary = useCallback(async (start, end) => {
    setLoading(prev => ({ ...prev, pumpSummary: true }));
    setError(prev => ({ ...prev, pumpSummary: null }));
    try {
      let url = `${backendUrl}/api/pump-transactions/summary`;
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setPumpSummary(res.data.summary);
        const total = res.data.summary.reduce((acc, p) => acc + p.balance, 0);
        setTotalPumpBalance(total);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchPumpSummary(start, end);
      }
      setError(prev => ({ ...prev, pumpSummary: error.response?.data?.message || "Failed to load pump summary" }));
    } finally {
      setLoading(prev => ({ ...prev, pumpSummary: false }));
    }
  }, []);

  // Vehicle & Driver stats (not date‑dependent)
  const fetchVehicleStats = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/vehicle-master/stats`, { withCredentials: true });
      if (res.data.success) setVehicleCount(res.data.count);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) fetchVehicleStats();
      }
    }
  };

  const fetchDriverStats = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/driver-master/stats`, { withCredentials: true });
      if (res.data.success) setDriverCount(res.data.count);
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) fetchDriverStats();
      }
    }
  };

  // Driver payments with date filter
  const fetchDriverMonthlyPayments = useCallback(async (start, end) => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(prev => ({ ...prev, stats: null }));
    try {
      let url = `${backendUrl}/api/driver-transactions/current-month`;
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setDriverMonthlyPayments(res.data.drivers);
        setTotalDriverPayments(res.data.totalPayments);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) return fetchDriverMonthlyPayments(start, end);
      }
      setError(prev => ({ ...prev, stats: error.response?.data?.message || "Failed to load driver payments" }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // New: fetch expense total
  const fetchExpenseTotal = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/expense-total`, { withCredentials: true });
      if (res.data.success) setExpenseTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch expense total", error);
    }
  };

  // New: fetch driver pending total
  const fetchDriverPendingTotal = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/driver-pending`, { withCredentials: true });
      if (res.data.success) setDriverPendingTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch driver pending", error);
    }
  };

  // Bilty data – with pageSize
  const getBilty = useCallback(async (page = 1, limit = pageSize) => {
    setLoading(prev => ({ ...prev, bilty: true }));
    try {
      const url = `${backendUrl}/api/bill/get-bills?page=${page}&limit=${limit}&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url, { withCredentials: true });
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
        setVehicleTotalBalance(response.data.vehicleTotalBalance || null);
        setOpeningBalance(response.data.openingBalance ?? null);
        setClosingBalance(response.data.closingBalance ?? null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getBilty(page, limit);
      }
    } finally { setLoading(prev => ({ ...prev, bilty: false })); }
  }, [searchTerm, startDate, endDate, pageSize]);

  // Expenses function – with pageSize
  const getExpenses = useCallback(async (page = 1, limit = pageSize) => {
    setLoading(prev => ({ ...prev, expense: true }));
    try {
      const url = `${backendUrl}/api/persnol/get-expantion?page=${page}&limit=${limit}&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        const formattedExpenses = response.data.expantions.map(exp => ({
          ...exp,
          createdAt: formatDate(exp.createdAt),
          updatedAt: formatDate(exp.updatedAt),
          expenseDate: formatDate(exp.expenseDate)
        }));
        setExpenseData(formattedExpenses);
        setTotalPages(response.data.totalPage);
        setCurrentPage(response.data.page);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) getExpenses(page, limit);
      }
      console.error("Error fetching expenses:", error);
    } finally { setLoading(prev => ({ ...prev, expense: false })); }
  }, [searchTerm, startDate, endDate, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    if (menuOption === "biltiy" || menuOption === "accounts") {
      getBilty(1, pageSize);
    } else if (menuOption === "expantion") {
      getExpenses(1, pageSize);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
    if (menuOption === "biltiy" || menuOption === "accounts") {
      getBilty(1, newSize);
    } else if (menuOption === "expantion") {
      getExpenses(1, newSize);
    }
  };

  // Event listener for opening pricing modal from other components
  useEffect(() => {
    const handleOpenPricing = () => setIsPricingOpen(true);
    window.addEventListener('openPricing', handleOpenPricing);
    return () => window.removeEventListener('openPricing', handleOpenPricing);
  }, []);

  // Initial data fetch based on menu option
  useEffect(() => {
    if (menuOption === "home") {
      getDashboardData(dashFilterType, dashStartDate, dashEndDate);
      fetchPumpSummary(dashStartDate, dashEndDate);
      fetchVehicleStats();
      fetchDriverStats();
      fetchDriverMonthlyPayments(dashStartDate, dashEndDate);
      fetchVehicles();
      fetchExpenseTotal();
      fetchDriverPendingTotal();
    } else if (menuOption === "biltiy" || menuOption === "accounts") {
      fetchVehicles();
      handleSearch();
    } else if (menuOption === "expantion") {
      handleSearch();
    } else if (menuOption !== "petrolPump" && menuOption !== "Reports") {
      handleSearch();
    }
  }, [menuOption]);

  // Fetch dashboard data when filter changes
  useEffect(() => {
    if (menuOption === "home") {
      getDashboardData(dashFilterType, dashStartDate, dashEndDate);
      fetchPumpSummary(dashStartDate, dashEndDate);
      fetchDriverMonthlyPayments(dashStartDate, dashEndDate);
    }
  }, [dashFilterType, dashStartDate, dashEndDate, menuOption, getDashboardData, fetchPumpSummary, fetchDriverMonthlyPayments]);

  // Determine if current search term is an exact vehicle number
  const isVehicleFilter = useMemo(() => {
    if (!searchTerm) return false;
    const trimmed = searchTerm.trim().toUpperCase();
    return vehicleList.some(v => v.vehicleNo.toUpperCase() === trimmed);
  }, [searchTerm, vehicleList]);

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // If profile page is open, show it
  if (showProfile) {
    return (
      <ProfilePage
        user={user}
        onClose={() => setShowProfile(false)}
        showNotification={showNotification}
      />
    );
  }

  return (
    <div className="flex fixed h-screen  w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden uppercase font-bold text-xs">
      {toast.show && <SuccessToster success={toast.success} msg={toast.msg} id={toast.id} />}

      <AddBiltyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={(msg) => { getBilty(1, pageSize); showNotification(true, msg); }} onError={(msg) => showNotification(false, msg)} />
      <AddExpenseModal isOpen={isExModalOpen} onClose={() => setIsExModalOpen(false)} onSuccess={(msg) => { getExpenses(1, pageSize); showNotification(true, msg); }} onError={(msg) => showNotification(false, msg)} />
      <Pricing isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed md:relative md:translate-x-0 z-50 h-full bg-white dark:bg-gray-900 text-gray-700 transition-all duration-300 flex flex-col shadow-2xl w-64`}>
        <div className="p-5 flex items-center justify-between dark:border-slate-900">
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 hover:bg-slate-800 dark:hover:bg-slate-900 rounded">
            <X size={20} />
          </button>
          <span className="text-sm font-black">MENU</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-2 tracking-widest text-[10px] overflow-y-auto">
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
              onClick={() => { setMenuOption(item.name); setCurrentPage(1); setSearchTerm(""); setSidebarOpen(false); setSelectedPump(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded transition-all ${menuOption === item.name ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40" : "text-slate-400 hover:bg-slate-700 hover:text-white dark:hover:bg-slate-900"}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={() => setShowProfile(true)} className="w-full flex items-center gap-4 p-4 rounded text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900 mt-10">
            <Settings size={20} /> <span>Edit Profile</span>
          </button>
        </nav>
        <div className="p-4 dark:border-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded text-red-400 font-bold hover:bg-red-500/10">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-3 md:px-8 shrink-0 shadow-sm uppercase italic">
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} className="dark:text-white" />
            </button>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-800 dark:text-white tracking-tighter truncate max-w-[120px] sm:max-w-[200px] md:max-w-full">
              {menuOption} Manager
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div onClick={() => setShowProfile(true)} className="cursor-pointer group flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-900 dark:text-white truncate max-w-[80px]">{user?.name}</p>
                <p className="text-[8px] text-blue-500 dark:text-blue-400 truncate max-w-[80px]">{user?.companyName}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 dark:bg-black rounded flex items-center justify-center text-white font-black group-hover:bg-blue-600 dark:group-hover:bg-blue-700 transition-colors shadow-lg">
                {user?.companyName?.[0] || <UserIcon size={14} />}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6 lg:p-10 overflow-y-auto grow bg-gray-50/50 dark:bg-slate-900">
          {menuOption === "home" && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-black pb-48">
              {/* Premium Status Banner */}
              {user?.isPremium && (
                <div className={`mb-6 p-4 rounded shadow-lg border-l-4 ${timeRemaining?.expired
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : timeRemaining?.days <= 7
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${timeRemaining?.expired
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : timeRemaining?.days <= 7
                          ? 'bg-orange-100 dark:bg-orange-900/40'
                          : 'bg-green-100 dark:bg-green-900/40'
                        }`}>
                        <Crown size={20} className={
                          timeRemaining?.expired
                            ? 'text-red-600 dark:text-red-400'
                            : timeRemaining?.days <= 7
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                        } />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          Premium {user.premiumVersion} Plan {timeRemaining?.expired ? 'Expired' : 'Active'}
                        </p>
                        {!timeRemaining?.expired && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {timeRemaining?.days > 0 && `${timeRemaining?.days} days `}
                            {timeRemaining?.hours > 0 && `${timeRemaining?.hours} hours `}
                            {timeRemaining?.days === 0 && timeRemaining?.hours === 0 &&
                              `${timeRemaining?.minutes} minutes`} remaining
                          </p>
                        )}
                      </div>
                    </div>
                    {(timeRemaining?.days <= 7 || timeRemaining?.expired) && (
                      <button
                        onClick={() => setIsPricingOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-black uppercase hover:bg-blue-700 transition-colors"
                      >
                        {timeRemaining?.expired ? 'Renew Now' : 'Extend'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dashboard Filter Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <h2 className="text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-8 tracking-tighter">
                  Dashboard
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setDashFilterType("week")}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${dashFilterType === "week" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setDashFilterType("month")}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${dashFilterType === "month" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setDashFilterType("year")}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${dashFilterType === "year" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setDashFilterType("custom")}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded transition-colors ${dashFilterType === "custom" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
                  >
                    Custom
                  </button>
                  {/* Refresh button */}
                  <button
                    onClick={() => {
                      getDashboardData(dashFilterType, dashStartDate, dashEndDate);
                      fetchPumpSummary(dashStartDate, dashEndDate);
                      fetchDriverMonthlyPayments(dashStartDate, dashEndDate);
                      fetchExpenseTotal();
                      fetchDriverPendingTotal();
                    }}
                    className="p-2 bg-gray-200 dark:bg-slate-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    title="Refresh Dashboard"
                  >
                    <RefreshCw size={14} className="text-slate-700 dark:text-white" />
                  </button>
                </div>
              </div>

              {/* Custom date range inputs */}
              {dashFilterType === "custom" && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <input
                    type="date"
                    value={dashStartDate}
                    onChange={(e) => setDashStartDate(e.target.value)}
                    className="border px-3 py-2 text-xs bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 rounded"
                  />
                  <span className="text-slate-500 dark:text-slate-400">to</span>
                  <input
                    type="date"
                    value={dashEndDate}
                    onChange={(e) => setDashEndDate(e.target.value)}
                    className="border px-3 py-2 text-xs bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 rounded"
                  />
                </div>
              )}

              {/* Dashboard Cards - 5 Cards */}
              {loading.dashboard ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                </div>
              ) : error.dashboard ? (
                <ErrorState message={error.dashboard} onRetry={() => getDashboardData(dashFilterType, dashStartDate, dashEndDate)} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Total Revenue */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{dashData.totalRevenue?.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Trip Balance */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trip Balance</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">₹{dashData.totalTripBalance?.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Total Expense */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expense</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">₹{expenseTotal.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Total Driver Pending */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Driver Pending</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">₹{driverPendingTotal.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Total Payable */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Payable</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{totalPumpBalance.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              {/* Pump Summary */}
              <div className="mt-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 underline decoration-green-500 decoration-4 underline-offset-8">
                  Petrol Pumps Payable (as of {dashEndDate})
                </h3>
                {loading.pumpSummary ? (
                  <div className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b dark:border-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Pump Name</th>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          <TableRowSkeleton rows={3} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : error.pumpSummary ? (
                  <ErrorState message={error.pumpSummary} onRetry={() => fetchPumpSummary(dashStartDate, dashEndDate)} />
                ) : pumpSummary.length === 0 ? (
                  <EmptyState message="No pumps found. Add a pump in Petrol Pump section." />
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b dark:border-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Pump Name</th>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {pumpSummary.map(pump => (
                            <tr key={pump._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-bold">{pump.name}</td>
                              <td className={`px-4 py-2 font-black text-right ${pump.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                ₹{pump.balance.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-700 border-t dark:border-slate-600 font-black">
                          <tr>
                            <td className="px-4 py-3 text-slate-800 dark:text-white uppercase">Total Payable</td>
                            <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                              ₹{totalPumpBalance.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Payments List */}
              {loading.stats ? (
                <div className="mt-6">
                  <div className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-8 text-center">
                      <ButtonLoaders />
                    </div>
                  </div>
                </div>
              ) : error.stats ? (
                <div className="mt-6">
                  <ErrorState message={error.stats} onRetry={() => fetchDriverMonthlyPayments(dashStartDate, dashEndDate)} />
                </div>
              ) : driverMonthlyPayments.length > 0 ? (
                <div className="mt-6 pb-20">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 underline decoration-blue-500 decoration-4 underline-offset-8">Driver Payments (Selected Period)</h4>
                  <div className="bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b dark:border-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase">Driver Name</th>
                            <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase text-right">Total Paid (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {driverMonthlyPayments.map(d => (
                            <tr key={d.driverId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-bold">{d.driverName}</td>
                              <td className="px-4 py-2 font-black text-right text-green-600 dark:text-green-400">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {(menuOption === "biltiy" || menuOption === "accounts") && (
            <div className="space-y-3 animate-in fade-in duration-500 pb-48">
              {/* Filter bar with vehicle suggestions */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch gap-3 bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-stretch gap-2 flex-1">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                    <input
                      type="text"
                      list="vehicleSearchList"
                      placeholder="Search LR, Vehicle..."
                      className="w-full pl-8 pr-3 py-2 border rounded text-[10px] font-bold outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <datalist id="vehicleSearchList">
                      {vehicleList.map(v => (
                        <option key={v._id} value={v.vehicleNo} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded px-2 py-2 text-[10px] font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white flex-1 min-w-[120px]"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded px-2 py-2 text-[10px] font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white flex-1 min-w-[120px]"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-1 text-[10px] font-black shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search size={12} /> Search
                    </button>
                    <button
                      onClick={resetToCurrentMonth}
                      className="p-2 bg-gray-200 dark:bg-slate-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                      title="Reset to current month"
                    >
                      <RotateCcw size={12} className="text-slate-700 dark:text-white" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-1 text-[10px] font-black shadow-lg shadow-blue-100 dark:shadow-blue-900/50 w-full sm:w-auto"
                >
                  <Plus size={14} /> New Bilty
                </button>
              </div>

              {/* Table container */}
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden rounded">
                <div className="overflow-x-auto">
                  {menuOption === "biltiy" ? (
                    <BiltyTable
                      data={biltyData}
                      loading={loading.bilty}
                      refreshData={() => getBilty(currentPage, pageSize)}
                      showNotification={showNotification}
                      vehicleTotalBalance={vehicleTotalBalance}
                      openingBalance={openingBalance}
                      closingBalance={closingBalance}
                    />
                  ) : (
                    <FrightTable
                      data={biltyData}
                      loading={loading.bilty}
                      refreshData={() => getBilty(currentPage, pageSize)}
                      showNotification={showNotification}
                      vehicleTotalBalance={vehicleTotalBalance}
                      openingBalance={openingBalance}
                      closingBalance={closingBalance}
                      vehicleList={vehicleList}
                      startDate={startDate}
                      endDate={endDate}
                      searchTerm={searchTerm}
                      isVehicleFilter={isVehicleFilter}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Petrol Pump Section */}
          {menuOption === "petrolPump" && (
            <div className="space-y-4 pb-48">
              {!selectedPump ? (
                <PumpMasterList
                  showNotification={showNotification}
                  onSelectPump={(pump) => setSelectedPump(pump)}
                  user={user}
                />
              ) : (
                <PumpLedger
                  pumpId={selectedPump._id}
                  pumpName={selectedPump.name}
                  onBack={() => setSelectedPump(null)}
                  showNotification={showNotification}
                />
              )}
            </div>
          )}

          {/* Reports Section */}
          {menuOption === "Reports" && (
            <ReportsManager showNotification={showNotification} />
          )}

          {/* Expenses Section */}
          {menuOption === "expantion" && (
            <div className="space-y-3 animate-in fade-in duration-500 pb-48">
              <div className="flex flex-col lg:flex-row justify-between items-stretch gap-3 bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-stretch gap-2 flex-1">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search by Title or Purpose..."
                      className="w-full pl-8 pr-3 py-2 border rounded text-[10px] font-bold outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded px-2 py-2 text-[10px] font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white flex-1 min-w-[120px]"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded px-2 py-2 text-[10px] font-bold bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white flex-1 min-w-[120px]"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-1 text-[10px] font-black shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search size={12} /> Search
                    </button>
                    <button
                      onClick={resetToCurrentMonth}
                      className="p-2 bg-gray-200 dark:bg-slate-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                      title="Reset to current month"
                    >
                      <RotateCcw size={12} className="text-slate-700 dark:text-white" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsExModalOpen(true)}
                  className="bg-slate-900 dark:bg-black text-white px-4 py-2 rounded flex items-center justify-center gap-1 text-[10px] font-black shadow-xl w-full sm:w-auto"
                >
                  <Plus size={14} /> New Expense
                </button>
              </div>
              <div className="overflow-x-auto">
                <ExpenseTable
                  data={expenseData}
                  loading={loading.expense}
                  filterTerm={searchTerm}
                  refreshData={() => getExpenses(currentPage, pageSize)}
                />
              </div>
            </div>
          )}

          {/* Pagination footer with page size selector */}
          {menuOption !== "home" && menuOption !== "petrolPump" && menuOption !== "Reports" && totalPages > 1 && (
            <div className="flex items-center pb-48 justify-between bg-white dark:bg-slate-800 px-4 py-3 mt-4 rounded border dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4">
                <p className="text-[8px] uppercase text-gray-500 dark:text-slate-400 font-sans font-bold">
                  Page {currentPage} of {totalPages}
                </p>
                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <ListChecks size={12} className="text-slate-500 dark:text-slate-400" />
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="border rounded px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    if (menuOption === "biltiy" || menuOption === "accounts") {
                      getBilty(newPage, pageSize);
                    } else if (menuOption === "expantion") {
                      getExpenses(newPage, pageSize);
                    }
                  }}
                  className="p-1 border border-gray-300 dark:border-slate-600 rounded disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft size={14} className="dark:text-white" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    if (menuOption === "biltiy" || menuOption === "accounts") {
                      getBilty(newPage, pageSize);
                    } else if (menuOption === "expantion") {
                      getExpenses(newPage, pageSize);
                    }
                  }}
                  className="p-1 border border-gray-300 dark:border-slate-600 rounded disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight size={14} className="dark:text-white" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Home;