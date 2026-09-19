/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, Users, FileWarning, Printer, Plus, ShieldAlert, DollarSign, 
  Table, Check, Activity, ShieldCheck, AlertTriangle, FileCheck, Search, 
  SlidersHorizontal, RefreshCw, BarChart3, Fingerprint, Award, CheckCircle2,
  FileText
} from "lucide-react";

interface AccountsSettingsViewProps {
  initialPanel?: "masters" | "notices" | "reports" | "general" | "shifts";
}

export default function AccountsSettingsView({ initialPanel = "masters" }: AccountsSettingsViewProps) {
  const [activePanel, setActivePanel] = useState<"masters" | "notices" | "reports" | "general" | "shifts">(initialPanel);

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel]);
  const [loading, setLoading] = useState(false);

  // Auditing Panel internal sub-tabs
  const [auditSubTab, setAuditSubTab] = useState<"trial" | "logs" | "bill" | "day">("trial");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  
  // AI Audit Report State
  const [aiAuditResult, setAiAuditResult] = useState<any | null>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);

  // Masters State
  const [masters, setMasters] = useState<any[]>([]);
  const [newMaster, setNewMaster] = useState({
    name: "",
    category: "dealer",
    phone: "",
    commissionPct: "2"
  });

  // Notice State
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanNo, setSelectedLoanNo] = useState("");
  const [noticeType, setNoticeType] = useState("Pre-seizure Notice (45 days overdue)");
  const [printedNotice, setPrintedNotice] = useState<any | null>(null);

  // Employee Shift Tracker State
  const [sessions, setSessions] = useState<any[]>([]);

  // Reports Summaries
  const [stats, setStats] = useState<any>({
    activePrincipal: 2840000,
    expectedInterest: 340000,
    provisionedBadDebts: 90000,
    trialBalanceCash: 450000,
    trialBalanceBank: 1200000
  });

  useEffect(() => {
    fetchMasters();
    fetchLoans();
  }, []);

  useEffect(() => {
    if (activePanel === "shifts") {
      fetchSessions();
    }
    if (activePanel === "reports") {
      fetchAuditLogs();
    }
  }, [activePanel]);

  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const triggerAiAudit = async () => {
    setAiAuditLoading(true);
    try {
      const res = await fetch("/api/ai/finance-audit", {
        method: "POST"
      });
      const data = await res.json();
      setAiAuditResult(data);
      fetchAuditLogs();
    } catch (e) {
      console.error("Error running AI audit:", e);
    } finally {
      setAiAuditLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/employee/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const fetchMasters = async () => {
    try {
      const res = await fetch("/api/masters");
      const data = await res.json();
      setMasters(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      setLoans(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaster.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/masters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaster)
      });
      if (res.ok) {
        setNewMaster({ name: "", category: "dealer", phone: "", commissionPct: "2" });
        fetchMasters();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNotice = () => {
    const loan = loans.find((l) => l.loanNo === selectedLoanNo);
    if (!loan) return;
    setPrintedNotice({
      loanNo: loan.loanNo,
      type: noticeType,
      customerName: loan.customer?.name || "Customer",
      customerAddress: loan.customer?.address || `${loan.customer?.address1 || ""} ${loan.customer?.address2 || ""} ${loan.customer?.address3 || ""}`.trim() || "Katpadi Main Road, Vellore",
      phone: loan.customer?.phone || "N/A",
      vehicleName: loan.vehicle?.vehicleName || "Vehicle",
      vehicleNo: loan.vehicle?.rcNo || "TN-23-MOCK",
      chassisNo: loan.vehicle?.chassisNo || "CHA-MOCK-9182",
      engineNo: loan.vehicle?.engineNo || "ENG-MOCK-3041",
      coObligantName: loan.coObligants?.[0]?.name || "N/A",
      coObligantAddress: loan.coObligants?.[0]?.address || "N/A",
      coObligantPhone: loan.coObligants?.[0]?.phone || "N/A",
      loanAmount: loan.loanAmount || 50000,
      totalDueAmount: loan.totalDueAmount || 65000,
      emiAmount: loan.emiAmount || 2500,
      durationMonths: loan.durationMonths || 24,
      payments: loan.payments || [],
      pendingAmount: (loan.emiAmount || 2500) * 2, // simulated arrears
      date: new Date().toISOString().split("T")[0]
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase font-sans">
          ERP Administration Cockpit
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure corporate master tables, draft standard legal warning notices, audit trial balance assets, and set system metrics.
        </p>
      </div>

      {/* Internal sub navigation */}
      <div className="flex border-b border-slate-200 font-mono text-xs gap-1 overflow-x-auto">
        <button onClick={() => setActivePanel("masters")} className={`px-4 py-2 border-b-2 transition-colors font-bold ${activePanel === "masters" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Master Data registers
        </button>
        <button onClick={() => setActivePanel("notices")} className={`px-4 py-2 border-b-2 transition-colors font-bold ${activePanel === "notices" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Legal Warning Notices
        </button>
        <button onClick={() => setActivePanel("reports")} className={`px-4 py-2 border-b-2 transition-colors font-bold ${activePanel === "reports" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Audit Statements & Trial Balance
        </button>
        <button onClick={() => setActivePanel("shifts")} className={`px-4 py-2 border-b-2 transition-colors font-bold ${activePanel === "shifts" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Employee Shift & Session Logs
        </button>
        <button onClick={() => setActivePanel("general")} className={`px-4 py-2 border-b-2 transition-colors font-bold ${activePanel === "general" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Global Parameters Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans text-xs">
        
        {/* Main interactive cards */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 lg:col-span-2 space-y-4 shadow-sm">
          
          {/* Master Registers panel */}
          {activePanel === "masters" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase">
                <Table className="h-4 w-4 text-blue-600" /> Authorized Master Listings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form to add */}
                <form onSubmit={handleAddMaster} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Create Sourcing Master</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Master Category</label>
                    <select 
                      value={newMaster.category}
                      onChange={(e) => setNewMaster({...newMaster, category: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="dealer">DEALER OUTLET SHOWROOM</option>
                      <option value="broker">BROKER / ACQUISITION AGENT</option>
                      <option value="area">OPERATIONAL VERIFICATION AREA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Entity Name</label>
                    <input 
                      type="text" required placeholder="e.g. Supreme Honda, Katpadi West"
                      value={newMaster.name} onChange={(e) => setNewMaster({...newMaster, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
                    <input 
                      type="tel" placeholder="Mobile phone"
                      value={newMaster.phone} onChange={(e) => setNewMaster({...newMaster, phone: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Default Broker/Dealer Commission (%)</label>
                    <input 
                      type="number" step="0.1" value={newMaster.commissionPct}
                      onChange={(e) => setNewMaster({...newMaster, commissionPct: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded font-bold text-xs shadow-sm transition-colors">
                    {loading ? "Registering..." : "Add Master Directory"}
                  </button>
                </form>

                {/* List of existing */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 max-h-[300px] overflow-y-auto shadow-inner">
                  <h4 className="text-xs font-bold text-slate-800 font-sans uppercase">Active Sourcing Masters ({masters.length})</h4>
                  <div className="space-y-1.5">
                    {masters.map((m) => (
                      <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800">{m.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{m.category}</p>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                          {m.commissionPct || 2}% Comm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notices panel */}
          {activePanel === "notices" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase">
                <FileWarning className="h-4 w-4 text-amber-600" /> Default Warn & Pre-Repossession Legal Notices
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Generate Notice Dispatch</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Borrower Account</label>
                    <select 
                      value={selectedLoanNo} 
                      onChange={(e) => setSelectedLoanNo(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose Account --</option>
                      {loans.map((l) => (
                        <option key={l.loanNo} value={l.loanNo}>{l.loanNo} - {l.customer?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Standard Legal Format</label>
                    <select 
                      value={noticeType}
                      onChange={(e) => setNoticeType(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="F9/Ledger Print">F9/Ledger Print</option>
                      <option value="Reference for Arbitration">Reference for Arbitration</option>
                      <option value="Seizing Letter">Seizing Letter</option>
                      <option value="Loan Repayment Notice - Customer (Tamil)">Loan Repayment Notice - Customer (Tamil)</option>
                      <option value="Loan Repayment Notice - Co-Obligant (Tamil)">Loan Repayment Notice - Co-Obligant (Tamil)</option>
                      <option value="Loan Default Notice - Customer">Loan Default Notice - Customer</option>
                      <option value="Loan Default Notice - Co-Obligant">Loan Default Notice - Co-Obligant</option>
                      <option value="Loan Balance Notice (Tamil)">Loan Balance Notice (Tamil)</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleGenerateNotice}
                    disabled={!selectedLoanNo}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded font-bold text-xs shadow-sm transition-colors"
                  >
                    Draft Legal Notice
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-inner text-[11px] text-slate-700 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2 font-mono uppercase tracking-wide">NOTICE DISPATCH LOGS</h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-600 font-medium">
                      <li>Sent warning to HP-1002 (2026-07-10)</li>
                      <li>Legal Advocate notice to HP-1005 (2026-07-14)</li>
                      <li>RC Transfer request reminder to HP-1004 (2026-07-16)</li>
                    </ul>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Simulate legal notices directly from customer dues profiles to maintain strong collection cycles.</p>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheets & Reports summary */}
          {activePanel === "reports" && (
            <div className="space-y-4 font-sans text-xs">
              
              {/* Tab Selector inside Reports */}
              <div className="flex border-b border-slate-200 text-[11px] font-mono gap-1 overflow-x-auto no-print">
                <button 
                  onClick={() => setAuditSubTab("trial")} 
                  className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${auditSubTab === "trial" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Financial Balance & AI Audit
                </button>
                <button 
                  onClick={() => setAuditSubTab("logs")} 
                  className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${auditSubTab === "logs" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  <Fingerprint className="h-3.5 w-3.5" /> ERP Action Logs & Security Audit
                </button>
                <button 
                  onClick={() => setAuditSubTab("bill")} 
                  className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${auditSubTab === "bill" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-500" /> Bill Report (Transaction Table)
                </button>
                <button 
                  onClick={() => setAuditSubTab("day")} 
                  className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${auditSubTab === "day" ? "text-blue-600 border-blue-600 bg-white" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-500" /> Day Book Report
                </button>
              </div>

              {auditSubTab === "trial" && (
                <div className="space-y-4">
                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner">
                      <p className="text-slate-400 text-[9px] font-sans font-bold uppercase tracking-wider">TOTAL OUTSTANDING BOOKS</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">₹{stats.activePrincipal.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner">
                      <p className="text-slate-400 text-[9px] font-sans font-bold uppercase tracking-wider">INTEREST RECEIVABLE</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">₹{stats.expectedInterest.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner col-span-2 md:col-span-1">
                      <p className="text-slate-400 text-[9px] font-sans font-bold uppercase tracking-wider">PROVISIONED BAD DEBTS</p>
                      <p className="text-xs font-bold text-red-600 mt-1">₹{stats.provisionedBadDebts.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Main Split Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Trial Balance Ledger */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-inner space-y-3.5">
                      <h4 className="text-[11px] font-bold text-slate-850 uppercase border-b border-slate-200 pb-1.5 flex justify-between items-center">
                        <span>Trial Balance Book Summary</span>
                        <span className="text-[9px] text-slate-400 font-mono font-normal">Reconciled Counters</span>
                      </h4>
                      <div className="divide-y divide-slate-200 text-slate-700">
                        <div className="flex justify-between py-1.5">
                          <span>Cash Counter In-hand Ledger</span>
                          <span className="font-mono text-slate-800 font-bold">₹{stats.trialBalanceCash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span>Corporate Bank Accounts (SBI Main)</span>
                          <span className="font-mono text-slate-800 font-bold">₹{stats.trialBalanceBank.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span>Provisioning Fund for Collaterals</span>
                          <span className="font-mono text-slate-500 font-bold">₹300,000</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold border-t border-slate-300 text-slate-850 mt-1.5">
                          <span>Net Liquid Assets Valuation</span>
                          <span className="font-mono text-green-600 font-bold">₹{(stats.trialBalanceCash + stats.trialBalanceBank).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-2 no-print">
                        <button
                          onClick={triggerAiAudit}
                          disabled={aiAuditLoading}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Activity className={`h-4 w-4 ${aiAuditLoading ? "animate-spin" : ""}`} />
                          {aiAuditLoading ? "Compiling System Audited Balance Book..." : "Execute Financial Integrity AI Audit"}
                        </button>
                      </div>
                    </div>

                    {/* Right: AI Audit Report / Welcome Guard */}
                    <div className="border border-slate-200 rounded-lg p-3.5 bg-white flex flex-col justify-between shadow-sm min-h-[220px]">
                      {aiAuditLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                          <div>
                            <p className="font-bold text-slate-800">Assessing System Ledger Integrity...</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">Running cross-ledger matching and regulatory compliance rulesets</p>
                          </div>
                        </div>
                      ) : aiAuditResult ? (
                        <div className="space-y-3">
                          {/* Score & Verdict Header */}
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-indigo-600" />
                              <div>
                                <h4 className="font-bold text-slate-900 uppercase text-[10px]">Independent Auditor Verdict</h4>
                                <p className="text-[8px] text-slate-400 font-mono">Audited on: {new Date(aiAuditResult.timestamp).toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                aiAuditResult.auditorVerdict === "UNQUALIFIED_PASS"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : aiAuditResult.auditorVerdict === "QUALIFIED_PASS"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {aiAuditResult.auditorVerdict?.replace("_", " ")}
                              </span>
                              <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[11px] font-bold font-mono text-slate-800 leading-none">{aiAuditResult.integrityScore}</span>
                                <span className="text-[7px] text-slate-400 font-mono uppercase scale-90">Score</span>
                              </div>
                            </div>
                          </div>

                          {/* Certified Opinion Text Block */}
                          <div className="bg-slate-50 border-l-4 border-indigo-600 p-2.5 rounded text-[10px] italic text-slate-700 leading-relaxed font-serif relative">
                            "{aiAuditResult.auditorCertifiedOpinion}"
                            <div className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-400 mt-2 text-right not-italic">
                              — Certified: {aiAuditResult.auditedBy}
                            </div>
                          </div>

                          {/* Anomalies List */}
                          <div className="space-y-1.5">
                            <h5 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500" /> Discrepancies & Flagged Markers ({aiAuditResult.anomaliesFound?.length || 0})
                            </h5>
                            {aiAuditResult.anomaliesFound?.length === 0 ? (
                              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 p-2 rounded text-[10px] font-medium">
                                <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                                <span>Complete Ledger Reconciliation Passed. No structural anomalies detected.</span>
                              </div>
                            ) : (
                              <div className="space-y-1 bg-amber-50/50 border border-amber-200 p-2 rounded max-h-[100px] overflow-y-auto">
                                {aiAuditResult.anomaliesFound?.map((an: string, i: number) => (
                                  <p key={i} className="text-[9px] text-slate-700 font-medium leading-relaxed flex items-start gap-1">
                                    <span className="text-red-500 mt-0.5">•</span> <span>{an}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Key Recommendations */}
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <h5 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider">Operational Recommendations</h5>
                            <ul className="list-decimal pl-4 text-[9px] text-slate-600 space-y-1 font-medium">
                              {aiAuditResult.keyRecommendations?.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Printing Block button */}
                          <div className="pt-2 flex justify-end no-print">
                            <button
                              onClick={() => window.print()}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 text-[10px] font-bold rounded shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print Certified Audit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <ShieldCheck className="h-10 w-10 stroke-1 text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700 text-xs">Financial Compliance Scan Awaiting</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[260px] mx-auto leading-normal">
                            Click the left panel button to run an independent automated AI audit across all asset parameters, receipts, and general journal vouchers.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {auditSubTab === "logs" && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row justify-between gap-3 text-xs no-print shadow-inner">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search security trails by user or description details..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                      >
                        <option value="ALL">All Actions</option>
                        <option value="USER_LOGIN">User Logins</option>
                        <option value="USER_LOGOUT">User Logouts</option>
                        <option value="COLLECTION_RECEIPT_POSTED">Receipt Postings</option>
                        <option value="CREATE_HP_LEDGER">Loan Ledgers Created</option>
                        <option value="SYSTEM_FINANCIAL_AUDIT">AI Financial Audits</option>
                        <option value="CREATE_MASTER">Master Directory Edits</option>
                        <option value="PRELOAN_SUBMITTED">Pre-loan Dossier Setup</option>
                      </select>

                      <button
                        onClick={fetchAuditLogs}
                        disabled={auditLogsLoading}
                        className="bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-bold font-mono"
                      >
                        <RefreshCw className={`h-3 w-3 ${auditLogsLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Table Representation */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-wider font-mono border-b border-slate-200">
                          <th className="px-4 py-2.5 font-bold">Action Timestamp</th>
                          <th className="px-4 py-2.5 font-bold">Authorized User</th>
                          <th className="px-4 py-2.5 font-bold">Event Action Class</th>
                          <th className="px-4 py-2.5 font-bold">Transaction Details / Audit Description</th>
                          <th className="px-4 py-2.5 font-bold text-right">Integrity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px] text-slate-700 font-medium">
                        {auditLogsLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-mono animate-pulse">
                              Retrieving encrypted secure security logs from system ledger...
                            </td>
                          </tr>
                        ) : auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-mono">
                              No log records exist matching filter parameters.
                            </td>
                          </tr>
                        ) : (
                          auditLogs
                            .filter((log) => {
                              const matchesSearch = 
                                log.user?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                log.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                                log.action?.toLowerCase().includes(auditSearch.toLowerCase());
                              
                              const matchesAction = 
                                auditActionFilter === "ALL" || 
                                log.action === auditActionFilter;

                              return matchesSearch && matchesAction;
                            })
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true
                                  })}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="font-bold text-slate-900">{log.user || "SYSTEM"}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                    log.action?.includes("LOGIN") || log.action?.includes("LOGOUT")
                                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                                      : log.action?.includes("AUDIT")
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                      : log.action?.includes("RECEIPT") || log.action?.includes("POSTED")
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}>
                                    {log.action?.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-600 font-sans max-w-xs truncate" title={log.details}>
                                  {log.details}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase text-green-600">
                                    <span className="h-1 w-1 rounded-full bg-green-500" /> SECURE
                                  </span>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Print Logs layout wrapper button */}
                  <div className="flex justify-end no-print">
                    <button
                      onClick={() => window.print()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Security Logs
                    </button>
                  </div>
                </div>
              )}

              {auditSubTab === "bill" && (
                <BillReportSubTab loans={loans} />
              )}

              {auditSubTab === "day" && (
                <DayBookReportSubTab loans={loans} />
              )}

            </div>
          )}

          {/* Employee Shift & Session Logs Panel */}
          {activePanel === "shifts" && (
            <div className="space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase">
                  <Users className="h-4 w-4 text-blue-600" /> Employee Shift & Session Logs
                </h3>
                <button
                  onClick={fetchSessions}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                This log tracks active and historic staff shifts, including exact login times, logout times, and total duration of each session. Use this for monitoring compliance and operational coverage.
              </p>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-wider font-mono border-b border-slate-200">
                      <th className="px-4 py-3 font-bold">Staff ID & Name</th>
                      <th className="px-4 py-3 font-bold">Role</th>
                      <th className="px-4 py-3 font-bold">Shift Start (Login)</th>
                      <th className="px-4 py-3 font-bold">Shift End (Logout)</th>
                      <th className="px-4 py-3 font-bold">Duration</th>
                      <th className="px-4 py-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 font-medium">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-mono">
                          No session logs recorded in the system yet.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{sess.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono">ID: {sess.userId || sess.username}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                              {sess.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {formatTime(sess.loginTime)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {sess.logoutTime ? formatTime(sess.logoutTime) : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {sess.duration || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!sess.logoutTime ? (
                              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                On-Shift Now
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
                                Shift Complete
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System settings */}
          {activePanel === "general" && (
            <div className="space-y-4 font-sans text-xs">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase">
                <Settings className="h-4 w-4 text-blue-600" /> Global Finance Parameters configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Standard flat interest rate (% p.a)</label>
                  <input type="number" defaultValue="12" className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Overdue Penalty Charge (₹ / day)</label>
                  <input type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Default Grace period (Days)</label>
                  <input type="number" defaultValue="3" className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">SMS / WhatsApp Gateway integration</label>
                  <select className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500">
                    <option>Simulated Developer Console</option>
                    <option>Twilio Global SMS API</option>
                    <option>WhatsApp Business API Gateway</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => alert("Global configuration committed successfully.")}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold text-xs mt-2 shadow-sm transition-colors"
              >
                Save configurations
              </button>
            </div>
          )}

        </div>

        {/* Right Detail Panel: notice reprint preview */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          {printedNotice ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-800 text-xs font-mono uppercase">ADVOCATE NOTICE PREVIEW</h4>
                <button onClick={() => setPrintedNotice(null)} className="text-slate-400 hover:text-slate-600 text-[10px] font-bold">Dismiss</button>
              </div>

              {/* Legal Notice template */}
              <div className="bg-slate-50 text-slate-900 p-4 rounded font-serif shadow-inner text-[10px] leading-relaxed border-t-8 border-amber-500 border border-slate-250 printable-print-block">
                {printedNotice.type === "F9/Ledger Print" ? (
                  <div className="space-y-4 font-sans text-[10px]">
                    <div className="text-center border-b border-slate-300 pb-3">
                      <p className="font-bold text-sm uppercase tracking-wider text-slate-950">XEROVA AUTO FINANCE</p>
                      <p className="text-[8px] text-slate-500">Corporate Office: Bypass Road, Madurai | HP Ledger Audit Book</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[9px] bg-white p-2 border rounded">
                      <div>
                        <p><strong>Loan A/C No:</strong> {printedNotice.loanNo}</p>
                        <p><strong>Customer Name:</strong> {printedNotice.customerName}</p>
                        <p><strong>Contact Phone:</strong> {printedNotice.phone}</p>
                        <p><strong>Address:</strong> {printedNotice.customerAddress}</p>
                      </div>
                      <div>
                        <p><strong>Vehicle Name:</strong> {printedNotice.vehicleName}</p>
                        <p><strong>Plate Reg No:</strong> {printedNotice.vehicleNo}</p>
                        <p><strong>HP Loan Amount:</strong> ₹{printedNotice.loanAmount?.toLocaleString()}</p>
                        <p><strong>Total HP Payable:</strong> ₹{printedNotice.totalDueAmount?.toLocaleString()}</p>
                      </div>
                    </div>

                    <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-700">Account Transaction Ledger Rows:</p>
                    <table className="w-full text-left border-collapse border border-slate-200 text-[9px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-1.5 border-r border-slate-200">Date</th>
                          <th className="p-1.5 border-r border-slate-200">Description</th>
                          <th className="p-1.5 border-r border-slate-200">Type</th>
                          <th className="p-1.5 border-r border-slate-200 text-right">Debit (Charge)</th>
                          <th className="p-1.5 text-right">Credit (Receipt)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-white">
                          <td className="p-1.5 border-r border-slate-200 font-mono">{printedNotice.date}</td>
                          <td className="p-1.5 border-r border-slate-200 font-semibold">HP-{printedNotice.customerName} Asset Booking</td>
                          <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[8px] text-slate-500">Debit Note</td>
                          <td className="p-1.5 border-r border-slate-200 text-right font-mono">₹{printedNotice.loanAmount?.toLocaleString()}</td>
                          <td className="p-1.5 text-right font-mono">₹0</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-1.5 border-r border-slate-200 font-mono">{printedNotice.date}</td>
                          <td className="p-1.5 border-r border-slate-200 font-semibold">Document Income-{printedNotice.customerName}</td>
                          <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[8px] text-slate-500">Charges</td>
                          <td className="p-1.5 border-r border-slate-200 text-right font-mono">₹1,500</td>
                          <td className="p-1.5 text-right font-mono">₹0</td>
                        </tr>
                        {printedNotice.payments && printedNotice.payments.length > 0 ? (
                          printedNotice.payments.map((p: any, i: number) => (
                            <tr key={i} className="bg-white">
                              <td className="p-1.5 border-r border-slate-200 font-mono">{p.date || printedNotice.date}</td>
                              <td className="p-1.5 border-r border-slate-200">EMI Collection Receipt Rcvd</td>
                              <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[8px] text-emerald-600">Payment</td>
                              <td className="p-1.5 border-r border-slate-200 text-right font-mono">₹0</td>
                              <td className="p-1.5 text-right font-mono text-emerald-600">₹{p.amount?.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white">
                            <td className="p-1.5 border-r border-slate-200 font-mono">{printedNotice.date}</td>
                            <td className="p-1.5 border-r border-slate-200">EMI Collection Receipt Rcvd</td>
                            <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[8px] text-emerald-600">Payment</td>
                            <td className="p-1.5 border-r border-slate-200 text-right font-mono">₹0</td>
                            <td className="p-1.5 text-right font-mono text-emerald-600">₹{(printedNotice.emiAmount || 2500).toLocaleString()}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-bold border-t border-slate-300">
                          <td colSpan={3} className="p-1.5 border-r border-slate-200 text-right uppercase">Total Summary (Reconciled):</td>
                          <td className="p-1.5 border-r border-slate-200 text-right font-mono">₹{(printedNotice.loanAmount + 1500)?.toLocaleString()}</td>
                          <td className="p-1.5 text-right font-mono text-emerald-600">₹{(printedNotice.payments && printedNotice.payments.length > 0 ? printedNotice.payments.reduce((sum: number, x: any) => sum + x.amount, 0) : printedNotice.emiAmount || 2500)?.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="pt-4 border-t border-slate-300 text-center text-[8px] text-slate-500 font-bold tracking-wider select-none">
                      <p>*** XEROVA AUTO FINANCE AUTO-GENERATED HP SYSTEM ***</p>
                      <p>Subject to corporate audit reconciliation and local tax frameworks.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center border-b border-slate-300 pb-2">
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-950">XEROVA AUTO FINANCE LEGAL RECOVERY CELL</p>
                      <p className="font-sans text-[7px] text-slate-500">Advocates Chambers, Bypass Junction Road, Madurai</p>
                    </div>

                    <div className="flex justify-between font-sans text-[8px] text-slate-500">
                      <span>REF: HP-LEGAL/{printedNotice.loanNo}</span>
                      <span>Date: {printedNotice.date}</span>
                    </div>

                    <div className="space-y-1 font-sans">
                      <p className="font-bold text-slate-950 text-[9px]">TO:</p>
                      <p className="font-bold text-slate-950">{printedNotice.customerName}</p>
                      <p>{printedNotice.customerAddress}</p>
                      <p>Ph: {printedNotice.phone}</p>
                      {printedNotice.coObligantName && printedNotice.coObligantName !== "N/A" && (
                        <p className="text-slate-500">Co-Obligant / Guarantor on File: <strong>{printedNotice.coObligantName}</strong> (Ph: {printedNotice.coObligantPhone})</p>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-2 text-[10px]">
                      <p className="font-bold text-center underline font-sans text-[11px] uppercase text-indigo-900">{printedNotice.type}</p>

                      {printedNotice.type === "Reference for Arbitration" && (
                        <div className="space-y-2">
                          <p>
                            Sir/Madam, you are hereby served notice that a legal dispute has arisen concerning default on Hire-Purchase Loan Account <strong className="font-sans">{printedNotice.loanNo}</strong> against Collateral Asset Vehicle <strong className="font-sans">{printedNotice.vehicleName} ({printedNotice.vehicleNo})</strong>.
                          </p>
                          <p>
                            Pursuant to Clause 18 of the Hire-Purchase loan agreement, this dispute is formally referred to the Sole Arbitrator. You are summoned to appear before the Arbitration Tribunal within 14 days of this notice to show cause why the recovery proceedings should not be completed.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Seizing Letter" && (
                        <div className="space-y-2">
                          <p className="font-bold text-rose-700 uppercase tracking-wide">OFFICIAL REPOSSESSION AND SEIZURE WARRANT</p>
                          <p>
                            Pursuant to Clause 14 of the Hire-Purchase deed execution, the borrower having defaulted on successive EMIs, our regional recovery task-force is hereby authorized to repossess and physically seize the collateral vehicle specs described below:
                          </p>
                          <div className="bg-white border p-2 rounded font-mono text-[9px] space-y-0.5">
                            <p>• Vehicle: <strong>{printedNotice.vehicleName}</strong></p>
                            <p>• Registration Plate: <strong>{printedNotice.vehicleNo}</strong></p>
                            <p>• Engine Serial: {printedNotice.engineNo}</p>
                            <p>• Chassis Serial: {printedNotice.chassisNo}</p>
                            <p>• Total Unresolved Default Arrears: ₹{printedNotice.pendingAmount?.toLocaleString()}</p>
                          </div>
                          <p>
                            Regional yard supervisors are authorized to deploy recovery sirens, GPS trackers, and immobilizers to secure the vehicle immediately.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Loan Repayment Notice - Customer (Tamil)" && (
                        <div className="space-y-2 font-sans leading-relaxed text-slate-800">
                          <p><strong>அன்புள்ள வாடிக்கையாளர் {printedNotice.customerName} அவர்களுக்கு,</strong></p>
                          <p>
                            தங்கள் பெற்ற வாகன கடன் கணக்கு எண் <strong>{printedNotice.loanNo}</strong> (வாகனம்: <strong>{printedNotice.vehicleName} - {printedNotice.vehicleNo}</strong>) க்கான மாத தவணை நிலுவையில் உள்ளது என்பதைத் தெரிவித்துக் கொள்கிறோம்.
                          </p>
                          <p>
                            தங்களது தற்போதைய தவணை நிலுவைத் தொகை <strong>₹{printedNotice.pendingAmount?.toLocaleString()}</strong> ஆகும். இதனை உடனடியாக 7 நாட்களுக்குள் செலுத்தி ஜப்தி மற்றும் சட்ட நடவடிக்கைகளைத் தவிர்க்குமாறு கேட்டுக்கொள்கிறோம். தவறினால் தங்கள் வாகனம் பறிமுதல் செய்யப்படும்.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Loan Repayment Notice - Co-Obligant (Tamil)" && (
                        <div className="space-y-2 font-sans leading-relaxed text-slate-800">
                          <p><strong>அன்புள்ள ஜாமீன்தார் {printedNotice.coObligantName} அவர்களுக்கு,</strong></p>
                          <p>
                            தாங்கள் ஜாமீன் (Co-Obligant) கையெழுத்திட்ட முதன்மை கடன்தாரர் <strong>{printedNotice.customerName}</strong> என்பவரின் வாகன கடன் கணக்கு எண் <strong>{printedNotice.loanNo}</strong>-ல் மாத தவணை நிலுவை நீண்ட நாட்களாக உள்ளது.
                          </p>
                          <p>
                            முதன்மை கடன்தாரர் தவணை நிலுவைத் தொகை <strong>₹{printedNotice.pendingAmount?.toLocaleString()}</strong>-ஐ செலுத்த தவறியதால், ஜாமீன்தாரராகிய தங்களுக்கு இந்த இறுதி எச்சரிக்கை அறிவிப்பு அனுப்பப்படுகிறது. கூட்டுப் பொறுப்பின் கீழ் இந்தத் தொகையை தாங்கள் உடனடியாக செலுத்த கடமைப்பட்டவர் ஆவீர்கள்.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Loan Default Notice - Customer" && (
                        <div className="space-y-2">
                          <p>
                            Sir/Madam, you are hereby served final notice of default for Hire-Purchase Loan Account <strong className="font-sans">{printedNotice.loanNo}</strong> against Collateral Asset Vehicle <strong className="font-sans">{printedNotice.vehicleName} ({printedNotice.vehicleNo})</strong>.
                          </p>
                          <p>
                            Outstanding arrears amount to <strong>₹{printedNotice.pendingAmount?.toLocaleString()}</strong>. Continuous failure to pay constitutes a material breach. We demand immediate repayment of the full default balance failing which we shall file a civil advocate suit and execute physical asset recovery.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Loan Default Notice - Co-Obligant" && (
                        <div className="space-y-2">
                          <p>
                            Dear Co-Obligant / Guarantor <strong>{printedNotice.coObligantName}</strong>,
                          </p>
                          <p>
                            This is to inform you that the primary borrower <strong>{printedNotice.customerName}</strong> of Loan Account <strong className="font-sans">{printedNotice.loanNo}</strong> has entered serious default.
                          </p>
                          <p>
                            Under the co-obligation contract of Hire-Purchase, you are jointly and severally liable for the outstanding arrears of <strong>₹{printedNotice.pendingAmount?.toLocaleString()}</strong>. Demands are hereby made upon you to clear the balance immediately.
                          </p>
                        </div>
                      )}

                      {printedNotice.type === "Loan Balance Notice (Tamil)" && (
                        <div className="space-y-2 font-sans leading-relaxed text-slate-800 text-[9px]">
                          <p className="font-bold text-center underline">வாகன கடன் நிலுவைத் தொகை விபரம் (BALANCE ACCOUNT STATEMENT)</p>
                          <div className="bg-white border p-2 rounded space-y-1">
                            <p>• வாடிக்கையாளர் பெயர்: <strong>{printedNotice.customerName}</strong></p>
                            <p>• கடன் கணக்கு எண்: <strong>{printedNotice.loanNo}</strong></p>
                            <p>• அசல் கடன் தொகை: <strong>₹{printedNotice.loanAmount?.toLocaleString()}</strong></p>
                            <p>• மொத்த தவணைத் தொகை: <strong>₹{printedNotice.totalDueAmount?.toLocaleString()}</strong></p>
                            <p>• செலுத்த வேண்டிய நிலுவை: <strong>₹{printedNotice.pendingAmount?.toLocaleString()}</strong></p>
                          </div>
                          <p className="text-[8px] text-slate-500 italic">குறிப்பு: தங்களது கடன் கணக்குத் தணிக்கை சரிபார்க்கப்பட்ட நிலுவை விவரம் ஆகும்.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between pt-4 font-sans text-[8px] text-slate-500 border-t border-slate-300">
                      <p>Advocate / Signatory</p>
                      <p>XEROVA Authorized Sign</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-400" /> Print Notice
                </button>
                <button 
                  onClick={() => alert(`Simulated WhatsApp Dispatch of Advocate warning copy to debtor.`)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3.5 py-1.5 rounded font-bold text-xs transition-colors"
                >
                  Dispatch
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center font-sans">
              <ShieldAlert className="h-8 w-8 stroke-1 text-amber-600 mb-2" />
              <p className="text-xs">Select a defaulted account on the left notice generator to draft advocate demand filings.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export function BillReportSubTab({ loans }: { loans: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState("loanNo");
  const [sortAsc, setSortAsc] = useState(true);

  // Columns visibility state
  const [columns, setColumns] = useState({
    slNo: true,
    partyName: true,
    vehicleName: true,
    hpDate: true,
    hpAmount: true,
    interestAmount: true,
    totalHp: true,
    advDue: true,
    noOfDues: true,
    emiAmount: true,
    totalPaid: true,
    balDues: true,
    balAmount: true,
    mobile: true,
    address: true,
    status: true,
    vehicleNo: true,
    coObligant: true,
    coObligantPhone: true,
    dealer: true,
    broker: true,
    area: true,
    vehicleModel: true,
  });

  const handleToggleColumn = (col: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Process data
  const processedData = loans.map((l, index) => {
    const loanAmount = l.loanAmount || 0;
    const interestRate = l.interestRate || 12;
    const durationMonths = l.durationMonths || 24;
    const emiAmount = l.emiAmount || Math.round(loanAmount / durationMonths);
    const intAmount = Math.round(loanAmount * (interestRate / 100) * (durationMonths / 12));
    const totalHp = loanAmount + intAmount;

    // Calculate paid details from installments
    const installments = l.installments || [];
    const totalPaid = installments.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0);
    const balAmount = totalHp - totalPaid;
    const balDues = installments.filter((inst: any) => inst.status !== "PAID").length;

    return {
      id: l.loanNo,
      slNo: index + 1,
      loanNo: l.loanNo,
      partyName: l.customer?.name || "N/A",
      vehicleName: l.vehicleName || l.vehicle?.vehicleName || "N/A",
      hpDate: l.hpDate || "N/A",
      hpAmount: loanAmount,
      interestAmount: intAmount,
      totalHp: totalHp,
      advDue: l.advanceDues || 0,
      noOfDues: durationMonths,
      emiAmount: emiAmount,
      totalPaid: totalPaid,
      balDues: balDues,
      balAmount: balAmount,
      mobile: l.customer?.phone || "N/A",
      address: l.customer?.address || `${l.customer?.address1 || ""} ${l.customer?.address2 || ""}`.trim() || "N/A",
      status: l.status || "ACTIVE",
      vehicleNo: l.vehicleNo || l.vehicle?.rcNo || "N/A",
      coObligant: l.coObligants?.[0]?.name || "N/A",
      coObligantPhone: l.coObligants?.[0]?.phone || "N/A",
      dealer: l.dealerName || "N/A",
      broker: l.brokerName || "N/A",
      area: l.area || "N/A",
      vehicleModel: l.vehicleModel || "N/A",
    };
  });

  // Filtering
  const filtered = processedData.filter(d => {
    const matchesSearch = 
      d.partyName.toLowerCase().includes(search.toLowerCase()) ||
      d.loanNo.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
      d.mobile.toLowerCase().includes(search.toLowerCase()) ||
      d.coObligant.toLowerCase().includes(search.toLowerCase()) ||
      d.area.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a: any, b: any) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortAsc ? (valA - valB) : (valB - valA);
    }
  });

  // Copy to clipboard
  const handleCopy = () => {
    const text = sorted.map(d => `${d.loanNo}\t${d.partyName}\t${d.vehicleName}\t${d.hpAmount}\t${d.totalPaid}\t${d.balAmount}`).join("\n");
    navigator.clipboard.writeText(`Loan No\tParty Name\tVehicle Name\tHP Amount\tTotal Paid\tBalance\n` + text);
    alert("Transaction Summary copied to clipboard!");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = Object.keys(columns).filter(k => columns[k as keyof typeof columns]).join(",");
    const rows = sorted.map(d => {
      return Object.keys(columns)
        .filter(k => columns[k as keyof typeof columns])
        .map(k => `"${String(d[k as keyof typeof d] || "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Xerova_Bill_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 no-print">
        <div className="flex flex-wrap gap-2">
          {["ALL", "ACTIVE", "CLOSED", "SEIZED"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-[10px] font-bold border cursor-pointer uppercase transition-all ${
                statusFilter === st 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-white border border-slate-200 rounded px-2 py-1 flex items-center gap-1.5 flex-1 md:flex-initial">
            <Search className="h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by party, loan #, reg #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-[10px] text-slate-700 font-semibold focus:outline-none w-full md:w-48"
            />
          </div>

          <button 
            onClick={handleCopy}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
          >
            Copy
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
          >
            Export CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Column Customizer Panel */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg no-print space-y-2">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Custom columns configuration (Show/Hide)</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.keys(columns).map(col => (
            <label key={col} className="flex items-center gap-1.5 text-[10.5px] text-slate-700 font-semibold cursor-pointer">
              <input 
                type="checkbox" 
                checked={columns[col as keyof typeof columns]} 
                onChange={() => handleToggleColumn(col as keyof typeof columns)}
                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span>{col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] uppercase tracking-wider font-mono border-b border-slate-200">
              {columns.slNo && <th className="px-3 py-2 font-bold text-center">Sl No</th>}
              <th className="px-3 py-2 font-bold cursor-pointer hover:bg-slate-800" onClick={() => handleSort("loanNo")}>Loan No {sortField === "loanNo" && (sortAsc ? "▲" : "▼")}</th>
              {columns.partyName && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-slate-800" onClick={() => handleSort("partyName")}>Party Name {sortField === "partyName" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.vehicleName && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-slate-800" onClick={() => handleSort("vehicleName")}>Vehicle Name {sortField === "vehicleName" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.vehicleNo && <th className="px-3 py-2 font-bold">Vehicle No</th>}
              {columns.vehicleModel && <th className="px-3 py-2 font-bold">Model</th>}
              {columns.hpDate && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-slate-800" onClick={() => handleSort("hpDate")}>HP Date {sortField === "hpDate" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.hpAmount && <th className="px-3 py-2 font-bold text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort("hpAmount")}>HP Amount {sortField === "hpAmount" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.interestAmount && <th className="px-3 py-2 font-bold text-right">Int. Amount</th>}
              {columns.totalHp && <th className="px-3 py-2 font-bold text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort("totalHp")}>Total HP {sortField === "totalHp" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.advDue && <th className="px-3 py-2 font-bold text-center">Adv Due</th>}
              {columns.noOfDues && <th className="px-3 py-2 font-bold text-center">No of Dues</th>}
              {columns.emiAmount && <th className="px-3 py-2 font-bold text-right">EMI Amount</th>}
              {columns.totalPaid && <th className="px-3 py-2 font-bold text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort("totalPaid")}>Total Paid {sortField === "totalPaid" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.balDues && <th className="px-3 py-2 font-bold text-center">Bal Dues</th>}
              {columns.balAmount && <th className="px-3 py-2 font-bold text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort("balAmount")}>Bal Amount {sortField === "balAmount" && (sortAsc ? "▲" : "▼")}</th>}
              {columns.mobile && <th className="px-3 py-2 font-bold">Mobile No</th>}
              {columns.coObligant && <th className="px-3 py-2 font-bold">Co-Obligant</th>}
              {columns.coObligantPhone && <th className="px-3 py-2 font-bold">Co-Guarantor Mobile</th>}
              {columns.dealer && <th className="px-3 py-2 font-bold">Dealer Name</th>}
              {columns.broker && <th className="px-3 py-2 font-bold">Broker Name</th>}
              {columns.area && <th className="px-3 py-2 font-bold">Area</th>}
              {columns.address && <th className="px-3 py-2 font-bold">Address</th>}
              {columns.status && <th className="px-3 py-2 font-bold text-center">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10.5px] text-slate-700 font-semibold">
            {sorted.map((d, index) => (
              <tr key={d.loanNo} className="hover:bg-slate-50 transition-colors">
                {columns.slNo && <td className="px-3 py-2 text-center text-slate-400 font-mono font-bold">{index + 1}</td>}
                <td className="px-3 py-2 font-mono font-bold text-indigo-700">{d.loanNo}</td>
                {columns.partyName && <td className="px-3 py-2 text-slate-900 font-bold">{d.partyName}</td>}
                {columns.vehicleName && <td className="px-3 py-2 font-medium">{d.vehicleName}</td>}
                {columns.vehicleNo && <td className="px-3 py-2 font-mono">{d.vehicleNo}</td>}
                {columns.vehicleModel && <td className="px-3 py-2 text-slate-500 font-mono">{d.vehicleModel}</td>}
                {columns.hpDate && <td className="px-3 py-2 font-mono text-slate-500">{d.hpDate}</td>}
                {columns.hpAmount && <td className="px-3 py-2 text-right font-mono text-slate-900">₹{d.hpAmount.toLocaleString()}</td>}
                {columns.interestAmount && <td className="px-3 py-2 text-right font-mono text-slate-500">₹{d.interestAmount.toLocaleString()}</td>}
                {columns.totalHp && <td className="px-3 py-2 text-right font-mono font-bold text-indigo-800">₹{d.totalHp.toLocaleString()}</td>}
                {columns.advDue && <td className="px-3 py-2 text-center font-mono">{d.advDue}</td>}
                {columns.noOfDues && <td className="px-3 py-2 text-center font-mono">{d.noOfDues}</td>}
                {columns.emiAmount && <td className="px-3 py-2 text-right font-mono text-slate-600">₹{d.emiAmount.toLocaleString()}</td>}
                {columns.totalPaid && <td className="px-3 py-2 text-right font-mono text-emerald-600 font-bold">₹{d.totalPaid.toLocaleString()}</td>}
                {columns.balDues && <td className="px-3 py-2 text-center font-mono text-rose-500 font-bold">{d.balDues}</td>}
                {columns.balAmount && <td className="px-3 py-2 text-right font-mono text-rose-600 font-bold">₹{d.balAmount.toLocaleString()}</td>}
                {columns.mobile && <td className="px-3 py-2 font-mono text-slate-600">{d.mobile}</td>}
                {columns.coObligant && <td className="px-3 py-2 text-slate-600">{d.coObligant}</td>}
                {columns.coObligantPhone && <td className="px-3 py-2 font-mono text-slate-500">{d.coObligantPhone}</td>}
                {columns.dealer && <td className="px-3 py-2 text-slate-500">{d.dealer}</td>}
                {columns.broker && <td className="px-3 py-2 text-slate-500">{d.broker}</td>}
                {columns.area && <td className="px-3 py-2 text-indigo-600/80 font-mono text-[9px]">{d.area}</td>}
                {columns.address && <td className="px-3 py-2 max-w-xs truncate text-slate-400" title={d.address}>{d.address}</td>}
                {columns.status && (
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.2 rounded font-mono font-bold text-[8.5px] border ${
                      d.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      d.status === "SEIZED" ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" :
                      "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DayBookReportSubTab({ loans }: { loans: any[] }) {
  const [quickFilter, setQuickFilter] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/receipts");
      if (res.ok) {
        const data = await res.json();
        setReceipts(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick filter presets
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (quickFilter === "TODAY") {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (quickFilter === "THIS_WEEK") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setFromDate(startOfWeek.toISOString().split("T")[0]);
      setToDate(todayStr);
    } else if (quickFilter === "THIS_MONTH") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(startOfMonth.toISOString().split("T")[0]);
      setToDate(todayStr);
    }
  }, [quickFilter]);

  // Combine HP Loans (Payments) and Receipts (Receipts) into a single Day Book ledger stream
  const dayBookStream = [
    // Outflow: HP loan disbursements
    ...loans.map(l => ({
      id: l.loanNo,
      date: l.hpDate || "2026-07-01",
      headOfAccount: `HP Loan Disbursed - ${l.customer?.name || "Customer"}`,
      type: "PAYMENT",
      refNo: l.loanNo,
      credit: 0,
      debit: l.loanAmount || 50000,
      details: l,
    })),
    // Inflow: Collection receipts received
    ...receipts.map(r => ({
      id: r.id || r.receiptNo,
      date: r.date || "2026-07-01",
      headOfAccount: `EMI Receipt - ${r.customerName || "Customer"}`,
      type: "RECEIPT",
      refNo: r.receiptNo || "R-MOCK",
      credit: r.amount || 2500,
      debit: 0,
      details: r,
    })),
  ];

  // Filter by fromDate / toDate
  const filteredStream = dayBookStream.filter(tx => {
    if (!fromDate || !toDate) return true;
    const txDate = tx.date;
    return txDate >= fromDate && txDate <= toDate;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Compute live sum metrics
  const totalReceipts = filteredStream.reduce((sum, tx) => sum + tx.credit, 0);
  const totalPayments = filteredStream.reduce((sum, tx) => sum + tx.debit, 0);
  const netInflow = totalReceipts - totalPayments;

  const handleCopy = () => {
    const text = filteredStream.map(tx => `${tx.date}\t${tx.headOfAccount}\t${tx.type}\t${tx.refNo}\t₹${tx.credit}\t₹${tx.debit}`).join("\n");
    navigator.clipboard.writeText(`Date\tHead of Account\tType\tRef No\tCredit (Inflow)\tDebit (Outflow)\n` + text);
    alert("Day Book copied to clipboard!");
  };

  const handleExportCSV = () => {
    const headers = "Date,Head of Account,Type,Reference No,Credit (Receipt),Debit (Payment)";
    const rows = filteredStream.map(tx => {
      return `"${tx.date}","${tx.headOfAccount}","${tx.type}","${tx.refNo}","${tx.credit}","${tx.debit}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Xerova_Day_Book_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Date controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          {["TODAY", "THIS_WEEK", "THIS_MONTH"].map(q => (
            <button
              key={q}
              onClick={() => setQuickFilter(q)}
              className={`px-3 py-1 rounded text-[10px] font-bold border cursor-pointer uppercase transition-all ${
                quickFilter === q 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {q.replace("_", " ")}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[10px] font-bold text-slate-500 font-mono">From:</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setQuickFilter("CUSTOM"); }}
              className="bg-white border border-slate-200 text-slate-800 text-[10.5px] font-bold p-1 rounded focus:outline-none"
            />
            <span className="text-[10px] font-bold text-slate-500 font-mono">To:</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setQuickFilter("CUSTOM"); }}
              className="bg-white border border-slate-200 text-slate-800 text-[10.5px] font-bold p-1 rounded focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <button 
            onClick={handleCopy}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
          >
            Copy
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
          >
            Export CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Print Day Book
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-inner">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Total Receipts Inflow (+)</span>
          <span className="text-sm font-bold text-emerald-600 mt-1 block">₹{totalReceipts.toLocaleString()}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-inner">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Total HP Loan Outflow (-)</span>
          <span className="text-sm font-bold text-rose-600 mt-1 block">₹{totalPayments.toLocaleString()}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center shadow-inner">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Net Day Book Balance</span>
          <span className={`text-sm font-bold mt-1 block ${netInflow >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
            ₹{netInflow.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Day Book Table Ledger */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] uppercase tracking-wider font-mono border-b border-slate-200">
              <th className="px-4 py-2 font-bold text-center">Sl No</th>
              <th className="px-4 py-2 font-bold">Date</th>
              <th className="px-4 py-2 font-bold">Head of Account / Party Details</th>
              <th className="px-4 py-2 font-bold text-center">Type</th>
              <th className="px-4 py-2 font-bold">Reference Ledger</th>
              <th className="px-4 py-2 font-bold text-right">Credit (+)</th>
              <th className="px-4 py-2 font-bold text-right">Debit (-)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10.5px] text-slate-700 font-semibold">
            {filteredStream.map((tx, index) => (
              <tr 
                key={tx.id} 
                onClick={() => setSelectedTransaction(tx)}
                className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2 text-center text-slate-400 font-mono font-bold">{index + 1}</td>
                <td className="px-4 py-2 font-mono text-slate-500 whitespace-nowrap">{tx.date}</td>
                <td className="px-4 py-2">
                  <div className="text-slate-900 font-bold">{tx.headOfAccount}</div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-1.5 py-0.2 rounded font-mono text-[8.5px] font-bold border ${
                    tx.type === "RECEIPT" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-indigo-700">{tx.refNo}</td>
                <td className="px-4 py-2 text-right font-mono text-emerald-600 font-bold">
                  {tx.credit > 0 ? `₹${tx.credit.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2 text-right font-mono text-rose-600 font-bold">
                  {tx.debit > 0 ? `₹${tx.debit.toLocaleString()}` : "—"}
                </td>
              </tr>
            ))}

            {filteredStream.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-mono">
                  No daily transaction ledgers registered in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Dialog Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center select-none">
              <span className="font-bold text-xs uppercase tracking-wider">Transaction Ledger Metadata</span>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                Close
              </button>
            </div>
            
            <div className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Head of Account</span>
                <p className="font-bold text-slate-800 text-sm leading-tight">{selectedTransaction.headOfAccount}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Date</span>
                  <p className="font-bold text-slate-700">{selectedTransaction.date}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Type</span>
                  <p className={`font-bold uppercase ${selectedTransaction.type === "RECEIPT" ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedTransaction.type}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Credit (+)</span>
                  <p className="font-bold text-emerald-600">₹{selectedTransaction.credit.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Debit (-)</span>
                  <p className="font-bold text-rose-600">₹{selectedTransaction.debit.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 border p-3 rounded space-y-1 text-[11px]">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-sans mb-1">Audit Details</span>
                {selectedTransaction.type === "RECEIPT" ? (
                  <>
                    <p>• Receipt No: <strong>{selectedTransaction.details.receiptNo}</strong></p>
                    <p>• Customer Name: <strong>{selectedTransaction.details.customerName}</strong></p>
                    <p>• Mode: <strong>{selectedTransaction.details.payMode || "Cash"}</strong></p>
                    <p>• Collector: <strong>{selectedTransaction.details.collectedBy || "System Operator"}</strong></p>
                    {selectedTransaction.details.remarks && <p>• Remarks: <i>{selectedTransaction.details.remarks}</i></p>}
                  </>
                ) : (
                  <>
                    <p>• Loan No: <strong>{selectedTransaction.details.loanNo}</strong></p>
                    <p>• Vehicle: <strong>{selectedTransaction.details.vehicleName || "Collateral"}</strong></p>
                    <p>• HP Interest Rate: <strong>{selectedTransaction.details.interestRate}%</strong></p>
                    <p>• Tenure Months: <strong>{selectedTransaction.details.durationMonths}</strong></p>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 px-4 py-2.5 border-t flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-1 rounded"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
