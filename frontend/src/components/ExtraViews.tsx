/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  PiggyBank, ShieldCheck, MapPin, Landmark, Coins, Scale, FileText, 
  UserCheck, AlertTriangle, Play, CheckCircle2, ChevronRight, Map, 
  Navigation, Check, Plus, Search, Calendar, DollarSign, RefreshCw,
  Printer, X, Receipt, ArrowDownRight, ArrowUpRight, History, Award
} from "lucide-react";
import { InteractiveWebMap } from "./InteractiveWebMap";

// ============================================================================
// 1. DEPOSITS VIEW
// ============================================================================
export function DepositsView() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    depositorName: "",
    phone: "",
    amount: "100000",
    rate: "8.5",
    months: "12",
    remarks: "Branch fixed reserve certificate"
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deposits");
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Real-time calculated maturity values
  const numAmount = Number(formData.amount) || 0;
  const numRate = Number(formData.rate) || 0;
  const numMonths = Number(formData.months) || 12;
  const calcInterest = Math.round((numAmount * numRate * (numMonths / 12)) / 100);
  const calcMaturity = numAmount + calcInterest;
  const calcMaturityDate = new Date(Date.now() + numMonths * 30.44 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.depositorName || !formData.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositorName: formData.depositorName,
          phone: formData.phone || "N/A",
          amount: numAmount,
          interestRate: numRate,
          durationMonths: numMonths,
          maturityAmount: calcMaturity,
          maturityDate: calcMaturityDate,
          remarks: formData.remarks,
          date: new Date().toISOString().split("T")[0]
        })
      });
      if (res.ok) {
        setFormData({ 
          depositorName: "", 
          phone: "", 
          amount: "100000", 
          rate: "8.5", 
          months: "12", 
          remarks: "Branch fixed reserve certificate" 
        });
        fetchDeposits();
        alert("Fixed Deposit certificate booked and registered in branch books!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidate = async (dep: any) => {
    const defaultPayout = dep.maturityAmount || Math.round(dep.amount * (1 + (dep.interestRate / 100) * (dep.durationMonths / 12)));
    if (!window.confirm(`Liquidate & Close Fixed Deposit ${dep.id} for ${dep.depositorName}?\nPrincipal: ₹${dep.amount?.toLocaleString()}\nSettlement Payout: ₹${defaultPayout.toLocaleString()}`)) {
      return;
    }
    try {
      const res = await fetch(`/api/deposits/${dep.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closedPayout: defaultPayout })
      });
      if (res.ok) {
        fetchDeposits();
        alert(`Fixed Deposit ${dep.id} closed and payout logged!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI Calculations
  const activeDeposits = deposits.filter(d => d.status !== "WITHDRAWN");
  const totalPrincipal = activeDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalMaturity = activeDeposits.reduce((sum, d) => sum + Number(d.maturityAmount || (d.amount * (1 + (d.interestRate || 8.5) / 100 * (d.durationMonths || 12) / 12))), 0);
  const avgRate = activeDeposits.length > 0 
    ? (activeDeposits.reduce((sum, d) => sum + Number(d.interestRate || 8.5), 0) / activeDeposits.length).toFixed(1)
    : "8.5";

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Top Level Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Deposit Capital</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">₹{totalPrincipal.toLocaleString()}</p>
          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3" /> Branch Lending Backing
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guaranteed Maturity Return</p>
          <p className="text-lg font-black text-indigo-700 font-mono mt-1">₹{Math.round(totalMaturity).toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">
            Accrued Liability Total
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active FD Certificates</p>
          <p className="text-lg font-black text-slate-800 font-mono mt-1">{activeDeposits.length}</p>
          <span className="text-[9px] text-slate-400 mt-0.5 block">
            {deposits.length - activeDeposits.length} Liquidated
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted Interest Rate</p>
          <p className="text-lg font-black text-amber-600 font-mono mt-1">{avgRate}% <span className="text-xs font-semibold text-slate-400">p.a.</span></p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">
            Fixed Simple Payout
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Book FD Form Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3.5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <PiggyBank className="h-4.5 w-4.5 text-indigo-600" />
              Book Fixed Deposit (FD)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Accept branch deposit capital to balance active Hire-Purchase lending books.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Depositor Full Name</label>
              <input 
                type="text" required placeholder="e.g. Shanmuga Sundaram"
                value={formData.depositorName}
                onChange={(e) => setFormData({...formData, depositorName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Contact Phone</label>
              <input 
                type="tel" placeholder="e.g. 98401 22345"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Principal Amount (₹)</label>
                <input 
                  type="number" required placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none focus:border-indigo-500 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Interest (p.a %)</label>
                <input 
                  type="number" step="0.1" required
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none font-bold text-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Lock-In Tenure (Months)</label>
              <select 
                value={formData.months}
                onChange={(e) => setFormData({...formData, months: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none cursor-pointer font-medium"
              >
                <option value="6">6 Months (Half Yearly)</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="24">24 Months (2 Years)</option>
                <option value="36">36 Months (3 Years)</option>
                <option value="60">60 Months (5 Years)</option>
              </select>
            </div>

            {/* Live Interactive Maturity Preview Card */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 space-y-1.5 select-none">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-indigo-900 font-bold uppercase flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-indigo-600" /> Projected Maturity
                </span>
                <span className="font-mono text-indigo-600 font-bold">{calcMaturityDate}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-indigo-700">Total Return:</span>
                <span className="text-sm font-black font-mono text-indigo-900">₹{calcMaturity.toLocaleString()}</span>
              </div>
              <p className="text-[9px] text-indigo-600/80 italic">
                Principal ₹{numAmount.toLocaleString()} + Accrued Interest ₹{calcInterest.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Audit Remarks</label>
              <input 
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none"
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition-colors shadow-sm cursor-pointer uppercase tracking-wider text-[11px]"
            >
              {loading ? "Registering FD..." : "Confirm Book Deposit"}
            </button>
          </form>
        </div>

        {/* Portfolio Table Panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm lg:col-span-2 flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center select-none">
            <h3 className="font-bold text-slate-800 uppercase text-xs">Active Fixed Deposits Portfolio</h3>
            <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-0.5 rounded font-mono">
              {deposits.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider select-none">
                  <th className="px-3.5 py-2.5">Date / Cert</th>
                  <th className="px-3.5 py-2.5">Depositor Info</th>
                  <th className="px-3.5 py-2.5 text-right">Principal</th>
                  <th className="px-3.5 py-2.5 text-center">Rate / Term</th>
                  <th className="px-3.5 py-2.5 text-right">Maturity Return</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-[11px] text-slate-600">
                {deposits.map((dep: any) => {
                  const isWithdrawn = dep.status === "WITHDRAWN";
                  const maturity = dep.maturityAmount || Math.round(Number(dep.amount || 0) * (1 + (Number(dep.interestRate || 8.5) / 100) * (Number(dep.durationMonths || 12) / 12)));
                  return (
                    <tr key={dep.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-3">
                        <p className="font-mono text-slate-800 font-bold text-[10px]">{dep.id}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{dep.date || dep.startDate}</p>
                      </td>
                      <td className="px-3.5 py-3">
                        <p className="font-bold text-slate-800">{dep.depositorName}</p>
                        <p className="text-[10px] text-slate-400 font-normal italic leading-none">{dep.phone && dep.phone !== "N/A" ? dep.phone : dep.remarks}</p>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(dep.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <span className="font-mono text-indigo-600 font-bold">{dep.interestRate || 8.5}%</span>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{dep.durationMonths || 12}M</p>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <p className="font-mono font-bold text-emerald-700">₹{maturity.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{dep.maturityDate || "Maturity Due"}</p>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isWithdrawn ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {isWithdrawn ? "WITHDRAWN" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedCert(dep)}
                            title="Print FD Certificate"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          {!isWithdrawn && (
                            <button 
                              onClick={() => handleLiquidate(dep)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Liquidate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 italic font-semibold">
                      No fixed deposit certificates registered. Use the left form to book.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Fixed Deposit Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center select-none">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" /> Fixed Deposit Certificate
              </span>
              <button onClick={() => setSelectedCert(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 printable-print-block">
              <div className="border-4 border-double border-indigo-900/20 p-5 rounded-lg space-y-4 bg-amber-50/20">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h2 className="text-base font-black text-indigo-950 uppercase tracking-tight">XEROVA AUTO FINANCE LIMITED</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Incorporated under NBFC / Auxiliary Credit Registry • Vellore HQ</p>
                  <p className="text-[10px] font-mono font-bold text-indigo-800 mt-1 uppercase">FIXED DEPOSIT RECEIPT / CERTIFICATE</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Certificate No</span>
                    <span className="font-mono font-black text-slate-900">{selectedCert.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Issue Date</span>
                    <span className="font-mono font-bold text-slate-800">{selectedCert.date || selectedCert.startDate}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                  <p className="text-slate-600 text-xs">
                    Received with thanks from: <strong className="text-slate-900 text-sm">{selectedCert.depositorName}</strong>
                  </p>
                  <p className="text-slate-600 text-xs">
                    The Principal Sum of: <strong className="text-indigo-950 font-mono text-sm">₹{Number(selectedCert.amount || 0).toLocaleString()}</strong>
                  </p>
                  <p className="text-slate-600 text-xs">
                    Lock-In Tenure: <strong className="text-slate-900">{selectedCert.durationMonths || 12} Months</strong> @ <strong className="text-indigo-700">{selectedCert.interestRate || 8.5}% p.a.</strong>
                  </p>
                  <div className="border-t border-dashed border-slate-200 pt-1.5 mt-1.5 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-700 uppercase">Guaranteed Maturity Return:</span>
                    <span className="text-base font-black font-mono text-emerald-800">
                      ₹{(selectedCert.maturityAmount || Math.round(Number(selectedCert.amount || 0) * (1 + (Number(selectedCert.interestRate || 8.5) / 100) * (Number(selectedCert.durationMonths || 12) / 12)))).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Maturity Expiry Date: {selectedCert.maturityDate || "Upon Demand"}
                  </p>
                </div>

                <div className="grid grid-cols-2 pt-4 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300">
                  <div>
                    <div className="h-6"></div>
                    <p className="border-t border-slate-400 pt-1 font-bold text-slate-700">Depositor Signature</p>
                  </div>
                  <div>
                    <div className="h-6 flex items-center justify-center">
                      <span className="text-[8px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded font-mono">SEAL & VERIFIED</span>
                    </div>
                    <p className="border-t border-slate-400 pt-1 font-bold text-slate-700">Authorized Branch Officer</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded font-bold text-xs uppercase"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 uppercase shadow-sm cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 2. BINDING LOAN AGREEMENT VIEW
// ============================================================================
export function BindingLoanView() {
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanNo, setSelectedLoanNo] = useState("");
  const [isBound, setIsBound] = useState(false);
  const [agreeBorrower, setAgreeBorrower] = useState(false);
  const [agreeGuarantor, setAgreeGuarantor] = useState(false);
  const [agreeManager, setAgreeManager] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBindAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanNo || !agreeBorrower || !agreeGuarantor || !agreeManager) {
      alert("Please check all signature execution declarations to bind the HP agreement!");
      return;
    }
    setIsBound(true);
    alert("HP Agreement executed legally under Indian Contract Act 1872! Stamp paper generated.");
  };

  const activeLoan = loans.find(l => l.loanNo === selectedLoanNo);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm max-w-3xl mx-auto space-y-4 font-sans text-xs">
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Scale className="h-4.5 w-4.5 text-indigo-600" />
          Hire-Purchase Agreement Binding & Execution
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Legally execute loan agreement documents between the borrower, guarantors, and the authorized branch signatory.</p>
      </div>

      <form onSubmit={handleBindAgreement} className="space-y-4">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Select Active Ledger Account</label>
          <select 
            value={selectedLoanNo}
            required
            onChange={(e) => { setSelectedLoanNo(e.target.value); setIsBound(false); }}
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-700"
          >
            <option value="">-- Select Active Borrower Ledger --</option>
            {loans.map(l => (
              <option key={l.loanNo} value={l.loanNo}>{l.loanNo} - {l.customer?.name} ({l.vehicle?.vehicleName})</option>
            ))}
          </select>
        </div>

        {activeLoan && (
          <div className="border border-amber-200 rounded bg-amber-50/50 p-4 space-y-3">
            {/* Stamp Paper simulation header */}
            <div className="text-center border-b border-amber-300 pb-3 space-y-1">
              <span className="text-[14px] font-bold text-amber-800 tracking-widest font-mono uppercase">INDIA NON JUDICIAL</span>
              <p className="text-[10px] font-mono text-amber-600 font-bold">TAMIL NADU GOVERNMENT - SECURITIES AND ASSETS RECOVERY</p>
              <div className="inline-block border border-amber-400 text-[9px] font-mono font-bold text-amber-800 bg-amber-100/50 px-3 py-1">
                STAMP DUTY DECLARED: ₹100 • REF: IN-TN{Date.now().toString().slice(-6)}
              </div>
            </div>

            <div className="space-y-2 text-slate-700 leading-normal font-semibold text-[10.5px]">
              <p>This <b>HIRE-PURCHASE DEED OF CONTRACT</b> is executed on this <b>{activeLoan.hpDate}</b> at XEROVA AUTO FINANCE CORP, Madurai, between:</p>
              <p><b>1. THE HIRER (Borrower):</b> <b>{activeLoan.customer?.name}</b>, residing at <i>{activeLoan.customer?.address || "Address not provided"}</i>.</p>
              <p><b>2. THE GUARANTOR (Co-obligant):</b> <b>{activeLoan.coObligants?.[0]?.name || "N/A"}</b>, residing at <i>{activeLoan.coObligants?.[0]?.address || "N/A"}</i>.</p>
              <p><b>3. THE OWNER (Financier):</b> <b>XEROVA AUTO FINANCE CORP</b>, Madurai Authorized Branch Manager.</p>

              <div className="bg-white border p-3 rounded text-[9.5px] font-mono text-slate-600 space-y-1 mt-3">
                <p><b>COLLATERAL VEHICLE SPECS:</b></p>
                <p>• Vehicle Classification: {activeLoan.vehicle?.vehicleType}</p>
                <p>• Model Brand/Model Name: {activeLoan.vehicle?.vehicleName}</p>
                <p>• Registered Plate Number: {activeLoan.vehicle?.rcNo}</p>
                <p>• Chassis Serial Number: {activeLoan.vehicle?.chassisNo}</p>
                <p>• Engine Serial Number: {activeLoan.vehicle?.engineNo}</p>
                <p>• Agreed HP Asset Valuation: ₹{activeLoan.totalDueAmount?.toLocaleString()}</p>
              </div>

              <div className="space-y-1 pt-2">
                <p><b>CORE RECOVERY COVENANTS:</b></p>
                <p>a. The Financier extends credit of <b>₹{activeLoan.loanAmount?.toLocaleString()}</b> over <b>{activeLoan.durationMonths} Months</b> duration.</p>
                <p>b. Default in 2 or more successive EMIs authorizes physical repossession/seizure of vehicle coordinates without notification.</p>
                <p>c. Delinquent accounts accrue default per day surcharge rate of <b>₹{activeLoan.penaltyRatePerDay || 5}/day</b>.</p>
              </div>
            </div>

            {/* Signature Pad checkbox simulators */}
            {!isBound ? (
              <div className="bg-white border border-slate-200 rounded p-4.5 space-y-3.5 mt-3 shadow-inner">
                <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Deed Verification & Digital Signature Sign-Off</h4>
                <div className="space-y-2.5 font-sans">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" checked={agreeBorrower}
                      onChange={(e) => setAgreeBorrower(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10.5px] text-slate-600 font-semibold">I, <b>{activeLoan.customer?.name}</b> (Hirer), accept Hire-Purchase terms and digitally witness my consent.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" checked={agreeGuarantor}
                      onChange={(e) => setAgreeGuarantor(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10.5px] text-slate-600 font-semibold">I, <b>{activeLoan.coObligants?.[0]?.name || "Guarantor on File"}</b> (Co-obligant), agree to serve as absolute backup guarantor.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" checked={agreeManager}
                      onChange={(e) => setAgreeManager(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10.5px] text-slate-600 font-semibold">I, Authorized Signatory, execute this transaction for XEROVA AUTO FINANCE CORP.</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded transition-colors text-xs shadow-md uppercase tracking-wider cursor-pointer mt-3"
                >
                  Legally Bind Contract
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center text-green-800 mt-3 space-y-2">
                <p className="font-bold text-sm flex items-center justify-center gap-1.5 uppercase">
                  <CheckCircle2 className="h-5.5 w-5.5 text-green-600" />
                  Agreement Binding Completed Successfully!
                </p>
                <p className="text-[10px] font-semibold text-green-700">Digital signature tokens stored at: <span className="font-mono text-[9px] bg-white border px-1.5 rounded text-green-800">TX-HASH-{Date.now()}</span></p>
                <p className="text-[9px] text-slate-400 font-semibold">This contract is locked and registered with the regional automobile registry (RTO).</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ============================================================================
// 3. HAND LOAN PAYMENT POSTING VIEW
// ============================================================================
export function HLPaymentView() {
  const [handloans, setHandloans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pay" | "advance">("pay");
  const [selectedHlId, setSelectedHlId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [selectedLedgerHl, setSelectedLedgerHl] = useState<any | null>(null);

  // New Hand Loan Advance Form State
  const [advanceForm, setAdvanceForm] = useState({
    customerName: "",
    phone: "",
    amount: "25000",
    promisedReturnDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    remarks: "Counter auxiliary advance - 30 days return"
  });

  useEffect(() => {
    fetchHandloans();
  }, []);

  const fetchHandloans = async () => {
    try {
      const res = await fetch("/api/handloans");
      if (res.ok) {
        const data = await res.json();
        setHandloans(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedHl = handloans.find(h => h.id === selectedHlId);
  const selectedHlPaid = selectedHl 
    ? Number(selectedHl.repaidAmount ?? selectedHl.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0)
    : 0;
  const selectedHlBalance = selectedHl 
    ? Math.max(0, Number(selectedHl.amount || 0) - selectedHlPaid)
    : 0;

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHlId || !payAmount) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/handloans/${selectedHlId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payAmount),
          remarks: payRemarks || "Counter Cash Repayment"
        })
      });
      if (res.ok) {
        setPayAmount("");
        setPayRemarks("");
        fetchHandloans();
        alert("Hand loan repayment posted and balanced in auxiliary ledger!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceForm.customerName || !advanceForm.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/handloans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: advanceForm.customerName,
          borrowerName: advanceForm.customerName,
          phone: advanceForm.phone || "N/A",
          amount: Number(advanceForm.amount),
          promisedReturnDate: advanceForm.promisedReturnDate,
          remarks: advanceForm.remarks,
          givenDate: new Date().toISOString().split("T")[0]
        })
      });
      if (res.ok) {
        setAdvanceForm({
          customerName: "",
          phone: "",
          amount: "25000",
          promisedReturnDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
          remarks: "Counter auxiliary advance - 30 days return"
        });
        fetchHandloans();
        setActiveTab("pay");
        alert("New auxiliary hand loan advance issued and registered in logbook!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalAdvanced = handloans.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  const totalRepaid = handloans.reduce((sum, h) => {
    const paid = Number(h.repaidAmount ?? h.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0);
    return sum + paid;
  }, 0);
  const totalOutstanding = Math.max(0, totalAdvanced - totalRepaid);
  const activeCount = handloans.filter(h => {
    const paid = Number(h.repaidAmount ?? h.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0);
    return (Number(h.amount) || 0) > paid && h.status !== "PAID";
  }).length;

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Top Level Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hand Loans Disbursed</p>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">₹{totalAdvanced.toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">
            Auxiliary Cash Capital
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Repayments Collected</p>
          <p className="text-lg font-black text-emerald-700 font-mono mt-1">₹{totalRepaid.toLocaleString()}</p>
          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3" /> Recovered to Date
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Auxiliary Balance Due</p>
          <p className="text-lg font-black text-amber-600 font-mono mt-1">₹{totalOutstanding.toLocaleString()}</p>
          <span className="text-[9px] text-amber-700 font-medium mt-0.5 block">
            Outstanding Counter Dues
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Borrowers</p>
          <p className="text-lg font-black text-indigo-700 font-mono mt-1">{activeCount}</p>
          <span className="text-[9px] text-slate-400 mt-0.5 block">
            {handloans.length - activeCount} Fully Settled
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Interactive Operations Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3.5">
          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-indigo-600" />
                Hand Loan Desk
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage zero-interest auxiliary short-term counter advances.</p>
            </div>
            
            {/* Tab Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 select-none">
              <button 
                onClick={() => setActiveTab("pay")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeTab === "pay" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Repayment
              </button>
              <button 
                onClick={() => setActiveTab("advance")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeTab === "advance" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                New Loan
              </button>
            </div>
          </div>

          {/* Mode 1: Post Repayment Form */}
          {activeTab === "pay" && (
            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Select Active Borrower</label>
                <select 
                  value={selectedHlId}
                  required
                  onChange={(e) => setSelectedHlId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded p-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Account --</option>
                  {handloans.filter(hl => {
                    const paid = Number(hl.repaidAmount ?? hl.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0);
                    return (Number(hl.amount) || 0) > paid && hl.status !== "PAID";
                  }).map(hl => {
                    const paid = Number(hl.repaidAmount ?? hl.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0);
                    const due = Math.max(0, Number(hl.amount || 0) - paid);
                    return (
                      <option key={hl.id} value={hl.id}>
                        {hl.loanNo} - {hl.customerName || hl.borrowerName} (Balance: ₹{due.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Borrower Details Preview */}
              {selectedHl && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Initial Advance:</span>
                    <strong className="font-mono text-slate-900">₹{Number(selectedHl.amount || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Already Repaid:</span>
                    <strong className="font-mono">₹{selectedHlPaid.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-rose-700 border-t border-slate-200 pt-1 font-bold">
                    <span>Remaining Balance:</span>
                    <strong className="font-mono text-xs">₹{selectedHlBalance.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Post Pay Amount (₹)</label>
                <input 
                  type="number" required placeholder="₹"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Payment Receipt Remarks</label>
                <input 
                  type="text" placeholder="e.g. Counter Cash Settlement..."
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition-colors shadow-sm cursor-pointer uppercase tracking-wider text-[11px]"
              >
                {loading ? "Posting payment..." : "Commit HL Repayment"}
              </button>
            </form>
          )}

          {/* Mode 2: Issue New Hand Loan Form */}
          {activeTab === "advance" && (
            <form onSubmit={handleAdvanceSubmit} className="space-y-3">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Borrower Client Name</label>
                <input 
                  type="text" required placeholder="e.g. K. Arulmurugan"
                  value={advanceForm.customerName}
                  onChange={(e) => setAdvanceForm({...advanceForm, customerName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Contact Phone</label>
                <input 
                  type="tel" placeholder="e.g. 94432 10987"
                  value={advanceForm.phone}
                  onChange={(e) => setAdvanceForm({...advanceForm, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Advance Amount (₹)</label>
                  <input 
                    type="number" required placeholder="Amount"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none focus:border-indigo-500 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Promised Return</label>
                  <input 
                    type="date" required
                    value={advanceForm.promisedReturnDate}
                    onChange={(e) => setAdvanceForm({...advanceForm, promisedReturnDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-mono focus:outline-none text-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-0.5">Purpose / Terms</label>
                <input 
                  type="text"
                  value={advanceForm.remarks}
                  onChange={(e) => setAdvanceForm({...advanceForm, remarks: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition-colors shadow-sm cursor-pointer uppercase tracking-wider text-[11px]"
              >
                {loading ? "Recording Advance..." : "Authorize HL Advance"}
              </button>
            </form>
          )}
        </div>

        {/* Right Logbook Table Panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm lg:col-span-2 flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center select-none">
            <h3 className="font-bold text-slate-800 uppercase text-xs">Auxiliary Hand Loans Logbook</h3>
            <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2 py-0.5 rounded font-mono">
              {handloans.length} Accounts
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider select-none">
                  <th className="px-3.5 py-2.5">A/C No</th>
                  <th className="px-3.5 py-2.5">Borrower Details</th>
                  <th className="px-3.5 py-2.5 text-right">Advance HL</th>
                  <th className="px-3.5 py-2.5 text-right">Repaid to Date</th>
                  <th className="px-3.5 py-2.5 text-right">Balance Due</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-[11px] text-slate-600">
                {handloans.map((hl: any) => {
                  const paid = Number(hl.repaidAmount ?? hl.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) ?? 0);
                  const balance = Math.max(0, (Number(hl.amount) || 0) - paid);
                  const isPaid = balance === 0 || hl.status === "PAID";

                  return (
                    <tr key={hl.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold text-slate-800 text-[10px] block">{hl.loanNo || hl.id}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{hl.givenDate || "Direct"}</span>
                      </td>
                      <td className="px-3.5 py-3">
                        <p className="font-bold text-slate-800">{hl.customerName || hl.borrowerName}</p>
                        <p className="text-[10px] text-slate-400 font-normal italic leading-none">{hl.phone && hl.phone !== "N/A" ? hl.phone : hl.remarks}</p>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-800">₹{Number(hl.amount || 0).toLocaleString()}</td>
                      <td className="px-3.5 py-3 text-right font-mono text-emerald-600">₹{paid.toLocaleString()}</td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">₹{balance.toLocaleString()}</td>
                      <td className="px-3.5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {isPaid ? "PAID / SETTLED" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button 
                              onClick={() => {
                                setSelectedHlId(hl.id);
                                setActiveTab("pay");
                                setPayAmount(String(balance));
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Repay
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedLedgerHl(hl)}
                            title="View Payment Ledger History"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {handloans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 italic font-semibold">
                      No auxiliary hand loan ledgers recorded. Use the left form to issue advances.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hand Loan Repayments Ledger History Modal */}
      {selectedLedgerHl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center select-none">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-indigo-400" /> Auxiliary Repayments Ledger
              </span>
              <button onClick={() => setSelectedLedgerHl(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Borrower:</span>
                  <strong className="text-slate-900">{selectedLedgerHl.customerName || selectedLedgerHl.borrowerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLedgerHl.loanNo || selectedLedgerHl.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Advance:</span>
                  <span className="font-mono font-bold text-slate-900">₹{Number(selectedLedgerHl.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Repayment Transaction Logs</h4>
                <div className="max-h-[220px] overflow-y-auto space-y-1.5">
                  {selectedLedgerHl.payments && selectedLedgerHl.payments.length > 0 ? (
                    selectedLedgerHl.payments.map((p: any, idx: number) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded flex justify-between items-center text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-800 text-[10px]">{p.receiptNo || `RCP-${idx + 1}`}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5">{p.remarks || "Counter Repayment"}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{p.date}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-800 text-sm">₹{Number(p.amount).toLocaleString()}</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded block mt-0.5 uppercase">VERIFIED</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 italic text-[11px] border border-dashed rounded-lg">
                      No repayments recorded against this advance yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedLedgerHl(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded font-bold text-xs uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 4. PENDING LISTS VIEW
// ============================================================================
interface PendingListViewProps {
  onViewLoan?: (loanNo: string) => void;
  onCollect?: (loanNo: string) => void;
}

export function PendingListView({ onViewLoan, onCollect }: PendingListViewProps = {}) {
  const [items, setItems] = useState<any[]>([
    { id: 1, type: "RC_BOOK", desc: "Original Smart Card RC pending collection from showroom dealer", party: "Thangavel M", loanNo: "TN23-HFL-8104", age: "12 Days overdue", severity: "HIGH" },
    { id: 2, type: "STENCIL", desc: "Physical yard chassis/engine pencil stencils missing from folder", party: "Murugan S", loanNo: "TN23-HFL-9041", age: "3 Days overdue", severity: "MEDIUM" },
    { id: 3, type: "GPS_ALERT", desc: "GPS tracking device coordinates transmission silent for 48 hours", party: "Ganesh Babu", loanNo: "TN23-HFL-2305", age: "Emergency alert", severity: "CRITICAL" },
    { id: 4, type: "LOAN_BIND", desc: "Aadhaar e-KYC digital deed pending execution from co-obligant", party: "Latha Ramesh", loanNo: "TN23-HFL-7014", age: "6 Days overdue", severity: "MEDIUM" },
    { id: 5, type: "INSURANCE", desc: "Vehicle smart insurance coverage renewal certificate pending update", party: "Rajesh Kumar", loanNo: "TN23-HFL-3022", age: "FC imminent", severity: "HIGH" }
  ]);

  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("severity");

  useEffect(() => {
    fetchOverdueLoans();
  }, []);

  const fetchOverdueLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (!res.ok) return;
      const loans = await res.json();
      const today = new Date().toISOString().split("T")[0];
      const overdueFromLoans: any[] = [];
      
      loans.forEach((l: any, i: number) => {
        if (l.status === "ACTIVE" || l.status === "SEIZED") {
          const overdueInsts = (l.installments || []).filter((inst: any) => inst.status !== "PAID" && inst.dueDate < today);
          const totalOverdue = overdueInsts.reduce((sum: number, inst: any) => sum + (Number(inst.emiAmount) - Number(inst.paidAmount || 0)), 0);
          
          if (overdueInsts.length > 0 || l.status === "SEIZED" || (l.pendingAmount > 0 && l.installments?.length > 0)) {
            overdueFromLoans.push({
              id: 100 + i,
              type: l.status === "SEIZED" ? "SEIZED_ASSET" : "OVERDUE_EMI",
              desc: `${overdueInsts.length > 0 ? `${overdueInsts.length} EMI installment(s) past due date.` : "Active account with pending balance."} Outstanding balance: ₹${(l.pendingAmount || totalOverdue).toLocaleString()}. Vehicle: ${l.vehicle?.vehicleName || "Vehicle"} (${l.vehicle?.rcNo || "N/A"})`,
              party: l.customer?.name || "Customer",
              loanNo: l.loanNo,
              age: overdueInsts.length > 0 ? `${overdueInsts.length} EMI due` : "Active Ledger",
              severity: l.status === "SEIZED" || overdueInsts.length >= 3 ? "CRITICAL" : overdueInsts.length >= 2 ? "HIGH" : "MEDIUM",
              isRealLoan: true
            });
          }
        }
      });
      
      if (overdueFromLoans.length > 0) {
        setItems(prev => [...overdueFromLoans, ...prev.filter(p => !p.isRealLoan)]);
      }
    } catch (e) {
      console.error("Error loading overdue loans:", e);
    }
  };

  const handleDismiss = (id: number) => {
    setItems(items.filter(it => it.id !== id));
    alert("Checklist compliance item resolved successfully and posted to branch audit trail logs!");
  };

  const filteredItems = items
    .filter(it => filterType === "ALL" || it.type === filterType)
    .filter(it => 
      it.party.toLowerCase().includes(searchQuery.toLowerCase()) || 
      it.loanNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
      it.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Simple severity sorting
  const severityValue = (sev: string) => {
    if (sev === "CRITICAL") return 3;
    if (sev === "HIGH") return 2;
    return 1;
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === "severity") {
      return severityValue(b.severity) - severityValue(a.severity);
    }
    return a.party.localeCompare(b.party);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 font-sans text-xs">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
            Branch Operations & Overdue Debt Checklist
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Real-time compilation of delinquent accounts, pending compliance files, missing physical documents, or yard stencils requiring field enforcement.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 font-bold px-2 py-1 rounded font-mono">
            {items.length} critical items remaining
          </span>
        </div>
      </div>

      {/* Smart Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "OVERDUE_EMI", "SEIZED_ASSET", "RC_BOOK", "STENCIL", "GPS_ALERT", "LOAN_BIND", "INSURANCE"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                filterType === t 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded px-2 py-1 flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Search className="h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search party or A/C..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[10px] text-slate-700 font-semibold focus:outline-none w-36"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-white border border-slate-200 rounded text-[10px] p-1 font-bold text-slate-700 focus:outline-none"
          >
            <option value="severity">Sort: Criticality</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedItems.map(it => (
          <div key={it.id} className="border border-slate-200 rounded-lg p-3.5 bg-white hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative overflow-hidden">
            {/* Top color tag for visual weight */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              it.severity === "CRITICAL" ? "bg-rose-500" :
              it.severity === "HIGH" ? "bg-amber-500" : "bg-blue-400"
            }`} />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded font-bold text-[8.5px] uppercase font-mono border ${
                  it.type === "OVERDUE_EMI" ? "bg-rose-50 text-rose-700 border-rose-200 font-bold" :
                  it.type === "SEIZED_ASSET" ? "bg-red-50 text-red-800 border-red-200 font-bold" :
                  it.type === "GPS_ALERT" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                  it.type === "RC_BOOK" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  it.type === "STENCIL" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {it.type.replace("_", " ")}
                </span>
                <span className="text-[9px] text-slate-400 font-mono font-bold italic">{it.age}</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-[11.5px]">{it.party}</h4>
                <p className="text-[10px] text-indigo-600 font-mono font-bold leading-none mt-0.5">{it.loanNo}</p>
              </div>
              <p className="text-slate-600 leading-relaxed font-semibold text-[11px]">{it.desc}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                it.severity === "CRITICAL" ? "bg-red-100 text-red-800" :
                it.severity === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
              }`}>
                {it.severity}
              </span>
              
              <div className="flex items-center gap-1.5">
                {it.isRealLoan && onViewLoan && (
                  <button 
                    onClick={() => onViewLoan(it.loanNo)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1 px-2 rounded transition-colors cursor-pointer"
                  >
                    View Ledger
                  </button>
                )}
                {it.isRealLoan && onCollect && (
                  <button 
                    onClick={() => onCollect(it.loanNo)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1 px-2.5 rounded transition-colors cursor-pointer"
                  >
                    Collect
                  </button>
                )}
                {!it.isRealLoan && (
                  <button 
                    onClick={() => handleDismiss(it.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1 px-3 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {sortedItems.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400 space-y-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">No matching items found.</p>
            <p className="text-[10px]">All branch compliance workflows are in pristine state.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. GOOGLE MAPS LOCATOR VIEW
// ============================================================================
export function GoogleLocatorView() {
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanNo, setSelectedLoanNo] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState("12.9234");
  const [gpsLongitude, setGpsLongitude] = useState("79.1345");
  const [gpsAddress, setGpsAddress] = useState("Katpadi Road, Opp. VIT Main Gate, Vellore, Tamil Nadu 632014");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [phoneAlertSent, setPhoneAlertSent] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [showRouting, setShowRouting] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [zoomLevel, setZoomLevel] = useState(15);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [vehicles, setVehicles] = useState([
    { id: 1, plate: "TN-23-AB-9876", name: "TVS King Auto", owner: "Ramesh Kumar", lat: 12.9234, lng: 79.1345, speed: "22 km/h", status: "MOVING", area: "Katpadi Chittoor Road", geofence: "IN_ZONE", phone: "9845012301" },
    { id: 2, plate: "TN-23-BC-1204", name: "Honda Activa 6G", owner: "Suresh Babu", lat: 12.9351, lng: 79.1412, speed: "0 km/h", status: "PARKED", area: "Vellore Fort Main Gate", geofence: "IN_ZONE", phone: "9789123045" },
    { id: 3, plate: "TN-23-CF-4509", name: "Piaggio Ape 3-W", owner: "Meena Sundaram", lat: 12.9102, lng: 79.1129, speed: "45 km/h", status: "SPEEDING", area: "Vellore Bypass National Highway", geofence: "OUT_OF_BOUNDS", phone: "9443560712" }
  ]);

  const [search, setSearch] = useState("");

  // Simulated GPS position updates
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status !== "PARKED") {
          const deltaLat = (Math.random() - 0.5) * 0.001;
          const deltaLng = (Math.random() - 0.5) * 0.001;
          const newSpeed = Math.floor(Math.random() * 20) + (v.status === "SPEEDING" ? 40 : 15);
          return {
            ...v,
            lat: Number((v.lat + deltaLat).toFixed(4)),
            lng: Number((v.lng + deltaLng).toFixed(4)),
            speed: `${newSpeed} km/h`
          };
        }
        return v;
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active loans from backend on mount
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data || []);
      }
    } catch (e) {
      console.error("Error fetching loans:", e);
    }
  };

  const handleSelectVehicle = (v: any) => {
    setSelectedVehicleId(v.id);
    setGpsLatitude(v.lat.toString());
    setGpsLongitude(v.lng.toString());
    setPhoneInput(v.phone || "9876543210");
    setPhoneAlertSent(false);
    setSaveSuccess(false);

    // Dynamic reverse geocode based on selected vehicle's area
    setGpsAddress(`${v.area}, Vellore, Tamil Nadu, India`);

    // Match with corresponding loan if exists
    const matchedLoan = loans.find(l => l.vehicleNo === v.plate || l.customer?.name === v.owner);
    if (matchedLoan) {
      setSelectedLoanNo(matchedLoan.loanNo);
    } else if (loans.length > 0) {
      setSelectedLoanNo(loans[0].loanNo);
    }
  };

  const handleAutoCaptureGPS = () => {
    // Generate realistic Vellore coordinates
    const randomLat = (12.9100 + Math.random() * 0.04).toFixed(4);
    const randomLng = (79.1100 + Math.random() * 0.04).toFixed(4);
    setGpsLatitude(randomLat);
    setGpsLongitude(randomLng);
    setSaveSuccess(false);
    
    // Auto lookup address hint
    setGpsAddress("Latitude: " + randomLat + ", Longitude: " + randomLng + " (Pending Geocode Lookup)");
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setGpsLatitude(coords.lat.toString());
        setGpsLongitude(coords.lng.toString());
        setGpsAddress(`Live Device GPS Locked (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setIsLocating(false);
        alert("Unable to retrieve live device location. Using default coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReverseGeocode = () => {
    setIsReverseGeocoding(true);
    setTimeout(() => {
      const landmarks = [
        "Near Vellore New Bus Stand, Officers Line, Vellore, Tamil Nadu 632001",
        "Opposite VIT Main Campus Road, Katpadi, Vellore, Tamil Nadu 632014",
        "Vellore Bypass NH-48, Near Shell Fuel Station, Vellore, Tamil Nadu 632009",
        "Fort Round Road, Next to ASI Archeological Office, Vellore, Tamil Nadu 632004",
        "Katpadi Junction Railway Station Approach, Katpadi, Tamil Nadu 632007"
      ];
      const randomAddress = landmarks[Math.floor(Math.random() * landmarks.length)];
      setGpsAddress(randomAddress);
      setIsReverseGeocoding(false);
    }, 1000);
  };

  const handleSaveLocation = async () => {
    if (!selectedLoanNo) {
      alert("Please select a target Loan Account/Customer to link the GPS coordinates.");
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Find current loan data to avoid overwriting unrelated fields
      const currentLoan = loans.find(l => l.loanNo === selectedLoanNo) || {};
      
      const response = await fetch(`/api/loans/${selectedLoanNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentLoan,
          gpsLatitude: Number(gpsLatitude),
          gpsLongitude: Number(gpsLongitude),
          gpsAddress: gpsAddress,
          gpsInstalled: true,
          gpsLastSync: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        fetchLoans(); // Refresh local list
      } else {
        alert("Failed to synchronize coordinates on the server.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error saving location.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToPhone = () => {
    if (!phoneInput) return;
    setPhoneAlertSent(true);
    setTimeout(() => setPhoneAlertSent(false), 4000);
  };

  const handleShareLink = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${gpsLatitude},${gpsLongitude}`;
    navigator.clipboard.writeText(url);
    alert(`Google Maps Link copied to clipboard!\n${url}`);
  };

  const handleCalculateRoute = () => {
    setShowRouting(true);
    setRouteSteps([
      "Depart from Xerova Katpadi Head Office, Officers Line (0.0 km)",
      "Head North on Katpadi Main Road toward Vellore Green Circle (1.4 km)",
      "At Green Circle, take the 3rd exit past NH-48 tollgate (2.2 km)",
      `Turn towards target area of collateral asset: ${gpsAddress.split(",")[0]} (4.1 km)`,
      `Arrived at telemetry coordinates [${gpsLatitude}, ${gpsLongitude}]. Vehicle located!`
    ]);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.owner.toLowerCase().includes(search.toLowerCase()) ||
    v.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 font-sans text-xs">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
            Google Locator GPS Integration Engine
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Live telemetry monitoring of collateral assets. Synchronize coordinate capture snapshots directly into borrower ledgers.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" placeholder="Filter Plate / Owner / Area..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 text-[10px] text-slate-700 font-semibold focus:outline-none w-36"
          />
        </div>
      </div>

      {/* 1. MASSIVE FULL-WIDTH LIVE WEB MAP COCKPIT */}
      <div className="w-full h-[640px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 mb-6">
        <InteractiveWebMap
          lat={parseFloat(gpsLatitude) || 12.9234}
          lng={parseFloat(gpsLongitude) || 79.1345}
          zoom={zoomLevel}
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={(id) => {
            const v = vehicles.find(item => item.id === id);
            if (v) handleSelectVehicle(v);
          }}
          userLocation={userLocation}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
        />
      </div>

      {/* 2. LOWER MANAGEMENT COCKPIT GRID (3 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 Cols): Live Vehicles Feed */}
        <div className="lg:col-span-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
          <div className="bg-slate-900 text-white p-2.5 rounded-t-lg font-bold uppercase tracking-wider text-[10px] select-none flex justify-between items-center shadow-md">
            <span>Live Collateral Stream</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          {filteredVehicles.map(v => (
            <div 
              key={v.id} 
              onClick={() => handleSelectVehicle(v)}
              className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2 hover:bg-slate-100 cursor-pointer transition-all shadow-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{v.plate}</span>
                <span className={`px-2 py-0.2 rounded font-bold text-[8px] uppercase tracking-wider border ${
                  v.geofence === "OUT_OF_BOUNDS" ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}>
                  {v.geofence === "OUT_OF_BOUNDS" ? "GEOFENCE ALERT" : "IN ZONE"}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-[11px] leading-tight">{v.name}</p>
                <p className="text-[10px] text-slate-500">Hirer: <span className="font-semibold text-slate-700">{v.owner}</span></p>
                <p className="text-[9px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                  Last Seen: {v.area}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-1.5 text-[9px] font-mono select-none">
                <span className="text-slate-400">Speed: <b className="text-slate-800">{v.speed}</b></span>
                <span className={`font-bold uppercase ${v.status === "MOVING" ? "text-blue-600 font-bold" : v.status === "SPEEDING" ? "text-rose-600 animate-pulse" : "text-slate-500"}`}>
                  ● {v.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Center Column (4 Cols): Manual GPS Capture & Ledger Link */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1.5 flex items-center justify-between">
            <span>Manual GPS &amp; Ledger Link</span>
            <span className="text-[9px] text-indigo-600 font-normal">HP Ledger Sync</span>
          </h4>

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-[11px] text-emerald-800 font-bold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Success: Telemetry synced persistently to HP Ledger record!</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Target HP Ledger Account</label>
              <select
                value={selectedLoanNo}
                onChange={(e) => setSelectedLoanNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded p-2 focus:outline-none focus:border-indigo-500 text-[11px]"
              >
                <option value="">-- Choose Borrower Account to Bind GPS --</option>
                {loans.map(l => (
                  <option key={l.loanNo} value={l.loanNo}>
                    {l.loanNo} - {l.customer?.name} ({l.vehicleName || "Collateral"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Capture Latitude</label>
                <input
                  type="text"
                  value={gpsLatitude}
                  onChange={(e) => setGpsLatitude(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono text-slate-800 font-bold text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Capture Longitude</label>
                <input
                  type="text"
                  value={gpsLongitude}
                  onChange={(e) => setGpsLongitude(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono text-slate-800 font-bold text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleAutoCaptureGPS}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded transition-colors text-[9.5px] cursor-pointer flex items-center justify-center gap-1 uppercase shadow-xs"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                Random GPS
              </button>
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors text-[9.5px] cursor-pointer flex items-center justify-center gap-1 uppercase shadow-xs"
              >
                <span>🎯</span>
                {isLocating ? "Locating..." : "Use Live GPS"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleReverseGeocode}
              disabled={isReverseGeocoding}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition-colors text-[10px] cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-sm"
            >
              <MapPin className="h-3.5 w-3.5" />
              {isReverseGeocoding ? "Reverse geocoding..." : "Reverse Lookup Street Address"}
            </button>

            <div>
              <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Resolved Street Address / Landmark</label>
              <textarea
                rows={2}
                value={gpsAddress}
                onChange={(e) => setGpsAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-700 font-semibold text-[11px] focus:outline-none focus:border-indigo-500 leading-tight"
                placeholder="Street address..."
              />
            </div>

            <div className="flex gap-1.5 border-t pt-3">
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition-colors cursor-pointer text-[10px] text-center uppercase shadow-sm"
              >
                {isSaving ? "Synchronizing..." : "Save Coordinates"}
              </button>
              <button
                type="button"
                onClick={handleCalculateRoute}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-3 py-2 rounded transition-colors cursor-pointer text-[10px] uppercase"
              >
                Directions
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold p-2 rounded transition-colors cursor-pointer"
                title="Share Maps link"
              >
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Enforcement Dispatch & Nearby Yards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick action: Send phone alert dispatch */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-mono border-b border-slate-200 pb-1">
              Enforcement Dispatch Warning
            </span>
            {phoneAlertSent && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 font-bold p-2 rounded text-[10px]">
                Alert dispatched via WhatsApp gateway with coordinates!
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-normal">
              Send instant tracking warning link and geofence coordinates to borrower's mobile phone via SMS / WhatsApp.
            </p>
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Hirer Mobile (e.g. 9845012301)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="bg-white border border-slate-200 rounded p-2 text-[11px] font-mono text-slate-700 font-bold flex-1 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSendToPhone}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-2 rounded cursor-pointer uppercase shadow-xs shrink-0"
              >
                Send Alert
              </button>
            </div>
          </div>

          {/* Route Steps Sub-Panel if directions clicked */}
          {showRouting && (
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">
                  Turn-by-Turn Telemetry Routing Guide
                </h5>
                <button 
                  onClick={() => setShowRouting(false)}
                  className="text-indigo-400 hover:text-indigo-900 text-[10px] font-bold"
                >
                  Hide Route
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-[10.5px] font-semibold leading-relaxed max-h-36 overflow-y-auto">
                {routeSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Nearby Landmarks list */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
            <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1 font-mono">
              Nearby Repossession Yards &amp; Resources
            </h5>
            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-start gap-2.5">
                <Landmark className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-slate-800 text-[11px]">Vellore Regional Yard</h6>
                  <p className="text-[10px] text-slate-500 font-medium">Katpadi Industrial Estate (1.1 km away)</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-slate-800 text-[11px]">Enforcement Station #02</h6>
                  <p className="text-[10px] text-slate-500 font-medium">Katpadi Police limits (0.6 km away)</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-start gap-2.5">
                <RefreshCw className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-slate-800 text-[11px]">Shell Gas Station &amp; Garage</h6>
                  <p className="text-[10px] text-slate-500 font-medium">Vellore Bypass NH-48 (1.9 km away)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
