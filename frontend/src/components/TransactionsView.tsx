/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Banknote, FileSpreadsheet, Check, Coins, FileLock, Barcode, Printer, Share2, Clipboard, Landmark, RefreshCw } from "lucide-react";
import { ReceiptPayMode, VoucherType } from "../types.js";

interface TransactionsViewProps {
  onSuccess: () => void;
  prefillReprintNo?: string | null;
  prefillLoanNo?: string | null;
}

export default function TransactionsView({ onSuccess, prefillReprintNo, prefillLoanNo }: TransactionsViewProps) {
  const [activeTab, setActiveTab] = useState<"receipt" | "voucher" | "deposit" | "handloan" | "binding">("receipt");
  const [loading, setLoading] = useState(false);
  
  // API state
  const [loans, setLoans] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [handloans, setHandloans] = useState<any[]>([]);

  // Selected receipt for printing dialog
  const [printReceipt, setPrintReceipt] = useState<any | null>(null);

  // Form states
  const [receiptForm, setReceiptForm] = useState({
    loanNo: "",
    amount: "",
    payMode: ReceiptPayMode.CASH,
    payModeDetails: "Counter Cashier",
    penaltyPaid: "0",
    documentationChargePaid: "0",
    remarks: "EMI Collection Received",
    collectedBy: "Gopal Cashier"
  });

  const [voucherForm, setVoucherForm] = useState({
    type: VoucherType.PAYMENT,
    debitLedger: "Cash in Hand",
    creditLedger: "State Bank of India",
    amount: "",
    narration: ""
  });

  const [depositForm, setDepositForm] = useState({
    type: "CASH",
    amount: "",
    accountNo: "SBI - 100223344",
    bankName: "State Bank of India",
    referenceNo: ""
  });

  const [hlForm, setHlForm] = useState({
    customerName: "",
    phone: "",
    amount: "",
    remarks: ""
  });

  // Prefill reprint if passed from dashboard
  useEffect(() => {
    fetchLoans();
    fetchTransactions();
    if (prefillReprintNo) {
      handleReprintQuery(prefillReprintNo);
    }
  }, [prefillReprintNo]);

  // Handle prefillLoanNo
  useEffect(() => {
    if (prefillLoanNo) {
      const match = loans.find(l => l.loanNo === prefillLoanNo);
      setReceiptForm(prev => ({
        ...prev,
        loanNo: prefillLoanNo,
        amount: match?.emiAmount ? String(match.emiAmount) : prev.amount
      }));
      setActiveTab("receipt");
    }
  }, [prefillLoanNo, loans]);

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      setLoans(data.filter((l: any) => l.status === "ACTIVE" || l.status === "SEIZED"));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const [recRes, vchRes, hlRes] = await Promise.all([
        fetch("/api/receipts"),
        fetch("/api/vouchers"),
        fetch("/api/handloans")
      ]);
      setReceipts(await recRes.json());
      setVouchers(await vchRes.json());
      setHandloans(await hlRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleReprintQuery = async (no: string) => {
    try {
      const res = await fetch("/api/receipts");
      const recs = await res.json();
      const match = recs.find((r: any) => r.receiptNo === no || r.id === no);
      if (match) {
        setPrintReceipt(match);
      } else {
        alert("Receipt Number not found.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.loanNo || !receiptForm.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptForm)
      });
      if (res.ok) {
        const createdReceipt = await res.json();
        setPrintReceipt(createdReceipt.receipt || createdReceipt); // Trigger immediate printable view
        // Reset form
        setReceiptForm({
          loanNo: "",
          amount: "",
          payMode: ReceiptPayMode.CASH,
          payModeDetails: "Counter Cashier",
          penaltyPaid: "0",
          documentationChargePaid: "0",
          remarks: "EMI Collection Received",
          collectedBy: "Gopal Cashier"
        });
        fetchLoans();
        fetchTransactions();
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherForm)
      });
      if (res.ok) {
        setVoucherForm({
          type: VoucherType.PAYMENT,
          debitLedger: "Cash in Hand",
          creditLedger: "State Bank of India",
          amount: "",
          narration: ""
        });
        fetchTransactions();
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositForm)
      });
      if (res.ok) {
        setDepositForm({
          type: "CASH",
          amount: "",
          accountNo: "SBI - 100223344",
          bankName: "State Bank of India",
          referenceNo: ""
        });
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hlForm.amount || !hlForm.customerName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/handloans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hlForm)
      });
      if (res.ok) {
        setHlForm({
          customerName: "",
          phone: "",
          amount: "",
          remarks: ""
        });
        fetchTransactions();
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-slate-800 font-sans uppercase">
          ERP Cashier & Vouchers Office
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Post EMI collections, generate journal vouchers, deposit counter caches, advance hand loans, and label bundle document files.
        </p>
      </div>

      {/* Mini tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-1 overflow-x-auto">
        <button onClick={() => setActiveTab("receipt")} className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "receipt" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          EMI Collection Receipt
        </button>
        <button onClick={() => setActiveTab("voucher")} className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "voucher" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Double Entry Vouchers
        </button>
        <button onClick={() => setActiveTab("deposit")} className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "deposit" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Counter Deposits
        </button>
        <button onClick={() => setActiveTab("handloan")} className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "handloan" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Hand Loans (HL)
        </button>
        <button onClick={() => setActiveTab("binding")} className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "binding" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}>
          Binding Loan File Tracking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans">
        
        {/* Form Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 lg:col-span-2 space-y-4 shadow-sm">
          
          {/* Collection Receipt Form */}
          {activeTab === "receipt" && (
            <form onSubmit={handleReceiptSubmit} className="space-y-3.5 text-xs">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 uppercase tracking-wide">
                <Banknote className="h-4 w-4 text-blue-600" /> Post Counter Collection Receipt
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Active HP Loan Account</label>
                  <select 
                    value={receiptForm.loanNo} 
                    required
                    onChange={(e) => {
                      const selectedNo = e.target.value;
                      const match = loans.find(l => l.loanNo === selectedNo);
                      setReceiptForm(prev => ({
                        ...prev, 
                        loanNo: selectedNo,
                        amount: match?.emiAmount ? String(match.emiAmount) : prev.amount
                      }));
                    }} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">EMI Collection Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Enter amount"
                    value={receiptForm.amount}
                    onChange={(e) => setReceiptForm({...receiptForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Payment Channel Mode</label>
                  <select 
                    value={receiptForm.payMode} 
                    onChange={(e) => setReceiptForm({...receiptForm, payMode: e.target.value as any})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value={ReceiptPayMode.CASH}>CASH COUNTER</option>
                    <option value={ReceiptPayMode.BANK}>BANK TRANSFER</option>
                    <option value={ReceiptPayMode.UPI}>UPI / QR CODE</option>
                    <option value={ReceiptPayMode.CHEQUE}>CHEQUE ADVANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Receipt Pay Mode Details (Cheque No/UPI Ref)</label>
                  <input 
                    type="text" 
                    placeholder="Reference notes"
                    value={receiptForm.payModeDetails}
                    onChange={(e) => setReceiptForm({...receiptForm, payModeDetails: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Aux Penalty Collected (₹)</label>
                  <input 
                    type="number" 
                    value={receiptForm.penaltyPaid}
                    onChange={(e) => setReceiptForm({...receiptForm, penaltyPaid: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Aux Doc Charges Collected (₹)</label>
                  <input 
                    type="number" 
                    value={receiptForm.documentationChargePaid}
                    onChange={(e) => setReceiptForm({...receiptForm, documentationChargePaid: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Transaction remarks</label>
                  <input 
                    type="text" 
                    value={receiptForm.remarks}
                    onChange={(e) => setReceiptForm({...receiptForm, remarks: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold text-xs shadow-sm transition-colors"
                >
                  {loading ? "Posting receipt..." : "Create Collection Receipt"}
                </button>
              </div>
            </form>
          )}

          {/* Vouchers double entry */}
          {activeTab === "voucher" && (
            <form onSubmit={handleVoucherSubmit} className="space-y-3.5 text-xs">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 uppercase tracking-wide">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" /> Double Entry Accounts Vouchers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Voucher Ledger Type</label>
                  <select 
                    value={voucherForm.type} 
                    onChange={(e) => setVoucherForm({...voucherForm, type: e.target.value as any})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value={VoucherType.PAYMENT}>PAYMENT VOUCHER</option>
                    <option value={VoucherType.RECEIPT}>RECEIPT VOUCHER</option>
                    <option value={VoucherType.JOURNAL}>JOURNAL ADJUSTMENT</option>
                    <option value={VoucherType.CONTRA}>CONTRA TRANSFER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Transaction Amount (₹)</label>
                  <input 
                    type="number" required placeholder="Amount in INR"
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm({...voucherForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Debit Ledger Account (Dr)</label>
                  <input 
                    type="text" required
                    value={voucherForm.debitLedger}
                    onChange={(e) => setVoucherForm({...voucherForm, debitLedger: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Credit Ledger Account (Cr)</label>
                  <input 
                    type="text" required
                    value={voucherForm.creditLedger}
                    onChange={(e) => setVoucherForm({...voucherForm, creditLedger: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Transaction Narration</label>
                  <textarea 
                    rows={2} required
                    placeholder="Enter double entry narration reasons"
                    value={voucherForm.narration}
                    onChange={(e) => setVoucherForm({...voucherForm, narration: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold text-xs shadow-sm">Commit Double Entry Voucher</button>
              </div>
            </form>
          )}

          {/* Counter deposits */}
          {activeTab === "deposit" && (
            <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-xs">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 uppercase tracking-wide">
                <Coins className="h-4 w-4 text-blue-600" /> Counter Bank Deposits & Reconciliation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Deposit Type</label>
                  <select 
                    value={depositForm.type} 
                    onChange={(e) => setDepositForm({...depositForm, type: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="CASH">CASH DEPOSIT TO BANK</option>
                    <option value="BANK">ONLINE BANK ADJUSTMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Deposit Amount (₹)</label>
                  <input 
                    type="number" required placeholder="Amount"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Corporate Bank Account No</label>
                  <input 
                    type="text" value={depositForm.accountNo}
                    onChange={(e) => setDepositForm({...depositForm, accountNo: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bank Name & Branch</label>
                  <input 
                    type="text" value={depositForm.bankName}
                    onChange={(e) => setDepositForm({...depositForm, bankName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold text-xs shadow-sm">Verify & Post Deposit</button>
              </div>
            </form>
          )}

          {/* Hand loans */}
          {activeTab === "handloan" && (
            <form onSubmit={handleHlSubmit} className="space-y-3.5 text-xs">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 uppercase tracking-wide">
                <FileLock className="h-4 w-4 text-blue-600" /> Advance Hand Loan (HL) Ledger
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Borrower Client Name</label>
                  <input 
                    type="text" required placeholder="Enter full name"
                    value={hlForm.customerName}
                    onChange={(e) => setHlForm({...hlForm, customerName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Borrower Contact Phone</label>
                  <input 
                    type="tel" required placeholder="10-digit mobile"
                    value={hlForm.phone}
                    onChange={(e) => setHlForm({...hlForm, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Hand Loan Principal (₹)</label>
                  <input 
                    type="number" required placeholder="Advance amount"
                    value={hlForm.amount}
                    onChange={(e) => setHlForm({...hlForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Advance remarks / terms</label>
                  <input 
                    type="text" placeholder="Remarks e.g. Payable in 1 month"
                    value={hlForm.remarks}
                    onChange={(e) => setHlForm({...hlForm, remarks: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold text-xs shadow-sm">Authorize HL Advance</button>
              </div>
            </form>
          )}

          {/* File binding trackers */}
          {activeTab === "binding" && (
            <div className="space-y-4 text-xs font-sans">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 uppercase tracking-wide">
                <Barcode className="h-4 w-4 text-blue-600" /> Physical File Binding & Barcode Archival
              </h3>
              <p className="text-xs text-slate-500">
                Track and register physical files inside fireproof document lockers. Use generated barcode numbers to prevent document tracking loss during audits.
              </p>
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 font-mono">FILE LABEL BUNDLE GENERATOR</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">Katpadi Locker Shelf B-3</p>
                  </div>
                  <Barcode className="h-8 w-14 text-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                  <p className="font-medium">Archival Barcode: <strong className="text-slate-900 font-mono">BAR-XER-99821</strong></p>
                  <p className="font-medium">Status: <strong className="text-green-700">ARCHIVED IN SAFE</strong></p>
                  <p className="text-slate-500">Last checked: <span className="font-mono">2026-07-16 11:21</span></p>
                  <p className="text-slate-500">Dossier auditor: <span className="font-mono">Auditor Raman</span></p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Print Preview Receipt Card / History list */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm">
          {printReceipt ? (
            <div className="space-y-4 font-sans text-xs">
              <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">Receipt Reprint Office</h4>
                <button onClick={() => setPrintReceipt(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase">Clear</button>
              </div>

              {/* Thermal Ticket simulation */}
              <div className="bg-slate-50 text-slate-800 p-3 rounded font-mono shadow-inner text-[10px] space-y-2 border-l-4 border-blue-600 border border-slate-200 printable-print-block">
                <div className="text-center border-b border-dashed border-slate-300 pb-2">
                  <p className="font-bold text-xs uppercase text-slate-900">XEROVA AUTO FINANCE</p>
                  <p>Vellore Main, Katpadi Rd</p>
                  <p>Ph: 0416-224455</p>
                </div>
                
                <div className="space-y-1 text-slate-700">
                  <p>Receipt No: <strong className="text-slate-900">{printReceipt.receiptNo}</strong></p>
                  <p>Date: {printReceipt.date}</p>
                  <p>Loan No: {printReceipt.loanNo}</p>
                  <p>Party Name: <strong className="text-slate-900">{printReceipt.customerName || loans.find(l => l.loanNo === printReceipt.loanNo)?.customer?.name || "Customer"}</strong></p>
                  <p className="border-t border-dashed border-slate-300 pt-1">Collected: <strong className="text-blue-900 text-xs">₹{printReceipt.amount?.toLocaleString()}</strong></p>
                  <p>Pay Mode: {printReceipt.payMode}</p>
                  <p>Details: {printReceipt.payModeDetails}</p>
                  <p>Remarks: {printReceipt.remarks}</p>
                </div>

                <div className="text-center border-t border-dashed border-slate-300 pt-3 text-[8px] space-y-1 text-slate-500">
                  <p>Digital Signature Verified</p>
                  <p>Thank You For Settling Dues Promptly</p>
                  <p>*** Computer Generated Ticket ***</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 py-1 rounded font-bold text-center flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" /> Thermal Print
                </button>
                <button 
                  onClick={() => alert("Receipt copied to clipboard.")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded border border-slate-300 shadow-sm transition-all cursor-pointer"
                >
                  <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                </button>
                <button 
                  onClick={() => alert(`Simulated WhatsApp Dispatch of Receipt ${printReceipt.receiptNo} to borrower.`)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded font-bold transition-all text-xs shadow-sm cursor-pointer"
                >
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Historical Transactions</h4>
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 text-xs">
                {receipts.slice(0, 10).map((rec: any) => {
                  const partyName = rec.customerName || loans.find(l => l.loanNo === rec.loanNo)?.customer?.name || "Customer";
                  return (
                    <div key={rec.id || rec.receiptNo || rec._id} className="bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-mono text-slate-800 font-bold text-[11px]">{rec.receiptNo}</p>
                        <p className="text-[10px] text-slate-600 font-medium">{partyName}</p>
                        <p className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">{rec.loanNo}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 font-mono">₹{rec.amount?.toLocaleString()}</p>
                        <button 
                          onClick={() => setPrintReceipt(rec)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline mt-1 font-sans uppercase cursor-pointer"
                        >
                          Reprint
                        </button>
                      </div>
                    </div>
                  );
                })}
                {receipts.length === 0 && (
                  <p className="text-slate-400 text-center py-6">No historical collections recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
