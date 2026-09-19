/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Search, FileText, BookOpen, Wallet, Car, Settings, 
  ShieldAlert, LogOut, Clock, UserCheck, RefreshCw, AlertCircle, 
  FileCheck, CheckCircle, Bell, ChevronDown, ChevronRight, 
  PiggyBank, Coins, AlertTriangle, FileSpreadsheet, Building2
} from "lucide-react";

// Core Views
import DashboardView from "./components/DashboardView.js";
import SearchView from "./components/SearchView.js";
import PreLoanView from "./components/PreLoanView.js";
import LedgerEntryView from "./components/LedgerEntryView.js";
import TransactionsView from "./components/TransactionsView.js";
import ConsultancyView from "./components/ConsultancyView.js";
import SeizedVehiclesView from "./components/SeizedVehiclesView.js";
import AccountsSettingsView from "./components/AccountsSettingsView.js";
import EmployeeSessionsView from "./components/EmployeeSessionsView.js";
import LoginView from "./components/LoginView.js";

// Financial Views
import { 
  DepositsView, 
  BindingLoanView, 
  HLPaymentView, 
  PendingListView 
} from "./components/ExtraViews.js";

type CurrentView = 
  | "dashboard" 
  | "search" 
  | "pre_loan" 
  | "ledger_entry" 
  | "transactions" 
  | "consultancy" 
  | "seized" 
  | "admin"
  | "shifts"
  | "deposits_view"
  | "binding_loan_view"
  | "hl_payment_view"
  | "pending_list_view";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<CurrentView>("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  const [dbSynced, setDbSynced] = useState(true);
  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");
  const [currentBranch, setCurrentBranch] = useState("Madurai #01");

  // Advanced Global States for XEROVA AUTO FINANCE
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Superadmin");
  const [isAdmin, setIsAdmin] = useState(true);
  const [preLoanForceCreate, setPreLoanForceCreate] = useState(false);
  const [accountsPanel, setAccountsPanel] = useState<"masters" | "notices" | "reports" | "general" | "shifts">("notices");
  const [consultancyTab, setConsultancyTab] = useState<"purchase" | "sales" | "view_sales" | "pending">("purchase");

  // Collapsible sidebar groups
  const [preLoanOpen, setPreLoanOpen] = useState(true);
  const [consultancyOpen, setConsultancyOpen] = useState(true);
  const [entryOpen, setEntryOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);

  // Authentication State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Deep Link States (for navigating across components)
  const [selectedLoanNo, setSelectedLoanNo] = useState<string | null>(null);
  const [reprintReceiptNo, setReprintReceiptNo] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const logs = await res.json();
        const importantLogs = logs.filter((log: any) => 
          log.action === "PRELOAN_SUBMITTED" || 
          log.action === "PRELOAN_STATUS_UPDATE" || 
          log.action === "CREATE_HP_LEDGER" || 
          log.action === "VEHICLE_SEIZED" || 
          log.action === "COLLECTION_RECEIPT_POSTED"
        );
        setNotifications(importantLogs);

        const lastViewedStr = localStorage.getItem("last_viewed_notification_time");
        if (lastViewedStr) {
          const lastViewed = new Date(lastViewedStr).getTime();
          const unread = importantLogs.filter((n: any) => new Date(n.timestamp).getTime() > lastViewed).length;
          setUnreadNotificationsCount(unread);
        } else {
          setUnreadNotificationsCount(importantLogs.length);
        }
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const markNotificationsAsRead = () => {
    localStorage.setItem("last_viewed_notification_time", new Date().toISOString());
    setUnreadNotificationsCount(0);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Time-ticker effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };
      setCurrentTime(now.toLocaleTimeString("en-IN", options) + " IST");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize isAdmin with the active role profile state
  useEffect(() => {
    if (userProfile) {
      const isPrivileged = userProfile.role === "Super Admin" || userProfile.role === "Owner" || userProfile.role === "Superadmin" || selectedRole === "Superadmin" || selectedRole === "Owner";
      setIsAdmin(isPrivileged);
    }
  }, [userProfile, selectedRole]);

  // Sync Master Trigger
  const handleSuccessSync = () => {
    setDbSynced(false);
    fetchNotifications();
    setTimeout(() => setDbSynced(true), 1500);
  };

  // Auth Methods
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!username || !password) return;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, loginType })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setUserProfile(data.user);
        setSessionId(data.sessionId || null);
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (err) {
      setAuthError("Network error during authentication.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, username: userProfile?.username })
      });
    } catch (e) {
      console.error("Logout report error:", e);
    }
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setSessionId(null);
    setUserProfile(null);
    setCurrentView("dashboard");
  };

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={(user, sId) => {
          setIsAuthenticated(true);
          setUserProfile(user);
          setSessionId(sId || null);
        }} 
      />
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "ST";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getNotificationConfig = (action: string, details: string) => {
    switch (action) {
      case "PRELOAN_SUBMITTED":
        return {
          title: "Pre-loan Application",
          color: "bg-blue-500",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          icon: FileText
        };
      case "PRELOAN_STATUS_UPDATE":
        const isApproved = details.includes("APPROVED");
        const isRejected = details.includes("REJECTED");
        return {
          title: isApproved ? "Loan Approved" : isRejected ? "Loan Rejected" : "Dossier Verified",
          color: isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500",
          textColor: isApproved ? "text-emerald-600" : isRejected ? "text-rose-600" : "text-amber-600",
          bgColor: isApproved ? "bg-emerald-50 border-emerald-200" : isRejected ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200",
          icon: isApproved ? CheckCircle : isRejected ? AlertCircle : UserCheck
        };
      case "CREATE_HP_LEDGER":
        return {
          title: "HP Agreement Drafted",
          color: "bg-indigo-500",
          textColor: "text-indigo-600",
          bgColor: "bg-indigo-50 border-indigo-200",
          icon: FileCheck
        };
      case "VEHICLE_SEIZED":
        return {
          title: "Vehicle Seized",
          color: "bg-rose-500",
          textColor: "text-rose-600",
          bgColor: "bg-rose-50 border-rose-200",
          icon: ShieldAlert
        };
      case "COLLECTION_RECEIPT_POSTED":
        return {
          title: "EMI Collection Posted",
          color: "bg-emerald-500",
          textColor: "text-emerald-600",
          bgColor: "bg-emerald-50 border-emerald-200",
          icon: Wallet
        };
      default:
        return {
          title: "System Alert",
          color: "bg-slate-500",
          textColor: "text-slate-600",
          bgColor: "bg-slate-50 border-slate-200",
          icon: RefreshCw
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* Dynamic Nav Sidebar Panel */}
      <aside className="w-56 h-screen bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
        <div className="p-4 border-b border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-sm">X</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-tight uppercase leading-none">XEROVA</span>
              <span className="text-[8px] text-indigo-400 font-bold tracking-wider uppercase font-mono leading-none mt-0.5">AUTO FINANCE</span>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 flex flex-col">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Active Branch</span>
            <select
              value={currentBranch}
              onChange={(e) => {
                setCurrentBranch(e.target.value);
                setDbSynced(false);
                setTimeout(() => setDbSynced(true), 1200);
              }}
              className="w-full bg-transparent border-0 text-slate-300 text-[10px] font-bold focus:outline-none cursor-pointer p-0 m-0"
            >
              <option value="Madurai #01" className="bg-slate-900 text-white">Madurai #01 (HQ)</option>
              <option value="Coimbatore #02" className="bg-slate-900 text-white">Coimbatore #02 (West)</option>
              <option value="Chennai #03" className="bg-slate-900 text-white">Chennai #03 (North)</option>
              <option value="Trichy #04" className="bg-slate-900 text-white">Trichy #04 (Central)</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {/* Main Controls */}
          <button 
            onClick={() => { setCurrentView("dashboard"); setSelectedLoanNo(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "dashboard" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Dashboard
          </button>

          <button 
            onClick={() => { setCurrentView("search"); setGlobalSearchQuery(""); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "search" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Search
          </button>

          {/* 1. Pre-Loan Process */}
          <div>
            <button 
              onClick={() => setPreLoanOpen(!preLoanOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                Pre-Loan Process
              </span>
              {preLoanOpen ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
            </button>
            {preLoanOpen && (
              <div className="pl-6 space-y-0.5 mt-0.5">
                <button 
                  onClick={() => { setCurrentView("pre_loan"); setPreLoanForceCreate(true); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "pre_loan" && preLoanForceCreate ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • Create
                </button>
                <button 
                  onClick={() => { setCurrentView("pre_loan"); setPreLoanForceCreate(false); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "pre_loan" && !preLoanForceCreate ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • View
                </button>
              </div>
            )}
          </div>

          {/* 2. Consultancy */}
          <div>
            <button 
              onClick={() => setConsultancyOpen(!consultancyOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Car className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                Consultancy
              </span>
              {consultancyOpen ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
            </button>
            {consultancyOpen && (
              <div className="pl-6 space-y-0.5 mt-0.5">
                <button 
                  onClick={() => { setCurrentView("consultancy"); setConsultancyTab("purchase"); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "consultancy" && consultancyTab === "purchase" ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • Purchase Vehicle
                </button>
                <button 
                  onClick={() => { setCurrentView("consultancy"); setConsultancyTab("sales"); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "consultancy" && consultancyTab === "sales" ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • Sales Vehicle
                </button>
                <button 
                  onClick={() => { setCurrentView("consultancy"); setConsultancyTab("view_sales"); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "consultancy" && consultancyTab === "view_sales" ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • View Sales Vehicle
                </button>
                <button 
                  onClick={() => { setCurrentView("consultancy"); setConsultancyTab("pending"); }}
                  className={`w-full text-left px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${currentView === "consultancy" && consultancyTab === "pending" ? "text-white font-bold bg-slate-800/50" : "text-slate-400 hover:text-white"}`}
                >
                  • Pending Vehicle
                </button>
              </div>
            )}
          </div>

          {/* 3. Entry */}
          <div>
            <button 
              onClick={() => setEntryOpen(!entryOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                Entry Folder
              </span>
              {entryOpen ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
            </button>
            {entryOpen && (
              <div className="pl-6 space-y-0.5 mt-0.5 border-l border-slate-800 ml-4">
                <button 
                  onClick={() => { setCurrentView("ledger_entry"); setSelectedLoanNo(null); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • HP Ledger (Create)
                </button>
                <button 
                  onClick={() => { setCurrentView("search"); setGlobalSearchQuery(""); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • HP Ledger (View)
                </button>
                <button 
                  onClick={() => { setCurrentView("ledger_entry"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Document Detail Entry
                </button>
                <button 
                  onClick={() => { setCurrentView("locator"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
                >
                  • Google Locator <span className="text-[8px] bg-indigo-600/50 text-indigo-200 px-1 rounded">Map</span>
                </button>
                <button 
                  onClick={() => { setCurrentView("transactions"); setReprintReceiptNo(null); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Receipt Create
                </button>
                <button 
                  onClick={() => { setCurrentView("transactions"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Re-Print Receipt
                </button>
                <button 
                  onClick={() => { setCurrentView("deposits_view"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Deposit
                </button>
                <button 
                  onClick={() => { setCurrentView("binding_loan_view"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Binding Loan
                </button>
                <button 
                  onClick={() => { setCurrentView("hl_payment_view"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • HL Payment & Posting
                </button>
                <button 
                  onClick={() => { setCurrentView("admin"); setAccountsPanel("reports"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Voucher
                </button>
                <button 
                  onClick={() => { setCurrentView("seized"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Seized Vehicles (Entry)
                </button>
                <button 
                  onClick={() => { setCurrentView("seized"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Seized Vehicles (Details)
                </button>
                <button 
                  onClick={() => { setCurrentView("seized"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Bad Debts-Police
                </button>
                <button 
                  onClick={() => { setCurrentView("seized"); }}
                  className="w-full text-left px-3 py-0.5 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Godown Sale
                </button>
              </div>
            )}
          </div>

          {/* Main auxiliary list */}
          <button 
            onClick={() => { setCurrentView("admin"); setAccountsPanel("masters"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "admin" && accountsPanel === "masters" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Master
          </button>

          <button 
            onClick={() => { setCurrentView("pending_list_view"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "pending_list_view" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Pending List
          </button>

          <button 
            onClick={() => { setCurrentView("admin"); setAccountsPanel("reports"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "admin" && accountsPanel === "reports" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Reports
          </button>

          <button 
            onClick={() => { setCurrentView("admin"); setAccountsPanel("general"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "admin" && accountsPanel === "general" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <Coins className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Accounts
          </button>

          <button 
            onClick={() => { setCurrentView("admin"); setAccountsPanel("notices"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "admin" && accountsPanel === "notices" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <Printer className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Notice &amp; Print's
          </button>

          {/* AI Intelligence (Privileged) */}
          {isAdmin ? (
            <button 
              onClick={() => setCurrentView("fraud")}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentView === "fraud" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <Fingerprint className="h-3.5 w-3.5 shrink-0 text-indigo-400 animate-pulse" />
              AI Fraud Intelligence
            </button>
          ) : (
            <div 
              className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-slate-600 cursor-not-allowed select-none"
              title="Admin Privilege Required"
            >
              <span className="flex items-center gap-2.5">
                <Fingerprint className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                AI Fraud Intel
              </span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded font-bold uppercase text-slate-500 font-mono">LOCK</span>
            </div>
          )}

          {/* Options Section */}
          <div>
            <button 
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Settings className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                Options
              </span>
              {optionsOpen ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
            </button>
            {optionsOpen && (
              <div className="pl-6 space-y-0.5 mt-0.5">
                <button 
                  onClick={() => { setCurrentView("admin"); setAccountsPanel("general"); }}
                  className="w-full text-left px-3 py-1 rounded text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  • Settings
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* User Profile Block */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {getInitials(userProfile?.name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-white truncate leading-tight">{userProfile?.name || "Staff Member"}</p>
              <p className="text-[9px] text-slate-500 truncate leading-none">{userProfile?.role || "Staff Operator"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
            title="Log out of Terminal"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Console Stage wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Dynamic Context Header bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 relative select-none">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-slate-600 hidden sm:flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded border border-slate-200">
              <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              {currentTime || "IST Ticker"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  const targetState = !showNotifications;
                  setShowNotifications(targetState);
                  if (targetState) {
                    markNotificationsAsRead();
                  }
                }}
                className={`p-2 rounded-lg border transition-all relative cursor-pointer flex items-center justify-center ${
                  showNotifications 
                    ? "bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm ring-2 ring-indigo-500/20" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                }`}
                title="System Activity Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Dropdown Card */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans ring-1 ring-slate-900/5">
                    <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center select-none">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-400" />
                        <span className="font-bold text-xs uppercase tracking-wider">System Activity Logs</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono font-medium">
                        {notifications.length} logs
                      </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 bg-white">
                      {notifications.map((notif: any) => {
                        const config = getNotificationConfig(notif.action, notif.details);
                        const NotificationIcon = config.icon;
                        
                        return (
                          <div key={notif.id} className="p-3.5 hover:bg-slate-50 transition-colors flex gap-3 items-start text-xs text-slate-700">
                            {/* Rich Visual Image Icon Badge */}
                            <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative bg-slate-100 shadow-xs select-none">
                              <img 
                                src={config.image} 
                                alt={config.title} 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-white p-0.5 shadow-sm ${config.color}`}>
                                <NotificationIcon className="h-2.5 w-2.5" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className={`font-bold text-[11px] uppercase tracking-wide ${config.textColor}`}>
                                  {config.title}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(notif.timestamp).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed font-medium break-words text-[11px]">
                                {notif.details}
                              </p>
                              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                                <span>Actor:</span>
                                <span className="font-bold text-slate-600">{notif.user}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {notifications.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-[11px] bg-white">
                          <Bell className="h-6 w-6 text-slate-300 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">No activity alerts in buffer.</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 text-center text-[9px] text-slate-400 font-mono select-none uppercase tracking-wider">
                      XEROVA AUTO-SENSING WORKSPACE
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-[10px] font-mono bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded flex items-center gap-1.5 font-bold uppercase">
              <RefreshCw className={`h-3 w-3 text-green-600 ${!dbSynced ? "animate-spin" : ""}`} />
              {dbSynced ? "System Online • FY 26-27" : "Syncing Buffer..."}
            </span>
            <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded font-bold hidden sm:flex items-center gap-1 uppercase">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              {userProfile?.role || "Staff"} Terminal
            </span>
          </div>
        </header>

        {/* Dynamic Display of Central Central modules */}
        <main className="flex-1 overflow-y-auto p-5 bg-slate-50 text-slate-900">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {currentView === "dashboard" && (
              <DashboardView 
                onNavigate={(tab) => {
                  if (tab === "Transactions") setCurrentView("transactions");
                  else if (tab === "Search") setCurrentView("search");
                }}
                onSetReprintNo={(no) => {
                  setReprintReceiptNo(no);
                }}
              />
            )}

            {currentView === "search" && (
              <SearchView 
                onViewLoan={(loanNo) => {
                  setSelectedLoanNo(loanNo);
                  setCurrentView("ledger_entry");
                }}
              />
            )}

            {currentView === "pre_loan" && (
              <PreLoanView onSuccess={handleSuccessSync} />
            )}

            {currentView === "ledger_entry" && (
              <LedgerEntryView 
                selectedLoanNo={selectedLoanNo}
                onSuccess={(createdLoanNo) => {
                  if (createdLoanNo) {
                    setSelectedLoanNo(createdLoanNo);
                  }
                  handleSuccessSync();
                }}
              />
            )}

            {currentView === "transactions" && (
              <TransactionsView 
                prefillReprintNo={reprintReceiptNo}
                onSuccess={() => {
                  setReprintReceiptNo(null);
                  handleSuccessSync();
                }}
              />
            )}

            {currentView === "consultancy" && (
              <ConsultancyView initialTab={consultancyTab} onTabChange={setConsultancyTab} />
            )}

            {currentView === "seized" && (
              <SeizedVehiclesView />
            )}

            {currentView === "admin" && (
              <AccountsSettingsView initialPanel={accountsPanel} />
            )}

            {currentView === "fraud" && (
              <FraudDetectionView />
            )}

            {currentView === "shifts" && (
              <EmployeeSessionsView />
            )}

            {currentView === "deposits_view" && (
              <DepositsView />
            )}

            {currentView === "binding_loan_view" && (
              <BindingLoanView />
            )}

            {currentView === "hl_payment_view" && (
              <HLPaymentView />
            )}

            {currentView === "pending_list_view" && (
              <PendingListView />
            )}

            {currentView === "locator" && (
              <GoogleLocatorView />
            )}

          </div>
        </main>

        {/* SYSTEM FOOTER */}
        <footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-600 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <span>DB Connect: <span className="text-green-600 font-bold">POSTGRES_LIVE</span></span>
            <span className="hidden sm:inline">Server Latency: <span className="font-semibold text-slate-700">12ms</span></span>
            <span className="hidden md:inline">Last Backup: <span className="font-semibold text-slate-700">14:00 Today</span></span>
          </div>
          <div className="font-mono text-slate-500">v4.8.2-PRO • ROLE-BASED STAFF SESSION</div>
        </footer>
      </div>

      {/* Embedded Floating AI Underwriter Chat Companion */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {aiChatOpen ? (
          <div className="w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[420px] transition-all">
            <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold leading-none">Ask Me</h4>
                  <p className="text-[9px] text-blue-200 leading-tight">Xerova AI Intelligent Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setAiChatOpen(false)}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[300px] text-[11px] bg-slate-950">
              {chatHistory.map((h, idx) => (
                <div key={idx} className={`max-w-[85%] rounded-lg p-2.5 ${h.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-900 text-slate-300 mr-auto"}`}>
                  <p>{h.text}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="bg-slate-900 text-slate-300 mr-auto rounded-lg p-2.5 max-w-[85%] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-ping" />
                  <span>Ask Me is thinking...</span>
                </div>
              )}
            </div>

            {/* Chat form */}
            <form onSubmit={handleSendAiMessage} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-1.5">
              <input 
                type="text"
                placeholder="Ask me anything (loans, GPS, ledgers...)"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded transition-colors">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button 
            onClick={() => setAiChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-4 rounded-full flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 duration-100"
          >
            <Bot className="h-4.5 w-4.5" />
            <span className="text-xs font-semibold">Ask Me</span>
          </button>
        )}
      </div>

    </div>
  );
}
