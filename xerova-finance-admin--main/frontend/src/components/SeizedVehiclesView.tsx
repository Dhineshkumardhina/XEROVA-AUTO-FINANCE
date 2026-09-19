/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Hammer, Landmark, ShieldCheck, MapPin, Search, Plus, Trash2, ArrowRightLeft,
  Mail, Phone, Calculator, Send, FileText, Check, MessageSquare, Share2, ChevronDown, ChevronUp, RefreshCw, Printer
} from "lucide-react";

interface SeizedVehiclesViewProps {
  onSuccess?: () => void;
}

export default function SeizedVehiclesView({ onSuccess }: SeizedVehiclesViewProps) {
  const [seized, setSeized] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Auction State
  const [bidAmount, setBidAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Seizure State
  const [isSeizing, setIsSeizing] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [seizeForm, setSeizeForm] = useState({
    loanNo: "",
    godownName: "Katpadi Main Yard",
    seizedDate: new Date().toISOString().split("T")[0],
    seizedArea: "Vellore Bypass",
    remarks: "Defaulted on 4 successive EMIs"
  });

  // Notices & Dispatch State
  const [noticeType, setNoticeType] = useState<string>("possession");
  const [noticeText, setNoticeText] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [showDispatchAlert, setShowDispatchAlert] = useState<boolean>(false);
  const [dispatchChannel, setDispatchChannel] = useState<string>("");

  // Collapsible sections
  const [isValuationOpen, setIsValuationOpen] = useState<boolean>(true);
  const [isNoticesOpen, setIsNoticesOpen] = useState<boolean>(true);

  // Valuation params
  const [originalValue, setOriginalValue] = useState<number>(145000);
  const [modelYear, setModelYear] = useState<number>(2023);
  const [depreciationRate, setDepreciationRate] = useState<number>(15);

  useEffect(() => {
    fetchSeized();
    fetchActiveLoans();
  }, []);

  useEffect(() => {
    if (!selectedAsset) return;
    setCustomerPhone(selectedAsset.customerPhone || "9876543210");
    setCustomerEmail(selectedAsset.customerEmail || "debtor.reminders@gmail.com");
    
    // Guess default values based on model name
    const nm = (selectedAsset.vehicleName || "").toLowerCase();
    if (nm.includes("auto") || nm.includes("3-w")) {
      setOriginalValue(180000);
      setModelYear(2023);
    } else if (nm.includes("honda") || nm.includes("activa")) {
      setOriginalValue(95000);
      setModelYear(2024);
    } else if (nm.includes("swift") || nm.includes("car")) {
      setOriginalValue(550000);
      setModelYear(2021);
    } else {
      setOriginalValue(125000);
      setModelYear(2022);
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    
    let text = "";
    if (noticeType === "pre_seizure") {
      text = `URGENT LEGAL NOTICE: OUTSTANDING EMI RECOVERY
Date: ${new Date().toLocaleDateString()}
Ref: XEROVA/LEGAL/${selectedAsset.loanNo}

Dear ${selectedAsset.customerName || "Customer"},

This is to notify you that your Hire-Purchase account ${selectedAsset.loanNo} remains in deep delinquency. Total outstanding dues have crossed standard microfinance margins. To prevent immediate field repossession of your vehicle ${selectedAsset.vehicleName} (${selectedAsset.vehicleNo}), pay your EMI immediately at our counter or UPI portal.

Regards,
Legal Cell, Xerova Auto Finance.`;
    } else if (noticeType === "possession") {
      text = `OFFICIAL POSSESSION RECEIPT & INVENTORY RECORD
Date: ${new Date().toLocaleDateString()}
Ref: XEROVA/REPO/${selectedAsset.loanNo}

Dear ${selectedAsset.customerName || "Customer"},

We hereby acknowledge that the vehicle ${selectedAsset.vehicleName} bearing Plate No: ${selectedAsset.vehicleNo} has been physically seized by Team Alpha under the HP Repossession Act.
The asset is currently warehoused in safe custody at: ${selectedAsset.godownName || "Ranipet Yard"}.
Inventory Status: Engine running, standard body kit, tires intact.

To request release, contact the head office within 7 working days.

Sincerely,
Asset Repossession Officer, Xerova.`;
    } else if (noticeType === "auction") {
      text = `PUBLIC BID AUCTION SALE NOTICE
Date: ${new Date().toLocaleDateString()}
Ref: XEROVA/BID/${selectedAsset.loanNo}

To: ${selectedAsset.customerName || "Customer"}
Subject: Final Notice Prior to Collateral Liquidation

Take notice that as you failed to settle the outstanding balance on Loan Account ${selectedAsset.loanNo}, the collateral vehicle ${selectedAsset.vehicleName} (${selectedAsset.vehicleNo}) will be sold to the highest bidder at public auction.
The auction is scheduled at our Godown: ${selectedAsset.godownName} after 5 days.
Estimated reserve MRP: ₹${((selectedAsset.loanBalance || 50000) * 0.85).toFixed(0)}. Any deficiency in the final sale amount will be recovered from you.

Regards,
Auction Board, Xerova Finance.`;
    } else if (noticeType === "gate_pass") {
      text = `YARD DISPATCH GATE-PASS & RELEASE AUTHORIZATION
Gate Pass No: GP-${Date.now()}
Date: ${new Date().toLocaleDateString()}

REPAST TO YARD MANAGER: ${selectedAsset.godownName || "Ranipet Yard"}
You are authorized to release vehicle ${selectedAsset.vehicleName} bearing plate number ${selectedAsset.vehicleNo} to customer ${selectedAsset.customerName} on account of complete settlement of overdue amounts for Loan ${selectedAsset.loanNo}.

Authorized Signatory:
Branch Controller, Xerova Auto Finance.`;
    }
    setNoticeText(text);
  }, [selectedAsset, noticeType]);

  const handleRelease = async (id: string) => {
    if (!confirm("Are you sure you want to AUTHORIZE RELEASE of this vehicle to the debtor? This will restore the loan status to ACTIVE.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seized/${id}/release`, { method: "POST" });
      if (res.ok) {
        setSelectedAsset(null);
        fetchSeized();
        fetchActiveLoans();
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeized = async () => {
    try {
      const res = await fetch("/api/seized");
      const data = await res.json();
      setSeized(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      setLoans(data.filter((l: any) => l.status === "ACTIVE"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seizeForm.loanNo) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seizeForm)
      });
      if (res.ok) {
        setIsSeizing(false);
        fetchSeized();
        fetchActiveLoans();
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !bidAmount || !buyerName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seized/${selectedAsset.id}/auction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salePrice: Number(bidAmount),
          buyerName,
          buyerPhone
        })
      });
      if (res.ok) {
        setSelectedAsset(null);
        setBidAmount("");
        setBuyerName("");
        setBuyerPhone("");
        fetchSeized();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteOff = async (id: string) => {
    if (!confirm("Are you sure you want to write off this asset to Bad Debt reserves?")) return;
    try {
      const res = await fetch(`/api/seized/${id}/writeoff`, { method: "POST" });
      if (res.ok) {
        fetchSeized();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase font-sans">
            Repossessed Assets & Godown Sales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track asset physical seizures, inventory warehoused godown holdings, close recovery books via auctions, or write off bad debts.
          </p>
        </div>
        {!isSeizing && (
          <button
            onClick={() => setIsSeizing(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-sm transition-colors"
          >
            <Hammer className="h-3.5 w-3.5" />
            Repossess Collateral
          </button>
        )}
      </div>

      {isSeizing ? (
        <form onSubmit={handleSeizeSubmit} className="bg-white border border-slate-200 p-4 rounded-lg max-w-lg mx-auto space-y-3.5 font-sans text-xs shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase">Issue Seizure Command</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Active Defaulted Loan Book</label>
              <select 
                value={seizeForm.loanNo}
                required
                onChange={(e) => setSeizeForm({...seizeForm, loanNo: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Account --</option>
                {loans.map((l) => (
                  <option key={l.loanNo} value={l.loanNo}>
                    {l.loanNo} - {l.customer?.name} (EMI: ₹{l.emiAmount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Secured Godown Warehouse</label>
              <select 
                value={seizeForm.godownName}
                onChange={(e) => setSeizeForm({...seizeForm, godownName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Katpadi Main Yard">Katpadi Main Yard (Shed A)</option>
                <option value="Vellore Bypass Depot">Vellore Bypass Depot (Shed B)</option>
                <option value="Ambur Storage Yard">Ambur Storage Yard</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date of Seizure</label>
              <input 
                type="date"
                required
                value={seizeForm.seizedDate}
                onChange={(e) => setSeizeForm({...seizeForm, seizedDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Repossession Spot Area</label>
              <input 
                type="text"
                required
                value={seizeForm.seizedArea}
                onChange={(e) => setSeizeForm({...seizeForm, seizedArea: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Seizure Field Agent Remarks</label>
              <textarea 
                rows={2}
                value={seizeForm.remarks}
                onChange={(e) => setSeizeForm({...seizeForm, remarks: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsSeizing(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1 rounded text-xs transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors">{loading ? "Logging Repo..." : "Log Repossession"}</button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans">
          
          {/* Seized Assets Grid */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm lg:col-span-2">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase">Godown Inventory & Yard Holdings</h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold">Live Status Tracker</span>
            </div>

            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-2.5">Asset specs</th>
                  <th className="px-4 py-2.5">Original debtor</th>
                  <th className="px-4 py-2.5">Godown storage</th>
                  <th className="px-4 py-2.5">Debt valuation</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-200/80">
                {seized.map((sz) => (
                  <tr 
                    key={sz.id}
                    onClick={() => setSelectedAsset(sz)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedAsset?.id === sz.id ? "bg-red-50 border-l-2 border-red-600" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{sz.vehicleName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{sz.vehicleNo} | {sz.loanNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{sz.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {sz.seizedDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{sz.godownName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-slate-800 font-bold">₹{sz.loanBalance?.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Original Ledger</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        sz.status === "SEIZED" ? "bg-red-100 text-red-700 border-red-200" :
                        sz.status === "BAD_DEBT" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-green-100 text-green-700 border-green-200"
                      }`}>
                        {sz.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {seized.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">No repossessed yard inventory documented.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bid detail sidebar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            {selectedAsset ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="border-b border-slate-200 pb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selectedAsset.status === "SEIZED" || selectedAsset.status === "GODOWN" 
                      ? "bg-red-100 text-red-700 border-red-200" 
                      : selectedAsset.status === "RELEASED"
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                      : "bg-green-100 text-green-700 border-green-200"
                  }`}>
                    Holdings: {selectedAsset.status}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">{selectedAsset.vehicleName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Repossessed from {selectedAsset.customerName}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 font-mono text-[11px] shadow-inner">
                  <p><span className="text-slate-400 font-semibold font-sans">Asset Plate:</span> <span className="text-slate-800 font-bold">{selectedAsset.vehicleNo}</span></p>
                  <p><span className="text-slate-400 font-semibold font-sans">Yard Spot:</span> <span className="text-slate-800 font-bold">{selectedAsset.godownName}</span></p>
                  <p><span className="text-slate-400 font-semibold font-sans">Seized Date:</span> <span className="text-slate-800 font-bold">{selectedAsset.seizedDate || selectedAsset.seizeDate}</span></p>
                  <p><span className="text-slate-400 font-semibold font-sans">Write-off Ledger:</span> <strong className="text-red-600 font-bold">₹{(selectedAsset.loanBalance || 45000).toLocaleString()}</strong></p>
                </div>

                {(selectedAsset.status === "SEIZED" || selectedAsset.status === "GODOWN") && (
                  <>
                    {/* Collapsible Valuation & Depreciated MRP Estimator */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsValuationOpen(!isValuationOpen)}
                        className="w-full bg-slate-50 px-3 py-2 flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase tracking-wider focus:outline-none"
                      >
                        <span className="flex items-center gap-1.5">
                          <Calculator className="h-3.5 w-3.5 text-indigo-600" />
                          AI Valuation Estimator
                        </span>
                        {isValuationOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                      {isValuationOpen && (
                        <div className="p-3 bg-white space-y-2.5 border-t border-slate-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Original Cost (₹)</label>
                              <input
                                type="number"
                                value={originalValue}
                                onChange={(e) => setOriginalValue(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-mono text-[11px] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Model Year</label>
                              <input
                                type="number"
                                value={modelYear}
                                onChange={(e) => setModelYear(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-mono text-[11px] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-medium">Depreciation:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="range" min="5" max="30" step="5"
                                value={depreciationRate}
                                onChange={(e) => setDepreciationRate(Number(e.target.value))}
                                className="w-16 accent-indigo-600"
                              />
                              <span className="font-mono text-[10px] text-slate-700 font-bold">{depreciationRate}%</span>
                            </div>
                          </div>
                          <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-600 font-medium">Calculated Value (2026):</span>
                              <strong className="text-slate-900 font-mono font-bold">
                                ₹{Math.round(originalValue * Math.pow(1 - depreciationRate / 100, Math.max(1, 2026 - modelYear))).toLocaleString()}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-indigo-700 font-bold">AI Floor MRP Suggestion:</span>
                              <strong className="text-indigo-800 font-mono font-bold">
                                ₹{Math.round(originalValue * Math.pow(1 - depreciationRate / 100, Math.max(1, 2026 - modelYear)) * 0.80).toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notices & Legal Documents Dispatch (WhatsApp & Gmail Integration) */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsNoticesOpen(!isNoticesOpen)}
                        className="w-full bg-slate-50 px-3 py-2 flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase tracking-wider focus:outline-none"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          Notice Dispatcher
                        </span>
                        {isNoticesOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                      {isNoticesOpen && (
                        <div className="p-3 bg-white space-y-2.5 border-t border-slate-200">
                          <div>
                            <label className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Notice Template</label>
                            <select
                              value={noticeType}
                              onChange={(e) => setNoticeType(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none cursor-pointer"
                            >
                              <option value="pre_seizure">Pre-Seizure Warning Notice</option>
                              <option value="possession">Inventory Possession Receipt</option>
                              <option value="auction">Public Bid Auction Announcement</option>
                              <option value="gate_pass">Yard Clearance Gate-Pass Notice</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Mobile Phone</label>
                              <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-mono text-[11px] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Email Address</label>
                              <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-mono text-[11px] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] text-slate-500 uppercase font-bold">Document Preview</label>
                            <textarea
                              rows={3}
                              value={noticeText}
                              onChange={(e) => setNoticeText(e.target.value)}
                              className="w-full bg-slate-950 text-emerald-400 font-mono text-[10px] p-2 rounded leading-normal focus:outline-none border-0"
                            />
                          </div>

                          {showDispatchAlert && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded text-[10px] flex items-center gap-1.5 font-semibold">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>Notice Dispatched via <strong>{dispatchChannel}</strong>!</span>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const encodedMsg = encodeURIComponent(noticeText);
                                window.open(`https://api.whatsapp.com/send?phone=91${customerPhone}&text=${encodedMsg}`, "_blank");
                                setDispatchChannel("WhatsApp");
                                setShowDispatchAlert(true);
                                setTimeout(() => setShowDispatchAlert(false), 4000);
                              }}
                              className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-1 rounded text-[9px] transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3 w-3 shrink-0" />
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const subject = encodeURIComponent(`XEROVA LEGAL: Delinquency Notice [${selectedAsset.loanNo}]`);
                                const body = encodeURIComponent(noticeText);
                                window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, "_blank");
                                setDispatchChannel("Gmail");
                                setShowDispatchAlert(true);
                                setTimeout(() => setShowDispatchAlert(false), 4000);
                              }}
                              className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-1 rounded text-[9px] transition-colors cursor-pointer"
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              Gmail Notice
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                window.print();
                              }}
                              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-1 rounded text-[9px] transition-colors cursor-pointer"
                            >
                              <Printer className="h-3 w-3 shrink-0" />
                              Print Notice
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAuctionSubmit} className="space-y-3 pt-1 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Conduct Godown Bid Auction</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Actual Sold Price (₹)</label>
                        <input 
                          type="number" required placeholder="Auction sale amount"
                          value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-850 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Buyer Full Name</label>
                          <input 
                            type="text" required placeholder="Winner name"
                            value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-850 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Buyer Contact</label>
                          <input 
                            type="tel" placeholder="Mobile"
                            value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-850 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded font-bold text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        {loading ? "Recording Sale..." : "Confirm Auction Bid Sale"}
                      </button>
                    </form>

                    <div className="border-t border-slate-200 pt-3 flex gap-2">
                      <button 
                        type="button"
                        onClick={() => handleRelease(selectedAsset.id)}
                        className="flex-1 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 bg-white py-1.5 rounded text-center transition-colors font-mono uppercase tracking-wider text-[10px] font-bold cursor-pointer"
                      >
                        Release Asset
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleWriteOff(selectedAsset.id)}
                        className="flex-1 border border-red-200 hover:bg-red-50 text-red-700 bg-white py-1.5 rounded text-center transition-colors font-mono uppercase tracking-wider text-[10px] font-bold cursor-pointer"
                      >
                        Write-off Loss
                      </button>
                    </div>
                  </>
                )}

                {selectedAsset.status === "RELEASED" && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded text-[11px] text-slate-700 space-y-1.5 shadow-inner">
                    <p className="font-bold text-indigo-700 flex items-center gap-1 uppercase">
                      <Check className="h-4 w-4 text-indigo-600" /> Repossession Released
                    </p>
                    <p>This vehicle was officially released back to the debtor following complete clearance/restructure of the overdue principal balance.</p>
                    <p>Associated Loan Account: <strong className="text-slate-800 font-bold">{selectedAsset.loanNo}</strong> is restored to <strong>ACTIVE</strong>.</p>
                  </div>
                )}

                {selectedAsset.status === "SOLD" && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded text-[11px] text-slate-700 space-y-1.5 shadow-inner">
                    <p className="font-bold text-green-700 flex items-center gap-1 uppercase">
                      <ShieldCheck className="h-4 w-4 text-green-600" /> Yard Holding Settled
                    </p>
                    <p>Sold to Bidder: <strong className="text-slate-850 font-bold">{selectedAsset.buyerName}</strong></p>
                    <p>Auction Price: <strong className="text-slate-850 font-bold font-mono">₹{selectedAsset.salePrice?.toLocaleString()}</strong></p>
                    <p>Clearing Loss written-off: <span className="text-red-600 font-bold font-mono">₹{((selectedAsset.loanBalance || 45000) - selectedAsset.salePrice)?.toLocaleString()}</span></p>
                  </div>
                )}

                {selectedAsset.status === "BAD_DEBT" && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded text-[11px] text-slate-700 space-y-1 shadow-inner">
                    <p className="font-bold text-amber-700 uppercase">
                      ● Bad Debt Provisioned
                    </p>
                    <p className="mt-1">Entire book value of <strong className="text-slate-850 font-bold font-mono">₹{(selectedAsset.loanBalance || 45000).toLocaleString()}</strong> has been written off to provisioning pools as non-recoverable.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <p className="text-xs">Click on any asset card in godown listings to estimate vehicle values, dispatch legal notifications, record bid payouts, or authorize yard releases.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Hidden block rendered ONLY for media print */}
      {selectedAsset && (
        <div className="hidden printable-print-block font-sans text-slate-900 bg-white p-10 space-y-6">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">XEROVA AUTO FINANCE</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Official Recovery Cell & Legal Operations</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Head Office: Bypass Junction Road, Madurai | TN, India</p>
          </div>

          <div className="flex justify-between text-xs font-mono border-b border-slate-200 pb-3">
            <div>
              <p><strong>REF NO:</strong> XER-REC/{selectedAsset.loanNo}</p>
              <p><strong>DATE:</strong> {new Date().toLocaleDateString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p><strong>STATUS:</strong> DELINQUENT VEHICLE ACCT</p>
              <p><strong>YARD STATION:</strong> COIMBATORE WEST</p>
            </div>
          </div>

          <div className="space-y-1 bg-slate-50 p-4 border border-slate-200 rounded text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-800">Borrower Dossier Details</h3>
            <p><strong>Account ID / Loan No:</strong> {selectedAsset.loanNo}</p>
            <p><strong>Primary Debtor:</strong> {selectedAsset.customerName || "N/A"}</p>
            <p><strong>Contact Info:</strong> {customerPhone || "N/A"}</p>
            <p><strong>Registered Vehicle:</strong> {selectedAsset.vehicleName} ({selectedAsset.vehicleNo})</p>
            <p><strong>Outstanding Balance:</strong> ₹{selectedAsset.loanBalance?.toLocaleString()}</p>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-center font-extrabold text-sm underline uppercase tracking-wider text-slate-900">
              {noticeType === "pre_seizure" ? "PRE-SEIZURE DEMAND NOTICE" : 
               noticeType === "possession" ? "INVENTORY POSSESSION RECEIPT" :
               noticeType === "auction" ? "PUBLIC BID AUCTION ANNOUNCEMENT" :
               "YARD CLEARANCE GATE-PASS NOTICE"}
            </h2>

            <div className="text-xs leading-relaxed font-serif whitespace-pre-wrap text-slate-800 bg-white border border-slate-200 p-6 rounded shadow-xs leading-relaxed">
              {noticeText}
            </div>
          </div>

          <div className="pt-16 grid grid-cols-2 text-center text-xs font-mono font-bold">
            <div>
              <p className="border-t border-slate-300 pt-2 mx-12">Yard Head / Officer</p>
            </div>
            <div>
              <p className="border-t border-slate-300 pt-2 mx-12">XEROVA Legal Signatory</p>
            </div>
          </div>

          <div className="pt-8 text-center text-[8px] font-mono text-slate-400 select-none border-t border-slate-100">
            <p>*** THIS IS A COMPUTER-GENERATED COMPLIANCE DOCUMENT EXECUTED VIA XEROVA ERP ***</p>
            <p>Corporate Office: Bypass Road, Madurai | Tamil Nadu | Subject to regulatory frameworks.</p>
          </div>
        </div>
      )}
    </div>
  );
}
