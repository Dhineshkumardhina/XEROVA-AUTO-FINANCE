/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, 
  Shield, Briefcase, Fingerprint, Terminal, HelpCircle, Check, Sparkles,
  ShieldCheck
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: any, sessionId: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);

  // Auto-fill trigger with instant animation
  const handleQuickCredentialFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setAuthError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!username || !password) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, loginType })
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText.length < 200 ? rawText : `Server error (HTTP ${res.status}: ${res.statusText})` };
      }
      if (res.ok && data.success) {
        setTimeout(() => {
          onLoginSuccess(data.user, data.sessionId || "");
          setIsLoading(false);
        }, 600);
      } else {
        setAuthError(data.error || "Authentication failed. Invalid security credentials.");
        setShake(true);
        setIsLoading(false);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      setAuthError(err.message || "Network communication error with underwriter node.");
      setShake(true);
      setIsLoading(false);
      setTimeout(() => setShake(false), 500);
    }
  };

  // Demo Credentials
  const demoAdmins = [
    { u: "admin", p: "admin123", label: "Super Admin", desc: "Full control over HP Ledgers, audit logs & branch operations" },
    { u: "owner", p: "owner123", label: "Owner Portal", desc: "Corporate management and core executive summaries" },
  ];

  const demoEmployees = [
    { u: "manager", p: "manager123", label: "Manager", desc: "Pre-loan and collections tracking, RTO paperwork" },
    { u: "cashier", p: "cashier123", label: "Cashier Desk", desc: "Post collection receipts, clear ledger transactions" },
    { u: "recovery", p: "recovery123", label: "Recovery Team", desc: "Manage yard stock, register repossessions" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans select-none text-slate-800">
      
      {/* 1. SOLID CLEAN BACKGROUND WITH LEGIBLY VISIBLE LOGO WATERMARK */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
        {/* Crisp, Sharp, Non-Blurry Background Logo */}
        <div className="w-[85vw] max-w-[850px] h-[85vw] max-h-[850px] relative flex items-center justify-center opacity-90">
          <img 
            src="/logo-bg.jpg" 
            alt="Xerova Background Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* 2. Clean Subtle Dotted Grid Pattern for FinTech Structure */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.2] select-none bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* 3. Top Operational Security Bar (Solid, no gradients) */}
      <div className="absolute top-6 left-6 right-6 hidden md:flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-xs text-[#0084a9] font-mono font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SYS-STATUS: ONLINE / ENCRYPTED</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-[#002855]" />
            <span>RSA-4096 TLS 1.3</span>
          </span>
          <span className="px-2.5 py-1 rounded bg-white/80 border border-slate-200 text-slate-700 font-bold shadow-xs">
            SEC-ID: XER-8840
          </span>
        </div>
      </div>

      {/* 4. CENTRAL TRANSLUCENT GLASS LOGIN CARD (Solid colors, no gradient themes) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: 0,
          x: shake ? [-12, 12, -12, 12, 0] : 0,
        }}
        transition={{ 
          type: "spring",
          stiffness: 140,
          damping: 20,
          x: { duration: 0.4 },
        }}
        className="w-full max-w-md bg-white/75 backdrop-blur-xl border border-white text-slate-900 rounded-3xl p-7 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,40,85,0.12),0_0_1px_1px_rgba(255,255,255,0.8)_inset] relative z-10 flex flex-col gap-6"
      >
        {/* Solid Navy Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#002855] rounded-t-3xl" />

        {/* Header Section with Super Legible Brand Logo */}
        <div className="text-center space-y-3 relative z-10 pt-2">
          <div className="inline-block relative">
            {/* Crisp High-Clarity Logo Display */}
            <div className="relative h-20 bg-white rounded-2xl px-5 py-2 shadow-sm border border-slate-200/80 flex items-center justify-center mx-auto">
              <img 
                src="/logo-bg.jpg" 
                alt="Xerova Brand Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
          
          <div className="pt-1">
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-[#002855] font-mono font-extrabold tracking-widest px-3.5 py-1 rounded-full uppercase shadow-2xs">
              Automated Underwriting Gateway
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#002855] uppercase font-sans">
              Xerova Auto Finance
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed font-medium">
              Enterprise ERP & vehicle finance ledger management. Authorized personnel access only.
            </p>
          </div>
        </div>

        {/* Tab Selector - Solid Translucent Glass Style (No Gradients) */}
        <div className="relative p-1.5 bg-slate-200/60 backdrop-blur-md rounded-2xl border border-slate-300/60 flex relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setUsername("");
              setPassword("");
              setAuthError("");
            }}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 text-center flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          >
            <Shield className={`h-4 w-4 transition-colors ${loginType === "admin" ? "text-[#002855]" : "text-slate-500"}`} />
            <span className={loginType === "admin" ? "text-[#002855] font-black tracking-wide" : "text-slate-600 font-semibold"}>
              Admin Cockpit
            </span>
            {loginType === "admin" && (
              <motion.div 
                layoutId="solidActiveTab"
                className="absolute inset-0 bg-white border border-slate-200/80 rounded-xl shadow-sm z-[-1]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("employee");
              setUsername("");
              setPassword("");
              setAuthError("");
            }}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 text-center flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          >
            <Briefcase className={`h-4 w-4 transition-colors ${loginType === "employee" ? "text-[#002855]" : "text-slate-500"}`} />
            <span className={loginType === "employee" ? "text-[#002855] font-black tracking-wide" : "text-slate-600 font-semibold"}>
              Employee Desk
            </span>
            {loginType === "employee" && (
              <motion.div 
                layoutId="solidActiveTab"
                className="absolute inset-0 bg-white border border-slate-200/80 rounded-xl shadow-sm z-[-1]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Error Notification Alert */}
        <AnimatePresence mode="wait">
          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center gap-3 text-xs text-rose-700 font-sans shadow-sm relative z-10"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span className="font-bold">{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-extrabold text-slate-700 tracking-wider flex items-center gap-1.5">
                <span>Username / Staff ID</span>
              </label>
              <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#002855] transition-colors">
                <User className="h-4 w-4" />
              </span>
              <input 
                type="text"
                required
                placeholder={loginType === "admin" ? "e.g. admin or owner" : "e.g. manager, cashier, recovery"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/80 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-3.5 py-3 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-extrabold text-slate-700 tracking-wider">
                Secure Password
              </label>
              <Lock className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#002855] transition-colors">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/80 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-10 py-3 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002855]/20 focus:border-[#002855] focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Solid Primary Action Button (No Gradients) */}
          <motion.button 
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#002855] hover:bg-[#001c3d] disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider mt-5"
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verifying System Clearance...</span>
              </div>
            ) : (
              <>
                <span>{loginType === "admin" ? "Enter Admin Dashboard" : "Access Operations Portal"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Quick Credentials / Assist Drawer Toggle */}
        <div className="border-t border-slate-200/80 pt-4 relative z-10">
          <button 
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-[11px] text-slate-600 hover:text-[#002855] font-bold flex items-center justify-between w-full focus:outline-none transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-[#0084a9] group-hover:text-[#002855] transition-colors" />
              <span>Show Quick-Fill Demo Credentials</span>
            </span>
            <span className="text-[#0084a9] underline font-mono text-[10px] group-hover:text-[#002855]">
              {showHint ? "Hide Drawer" : "Expand Credentials"}
            </span>
          </button>

          <AnimatePresence>
            {showHint && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#002855] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <span>{loginType === "admin" ? "Available Admin Roles:" : "Available Employee Roles:"}</span>
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 font-semibold">Click to autofill</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {(loginType === "admin" ? demoAdmins : demoEmployees).map((demo) => {
                      const isActive = username === demo.u && password === demo.p;
                      return (
                        <button
                          key={demo.u}
                          type="button"
                          onClick={() => handleQuickCredentialFill(demo.u, demo.p)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex justify-between items-center group/btn relative cursor-pointer ${
                            isActive 
                              ? "bg-[#002855] border-[#002855] text-white shadow-sm" 
                              : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold">{demo.label}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-[#0084a9]"}`}>
                                {demo.u}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-1 line-clamp-1 font-medium ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                              {demo.desc}
                            </p>
                          </div>
                          <div className="shrink-0 pl-2">
                            {isActive ? (
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-slate-400 group-hover/btn:text-[#0084a9] transition-colors" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Compliance Footer */}
        <div className="border-t border-slate-200/80 pt-4 text-center text-[10px] text-slate-500 font-mono space-y-1 relative z-10 font-medium">
          <div className="flex items-center justify-center gap-1.5 text-slate-600">
            <Terminal className="h-3 w-3 text-[#002855]" />
            <span className="uppercase tracking-wide font-extrabold">
              {loginType === "admin" ? "Admin Segmented Encryption Node" : "Staff Operation Active Node"}
            </span>
          </div>
          <p className="opacity-75">STATION ID: XEROVA-LIVE-GATEWAY • v2.4 PRO</p>
        </div>
      </motion.div>
    </div>
  );
}
