/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  CreditCard, Calendar, FileText, Upload, Send, MessageSquare, 
  CheckCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  User, DollarSign, Car, HelpCircle, Phone, FileCheck, ArrowRight
} from "lucide-react";

interface CustomerPortalViewProps {
  userPhone: string;
  onLogout: () => void;
}

export default function CustomerPortalView({ userPhone, onLogout }: CustomerPortalViewProps) {
  const [loans, setLoans] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [preLoans, setPreLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [paymentError, setPaymentError] = useState("");

  // Document Upload State
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([
    { name: "Aadhaar Card (Identity)", type: "PDF", size: "1.2 MB", status: "VERIFIED", date: "2026-06-10" },
    { name: "Vehicle Delivery Receipt", type: "PNG", size: "850 KB", status: "VERIFIED", date: "2026-06-15" }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Chat/Communication State
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", text: "Hello! Welcome to Ask Me, your Xerova Finance AI assistant. I have full access to your vehicle loan details, payment schedules, and account records. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [userPhone]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch loans
      const resLoans = await fetch("/api/loans");
      const allLoans = await resLoans.json();
      
      // Filter for loans matching this customer phone
      const customerLoans = allLoans.filter((l: any) => l.customer?.phone === userPhone);
      setLoans(customerLoans);
      if (customerLoans.length > 0) {
        setActiveLoan(customerLoans[0]);
      }

      // Fetch prospective pre-loans
      const resPre = await fetch("/api/preloans");
      const allPre = await resPre.json();
      const customerPre = allPre.filter((pl: any) => pl.phone === userPhone);
      setPreLoans(customerPre);
    } catch (e) {
      console.error("Error fetching customer portal data: ", e);
    } finally {
      setLoading(false);
    }
  };

  // Payment authorizes
  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccess(null);
    if (!activeLoan) return;

    const amountNum = Number(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError("Please enter a valid payment amount.");
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanNo: activeLoan.loanNo,
          amount: amountNum,
          payMode,
          payModeDetails: `Self-Service Online Portal (${payMode})`,
          collectedBy: "Customer Self-Portal"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(data.receipt);
        setPaymentAmount("");
        // Refresh customer loan info to immediately reflect deduction
        await fetchCustomerData();
      } else {
        setPaymentError(data.error || "Payment execution failed.");
      }
    } catch (err) {
      setPaymentError("Network error authorizing transaction.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Chat message submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          context: `Customer Self-service interface. Customer Name: ${activeLoan?.customer?.name || "Prospective Client"}. Loan HP No: ${activeLoan?.loanNo || "None"}.`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: "I apologize, our helpdesk connection is experiencing brief server downtime. Please call our Toll-Free Number 1800-419-2020." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error. Please check your network and try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Document Drag Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    simulateDocUpload("Uploaded_Document_" + Date.now().toString().slice(-4) + ".pdf");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateDocUpload(e.target.files[0].name);
    }
  };

  const simulateDocUpload = (fileName: string) => {
    setUploadSuccess(true);
    const newDoc = {
      name: fileName,
      type: fileName.split(".").pop()?.toUpperCase() || "PDF",
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      status: "PENDING_VERIFICATION",
      date: new Date().toISOString().split("T")[0]
    };
    setTimeout(() => {
      setUploadedDocs((prev) => [newDoc, ...prev]);
      setUploadSuccess(false);
    }, 1000);
  };

  // Calculations for outstanding
  const calculateOutstanding = () => {
    if (!activeLoan) return 0;
    const unpaid = activeLoan.installments
      .filter((inst: any) => inst.status !== "PAID")
      .reduce((sum: number, inst: any) => sum + (inst.dueAmount - inst.paidAmount + (inst.penalty || 0)), 0);
    return unpaid;
  };

  const calculateNextEmi = () => {
    if (!activeLoan) return null;
    const next = activeLoan.installments.find((inst: any) => inst.status !== "PAID");
    return next || null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* CUSTOMER PORTAL HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-white/20 text-white font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
              Customer Secure Self-Service
            </span>
            <h1 className="text-2xl font-black font-sans uppercase tracking-tight mt-1">
              Welcome, {activeLoan?.customer?.name || "Xerova Valued Client"}
            </h1>
            <p className="text-xs text-blue-100 font-medium">
              Registered Phone: <span className="font-mono">{userPhone}</span> • Account Status: <span className="font-bold text-green-300">{activeLoan ? "ACTIVE HIRE PURCHASE" : "PROSPECT"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchCustomerData}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg border border-white/10 transition-colors"
              title="Refresh Loan Details"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition-colors uppercase tracking-wider"
            >
              Sign Out Securely
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Retrieving secure accounts and active EMI books...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT & MID COLUMNS (LOAN STATS, BILLINGS, UPLOADS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* NO LOANS FALLBACK */}
            {!activeLoan && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Prospective Client Dashboard</h2>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center space-y-3 border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    You do not currently have an active Hire-Purchase vehicle loan registered under this mobile number. 
                    If you recently filed a pre-loan application, you can track its status below.
                  </p>
                </div>
              </div>
            )}

            {activeLoan && (
              <>
                {/* FINANCIAL METRICS SUMMARY BENTO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* METRIC 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex items-center gap-3.5">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Net Outstanding</p>
                      <h3 className="text-lg font-black text-slate-800 font-mono mt-0.5">₹{calculateOutstanding().toLocaleString()}</h3>
                      <p className="text-[9px] text-slate-500">Includes back dues & penal charges</p>
                    </div>
                  </div>

                  {/* METRIC 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex items-center gap-3.5">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Next EMI Amount</p>
                      <h3 className="text-lg font-black text-indigo-700 font-mono mt-0.5">₹{activeLoan.emiAmount?.toLocaleString()}</h3>
                      <p className="text-[9px] text-slate-500">
                        {calculateNextEmi() ? `Due: ${calculateNextEmi()?.dueDate}` : "Fully Paid Up"}
                      </p>
                    </div>
                  </div>

                  {/* METRIC 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex items-center gap-3.5">
                    <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Collateral Asset</p>
                      <h3 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">{activeLoan.vehicle?.vehicleName}</h3>
                      <p className="text-[9px] text-slate-500 font-mono">RC: {activeLoan.vehicle?.rcNo}</p>
                    </div>
                  </div>

                </div>

                {/* DETAILED ACTIVE HP AGREEMENT INFO */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-blue-600" />
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Hire Purchase Agreement Dossier</h2>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2.5 py-0.5 rounded">
                      HP NO: {activeLoan.loanNo}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Financed Amount</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">₹{activeLoan.loanAmount?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Interest Rate p.a</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{activeLoan.interestRate}% Flat</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Tenure Months</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{activeLoan.durationMonths} Months</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Agreement Date</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{activeLoan.hpDate}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg text-xs space-y-2.5 border border-slate-150">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Vehicle Specifications</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 font-sans">
                      <p><span className="text-slate-400">Engine No:</span> <strong className="text-slate-700 font-mono">{activeLoan.vehicle?.engineNo}</strong></p>
                      <p><span className="text-slate-400">Chassis No:</span> <strong className="text-slate-700 font-mono">{activeLoan.vehicle?.chassisNo}</strong></p>
                      <p><span className="text-slate-400">Vehicle Value:</span> <strong className="text-slate-700 font-mono">₹{activeLoan.vehicleValue?.toLocaleString()}</strong></p>
                      <p><span className="text-slate-400">Insurance Expiry:</span> <strong className="text-slate-700">{activeLoan.vehicle?.insuranceExpiry}</strong></p>
                      <p><span className="text-slate-400">Broker Source:</span> <strong className="text-slate-700">{activeLoan.brokerName}</strong></p>
                      <p><span className="text-slate-400">GPS Tracker Status:</span> <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Verified Active</span></p>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE EMI REPAYMENT TIMELINE */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-blue-600" />
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide font-sans">Repayment Ledger & Installments Schedule</h2>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {activeLoan.installments?.filter((i: any) => i.status === "PAID").length} of {activeLoan.installments?.length} Paid
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                          <th className="py-2">Inst. No</th>
                          <th className="py-2">Due Date</th>
                          <th className="py-2 text-right">Emi Amount</th>
                          <th className="py-2 text-right">Penal / Charge</th>
                          <th className="py-2 text-right">Paid Amount</th>
                          <th className="py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {activeLoan.installments?.map((inst: any, index: number) => (
                          <tr key={inst.id} className="hover:bg-slate-50/50">
                            <td className="py-2 font-mono text-slate-500 font-bold">{index + 1}</td>
                            <td className="py-2 font-mono">{inst.dueDate}</td>
                            <td className="py-2 text-right font-mono font-semibold text-slate-800">₹{inst.dueAmount?.toLocaleString()}</td>
                            <td className="py-2 text-right font-mono text-red-500 font-semibold">₹{inst.penalty || 0}</td>
                            <td className="py-2 text-right font-mono font-semibold text-green-600">
                              {inst.paidAmount > 0 ? `₹${inst.paidAmount.toLocaleString()}` : "—"}
                            </td>
                            <td className="py-2 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded font-mono uppercase ${
                                inst.status === "PAID" ? "bg-green-50 text-green-700 border border-green-200" :
                                inst.status === "OVERDUE" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* PRE-LOAN PROPOSALS UNDER TRACKER */}
            {preLoans.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileCheck className="h-4.5 w-4.5 text-blue-600" />
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Prospective Application Tracking</h2>
                </div>
                <div className="space-y-3">
                  {preLoans.map((pl: any) => (
                    <div key={pl.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                            {pl.serialNo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Date Filed: {pl.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1.5 uppercase">Loan Sourcing: {pl.vehicleName}</h4>
                        <p className="text-[11px] text-slate-500">Requested Principal amount: <strong className="font-mono text-slate-700">₹{pl.requiredLoan?.toLocaleString()}</strong></p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          pl.status === "APPROVED" ? "bg-green-100 text-green-800 border border-green-200" :
                          pl.status === "REJECTED" ? "bg-red-100 text-red-800 border border-red-200" :
                          pl.status === "VERIFIED" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {pl.status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                          {pl.status === "VERIFIED" && <ShieldCheck className="h-3.5 w-3.5" />}
                          {pl.status === "APPROVED" && <CheckCircle className="h-3.5 w-3.5" />}
                          {pl.status === "REJECTED" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {pl.status}
                        </span>
                        {pl.status === "APPROVED" && (
                          <div className="text-[10px] bg-green-500 text-white font-bold px-2.5 py-1 rounded animate-pulse">
                            DISBURSEMENT READY
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DOCUMENT MANAGEMENT HUB */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-4.5 w-4.5 text-blue-600" />
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Compliance Document Locker</h2>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload required government IDs, sign boards, or vehicle documents to clear HP covenants.</p>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  isDragging ? "border-blue-600 bg-blue-50/55" : "border-slate-200 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <input 
                  type="file" 
                  id="portal-file-picker" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
                <label htmlFor="portal-file-picker" className="cursor-pointer block space-y-2">
                  <Upload className="h-7 w-7 text-slate-400 mx-auto animate-bounce" />
                  <div className="text-xs text-slate-600 font-bold">
                    {uploadSuccess ? "Processing Secure Upload..." : "Drag & Drop compliance files here, or Click to Browse"}
                  </div>
                  <p className="text-[9px] text-slate-400">Supports PDF, PNG, JPG files up to 10MB.</p>
                </label>
              </div>

              {/* Uploaded Files Table */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Verified Documents ({uploadedDocs.length})</h4>
                <div className="space-y-2">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-sans">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Date: {doc.date} • {doc.size}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        doc.status === "VERIFIED" ? "bg-green-100 text-green-800 border border-green-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {doc.status === "VERIFIED" ? "VERIFIED" : "PENDING AUDIT"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR (ONLINE BILL PAYMENT PORTAL, FINANCE COMMUNICATION CHAT) */}
          <div className="space-y-6">
            
            {/* PAYMENTS WIDGET */}
            {activeLoan && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
                <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Online Settlement terminal</h3>
                </div>

                {paymentSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Payment Processed Successfully!</span>
                    </div>
                    <p className="font-medium text-[11px]">
                      Receipt No: <strong className="font-mono text-slate-800">{paymentSuccess.receiptNo}</strong> has been generated for EMI credit. 
                      Amount: <strong className="font-mono text-slate-800">₹{paymentSuccess.amount.toLocaleString()}</strong>.
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <form onSubmit={handleMakePayment} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] font-bold text-center">
                      {["UPI", "BANK", "CHEQUE"].map((mode) => (
                        <button
                          type="button" key={mode}
                          onClick={() => setPayMode(mode)}
                          className={`py-1.5 border rounded-lg transition-colors ${
                            payMode === mode ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Dues Payment Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">₹</span>
                      <input 
                        type="number" required placeholder="Enter custom payment amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner"
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] text-slate-400 font-bold">
                      <button 
                        type="button" 
                        onClick={() => setPaymentAmount(String(activeLoan.emiAmount))}
                        className="hover:text-blue-600 underline"
                      >
                        [Pay 1 EMI: ₹{activeLoan.emiAmount}]
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPaymentAmount(String(calculateOutstanding()))}
                        className="hover:text-blue-600 underline text-right"
                      >
                        [Pay Full Dues: ₹{calculateOutstanding()}]
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wide"
                  >
                    {paymentLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Authorizing Gateway...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Authorize Secure Payment
                      </>
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-3 text-[9px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                  <span>256-bit bank grade encryption activated.</span>
                </div>
              </div>
            )}

            {/* HELPDESK COMMUNICATION BOARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 text-white shadow-lg flex flex-col h-[380px]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <MessageSquare className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold leading-tight">Ask Me Helpdesk</h3>
                  <p className="text-[9px] text-slate-500 font-mono">Chat Online with Ask Me AI Assistant</p>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto py-3.5 space-y-2.5 max-h-[220px] text-[11px] font-sans pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={`p-2.5 rounded-xl max-w-[85%] ${m.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-800 text-slate-300 mr-auto"}`}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-slate-800 text-slate-400 mr-auto p-2.5 rounded-xl max-w-[85%] flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-slate-500 animate-ping" />
                    <span>Ask Me is drafting...</span>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <form onSubmit={handleSendChat} className="mt-auto border-t border-slate-800 pt-2.5 flex gap-2">
                <input 
                  type="text" required placeholder="Type query (foreclosure, penalty waive, etc.)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
