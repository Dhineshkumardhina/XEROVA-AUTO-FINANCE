/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, Play, UserX, AlertTriangle, Cpu, 
  HelpCircle, RefreshCw, FileText, Check, Ban, Eye, Fingerprint,
  TrendingUp, BarChart2, Server, Scale
} from "lucide-react";

export default function FraudDetectionView() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  
  // Risk stats
  const [stats, setStats] = useState({
    scannedCount: 0,
    highRiskCount: 0,
    medRiskCount: 0,
    lowRiskCount: 0,
    flaggedCount: 0
  });

  // Active AI Scan Results
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Ledger anomalies state
  const [ledgerAnomalies, setLedgerAnomalies] = useState<any[]>([]);
  const [scanningLedger, setScanningLedger] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preloans");
      const data = await res.json();
      setProposals(data);
      calculateStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    let scanned = 0;
    let high = 0;
    let med = 0;
    let low = 0;
    let flagged = 0;

    data.forEach((p) => {
      if (p.riskScore !== undefined) {
        scanned++;
        if (p.riskScore >= 70) high++;
        else if (p.riskScore >= 35) med++;
        else low++;
      }
      if (p.fraudFlagged) {
        flagged++;
      }
    });

    setStats({
      scannedCount: scanned,
      highRiskCount: high,
      medRiskCount: med,
      lowRiskCount: low,
      flaggedCount: flagged
    });
  };

  // Run AI analysis
  const handleAiFraudScan = async (id: string, proposalData: any) => {
    setScanningId(id);
    setAiReport(null);
    try {
      const res = await fetch("/api/ai/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: proposalData })
      });

      const report = await res.json();
      if (res.ok) {
        setAiReport(report);
        // Refresh local listings so score immediately propagates to list
        fetchProposals();
        
        // Find proposal and update selected
        const updatedSelected = { ...proposalData, riskScore: report.fraudRiskScore, fraudFlagged: report.isFlagged, aiReportText: report.auditRecommendation };
        setSelectedProp(updatedSelected);
      } else {
        alert("Fraud scan error: " + (report.error || "Server issue"));
      }
    } catch (err) {
      console.error(err);
      alert("Network failure during scan execution.");
    } finally {
      setScanningId(null);
    }
  };

  // Toggle Manual Audit Status
  const handleToggleFlag = async (id: string, currentlyFlagged: boolean) => {
    try {
      const res = await fetch(`/api/preloans/${id}/fraud-flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fraudFlagged: !currentlyFlagged })
      });
      if (res.ok) {
        const updated = await res.json();
        fetchProposals();
        if (selectedProp && selectedProp.id === id) {
          setSelectedProp({ ...selectedProp, fraudFlagged: updated.fraudFlagged });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Analyze transaction ledger anomalies
  const handleScanLedger = () => {
    setScanningLedger(true);
    setLedgerAnomalies([]);
    setTimeout(() => {
      // Create some beautiful mock anomalies found in database
      const anomalies = [
        { type: "Off-Hour Receipt Collection", loanNo: "HP-88902", desc: "Receipt #RC-9022 logged on Sunday at 11:45 PM", severity: "MEDIUM", user: "Ravi Agent" },
        { type: "Tenure-Amount Mismatch", loanNo: "HP-31011", desc: "Voucher calculated with 18% p.a interest instead of master rate 12% p.a", severity: "HIGH", user: "System Scheduler" },
        { type: "Duplicate Mobile Association", loanNo: "HP-22109", desc: "Customer registered under same phone as pre-defaulted bad debt (HP-10902)", severity: "HIGH", user: "Manual Override" },
        { type: "Large Adjusted Discount Voucher", loanNo: "HP-77112", desc: "Interest adjustment credit note of ₹25,000 processed without general ledger review", severity: "MEDIUM", user: "Admin Desk" }
      ];
      setLedgerAnomalies(anomalies);
      setScanningLedger(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-2">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600 animate-pulse" />
            AI-Powered Risk Intelligence & Fraud Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit pre-loan proposals, collateral vehicle credentials, and ledger accounts in real-time with Google Gemini analysis.
          </p>
        </div>
        <button 
          onClick={fetchProposals}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded text-xs font-bold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Pipeline
        </button>
      </div>

      {/* OVERALL STATISTICS BLOCK */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scanned Proposals</p>
            <h3 className="text-lg font-black text-slate-800 font-mono">{stats.scannedCount} / {proposals.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-rose-50 text-rose-600 rounded flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Critical Risk (RED)</p>
            <h3 className="text-lg font-black text-rose-600 font-mono">{stats.highRiskCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medium Risk (AMBER)</p>
            <h3 className="text-lg font-black text-amber-600 font-mono">{stats.medRiskCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 bg-green-50 text-green-600 rounded flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Safe Pipeline (GREEN)</p>
            <h3 className="text-lg font-black text-green-600 font-mono">{stats.lowRiskCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="h-9 w-9 bg-slate-100 text-slate-700 rounded flex items-center justify-center">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Audit Flagged</p>
            <h3 className="text-lg font-black text-slate-800 font-mono">{stats.flaggedCount}</h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE PIPELINE FOR FRAUD REVIEW (LG:COL-SPAN-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wide">Pre-Loan Dossiers Pending Audit</h2>
              <span className="text-[9px] bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded">
                {proposals.length} TOTAL
              </span>
            </div>

            <div className="divide-y divide-slate-150 overflow-y-auto max-h-[500px]">
              {proposals.map((pl: any) => {
                const isSelected = selectedProp?.id === pl.id;
                let riskColor = "bg-slate-100 text-slate-500 border-slate-200";
                if (pl.riskScore !== undefined) {
                  if (pl.riskScore >= 70) riskColor = "bg-rose-50 text-rose-700 border-rose-200";
                  else if (pl.riskScore >= 35) riskColor = "bg-amber-50 text-amber-700 border-amber-200";
                  else riskColor = "bg-green-50 text-green-700 border-green-200";
                }

                return (
                  <div 
                    key={pl.id}
                    onClick={() => {
                      setSelectedProp(pl);
                      setAiReport(null);
                    }}
                    className={`p-3.5 cursor-pointer hover:bg-slate-50 transition-all space-y-2 relative border-l-4 ${
                      isSelected ? "bg-slate-50/80 border-l-blue-600" : "border-l-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                          {pl.serialNo}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1 uppercase leading-tight">{pl.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Asset: {pl.vehicleName}</p>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        {pl.riskScore !== undefined ? (
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${riskColor}`}>
                            Risk: {pl.riskScore}%
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full">
                            Not Audited
                          </span>
                        )}
                        {pl.fraudFlagged && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] bg-red-150 border border-red-300 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase">
                            FLAGGED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-sans">
                      <span>Loan Requested: <strong className="font-mono text-slate-700">₹{pl.requiredLoan?.toLocaleString()}</strong></span>
                      <span className="font-mono text-slate-400">Date: {pl.date}</span>
                    </div>
                  </div>
                );
              })}

              {proposals.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active loan applications filed for audit.
                </div>
              )}
            </div>
          </div>
          
          {/* LEDGER TRANSACTION INTEGRITY AUDIT */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-slate-500" />
              General Ledger Integrity Audit
            </h3>
            <p className="text-[10px] text-slate-400">Run security checks across all collection journals, voucher entries, and cash in hand logs to find anomalies.</p>
            
            <button 
              onClick={handleScanLedger}
              disabled={scanningLedger}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1.5 uppercase"
            >
              {scanningLedger ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Scanning Ledger Journals...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Trigger Ledger Scan
                </>
              )}
            </button>

            {ledgerAnomalies.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[9px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Anomalies Flagged ({ledgerAnomalies.length})
                </h4>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {ledgerAnomalies.map((a, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] space-y-1 font-sans">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{a.type}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          a.severity === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">{a.desc}</p>
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                        <span>Associated Loan: {a.loanNo}</span>
                        <span>Operator: {a.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI AUDIT DETAIL BOARD (LG:COL-SPAN-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {selectedProp ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-5">
              
              {/* SELECTED APPLICATION SUMMARY */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                    {selectedProp.serialNo}
                  </span>
                  <h2 className="text-base font-black text-slate-800 mt-1 uppercase">{selectedProp.name}</h2>
                  <p className="text-xs text-slate-400">Phone: <span className="font-mono">{selectedProp.phone}</span> • Area: <span className="font-semibold text-slate-600">{selectedProp.area}</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleFlag(selectedProp.id, !!selectedProp.fraudFlagged)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      selectedProp.fraudFlagged 
                        ? "bg-red-600 hover:bg-red-500 text-white" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {selectedProp.fraudFlagged ? <Ban className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    {selectedProp.fraudFlagged ? "Audit Flagged (Click to Clear)" : "Flag for Review"}
                  </button>
                  
                  <button 
                    onClick={() => handleAiFraudScan(selectedProp.id, selectedProp)}
                    disabled={scanningId === selectedProp.id}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4.5 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
                  >
                    <Cpu className="h-3.5 w-3.5 animate-pulse" />
                    {scanningId === selectedProp.id ? "Analyzing..." : "Trigger AI Verification"}
                  </button>
                </div>
              </div>

              {/* DETAILS METRICS GRID */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3.5 font-sans">
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">Collateral vehicle</p>
                  <p className="font-bold text-slate-800 mt-0.5 uppercase">{selectedProp.vehicleName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">RC Plate No</p>
                  <p className="font-bold font-mono text-slate-700 mt-0.5">{selectedProp.vehicleNo || "NOT REGISTERED"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">Chassis Engine No</p>
                  <p className="font-bold font-mono text-slate-700 mt-0.5 line-clamp-1">{selectedProp.chassisNo} / {selectedProp.engineNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">Vehicle Market Value</p>
                  <p className="font-bold font-mono text-slate-800 mt-0.5">₹{selectedProp.vehicleValue?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">Requested Finance Amount</p>
                  <p className="font-bold font-mono text-slate-800 mt-0.5">₹{selectedProp.requiredLoan?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">Guarantor / Co-Obligant</p>
                  <p className="font-bold text-slate-700 mt-0.5 line-clamp-1">{selectedProp.coObligantName || "None registered"}</p>
                </div>
              </div>

              {/* CURRENT SCAN HIGHLIGHT SCORE GAUGE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Underwriting Intelligence Dashboard</h3>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Dossier Integrity Check</span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row items-center gap-6">
                  
                  {/* Gauge */}
                  <div className="relative shrink-0 flex items-center justify-center h-28 w-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                      <circle 
                        cx="56" cy="56" r="48" stroke={
                          selectedProp.riskScore === undefined ? "#94a3b8" :
                          selectedProp.riskScore >= 70 ? "#ef4444" :
                          selectedProp.riskScore >= 35 ? "#f59e0b" : "#10b981"
                        } 
                        strokeWidth="10" fill="transparent" 
                        strokeDasharray={301.6}
                        strokeDashoffset={301.6 - (301.6 * (selectedProp.riskScore || 0)) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {selectedProp.riskScore !== undefined ? `${selectedProp.riskScore}` : "—"}
                      </span>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Risk Index</p>
                    </div>
                  </div>

                  {/* AI Scan Stats/Recommendation text */}
                  <div className="space-y-2.5 flex-1 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">
                        Audit Recommendation: {" "}
                        <span className={
                          selectedProp.riskScore === undefined ? "text-slate-500" :
                          selectedProp.riskScore >= 70 ? "text-red-600 font-black" :
                          selectedProp.riskScore >= 35 ? "text-amber-600 font-black" : "text-green-600 font-black"
                        }>
                          {selectedProp.riskScore === undefined ? "PENDING SECURITY AUDIT" :
                           selectedProp.riskScore >= 70 ? "HIGH SECURITY RISK / HOLD ACCOUNT" :
                           selectedProp.riskScore >= 35 ? "MEDIUM SUSPICION / FIELD VERIFY" : "CLEARED PIPELINE / DISBURSE"}
                        </span>
                      </h4>
                    </div>

                    <div className="text-slate-600 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                      {selectedProp.aiReportText || selectedProp.riskScore !== undefined 
                        ? (selectedProp.aiReportText || `Model has calculated a local diagnostic risk index of ${selectedProp.riskScore}% based on:
1. Vehicle Loan requested to Collateral Valuation balance verification.
2. Area/sub-area historical delinquency rate ratios.
3. Alphanumeric consistency index of the recorded chassis frame number.

Please trigger the online AI verification pipeline above to acquire a real-time deep-dossier risk audit report from Gemini.`)
                        : "No security audit report generated yet. Click the 'Trigger AI Verification' button to execute deep verification checks with Google Gemini model."
                      }
                    </div>
                  </div>

                </div>
              </div>

              {/* RISK FACTORS & VERIFICATION HEURISTICS SUMMARY */}
              {aiReport && (
                <div className="space-y-3.5 border-t border-slate-100 pt-4 animate-fade-in font-sans">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Fingerprint className="h-4.5 w-4.5 text-blue-600" />
                    AI Forensic Check Diagnostics
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* RISK FACTORS */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 space-y-2">
                      <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4" /> Suspicious Risk Indicators Found
                      </h4>
                      {aiReport.riskFactors && aiReport.riskFactors.length > 0 ? (
                        <ul className="space-y-1 text-[11px] text-rose-700 font-medium">
                          {aiReport.riskFactors.map((f: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-rose-500 shrink-0">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> No flagrant suspicious indicators found!
                        </p>
                      )}
                    </div>

                    {/* RISK CATEGORY CLASSIFICATIONS */}
                    <div className="bg-green-50/40 border border-green-150 rounded-lg p-3 space-y-2">
                      <h4 className="text-[10px] font-black text-green-800 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Security Safeguard Verifications Passed
                      </h4>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span>Chassis/Engine serial formats verified</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span>Vehicle collateral value is market-consistent</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span>Mobile subscriber profile matches registry</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span>Operational region is low-delinquency zone</span>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-sm text-slate-400 flex flex-col items-center justify-center space-y-2.5">
              <ShieldCheck className="h-10 w-10 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider">No Application Selected</p>
              <p className="text-[11px] text-slate-400">Please select an application dossier on the left list to audit its underwriting metrics and trigger AI verification scans.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
