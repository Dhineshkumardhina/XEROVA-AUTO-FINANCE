/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, Copy, Download, Printer, Search, 
  Phone, User, Calendar, MapPin, ShieldAlert, CheckCircle, 
  AlertTriangle, CreditCard, ClipboardList, Send, Plus, Trash2, Edit2, Info
} from "lucide-react";

interface CustomerTableProps {
  onViewLoan: (loanNo: string) => void;
  prefilledQuery?: string;
}

export default function CustomerDetailsTableView({ onViewLoan, prefilledQuery = "" }: CustomerTableProps) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(prefilledQuery);
  const [sortField, setSortField] = useState<string>("loanNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedLoanNo, setExpandedLoanNo] = useState<string | null>(null);

  // Active Tab for Expanded Card
  const [activeTab, setActiveTab] = useState<"personal" | "co_obligant" | "collateral" | "repayments" | "calls" | "rc_history" | "hand_loans" | "extended_dossier">("personal");

  // Call logs, RC history, handloan input additions
  const [newCallNote, setNewCallNote] = useState("");
  const [newCallDisp, setNewCallDisp] = useState("No Answer");
  const [newCallFollowup, setNewCallFollowup] = useState("");
  const [smsText, setSmsText] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  // Edit RC fields
  const [rcStatus, setRcStatus] = useState("");
  const [rcLocation, setRcLocation] = useState("");
  const [rcRemarks, setRcRemarks] = useState("");

  // Edit Hand loan fields
  const [hlAmount, setHlAmount] = useState<number>(0);
  const [hlRemarks, setHlRemarks] = useState("");

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    if (prefilledQuery) {
      setSearchTerm(prefilledQuery);
    }
  }, [prefilledQuery]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        // Ensure callLogs and rcHistory structures exist
        const updated = data.map((loan: any) => ({
          ...loan,
          callLogs: loan.callLogs || [
            { date: "2026-03-01", operator: "Vikram Singh", disposition: "Ringing No Answer", note: "Called twice regarding due cycle", followup: "2026-03-05" },
            { date: "2026-03-05", operator: "Srinivasan", disposition: "PTP (Promise to Pay)", note: "Party promised to visit counter tomorrow", followup: "2026-03-06" }
          ],
          rcHistory: loan.rcHistory || [
            { date: loan.hpDate || "2026-02-15", status: "In Office Yard", location: "Safe Vault #1A", remarks: "Original smart card RC received from TVS dealership" }
          ]
        }));
        setLoans(updated);
      }
    } catch (e) {
      console.error("Error loading customer ledgers:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveLoanUpdates = async (updatedLoan: any) => {
    try {
      const res = await fetch(`/api/loans/${updatedLoan.loanNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLoan)
      });
      if (res.ok) {
        setLoans(prev => prev.map(l => l.loanNo === updatedLoan.loanNo ? updatedLoan : l));
      }
    } catch (e) {
      console.error("Failed to persist ledger updates:", e);
    }
  };

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Column Sorting Logic
  const getSortedLoans = () => {
    const term = searchTerm.toLowerCase();
    const filtered = loans.filter(l => {
      return (
        l.loanNo.toLowerCase().includes(term) ||
        (l.customer?.name || "").toLowerCase().includes(term) ||
        (l.vehicle?.rcNo || "").toLowerCase().includes(term) ||
        (l.customer?.phone || "").toLowerCase().includes(term)
      );
    });

    return filtered.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "loanNo") {
        valA = a.loanNo;
        valB = b.loanNo;
      } else if (sortField === "name") {
        valA = a.customer?.name || "";
        valB = b.customer?.name || "";
      } else if (sortField === "vehicle") {
        valA = a.vehicle?.rcNo || "";
        valB = b.vehicle?.rcNo || "";
      } else if (sortField === "phone") {
        valA = a.customer?.phone || "";
        valB = b.customer?.phone || "";
      } else if (sortField === "dueAmount") {
        const paidCountA = a.installments?.filter((i: any) => i.status === "PAID").length || 0;
        const totalA = a.totalDueAmount || 0;
        const paidA = a.installments?.filter((i: any) => i.status === "PAID").reduce((sum: number, i: any) => sum + i.paidAmount, 0) || 0;
        valA = totalA - paidA;

        const paidCountB = b.installments?.filter((i: any) => i.status === "PAID").length || 0;
        const totalB = b.totalDueAmount || 0;
        const paidB = b.installments?.filter((i: any) => i.status === "PAID").reduce((sum: number, i: any) => sum + i.paidAmount, 0) || 0;
        valB = totalB - paidB;
      } else if (sortField === "totalAmount") {
        valA = a.totalDueAmount || 0;
        valB = b.totalDueAmount || 0;
      } else if (sortField === "handloan") {
        valA = a.handloanAmount || 0;
        valB = b.handloanAmount || 0;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
  };

  const sortedLoansList = getSortedLoans();

  // EXPORT UTILITIES
  const handleCopyClipboard = () => {
    const text = sortedLoansList.map((l, i) => {
      const paidDue = l.installments?.filter((ins: any) => ins.status === "PAID").length || 0;
      const pendDue = (l.installments?.length || 0) - paidDue;
      const paidAmt = l.installments?.filter((ins: any) => ins.status === "PAID").reduce((sum: number, ins: any) => sum + ins.paidAmount, 0) || 0;
      const defAmt = l.installments?.filter((ins: any) => ins.status === "OVERDUE").reduce((sum: number, ins: any) => sum + (ins.dueAmount - ins.paidAmount), 0) || 0;
      return `${i + 1}\t${l.loanNo}\t${l.customer?.name}\t${l.vehicle?.rcNo}\t${l.customer?.phone}\t${paidDue}\t${pendDue}\t₹${l.totalDueAmount - paidAmt}\t₹${l.handloanAmount || 0}\t₹${defAmt}\t₹${l.totalDueAmount}`;
    }).join("\n");
    
    const headers = "S.No\tHPL/A/C No\tBorrower Name\tVehicle No\tPhone\tPaid Due\tPend Due\tDue Amount\tHL Amount\tDefault\tTotal Amount\n";
    navigator.clipboard.writeText(headers + text);
    alert("HP Ledger Table copied to clipboard!");
  };

  const handleDownloadCSV = () => {
    let csv = "S.No,HPL A/C No,Borrower Name,Vehicle No,Phone,Paid Due,Pend Due,Due Amount,HL Amount,Default,Total Amount\n";
    sortedLoansList.forEach((l, i) => {
      const paidDue = l.installments?.filter((ins: any) => ins.status === "PAID").length || 0;
      const pendDue = (l.installments?.length || 0) - paidDue;
      const paidAmt = l.installments?.filter((ins: any) => ins.status === "PAID").reduce((sum: number, ins: any) => sum + ins.paidAmount, 0) || 0;
      const defAmt = l.installments?.filter((ins: any) => ins.status === "OVERDUE").reduce((sum: number, ins: any) => sum + (ins.dueAmount - ins.paidAmount), 0) || 0;
      csv += `${i + 1},${l.loanNo},"${l.customer?.name}",${l.vehicle?.rcNo},${l.customer?.phone},${paidDue},${pendDue},${l.totalDueAmount - paidAmt},${l.handloanAmount || 0},${defAmt},${l.totalDueAmount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `xerova_ledgers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTable = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let tableRows = "";
    sortedLoansList.forEach((l, i) => {
      const paidDue = l.installments?.filter((ins: any) => ins.status === "PAID").length || 0;
      const pendDue = (l.installments?.length || 0) - paidDue;
      const paidAmt = l.installments?.filter((ins: any) => ins.status === "PAID").reduce((sum: number, ins: any) => sum + ins.paidAmount, 0) || 0;
      const defAmt = l.installments?.filter((ins: any) => ins.status === "OVERDUE").reduce((sum: number, ins: any) => sum + (ins.dueAmount - ins.paidAmount), 0) || 0;
      tableRows += `
        <tr>
          <td>${i + 1}</td>
          <td><b>${l.loanNo}</b></td>
          <td>${l.customer?.name}</td>
          <td>${l.vehicle?.rcNo}</td>
          <td>${l.customer?.phone}</td>
          <td>${paidDue}</td>
          <td>${pendDue}</td>
          <td>₹${(l.totalDueAmount - paidAmt).toLocaleString()}</td>
          <td>₹${(l.handloanAmount || 0).toLocaleString()}</td>
          <td>₹${defAmt.toLocaleString()}</td>
          <td>₹${l.totalDueAmount.toLocaleString()}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>XEROVA AUTO FINANCE - HP LEDGERS</title>
          <style>
            body { font-family: sans-serif; padding: 20px; font-size: 11px; color: #333; }
            h1 { font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { bg-color: #f5f5f5; text-transform: uppercase; font-size: 9px; }
          </style>
        </head>
        <body>
          <h1>XEROVA AUTO FINANCE CORP</h1>
          <p>Generated On: ${new Date().toLocaleString()} | Filter query: "${searchTerm || "None"}"</p>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>A/C No / HPL</th>
                <th>Borrower Name</th>
                <th>Vehicle No</th>
                <th>Phone No</th>
                <th>Paid</th>
                <th>Pend</th>
                <th>Due Amt</th>
                <th>Hand Loan</th>
                <th>Default</th>
                <th>Total Amt</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleRowExpand = (loan: any) => {
    if (expandedLoanNo === loan.loanNo) {
      setExpandedLoanNo(null);
    } else {
      setExpandedLoanNo(loan.loanNo);
      // Initialize edit fields
      setRcStatus(loan.rcHistory?.[loan.rcHistory.length - 1]?.status || "In Office Yard");
      setRcLocation(loan.rcHistory?.[loan.rcHistory.length - 1]?.location || "Safe Vault #1A");
      setRcRemarks(loan.rcHistory?.[loan.rcHistory.length - 1]?.remarks || "");
      setHlAmount(loan.handloanAmount || 0);
      setHlRemarks(loan.handloanRemarks || "");
      setActiveTab("personal");
      setSmsStatus(null);
    }
  };

  // ADD CALL LOG
  const handleAddCallLog = (loan: any) => {
    if (!newCallNote.trim()) return;
    const newLog = {
      date: new Date().toISOString().split("T")[0],
      operator: "Superadmin Staff",
      disposition: newCallDisp,
      note: newCallNote,
      followup: newCallFollowup || "None"
    };

    const updated = {
      ...loan,
      callLogs: [newLog, ...(loan.callLogs || [])]
    };

    saveLoanUpdates(updated);
    setNewCallNote("");
    setNewCallFollowup("");
    alert("Follow-up call history log written successfully!");
  };

  // UPDATE RC STATUS
  const handleUpdateRc = (loan: any) => {
    const updatedHistory = [
      ...(loan.rcHistory || []),
      {
        date: new Date().toISOString().split("T")[0],
        status: rcStatus,
        location: rcLocation,
        remarks: rcRemarks
      }
    ];

    const updated = {
      ...loan,
      rcHistory: updatedHistory
    };

    saveLoanUpdates(updated);
    setRcRemarks("");
    alert("RC Book Status log updated successfully!");
  };

  // UPDATE HAND LOAN
  const handleUpdateHandLoan = (loan: any) => {
    const updated = {
      ...loan,
      handloanAmount: hlAmount,
      handloanRemarks: hlRemarks
    };

    saveLoanUpdates(updated);
    alert("Hand loan parameters updated permanently in ledger book!");
  };

  // SEND SIMULATED SMS
  const handleSendSMS = (phone: string) => {
    if (!smsText.trim()) return;
    setSmsStatus("sending");
    setTimeout(() => {
      setSmsStatus("success");
      setSmsText("");
      setTimeout(() => setSmsStatus(null), 3000);
    }, 1200);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm font-sans">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            Durable HP Ledgers List & Active Portfolios
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Click any row expand icon to view profiles, add call logs, track RC books, or dispatch SMS reminders.</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Global search input */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 flex-1 sm:flex-initial">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by HPL/Name/VNo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none w-full sm:w-44 font-semibold"
            />
          </div>

          <button 
            onClick={handleCopyClipboard}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] py-1 px-2 transition-all font-semibold cursor-pointer"
            title="Copy selection"
          >
            <Copy className="h-3.5 w-3.5 text-slate-500" />
            Copy
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] py-1 px-2 transition-all font-semibold cursor-pointer"
            title="Download CSV file"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            CSV
          </button>
          <button 
            onClick={handlePrintTable}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] py-1 px-2 transition-all font-semibold cursor-pointer"
            title="Print report"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
          <p className="text-slate-400 text-[10px] mt-2 font-semibold">Indexing active HP agreements...</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 select-none tracking-wider sticky top-0 z-10">
                <th className="px-3.5 py-2.5 w-10 text-center">S.No</th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("loanNo")}>
                  <div className="flex items-center gap-1">
                    HPL / A/C No
                    {sortField === "loanNo" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    Borrower Name
                    {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("vehicle")}>
                  <div className="flex items-center gap-1">
                    Vehicle No
                    {sortField === "vehicle" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("phone")}>
                  <div className="flex items-center gap-1">
                    Phone No
                    {sortField === "phone" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-2 py-2.5 text-center font-semibold">Paid Due</th>
                <th className="px-2 py-2.5 text-center font-semibold">Pend Due</th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort("dueAmount")}>
                  <div className="flex items-center justify-end gap-1">
                    Due Amt
                    {sortField === "dueAmount" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-right font-semibold cursor-pointer" onClick={() => handleSort("handloan")}>Hand Loan</th>
                <th className="px-3.5 py-2.5 text-right font-semibold text-rose-600">Def</th>
                <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort("totalAmount")}>
                  <div className="flex items-center justify-end gap-1">
                    Total Amt
                    {sortField === "totalAmount" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold text-[11px]">
              {sortedLoansList.map((loan, idx) => {
                const isExpanded = expandedLoanNo === loan.loanNo;
                const installments = loan.installments || [];
                const paidCount = installments.filter((i: any) => i.status === "PAID").length;
                const pendCount = installments.length - paidCount;
                const totalAmt = loan.totalDueAmount || 0;
                
                const paidAmt = installments.filter((i: any) => i.status === "PAID").reduce((sum: number, i: any) => sum + i.paidAmount, 0);
                const remainingDue = totalAmt - paidAmt;
                const defAmt = installments.filter((i: any) => i.status === "OVERDUE").reduce((sum: number, i: any) => sum + (i.dueAmount - i.paidAmount), 0);

                return (
                  <React.Fragment key={loan.loanNo}>
                    <tr className={`hover:bg-slate-50/80 transition-all ${isExpanded ? "bg-indigo-50/20" : ""}`}>
                      <td className="px-3.5 py-2.5 text-center font-mono text-[10px] text-slate-400">{idx + 1}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">{loan.loanNo}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-800">{loan.customer?.name}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-700">{loan.vehicle?.rcNo}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-500">{loan.customer?.phone}</td>
                      <td className="px-2 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200">
                          {paidCount}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${pendCount > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-50 text-slate-400"}`}>
                          {pendCount}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-800 font-mono">₹{remainingDue.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-right text-slate-500 font-mono">₹{(loan.handloanAmount || 0).toLocaleString()}</td>
                      <td className={`px-3.5 py-2.5 text-right font-mono font-bold ${defAmt > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`}>
                        ₹{defAmt.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono">₹{totalAmt.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <button 
                          onClick={() => toggleRowExpand(loan)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors"
                          title="Expand customer profile"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible Customer Profile Section (Requirement 5 & 6) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={12} className="bg-slate-50/50 p-4 border-l-4 border-indigo-600">
                          <div className="bg-white border border-slate-250 rounded-lg overflow-hidden shadow-sm flex flex-col">
                            
                            {/* Card Header Profile Brief */}
                            <div className="bg-slate-900 text-white p-3.5 flex flex-wrap justify-between items-center gap-2">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                                  {loan.customer?.name?.[0]}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold leading-none">{loan.customer?.name} ({loan.loanNo})</h4>
                                  <p className="text-[10px] text-slate-400 mt-1">HP Agreement Date: <span className="text-indigo-400 font-mono font-semibold">{loan.hpDate}</span> | Default penalty rate: <span className="text-amber-400 font-semibold">₹{loan.penaltyRatePerDay || 5}/day</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${loan.status === "ACTIVE" ? "bg-green-600" : "bg-blue-600"}`}>
                                  Status: {loan.status}
                                </span>
                                <button 
                                  onClick={() => onViewLoan(loan.loanNo)}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-0.5 rounded text-[10px] transition-colors"
                                >
                                  Open Ledger Account View
                                </button>
                              </div>
                            </div>

                            {/* Card Navigation Tabs */}
                            <div className="flex border-b border-slate-200 text-[10px] gap-1 overflow-x-auto bg-slate-50 p-1 select-none">
                              <button 
                                onClick={() => setActiveTab("personal")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "personal" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Personal Profile
                              </button>
                              <button 
                                onClick={() => setActiveTab("co_obligant")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "co_obligant" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Guarantor / Co-obligant
                              </button>
                              <button 
                                onClick={() => setActiveTab("collateral")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "collateral" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Collateral specs
                              </button>
                              <button 
                                onClick={() => setActiveTab("extended_dossier")}
                                className={`px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold transition-all hover:bg-indigo-100 ${activeTab === "extended_dossier" ? "bg-indigo-600 text-white shadow-xs" : ""}`}
                              >
                                ★ Extended Ledger Dossier
                              </button>
                              <button 
                                onClick={() => setActiveTab("repayments")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "repayments" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Repayments schedule
                              </button>
                              <button 
                                onClick={() => setActiveTab("calls")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "calls" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Follow-Up calls log ({loan.callLogs?.length || 0})
                              </button>
                              <button 
                                onClick={() => setActiveTab("rc_history")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "rc_history" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                RC Book histories
                              </button>
                              <button 
                                onClick={() => setActiveTab("hand_loans")}
                                className={`px-3 py-1.5 rounded font-bold transition-all ${activeTab === "hand_loans" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Hand Loans auxiliary ({loan.handloanAmount ? "1 Log" : "0"})
                              </button>
                            </div>

                            {/* Tab Content Display */}
                            <div className="p-4 text-xs">
                              
                              {/* 1. PERSONAL PROFILE */}
                              {activeTab === "personal" && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Borrower details</h5>
                                    <p><span className="text-slate-400">DOB:</span> <b className="text-slate-700">{loan.customer?.dob || "N/A"}</b></p>
                                    <p><span className="text-slate-400">Father/Spouse:</span> <b className="text-slate-700">{loan.customer?.fatherName || loan.customer?.spouseName || "N/A"}</b></p>
                                    <p><span className="text-slate-400">Occupation:</span> <b className="text-slate-700">{loan.customer?.occupation || "N/A"}</b></p>
                                    <p><span className="text-slate-400">Verifiable Income:</span> <b className="text-slate-700">₹{loan.customer?.income?.toLocaleString()}/mo</b></p>
                                  </div>
                                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Contact & Residential</h5>
                                    <p className="flex items-center gap-1"><span className="text-slate-400">Phone:</span> <b className="text-slate-700 font-mono">{loan.customer?.phone}</b></p>
                                    <p><span className="text-slate-400">Address:</span> <span className="text-slate-700 font-semibold">{loan.customer?.address || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Landmark:</span> <span className="text-slate-700">{loan.customer?.landmark || "N/A"}</span></p>
                                    <p><span className="text-slate-400">House Type:</span> <b className="text-indigo-600 uppercase text-[9px]">{loan.customer?.houseType || "OWN"} RESIDENCE</b></p>
                                  </div>

                                  {/* SMS Dispatcher Box */}
                                  <div className="bg-slate-900 text-white rounded-lg p-3 flex flex-col justify-between">
                                    <div>
                                      <h5 className="font-bold text-indigo-400 uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1.5">
                                        <Send className="h-3 w-3" />
                                        Direct Borrower SMS Dispatcher
                                      </h5>
                                      <textarea 
                                        rows={2} 
                                        value={smsText}
                                        onChange={(e) => setSmsText(e.target.value)}
                                        placeholder="Type SMS collection reminder or legal warnings here..."
                                        className="w-full bg-slate-950 text-white placeholder:text-slate-500 rounded border border-slate-800 p-1.5 text-[10px] focus:outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between mt-2 select-none">
                                      {smsStatus === "sending" && <span className="text-[9px] text-indigo-400 animate-pulse">Transmitting packet...</span>}
                                      {smsStatus === "success" && <span className="text-[9px] text-green-400 font-bold">SMS Sent Successfully!</span>}
                                      {!smsStatus && <span className="text-[8px] text-slate-500 font-mono">Simulated GSM Terminal</span>}
                                      <button 
                                        onClick={() => handleSendSMS(loan.customer?.phone)}
                                        disabled={!smsText.trim() || smsStatus === "sending"}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors self-end shrink-0"
                                      >
                                        Send Message
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 2. CO-OBLIGANT */}
                              {activeTab === "co_obligant" && (
                                <div className="space-y-3">
                                  <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1 mb-2">Guarantor / Co-obligant Primary Dossier</h5>
                                  {loan.coObligants && loan.coObligants.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {loan.coObligants.map((co: any, i: number) => (
                                        <div key={i} className="bg-slate-50 p-3 rounded border border-slate-200">
                                          <p className="font-bold text-indigo-600 text-[10px] mb-1 font-mono uppercase">Guarantor Profile #{i+1}</p>
                                          <p><span className="text-slate-400">Name:</span> <b className="text-slate-700">{co.name || "N/A"}</b></p>
                                          <p><span className="text-slate-400">Father/Spouse:</span> <b className="text-slate-700">{co.fatherSpouseName || "N/A"}</b></p>
                                          <p><span className="text-slate-400">Address:</span> <span className="text-slate-700">{co.address || "N/A"}</span></p>
                                          <p><span className="text-slate-400">Mobile Phone:</span> <b className="text-slate-700 font-mono">{co.phone || "N/A"}</b></p>
                                          <p><span className="text-slate-400">Govt ID Type/No:</span> <b className="text-slate-700 font-mono">{co.govtId || "N/A"}</b></p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-slate-400 italic text-[11px]">No active guarantors or co-obligants loaded on file.</p>
                                  )}
                                </div>
                              )}

                              {/* 3. COLLATERAL SPECS */}
                              {activeTab === "collateral" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-100">
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Collateral Vehicle specs</h5>
                                    <p><span className="text-slate-400">Classification:</span> <b className="text-slate-700">{loan.vehicle?.vehicleType || "N/A"}</b></p>
                                    <p><span className="text-slate-400">Maker Brand/Model:</span> <b className="text-slate-700">{loan.vehicle?.vehicleName || "N/A"}</b></p>
                                    <p><span className="text-slate-400">RC Plate Number:</span> <b className="text-indigo-600 font-mono">{loan.vehicle?.rcNo}</b></p>
                                    <p><span className="text-slate-400">Engine No:</span> <b className="text-slate-700 font-mono">{loan.vehicle?.engineNo}</b></p>
                                    <p><span className="text-slate-400">Chassis No:</span> <b className="text-slate-700 font-mono">{loan.vehicle?.chassisNo}</b></p>
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Asset Expirations</h5>
                                    <p><span className="text-slate-400">Insurance Company:</span> <span className="text-slate-700 font-semibold">{loan.vehicle?.insuranceCompany || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Insurance Expiration:</span> <span className="text-rose-600 font-mono font-semibold">{loan.vehicle?.insuranceExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Fitness Expiration (FC):</span> <span className="text-slate-700 font-mono">{loan.vehicle?.fcExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Permit Expiration:</span> <span className="text-slate-700 font-mono">{loan.vehicle?.permitExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Pollution Clearance (PUCC):</span> <span className="text-slate-700 font-mono">{loan.vehicle?.pollutionExpiry || "N/A"}</span></p>
                                  </div>
                                </div>
                              )}

                              {/* 3. COLLATERAL SPECS */}
                              {activeTab === "collateral" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-100">
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Collateral Vehicle specs</h5>
                                    <p><span className="text-slate-400">Classification:</span> <b className="text-slate-700">{loan.vehicle?.vehicleType || "N/A"}</b></p>
                                    <p><span className="text-slate-400">Maker Brand/Model:</span> <b className="text-slate-700">{loan.vehicle?.vehicleName || "N/A"}</b></p>
                                    <p><span className="text-slate-400">RC Plate Number:</span> <b className="text-indigo-600 font-mono">{loan.vehicle?.rcNo}</b></p>
                                    <p><span className="text-slate-400">Engine No:</span> <b className="text-slate-700 font-mono">{loan.vehicle?.engineNo}</b></p>
                                    <p><span className="text-slate-400">Chassis No:</span> <b className="text-slate-700 font-mono">{loan.vehicle?.chassisNo}</b></p>
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] mb-1.5">Asset Expirations</h5>
                                    <p><span className="text-slate-400">Insurance Company:</span> <span className="text-slate-700 font-semibold">{loan.vehicle?.insuranceCompany || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Insurance Expiration:</span> <span className="text-rose-600 font-mono font-semibold">{loan.vehicle?.insuranceExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Fitness Expiration (FC):</span> <span className="text-slate-700 font-mono">{loan.vehicle?.fcExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Permit Expiration:</span> <span className="text-slate-700 font-mono">{loan.vehicle?.permitExpiry || "N/A"}</span></p>
                                    <p><span className="text-slate-400">Pollution Clearance (PUCC):</span> <span className="text-slate-700 font-mono">{loan.vehicle?.pollutionExpiry || "N/A"}</span></p>
                                  </div>
                                </div>
                              )}

                              {/* SECTION 16, 17, 18: EXTENDED DOSSIER AND FINANCIAL RECONCILIATION */}
                              {activeTab === "extended_dossier" && (
                                <div className="space-y-6">
                                  
                                  {/* SECTION 16: Customer Detail Record Extended Fields */}
                                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                      <h5 className="font-black text-slate-800 uppercase text-[9px] tracking-wider">Extended Registration Dossier Contract Fields</h5>
                                      <span className="text-[8.5px] font-mono text-indigo-700 font-bold">HP-AGREEMENT-RECORD</span>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50">
                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">A/C Identification</p>
                                        <p><span className="text-slate-500">SNo Serial:</span> <b className="text-slate-800 font-mono">{loan.sNo || 1}</b></p>
                                        <p><span className="text-slate-500">Agreement Date:</span> <b className="text-slate-800 font-mono">{loan.hpDate || "2026-02-15"}</b></p>
                                        <p><span className="text-slate-500">Reg Plate No:</span> <b className="text-indigo-600 font-mono">{loan.vehicle?.rcNo}</b></p>
                                        <p><span className="text-slate-500">HP No (Key):</span> <b className="text-slate-800 font-mono">{loan.loanNo}</b></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Primary Borrower</p>
                                        <p><span className="text-slate-500">Part Name:</span> <b className="text-slate-800">{loan.customer?.name}</b></p>
                                        <p><span className="text-slate-500">S/O Father:</span> <b className="text-slate-800">{loan.customer?.fatherName || loan.customer?.spouseName || "N/A"}</b></p>
                                        <p><span className="text-slate-500">Cell No (Primary):</span> <b className="text-slate-800 font-mono">{loan.customer?.phone}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Address Details:</span> <span className="text-slate-700 font-semibold">{loan.customer?.address || "N/A"}</span></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Guarantor / Co-Obligant</p>
                                        <p><span className="text-slate-500">Co-Obligant:</span> <b className="text-slate-800">{loan.coObligants?.[0]?.name || "N/A"}</b></p>
                                        <p><span className="text-slate-500">S/O Father:</span> <b className="text-slate-800">{loan.coObligants?.[0]?.fatherSpouseName || "N/A"}</b></p>
                                        <p><span className="text-slate-500">Cell No (Sec):</span> <b className="text-slate-800 font-mono">{loan.coObligants?.[0]?.phone || "N/A"}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Address details:</span> <span className="text-slate-700 font-semibold">{loan.coObligants?.[0]?.address || "N/A"}</span></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Vehicle Details & Values</p>
                                        <p className="truncate"><span className="text-slate-500">Vehicle Name:</span> <b className="text-slate-800">{loan.vehicle?.vehicleName || "N/A"}</b></p>
                                        <p><span className="text-slate-500">Model Year:</span> <b className="text-slate-800 font-mono">{loan.vehicle?.modelYear || "2024"}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Ch. No (Chassis):</span> <b className="text-slate-800 font-mono text-[9px]">{loan.vehicle?.chassisNo}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Eng. No (Engine):</span> <b className="text-slate-800 font-mono text-[9px]">{loan.vehicle?.engineNo}</b></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Insurance & Keys</p>
                                        <p><span className="text-slate-500">Key No Tag:</span> <b className="text-slate-800 font-mono">KEY-{loan.vehicle?.keyNo || "9082"}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Rc Book No:</span> <b className="text-indigo-600 font-mono">{loan.vehicle?.rcNo}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Ins Policy No:</span> <b className="text-slate-800 font-mono text-[9px]">{loan.vehicle?.insurancePolicyNo || "POL-827391"}</b></p>
                                        <p className="truncate"><span className="text-slate-500">Ins Company:</span> <span className="text-slate-700 font-semibold">{loan.vehicle?.insuranceCompany || "N/A"}</span></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Valuations & Duties</p>
                                        <p><span className="text-slate-500">Ins Val (IDV):</span> <b className="text-slate-800 font-mono">₹{Math.round(loan.loanAmount * 1.25)?.toLocaleString()}</b></p>
                                        <p><span className="text-slate-500">HP Ag No:</span> <b className="text-slate-800 font-mono">AG-{loan.loanNo}</b></p>
                                        <p><span className="text-slate-500">Stamp Duty (Rs.):</span> <b className="text-slate-800 font-mono">₹{loan.stampDuty || 350}</b></p>
                                      </div>

                                      <div className="space-y-1 bg-white p-2 border rounded shadow-3xs lg:col-span-2">
                                        <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Broker & Comm. Ledger</p>
                                        <div className="grid grid-cols-2 gap-2">
                                          <p><span className="text-slate-500">Broker Name:</span> <b className="text-slate-800 block text-[10px]">{loan.brokerName || "Direct Sales Dealer"}</b></p>
                                          <p><span className="text-slate-500">Commission paid:</span> <b className="text-rose-600 font-mono block text-xs">₹{(loan.brokerCommission || 1500).toLocaleString()}</b></p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* SECTION 17: Loan Due/Installment Schedule Table */}
                                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                    <div className="bg-slate-900 text-white px-3 py-2 flex justify-between items-center">
                                      <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                        <ClipboardList className="h-4 w-4 text-indigo-400" />
                                        Section 17: Loan Due & Installment Schedule Ledger
                                      </h5>
                                      <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-300">AUTO-GEN INTEREST MATRIX</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-[10.5px]">
                                        <thead>
                                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[8.5px]">
                                            <th className="p-2 text-center w-10">Sl No</th>
                                            <th className="p-2 font-mono">Due Date</th>
                                            <th className="p-2 text-right">Due Amount (EMI)</th>
                                            <th className="p-2 text-right">Interest Part</th>
                                            <th className="p-2 text-right">Principal Part</th>
                                            <th className="p-2 text-right text-rose-600">Late Fine</th>
                                            <th className="p-2 font-mono">Paid Date</th>
                                            <th className="p-2 text-right text-emerald-600">Paid Amount</th>
                                            <th className="p-2 text-right font-bold">Balance</th>
                                            <th className="p-2">Collection Staff</th>
                                            <th className="p-2 text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 font-sans">
                                          {installments.map((inst: any, idx: number) => {
                                            const interestPart = inst.interestPart || Math.round(inst.dueAmount * 0.14);
                                            const principalPart = inst.principalPart || (inst.dueAmount - interestPart);
                                            const penaltyPart = inst.penaltyAmount || 0;
                                            const paidDate = inst.paidDate || (inst.status === "PAID" ? inst.dueDate : "N/A");
                                            const paidAmount = inst.paidAmount || (inst.status === "PAID" ? inst.dueAmount : 0);
                                            const balance = inst.dueAmount - paidAmount;
                                            const collectionBoy = inst.collectionBoy || "Self Counter";

                                            return (
                                              <tr key={inst.id} className="hover:bg-slate-50">
                                                <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                                <td className="p-2 font-mono text-slate-700">{inst.dueDate}</td>
                                                <td className="p-2 text-right font-mono font-bold">₹{inst.dueAmount?.toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono text-slate-500">₹{interestPart?.toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono text-slate-500">₹{principalPart?.toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono text-rose-600">₹{penaltyPart}</td>
                                                <td className="p-2 font-mono text-slate-500">{paidDate}</td>
                                                <td className="p-2 text-right font-mono text-emerald-600 font-bold">₹{paidAmount?.toLocaleString()}</td>
                                                <td className="p-2 text-right font-mono font-black text-slate-900">₹{balance?.toLocaleString()}</td>
                                                <td className="p-2 font-semibold text-slate-600">{collectionBoy}</td>
                                                <td className="p-2 text-center">
                                                  <span className={`inline-block text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    inst.status === "PAID" ? "bg-green-100 text-green-700" :
                                                    inst.status === "OVERDUE" ? "bg-rose-100 text-rose-700" :
                                                    "bg-amber-100 text-amber-700"
                                                  }`}>
                                                    {inst.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* SECTION 18: Payment/Receipt Ledger Table */}
                                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                    <div className="bg-emerald-900 text-white px-3 py-2 flex justify-between items-center">
                                      <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                        <CreditCard className="h-4 w-4 text-emerald-300" />
                                        Section 18: Cashier Payment & EMI Receipt Ledger Table
                                      </h5>
                                      <span className="text-[9px] font-mono bg-emerald-800 px-2 py-0.5 rounded font-semibold text-slate-300">REALTIME POSTINGS</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-[10.5px]">
                                        <thead>
                                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[8.5px]">
                                            <th className="p-2 text-center w-10">S.No</th>
                                            <th className="p-2 font-mono">Receipt No</th>
                                            <th className="p-2 font-mono">Paid Date</th>
                                            <th className="p-2 text-right text-emerald-700">Paid Amount</th>
                                            <th className="p-2 text-right">Interest Part</th>
                                            <th className="p-2 text-right">Principal Part</th>
                                            <th className="p-2 text-right text-rose-600">Delay Fine / Penalty</th>
                                            <th className="p-2">Received By (Staff)</th>
                                            <th className="p-2">Mode</th>
                                            <th className="p-2 text-center">Receipt Print</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 font-sans">
                                          {loan.payments && loan.payments.length > 0 ? (
                                            loan.payments.map((p: any, idx: number) => {
                                              const receiptNo = p.receiptNo || p.rcptNo || `REC-2026-${String(idx + 1).padStart(4, '0')}`;
                                              const paidAmount = p.amount || 2500;
                                              const interestPart = p.interestPart || Math.round(paidAmount * 0.14);
                                              const principalPart = p.principalPart || (paidAmount - interestPart);
                                              const penaltyPart = p.penaltyPaid || p.penalty || 0;
                                              const receivedBy = p.receivedBy || "Cashier Desk #1";
                                              const mode = p.mode || "Cash";

                                              return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                  <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                                  <td className="p-2 font-mono font-bold text-slate-800">{receiptNo}</td>
                                                  <td className="p-2 font-mono text-slate-700">{p.date}</td>
                                                  <td className="p-2 text-right font-mono font-extrabold text-emerald-700">₹{paidAmount?.toLocaleString()}</td>
                                                  <td className="p-2 text-right font-mono text-slate-500">₹{interestPart?.toLocaleString()}</td>
                                                  <td className="p-2 text-right font-mono text-slate-500">₹{principalPart?.toLocaleString()}</td>
                                                  <td className="p-2 text-right font-mono text-rose-600">₹{penaltyPart}</td>
                                                  <td className="p-2 font-semibold text-slate-600">{receivedBy}</td>
                                                  <td className="p-2 font-mono text-indigo-600 uppercase text-[9px] font-bold">{mode}</td>
                                                  <td className="p-2 text-center select-none">
                                                    <button 
                                                      onClick={() => {
                                                        alert(`Direct thermal reprint initiated for ${receiptNo}. Loading layout...`);
                                                        window.print();
                                                      }}
                                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[8px] px-2 py-0.5 rounded transition-all cursor-pointer inline-flex items-center gap-0.5"
                                                    >
                                                      <Printer className="h-2 w-2" /> Reprint Receipt
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          ) : (
                                            <tr>
                                              <td colSpan={10} className="p-4 text-center text-slate-400 italic">No formal cashier receipt payment logs written for this HP contract ledger.</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                </div>
                              )}

                              {/* 4. REPAYMENTS SCHEDULE */}
                              {activeTab === "repayments" && (
                                <div className="space-y-3">
                                  <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1">Repayment Installments Schedule</h5>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[220px] overflow-y-auto p-1 bg-slate-50 rounded border border-slate-150">
                                    {installments.map((inst: any, i: number) => {
                                      const isPaid = inst.status === "PAID";
                                      const isOverdue = inst.status === "OVERDUE";
                                      return (
                                        <div 
                                          key={inst.id} 
                                          className={`p-2 rounded border text-center font-mono ${
                                            isPaid 
                                              ? "bg-green-50 border-green-200 text-green-800" 
                                              : isOverdue 
                                                ? "bg-rose-50 border-rose-200 text-rose-800 animate-pulse" 
                                                : "bg-white border-slate-200 text-slate-700"
                                          }`}
                                        >
                                          <p className="text-[9px] font-bold">Month {i + 1}</p>
                                          <p className="text-xs font-bold font-sans mt-0.5">₹{inst.dueAmount.toLocaleString()}</p>
                                          <p className="text-[8px] text-slate-400 mt-1">{inst.dueDate}</p>
                                          <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded mt-1.5 ${
                                            isPaid 
                                              ? "bg-green-100 text-green-700" 
                                              : isOverdue 
                                                ? "bg-rose-100 text-rose-700" 
                                                : "bg-slate-100 text-slate-500"
                                          }`}>
                                            {inst.status}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 5. FOLLOW-UP CALLS LOG */}
                              {activeTab === "calls" && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Call history List */}
                                  <div className="md:col-span-2 space-y-2 max-h-[240px] overflow-y-auto pr-2">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1 mb-2">Audit Call Reminders Log ({loan.callLogs?.length || 0})</h5>
                                    {loan.callLogs && loan.callLogs.length > 0 ? (
                                      loan.callLogs.map((c: any, i: number) => (
                                        <div key={i} className="bg-slate-50 p-2.5 rounded border border-slate-150 font-sans">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-indigo-600 font-mono">{c.date} | Agent: {c.operator}</span>
                                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase font-mono ${
                                              c.disposition === "PTP (Promise to Pay)" ? "bg-green-100 text-green-800" :
                                              c.disposition === "Ringing No Answer" || c.disposition === "No Answer" ? "bg-amber-100 text-amber-800" :
                                              "bg-rose-100 text-rose-800"
                                            }`}>{c.disposition}</span>
                                          </div>
                                          <p className="text-slate-700 leading-relaxed font-semibold">{c.note}</p>
                                          {c.followup && c.followup !== "None" && (
                                            <p className="text-[9px] text-rose-600 font-mono mt-1 font-bold">Follow-Up Date: {c.followup}</p>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-slate-400 italic text-[11px]">No calls compiled for this party yet.</p>
                                    )}
                                  </div>

                                  {/* Add Call Log Form */}
                                  <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1">Register New Call Event</h5>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Disposition Code</label>
                                      <select 
                                        value={newCallDisp} 
                                        onChange={(e) => setNewCallDisp(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px]"
                                      >
                                        <option value="No Answer">No Answer / Switched Off</option>
                                        <option value="Ringing No Answer">Ringing No Answer</option>
                                        <option value="PTP (Promise to Pay)">PTP (Promise to Pay)</option>
                                        <option value="Refused to Pay">Refused to Pay / Disputes</option>
                                        <option value="Out of Station">Out of Station</option>
                                        <option value="Switch Off">Switch Off / Unreachable</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Operator Notes</label>
                                      <textarea 
                                        rows={2}
                                        value={newCallNote}
                                        onChange={(e) => setNewCallNote(e.target.value)}
                                        placeholder="Party claims will visit branch..."
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px] focus:outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Follow-Up Commitment Date</label>
                                      <input 
                                        type="date"
                                        value={newCallFollowup}
                                        onChange={(e) => setNewCallFollowup(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px] font-mono"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleAddCallLog(loan)}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded transition-colors cursor-pointer"
                                    >
                                      Commit Call Note
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 6. RC BOOK HISTORIES */}
                              {activeTab === "rc_history" && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* List RC History */}
                                  <div className="md:col-span-2 space-y-2 max-h-[240px] overflow-y-auto pr-2">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1 mb-2">RC Book Storage & Custody histories ({loan.rcHistory?.length || 0})</h5>
                                    {loan.rcHistory && loan.rcHistory.map((h: any, i: number) => (
                                      <div key={i} className="bg-slate-50 p-2 text-xs rounded border border-slate-150">
                                        <div className="flex justify-between items-center mb-0.5 text-[9px] text-slate-400 font-mono">
                                          <span>Updated Date: {h.date}</span>
                                          <span className="font-bold text-indigo-600 uppercase bg-indigo-50 border px-1 rounded">{h.status}</span>
                                        </div>
                                        <p className="font-bold text-slate-700 leading-none">Safe Location: <span className="font-mono text-slate-600">{h.location}</span></p>
                                        {h.remarks && <p className="text-slate-500 text-[10px] mt-1 italic font-semibold">Remarks: {h.remarks}</p>}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Update RC Book Status Form */}
                                  <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1">Modify RC Storage Status</h5>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Physical Status</label>
                                      <select 
                                        value={rcStatus} 
                                        onChange={(e) => setRcStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px]"
                                      >
                                        <option value="In Office Yard">In Office Vault (Safe Custody)</option>
                                        <option value="With Dealer RTO">With Showroom/Dealer (RTO Process)</option>
                                        <option value="Dispatched to Party">Released to Borrower (Closed Account)</option>
                                        <option value="Submitted to Police">Submitted to Police (Seizure Dispute)</option>
                                        <option value="RC Missing">RC Missing / Duplicate Required</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Storage Location / Vault No</label>
                                      <input 
                                        type="text"
                                        value={rcLocation}
                                        onChange={(e) => setRcLocation(e.target.value)}
                                        placeholder="Vault Drawer #1B, Shelf C"
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase block mb-0.5">Remarks / Reason</label>
                                      <input 
                                        type="text"
                                        value={rcRemarks}
                                        onChange={(e) => setRcRemarks(e.target.value)}
                                        placeholder="Original card filed..."
                                        className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1 text-[10px]"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleUpdateRc(loan)}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded transition-colors cursor-pointer"
                                    >
                                      Commit Custody Update
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 7. HAND LOANS AUXILIARY */}
                              {activeTab === "hand_loans" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200">
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px]">Auxiliary Hand Loan Ledger Logs</h5>
                                    <p className="text-[10px] text-slate-400">Auxiliary hand loans are zero-interest short-term cash extensions provided to cover road tax, RTO agent fees, or spot insurance differences.</p>
                                    
                                    <div className="border border-indigo-100 bg-white rounded p-3 mt-2.5">
                                      <p className="text-[9px] text-indigo-600 font-mono font-bold uppercase">Current Hand Loan State</p>
                                      <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-slate-500">Advance cash outstanding:</span>
                                        <span className="text-lg font-bold font-mono text-slate-900">₹{(loan.handloanAmount || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="mt-1 text-[10px]">
                                        <span className="text-slate-400">Ledger Remarks:</span> <span className="font-semibold text-slate-700">{loan.handloanRemarks || "(Omitted / No details)"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                                    <h5 className="font-bold text-indigo-700 uppercase tracking-wide text-[9px] border-b pb-1">Edit Auxiliary Hand Loan</h5>
                                    <div>
                                      <label className="text-[8px] text-slate-500 block mb-0.5">Hand Loan Amount (₹)</label>
                                      <input 
                                        type="number"
                                        value={hlAmount}
                                        onChange={(e) => setHlAmount(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded p-1 text-[10px] font-mono font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 block mb-0.5">Remarks / Reason</label>
                                      <input 
                                        type="text"
                                        value={hlRemarks}
                                        onChange={(e) => setHlRemarks(e.target.value)}
                                        placeholder="Covered road tax and agent fees..."
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded p-1 text-[10px]"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleUpdateHandLoan(loan)}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded transition-colors cursor-pointer"
                                    >
                                      Save Hand Loan Ledger
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {sortedLoansList.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400 font-semibold font-sans">
                    No active HP loan accounts found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
