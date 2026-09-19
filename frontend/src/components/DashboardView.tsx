/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Users, ShieldAlert, Wallet, Banknote, Briefcase, 
  Calculator, Search, Printer, AlertCircle, CheckCircle2, RefreshCw, FileText, 
  Clock, Building, PlusCircle, Activity, Layers, ArrowRight, CheckCircle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onSetReprintNo: (no: string) => void;
  onSearchCustomer?: (query: string) => void;
}

export default function DashboardView({ onNavigate, onSetReprintNo, onSearchCustomer }: DashboardViewProps) {
  const [activeCompany, setActiveCompany] = useState<"ALL" | "XEROVA" | "MURUGAN" | "TRICHY" | "LAKSHA">("ALL");
  const [loading, setLoading] = useState(true);

  // Real stats state initialized cleanly
  const [stats, setStats] = useState({
    activeLoans: 0,
    closedLoans: 0,
    seizedLoans: 0,
    principalBalance: 0,
    cashInHand: 0,
    activeFDs: 0,
    loanAmountToday: 0,
    todayLoanCount: 0,
    todayCollectionAmount: 0,
    todayReceiptCount: 0,
    todayInterestIncome: 0,
    totalProfit: 0,
    activities: [] as any[]
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // EMI Calculator states
  const [emiAmount, setEmiAmount] = useState<number | string>(100000);
  const [emiRate, setEmiRate] = useState<number | string>(14);
  const [emiMonths, setEmiMonths] = useState<number | string>(12);

  // Quick Action states
  const [quickReprintNo, setQuickReprintNo] = useState("");
  const [quickSearchTerm, setQuickSearchTerm] = useState("");

  useEffect(() => {
    fetchStats();
  }, [activeCompany]);

  const isLoanOnDate = (l: any, targetDate: string) => {
    return (
      (l.disbursementDate && l.disbursementDate.startsWith(targetDate)) ||
      (l.hpDate && l.hpDate.startsWith(targetDate)) ||
      (l.createdAt && l.createdAt.startsWith(targetDate)) ||
      (l.date && l.date.startsWith(targetDate))
    );
  };

  const isReceiptOnDate = (r: any, targetDate: string) => {
    return (
      (r.date && r.date.startsWith(targetDate)) ||
      (r.timestamp && r.timestamp.startsWith(targetDate)) ||
      (r.createdAt && r.createdAt.startsWith(targetDate))
    );
  };

  const generateLast7DaysChart = (loans: any[], receipts: any[]) => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA");
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const dayReceipts = receipts.filter((r: any) => isReceiptOnDate(r, dateStr));
      const collectionSum = dayReceipts.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      
      const dayLoans = loans.filter((l: any) => isLoanOnDate(l, dateStr));
      const loanSum = dayLoans.reduce((sum: number, l: any) => sum + (Number(l.loanAmount) || 0), 0);

      days.push({
        date: dayLabel,
        "Collections (₹)": collectionSum,
        "Disbursements (₹)": loanSum
      });
    }

    return days;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [loansRes, receiptsRes, depositsRes, logsRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/receipts"),
        fetch("/api/deposits"),
        fetch("/api/audit-logs")
      ]);

      const allLoans = loansRes.ok ? await loansRes.json() : [];
      const allReceipts = receiptsRes.ok ? await receiptsRes.json() : [];
      const allDeposits = depositsRes.ok ? await depositsRes.json() : [];
      const logs = logsRes.ok ? await logsRes.json() : [];

      // Map loan numbers to their company branch
      const loanCompanyMap = new Map<string, string>();
      allLoans.forEach((l: any) => {
        loanCompanyMap.set(l.loanNo, (l.companyName || "XEROVA").toUpperCase());
      });

      // Filter by activeCompany
      const loans = allLoans.filter((l: any) => {
        if (activeCompany === "ALL") return true;
        const comp = (l.companyName || "XEROVA").toUpperCase();
        return comp.includes(activeCompany);
      });

      const receipts = allReceipts.filter((r: any) => {
        if (activeCompany === "ALL") return true;
        const comp = (r.companyName || loanCompanyMap.get(r.loanNo) || "XEROVA").toUpperCase();
        return comp.includes(activeCompany);
      });

      const deposits = allDeposits.filter((d: any) => {
        if (activeCompany === "ALL") return true;
        const comp = (d.companyName || "XEROVA").toUpperCase();
        return comp.includes(activeCompany);
      });

      const active = loans.filter((l: any) => l.status === "ACTIVE" || !l.status).length;
      const closed = loans.filter((l: any) => l.status === "CLOSED").length;
      const seized = loans.filter((l: any) => l.status === "SEIZED").length;

      // Outstanding principal calculates true remaining balance
      const activePrincipal = loans
        .filter((l: any) => l.status === "ACTIVE" || !l.status)
        .reduce((sum: number, l: any) => {
          const bal = l.pendingAmount !== undefined && l.pendingAmount !== null ? Number(l.pendingAmount) : Number(l.loanAmount);
          return sum + (bal || 0);
        }, 0);

      const todayStr = new Date().toLocaleDateString("en-CA");
      
      const todayReceipts = receipts.filter((r: any) => isReceiptOnDate(r, todayStr));
      const todayReceiptsSum = todayReceipts.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const todayPenaltySum = todayReceipts.reduce((sum: number, r: any) => sum + (Number(r.penaltyCollected) || 0), 0);
      
      const todayLoans = loans.filter((l: any) => isLoanOnDate(l, todayStr));
      const todayLoansSum = todayLoans.reduce((sum: number, l: any) => sum + (Number(l.loanAmount) || 0), 0);

      const totalReceiptsSum = receipts.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const activeDeposits = deposits.filter((d: any) => d.status !== "CLOSED").length;

      setStats({
        activeLoans: active,
        closedLoans: closed,
        seizedLoans: seized,
        principalBalance: activePrincipal,
        cashInHand: todayReceiptsSum,
        activeFDs: activeDeposits,
        loanAmountToday: todayLoansSum,
        todayLoanCount: todayLoans.length,
        todayCollectionAmount: todayReceiptsSum,
        todayReceiptCount: todayReceipts.length,
        todayInterestIncome: Math.round(todayReceiptsSum * 0.15) + todayPenaltySum,
        totalProfit: Math.round(totalReceiptsSum * 0.12),
        activities: Array.isArray(logs) ? logs.slice(0, 6) : []
      });

      setChartData(generateLast7DaysChart(loans, receipts));
    } catch (e) {
      console.error("Error fetching dashboard statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleQuickReprint = () => {
    if (quickReprintNo.trim()) {
      onSetReprintNo(quickReprintNo.trim());
      onNavigate("transactions");
    }
  };

  const handleCustomerSearch = () => {
    if (quickSearchTerm.trim()) {
      if (onSearchCustomer) {
        onSearchCustomer(quickSearchTerm.trim());
      } else {
        onNavigate("search");
      }
    } else {
      onNavigate("search");
    }
  };

  // EMI Calculations with safe type coercion
  const numAmount = Math.max(0, Number(emiAmount) || 0);
  const numRate = Math.max(0, Number(emiRate) || 0);
  const numMonths = Math.max(0, Number(emiMonths) || 0);
  const calcInterest = (numAmount * (numRate / 100) * numMonths) / 12;
  const calcTotalPayable = numAmount + calcInterest;
  const calcMonthlyEMI = numMonths > 0 ? Math.round(calcTotalPayable / numMonths) : 0;

  return (
    <div className="space-y-5 font-sans text-xs pb-6">
      
      {/* HEADER BAR: Node Selector & Live System Status */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <Building className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wide text-white">XEROVA Finance Control Center</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Fresh System Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time ledger overview & daily financial management node</p>
          </div>
        </div>
        
        {/* Branch / Entity Tabs & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(["ALL", "XEROVA", "MURUGAN", "TRICHY", "LAKSHA"] as const).map((branch) => (
              <button 
                key={branch}
                onClick={() => setActiveCompany(branch)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                  activeCompany === branch 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {branch === "ALL" ? "All Branches" : branch === "XEROVA" ? "XEROVA Auto" : branch}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchStats}
            title="Refresh Metrics"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* CORE HERO FINANCIAL KPIS (4 High-Impact Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Portfolio */}
        <div 
          onClick={() => onNavigate("search")}
          className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
          title="Click to view all accounts in Search"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl group-hover:bg-indigo-100/50 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Active Loans Portfolio</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{stats.activeLoans}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10.5px]">
              <span className="text-slate-500">Outstanding Principal:</span>
              <span className="font-bold text-indigo-700 font-mono">₹{stats.principalBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Today's Collections */}
        <div 
          onClick={() => onNavigate("transactions")}
          className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
          title="Click to view Transactions"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl group-hover:bg-emerald-100/50 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Today's Collections</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-emerald-700 font-mono tracking-tight">₹{stats.todayCollectionAmount.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10.5px]">
              <span className="text-slate-500">Receipts Posted:</span>
              <span className="font-bold text-emerald-800 font-mono">{stats.todayReceiptCount} Receipts</span>
            </div>
          </div>
        </div>

        {/* Today's Disbursements */}
        <div 
          onClick={() => onNavigate("pre_loan")}
          className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
          title="Click to create a New Pre-Loan"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-xl group-hover:bg-amber-100/50 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Today's Disbursements</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">₹{stats.loanAmountToday.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10.5px]">
              <span className="text-slate-500">New HP Loans:</span>
              <span className="font-bold text-amber-700 font-mono">{stats.todayLoanCount} Loans</span>
            </div>
          </div>
        </div>

        {/* Liquid Cash in Hand */}
        <div 
          onClick={() => onNavigate("transactions")}
          className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
          title="Click to view Cash Transactions"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl group-hover:bg-blue-100/50 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Liquid Cash In Hand</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <p className="text-2xl font-black text-blue-700 font-mono tracking-tight">₹{stats.cashInHand.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10.5px]">
              <span className="text-slate-500">Drawer Balance:</span>
              <span className="font-semibold text-slate-700">Daily Cash Desk</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECONDARY METRICS STRIP */}
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
        <div 
          onClick={() => onNavigate("search")}
          className="bg-white p-3 rounded-lg border border-slate-200/70 hover:border-emerald-300 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
          title="Click to view in Accounts Search"
        >
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Closed Loans</span>
            <p className="text-base font-black text-slate-800 font-mono mt-0.5">{stats.closedLoans}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500/70" />
        </div>

        <div 
          onClick={() => onNavigate("seized")}
          className="bg-white p-3 rounded-lg border border-slate-200/70 hover:border-rose-300 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
          title="Click to view Seized Vehicles"
        >
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Seized Accounts</span>
            <p className="text-base font-black text-rose-600 font-mono mt-0.5">{stats.seizedLoans}</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-rose-400/70" />
        </div>

        <div 
          onClick={() => onNavigate("deposits_view")}
          className="bg-white p-3 rounded-lg border border-slate-200/70 hover:border-indigo-300 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
          title="Click to view Fixed Deposits"
        >
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Active Fixed Deposits</span>
            <p className="text-base font-black text-slate-800 font-mono mt-0.5">{stats.activeFDs}</p>
          </div>
          <Briefcase className="h-5 w-5 text-indigo-400/70" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200/70 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Est. Interest Income</span>
            <p className="text-base font-black text-emerald-700 font-mono mt-0.5">₹{stats.todayInterestIncome.toLocaleString()}</p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-500/70" />
        </div>
      </div>

      {/* MAIN MIDDLE SECTION: 7-Day Visual Flow + Interactive EMI Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 7-DAY FINANCIAL FLOW CHART */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">7-Day Cashflow Analytics</h3>
                  <p className="text-[10px] text-slate-400">Daily breakdown of collections vs new loan disbursements</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                Live Data Stream
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDisbursements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: 11 }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Collections (₹)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollections)" />
                  <Area type="monotone" dataKey="Disbursements (₹)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorDisbursements)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Chart automatically aggregates real-time loan receipts & disbursements.</span>
            <span className="font-mono text-slate-500">Live DB Connected</span>
          </div>
        </div>

        {/* SMART EMI CALCULATOR */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Quick EMI Calculator</h3>
                <p className="text-[10px] text-slate-400">Calculate loan installments for customers</p>
              </div>
            </div>
            
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Loan Principal Amount (₹)</label>
                <input 
                  type="number" 
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 100000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Annual Interest %</label>
                  <input 
                    type="number" 
                    value={emiRate}
                    onChange={(e) => setEmiRate(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 14"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Tenure (Months)</label>
                  <input 
                    type="number" 
                    value={emiMonths}
                    onChange={(e) => setEmiMonths(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
                  />
                </div>
              </div>

              {/* EMI Calculation Summary Box */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 mt-4 space-y-2 select-none shadow-sm">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                  <span>Interest Component:</span>
                  <span className="font-mono text-slate-300 font-bold">₹{Math.round(calcInterest).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                  <span>Total Payable:</span>
                  <span className="font-mono text-slate-300 font-bold">₹{Math.round(calcTotalPayable).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-bold text-indigo-300">Monthly EMI:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">₹{calcMonthlyEMI.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[9px] text-slate-400">Flat interest vehicle rate</p>
            <button 
              onClick={() => onNavigate("pre_loan")}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Apply to Pre-Loan <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Launcher Bar & Quick Search & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* QUICK LAUNCHER TILES */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers className="h-4.5 w-4.5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Quick Operational Launcher</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={() => onNavigate("pre_loan")}
                className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700 text-xs">New Pre-Loan</span>
                  <PlusCircle className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-[9.5px] text-slate-500">Create loan application</p>
              </button>

              <button 
                onClick={() => onNavigate("ledger_entry")}
                className="p-3 bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 group-hover:text-emerald-700 text-xs">Post Collection</span>
                  <Banknote className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <p className="text-[9.5px] text-slate-500">Record cash receipt</p>
              </button>

              <button 
                onClick={() => onNavigate("search")}
                className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700 text-xs">Search Accounts</span>
                  <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-[9.5px] text-slate-500">Lookup HPL & vehicle</p>
              </button>

              <button 
                onClick={() => onNavigate("transactions")}
                className="p-3 bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 group-hover:text-amber-700 text-xs">Transactions</span>
                  <FileText className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <p className="text-[9.5px] text-slate-500">View payment history</p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Operational Quick Access • Active Node
          </div>
        </div>

        {/* FAST REPRINT & SEARCH WIDGET */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Printer className="h-4.5 w-4.5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Fast Receipt Reprint & Search</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Enter Receipt Number</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. REC-10001" 
                    value={quickReprintNo}
                    onChange={(e) => setQuickReprintNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickReprint();
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={handleQuickReprint}
                    disabled={!quickReprintNo.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Reprint
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Quick Account / Vehicle Search</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="e.g. HP-2026 or TN-01 or Name" 
                    value={quickSearchTerm}
                    onChange={(e) => setQuickSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCustomerSearch();
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={handleCustomerSearch}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Search className="h-3.5 w-3.5 text-indigo-400" />
                    Find
                  </button>
                </div>

                <button 
                  onClick={() => onNavigate("search")}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg transition-colors text-[10px] tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Open Full Filter Search
                </button>
              </div>
            </div>
          </div>

          <p className="text-[9.5px] text-slate-400 text-center mt-3">Instant receipt lookup across all branches.</p>
        </div>

        {/* SYSTEM AUDIT FEED */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">System Audit Feed</h3>
              </div>
              <span className="text-[9px] font-mono text-slate-400 font-medium">Live Activity</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stats.activities.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <CheckCircle className="h-6 w-6 text-emerald-500/50 mx-auto mb-1" />
                  <p className="text-[11px]">System ready. No audit entries logged yet.</p>
                </div>
              ) : (
                stats.activities.map((act: any) => {
                  const isReceipt = act.action?.includes("RECEIPT");
                  const isLoan = act.action?.includes("LOAN");
                  return (
                    <div key={act.id || act._id} className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-bold uppercase font-mono px-1.5 py-0.2 rounded text-[9px] ${
                          isReceipt 
                            ? "bg-emerald-100 text-emerald-800" 
                            : isLoan 
                              ? "bg-indigo-100 text-indigo-800" 
                              : "bg-slate-200 text-slate-700"
                        }`}>
                          {act.action}
                        </span>
                        <span className="text-slate-400 text-[9px] font-mono">
                          {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate mt-0.5">{act.details || "System action logged"}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[9.5px] text-slate-400 text-center">
            Encrypted activity trail powered by Xerova Audit Node.
          </div>
        </div>

      </div>

    </div>
  );
}
