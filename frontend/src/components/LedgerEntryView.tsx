/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle, ShieldAlert, Users, Car, User, 
  Settings, Landmark, RefreshCw, Plus, Calendar, DollarSign, Printer, 
  ArrowRight, Wallet, Hammer, AlertTriangle, FileText, CheckCircle2, Clock
} from "lucide-react";

interface LedgerEntryViewProps {
  onSuccess: (createdLoanNo?: string) => void;
  selectedLoanNo?: string | null;
  onNavigate?: (tab: string, arg?: string) => void;
}

export default function LedgerEntryView({ onSuccess, selectedLoanNo, onNavigate }: LedgerEntryViewProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "customer" | "vehicle" | "loan" | "co_obligants" | "review">("customer");
  const [loading, setLoading] = useState(false);
  const [existingLoan, setExistingLoan] = useState<any | null>(null);

  // Core Form State for HP Ledger
  const [customer, setCustomer] = useState({
    name: "",
    dob: "1990-01-01",
    photoUrl: "",
    signatureUrl: "",
    govtIdType: "Aadhaar Card",
    govtIdNo: "",
    occupation: "Business Owner",
    employer: "",
    income: 35000,
    address: "",
    landmark: "",
    houseType: "OWN" as "OWN" | "RENTED",
    phone: "",
    housePhone: "",
    officePhone: "",
    officeAddress: "",
    fatherName: "",
    spouseName: ""
  });

  const [vehicle, setVehicle] = useState({
    engineNo: "",
    chassisNo: "",
    rcBookType: "Smart Card RC",
    rcNo: "",
    vehicleType: "Two Wheeler",
    vehicleName: "",
    model: "2025 Standard",
    makeYear: 2025,
    color: "Royal Blue",
    insuranceCompany: "United India Insurance",
    insuranceExpiry: "2027-01-01",
    taxExpiry: "2035-01-01",
    fcExpiry: "2040-01-01",
    permitExpiry: "2026-12-31",
    pollutionExpiry: "2026-06-30",
    photoUrls: [] as string[]
  });

  const [loanDetails, setLoanDetails] = useState({
    loanNo: `TN23-HFL-${Date.now().toString().slice(-4)}`,
    vehicleValue: 100000,
    downPayment: 30000,
    loanAmount: 70000,
    interestRate: 14, // flat rate %
    durationMonths: 12,
    penaltyRatePerDay: 5,
    documentationCharge: 1500,
    brokerCommission: 1000,
    dealerCommission: 1500,
    brokerName: "Anand Brokerage",
    dealerName: "Supreme Honda",
    dealerAmount: 65000,
    handloanAmount: 0,
    handloanRemarks: "",
    payMode: "CASH",
    remarks: "",
    hpDate: new Date().toISOString().split("T")[0]
  });

  // Supporting multiple co-obligants
  const [coObligants, setCoObligants] = useState<any[]>([
    {
      name: "",
      fatherSpouseName: "",
      address: "",
      landmark: "",
      officeAddress: "",
      phone: "",
      refPhone: "",
      photoUrl: "",
      govtId: ""
    },
    {
      name: "",
      fatherSpouseName: "",
      address: "",
      landmark: "",
      officeAddress: "",
      phone: "",
      refPhone: "",
      photoUrl: "",
      govtId: ""
    }
  ]);

  // Masters
  const [brokers, setBrokers] = useState<string[]>([]);
  const [dealers, setDealers] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  useEffect(() => {
    fetchMasters();
    if (selectedLoanNo) {
      fetchExistingLoan(selectedLoanNo);
    }
  }, [selectedLoanNo]);

  const fetchMasters = async () => {
    try {
      const res = await fetch("/api/masters");
      const data = await res.json();
      setBrokers(data.filter((m: any) => m.category === "broker").map((m: any) => m.name));
      setDealers(data.filter((m: any) => m.category === "dealer").map((m: any) => m.name));
      setAreas(data.filter((m: any) => m.category === "area").map((m: any) => m.name));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExistingLoan = async (no: string) => {
    try {
      setLoading(true);
      let match = null;
      const res = await fetch(`/api/loans/${encodeURIComponent(no)}`);
      if (res.ok) {
        match = await res.json();
      } else {
        const allRes = await fetch("/api/loans");
        const loans = await allRes.json();
        match = loans.find((l: any) => l.loanNo === no);
      }

      if (match) {
        setExistingLoan(match);
        setActiveTab("schedule");
        if (match.customer) setCustomer({ ...customer, ...match.customer });
        if (match.vehicle) setVehicle({ ...vehicle, ...match.vehicle });
        setLoanDetails({
          loanNo: match.loanNo,
          vehicleValue: match.vehicleValue || 100000,
          downPayment: match.downPayment || 30000,
          loanAmount: match.loanAmount || 70000,
          interestRate: match.interestRate || 14,
          durationMonths: match.durationMonths || 12,
          penaltyRatePerDay: match.penaltyRatePerDay || 5,
          documentationCharge: match.documentationCharge || 1500,
          brokerCommission: match.brokerCommission || 1000,
          dealerCommission: match.dealerCommission || 1500,
          brokerName: match.brokerName || "Anand Brokerage",
          dealerName: match.dealerName || "Supreme Honda",
          dealerAmount: match.dealerAmount || 65000,
          handloanAmount: match.handloanAmount || 0,
          handloanRemarks: match.handloanRemarks || "",
          payMode: match.payMode || "CASH",
          remarks: match.remarks || "",
          hpDate: match.hpDate || match.disbursementDate || new Date().toISOString().split("T")[0]
        });
        if (match.coObligants && match.coObligants.length > 0) {
          setCoObligants(match.coObligants);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetFormForNewLedger = () => {
    setExistingLoan(null);
    setCustomer({
      name: "",
      dob: "1990-01-01",
      photoUrl: "",
      signatureUrl: "",
      govtIdType: "Aadhaar Card",
      govtIdNo: "",
      occupation: "Business Owner",
      employer: "",
      income: 35000,
      address: "",
      landmark: "",
      houseType: "OWN",
      phone: "",
      housePhone: "",
      officePhone: "",
      officeAddress: "",
      fatherName: "",
      spouseName: ""
    });
    setVehicle({
      engineNo: "",
      chassisNo: "",
      rcBookType: "Smart Card RC",
      rcNo: "",
      vehicleType: "Two Wheeler",
      vehicleName: "",
      model: "2025 Standard",
      makeYear: 2025,
      color: "Royal Blue",
      insuranceCompany: "United India Insurance",
      insuranceExpiry: "2027-01-01",
      taxExpiry: "2035-01-01",
      fcExpiry: "2040-01-01",
      permitExpiry: "2026-12-31",
      pollutionExpiry: "2026-06-30",
      photoUrls: []
    });
    setLoanDetails({
      loanNo: `HP-${Date.now().toString().slice(-4)}`,
      vehicleValue: 100000,
      downPayment: 30000,
      loanAmount: 70000,
      interestRate: 14,
      durationMonths: 12,
      penaltyRatePerDay: 5,
      documentationCharge: 1500,
      brokerCommission: 1000,
      dealerCommission: 1500,
      brokerName: "Anand Brokerage",
      dealerName: "Supreme Honda",
      dealerAmount: 65000,
      handloanAmount: 0,
      handloanRemarks: "",
      payMode: "CASH",
      remarks: "",
      hpDate: new Date().toISOString().split("T")[0]
    });
    setCoObligants([
      { name: "", fatherSpouseName: "", address: "", landmark: "", officeAddress: "", phone: "", refPhone: "", photoUrl: "", govtId: "" },
      { name: "", fatherSpouseName: "", address: "", landmark: "", officeAddress: "", phone: "", refPhone: "", photoUrl: "", govtId: "" }
    ]);
    setActiveTab("customer");
  };

  const handleValueChange = (field: string, value: number) => {
    const updated = { ...loanDetails, [field]: value };
    if (field === "vehicleValue" || field === "downPayment") {
      updated.loanAmount = Math.max(0, updated.vehicleValue - updated.downPayment);
    }
    setLoanDetails(updated);
  };

  // Flat Rate EMI Calculator
  const flatInterest = (loanDetails.loanAmount * (loanDetails.interestRate / 100) * (loanDetails.durationMonths / 12));
  const totalDueAmount = loanDetails.loanAmount + flatInterest;
  const emiAmount = loanDetails.durationMonths > 0 ? Math.round(totalDueAmount / loanDetails.durationMonths) : 0;
  const netPayable = (loanDetails.loanAmount - loanDetails.documentationCharge - loanDetails.brokerCommission);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        loanNo: loanDetails.loanNo,
        customer,
        vehicle,
        coObligants: coObligants.filter((co) => co.name),
        vehicleValue: loanDetails.vehicleValue,
        downPayment: loanDetails.downPayment,
        loanAmount: loanDetails.loanAmount,
        interestRate: loanDetails.interestRate,
        durationMonths: loanDetails.durationMonths,
        totalInterest: flatInterest,
        totalDueAmount,
        emiAmount,
        penaltyRatePerDay: loanDetails.penaltyRatePerDay,
        documentationCharge: loanDetails.documentationCharge,
        brokerCommission: loanDetails.brokerCommission,
        dealerCommission: loanDetails.dealerCommission,
        netPayable,
        brokerName: loanDetails.brokerName,
        dealerName: loanDetails.dealerName,
        dealerAmount: loanDetails.dealerAmount,
        handloanAmount: loanDetails.handloanAmount,
        handloanRemarks: loanDetails.handloanRemarks,
        payMode: loanDetails.payMode,
        remarks: loanDetails.remarks,
        hpDate: loanDetails.hpDate
      };

      const endpoint = existingLoan ? `/api/loans/${encodeURIComponent(existingLoan.loanNo)}` : "/api/loans";
      const method = existingLoan ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdData = await res.json();
        const createdNo = createdData?.loanNo || payload.loanNo;
        if (existingLoan) {
          alert(`HP Ledger Account ${createdNo} updated successfully!`);
          fetchExistingLoan(createdNo);
        } else {
          alert(`HP Ledger Book ${createdNo} successfully created and posted!`);
          resetFormForNewLedger();
          onSuccess(createdNo);
        }
      } else {
        const err = await res.json();
        alert("Error saving ledger: " + (err.error || "Operation failed"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase">
              {existingLoan ? `HP Ledger Account: ${existingLoan.loanNo}` : "HP Loan Ledger Entry Center"}
            </h1>
            {existingLoan && (
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase border ${
                existingLoan.status === "CLOSED" ? "bg-slate-100 text-slate-700 border-slate-300" :
                existingLoan.status === "SEIZED" ? "bg-rose-100 text-rose-700 border-rose-300" :
                "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                {existingLoan.status || "ACTIVE"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {existingLoan ? `Full account view, installments schedule, and ledger balances for ${customer.name || existingLoan.loanNo}` : "Step-by-step drafting wizard to build a fully normalized loan ledger book."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {existingLoan && (
            <>
              <button
                onClick={() => onNavigate?.("transactions", existingLoan.loanNo)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Wallet className="h-3.5 w-3.5" /> Post Collection
              </button>
              <button
                onClick={resetFormForNewLedger}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> New Loan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-1 overflow-x-auto">
        {existingLoan && (
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "schedule" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <Calendar className="h-4 w-4" /> Repayment Schedule & History
          </button>
        )}
        <button
          onClick={() => setActiveTab("customer")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "customer" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <User className="h-4 w-4" /> {existingLoan ? "Edit Customer Info" : "Step 1: Customer Info"}
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "vehicle" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Car className="h-4 w-4" /> {existingLoan ? "Edit Vehicle Specs" : "Step 2: Vehicle Specs"}
        </button>
        <button
          onClick={() => setActiveTab("loan")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "loan" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" /> {existingLoan ? "Edit Loan Terms" : "Step 3: Loan Details"}
        </button>
        <button
          onClick={() => setActiveTab("co_obligants")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "co_obligants" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" /> {existingLoan ? "Guarantors" : "Step 4: Guarantors"}
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "review" ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <CheckCircle className="h-4 w-4" /> {existingLoan ? "Confirm Updates" : "Step 5: Review & Post"}
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        
        {/* TAB 0: REPAYMENT SCHEDULE & ACCOUNT HISTORY (For existing loans) */}
        {activeTab === "schedule" && existingLoan && (
          <div className="space-y-5">
            {/* Account Summary Strip */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 font-mono">
              <div className="border-r border-slate-800 pr-2">
                <span className="text-[9.5px] text-slate-400 block uppercase">Disbursed Principal</span>
                <span className="text-base font-black text-white mt-0.5 block">₹{(existingLoan.loanAmount || 0).toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-800 pr-2">
                <span className="text-[9.5px] text-slate-400 block uppercase">Total Payable</span>
                <span className="text-base font-black text-slate-200 mt-0.5 block">₹{(existingLoan.totalDueAmount || 0).toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-800 pr-2">
                <span className="text-[9.5px] text-emerald-400 block uppercase">Total Paid Amount</span>
                <span className="text-base font-black text-emerald-400 mt-0.5 block">₹{(existingLoan.totalPaidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-800 pr-2">
                <span className="text-[9.5px] text-amber-400 block uppercase">Pending Balance</span>
                <span className="text-base font-black text-amber-400 mt-0.5 block">₹{(existingLoan.pendingAmount ?? existingLoan.totalDueAmount ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9.5px] text-indigo-300 block uppercase">Monthly EMI</span>
                <span className="text-base font-black text-indigo-300 mt-0.5 block">₹{(existingLoan.emiAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold text-xs">Borrower: {customer.name || existingLoan.customer?.name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-mono text-xs">{customer.phone || existingLoan.customer?.phone}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-600 font-mono font-bold text-xs">{vehicle.rcNo || existingLoan.vehicle?.rcNo}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate?.("transactions", existingLoan.loanNo)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Wallet className="h-3.5 w-3.5" /> Post Collection Receipt
                </button>
                <button
                  onClick={() => onNavigate?.("seized", existingLoan.loanNo)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Hammer className="h-3.5 w-3.5" /> Yard Seizure
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Ledger Card
                </button>
              </div>
            </div>

            {/* Installments Schedule Table */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Repayment Installments Schedule ({existingLoan.durationMonths || (existingLoan.installments?.length ?? 12)} Months)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Disbursed: {existingLoan.disbursementDate || existingLoan.hpDate || "2026-02-15"}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">EMI Amount</th>
                      <th className="p-2.5">Principal</th>
                      <th className="p-2.5">Interest</th>
                      <th className="p-2.5">Paid Amount</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Receipt / Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {(existingLoan.installments && existingLoan.installments.length > 0) ? (
                      existingLoan.installments.map((inst: any, idx: number) => {
                        const isPaid = inst.status === "PAID";
                        const isPartial = inst.status === "PARTIAL";
                        return (
                          <tr key={idx} className={isPaid ? "bg-emerald-50/40" : "hover:bg-slate-50"}>
                            <td className="p-2.5 font-bold text-slate-600">{inst.instNo || idx + 1}</td>
                            <td className="p-2.5 text-slate-700 font-semibold">{inst.dueDate}</td>
                            <td className="p-2.5 font-black text-slate-900">₹{(inst.emiAmount || existingLoan.emiAmount || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-slate-600">₹{(inst.principalPart || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-slate-600">₹{(inst.interestPart || 0).toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-emerald-700">₹{(inst.paidAmount || 0).toLocaleString()}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                                isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                                isPartial ? "bg-amber-100 text-amber-800 border-amber-300" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {inst.status || "PENDING"}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {inst.receiptNo ? (
                                <span className="text-indigo-600 font-bold">{inst.receiptNo} ({inst.paidDate})</span>
                              ) : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 font-sans">
                          No schedule generated for this loan book.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History Record */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3">
                <Clock className="h-4 w-4 text-indigo-600" />
                Receipts Posted Against This Account
              </h3>
              
              <div className="space-y-2">
                {(existingLoan.payments && existingLoan.payments.length > 0) ? (
                  existingLoan.payments.map((p: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold font-mono text-indigo-700 text-[11px]">{p.receiptNo}</span>
                        <span className="text-slate-400 ml-2 font-mono text-[10px]">Date: {p.date}</span>
                        <span className="text-slate-500 ml-2">via <strong>{p.mode || "CASH"}</strong></span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-700 font-mono text-xs">₹{(p.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs py-3 text-center bg-slate-50 rounded border border-dashed border-slate-200">
                    No payment receipts logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CUSTOMER DETAILS */}
        {activeTab === "customer" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <User className="h-4 w-4 text-indigo-600" /> Customer & Profile Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Borrower Full Name *</label>
                <input 
                  type="text" 
                  value={customer.name} 
                  onChange={(e) => setCustomer({...customer, name: e.target.value})} 
                  placeholder="e.g. S. Murugesan" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={customer.dob} 
                  onChange={(e) => setCustomer({...customer, dob: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Mobile Number *</label>
                <input 
                  type="tel" 
                  value={customer.phone} 
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})} 
                  placeholder="10-digit mobile number" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Father / Spouse Name</label>
                <input 
                  type="text" 
                  value={customer.fatherName} 
                  onChange={(e) => setCustomer({...customer, fatherName: e.target.value})} 
                  placeholder="Father's full name" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Government ID (Aadhaar / PAN)</label>
                <input 
                  type="text" 
                  value={customer.govtIdNo} 
                  onChange={(e) => setCustomer({...customer, govtIdNo: e.target.value})} 
                  placeholder="12-digit Aadhaar / PAN" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Monthly Income (₹)</label>
                <input 
                  type="number" 
                  value={customer.income} 
                  onChange={(e) => setCustomer({...customer, income: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Residential Street Address</label>
                <input 
                  type="text" 
                  value={customer.address} 
                  onChange={(e) => setCustomer({...customer, address: e.target.value})} 
                  placeholder="Door No, Street name, Town" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Prominent Landmark</label>
                <input 
                  type="text" 
                  value={customer.landmark} 
                  onChange={(e) => setCustomer({...customer, landmark: e.target.value})} 
                  placeholder="e.g. Near Bus Stand" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("vehicle")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                Next Step: Vehicle Specs <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLE SPECS */}
        {activeTab === "vehicle" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Car className="h-4 w-4 text-indigo-600" /> Vehicle Collateral & Registration Specs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Model Name *</label>
                <input 
                  type="text" 
                  value={vehicle.vehicleName} 
                  onChange={(e) => setVehicle({...vehicle, vehicleName: e.target.value})} 
                  placeholder="e.g. Honda Activa 6G / Bajaj Pulsar" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">RC Number / Registration Plate *</label>
                <input 
                  type="text" 
                  value={vehicle.rcNo} 
                  onChange={(e) => setVehicle({...vehicle, rcNo: e.target.value.toUpperCase()})} 
                  placeholder="e.g. TN-23-AB-1234" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Classification</label>
                <select 
                  value={vehicle.vehicleType} 
                  onChange={(e) => setVehicle({...vehicle, vehicleType: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Three Wheeler (Auto)">Three Wheeler (Auto)</option>
                  <option value="Commercial Vehicle">Commercial Vehicle</option>
                  <option value="Private Car">Private Car</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Engine Number</label>
                <input 
                  type="text" 
                  value={vehicle.engineNo} 
                  onChange={(e) => setVehicle({...vehicle, engineNo: e.target.value.toUpperCase()})} 
                  placeholder="e.g. ENG-998242" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Chassis Number</label>
                <input 
                  type="text" 
                  value={vehicle.chassisNo} 
                  onChange={(e) => setVehicle({...vehicle, chassisNo: e.target.value.toUpperCase()})} 
                  placeholder="e.g. CHS-882741" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Insurance Expiry Date</label>
                <input 
                  type="date" 
                  value={vehicle.insuranceExpiry} 
                  onChange={(e) => setVehicle({...vehicle, insuranceExpiry: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono" 
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Customer Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("loan")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                Next Step: Loan Terms <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LOAN DETAILS */}
        {activeTab === "loan" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Settings className="h-4 w-4 text-indigo-600" /> HP Financial Parameters & Pricing Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">HP Loan Book Serial No *</label>
                <input 
                  type="text" 
                  value={loanDetails.loanNo} 
                  onChange={(e) => setLoanDetails({...loanDetails, loanNo: e.target.value.toUpperCase()})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono font-bold focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Agreement / Disbursal Date</label>
                <input 
                  type="date" 
                  value={loanDetails.hpDate} 
                  onChange={(e) => setLoanDetails({...loanDetails, hpDate: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Invoice Price (₹)</label>
                <input 
                  type="number" 
                  value={loanDetails.vehicleValue} 
                  onChange={(e) => handleValueChange("vehicleValue", Number(e.target.value))} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer Down Payment (₹)</label>
                <input 
                  type="number" 
                  value={loanDetails.downPayment} 
                  onChange={(e) => handleValueChange("downPayment", Number(e.target.value))} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-1">Loan Principal Amount (₹) *</label>
                <input 
                  type="number" 
                  value={loanDetails.loanAmount} 
                  onChange={(e) => setLoanDetails({...loanDetails, loanAmount: Number(e.target.value)})} 
                  className="w-full bg-indigo-50/50 border border-indigo-200 text-indigo-900 font-bold rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Annual Interest Rate (%)</label>
                <input 
                  type="number" 
                  value={loanDetails.interestRate} 
                  onChange={(e) => setLoanDetails({...loanDetails, interestRate: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Loan Tenure (Months)</label>
                <input 
                  type="number" 
                  value={loanDetails.durationMonths} 
                  onChange={(e) => setLoanDetails({...loanDetails, durationMonths: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sourcing Broker Agent</label>
                <select 
                  value={loanDetails.brokerName} 
                  onChange={(e) => setLoanDetails({...loanDetails, brokerName: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Direct Walk-in">Direct Walk-in</option>
                  {brokers.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Associated Dealer</label>
                <select 
                  value={loanDetails.dealerName} 
                  onChange={(e) => setLoanDetails({...loanDetails, dealerName: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Direct / In-house">Direct / In-house</option>
                  {dealers.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Computed Summary Card */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono mt-3">
              <div>
                <span className="text-[10px] text-indigo-600 block uppercase font-bold">Total Interest</span>
                <strong className="text-slate-800 text-sm">₹{Math.round(flatInterest).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 block uppercase font-bold">Total Due Amount</span>
                <strong className="text-slate-800 text-sm">₹{Math.round(totalDueAmount).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 block uppercase font-bold">Monthly EMI</span>
                <strong className="text-indigo-700 text-sm font-black">₹{emiAmount.toLocaleString()}/mo</strong>
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 block uppercase font-bold">Net Dealer Disbursal</span>
                <strong className="text-slate-800 text-sm">₹{netPayable.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("vehicle")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Vehicle Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("co_obligants")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                Next Step: Guarantors <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: GUARANTORS */}
        {activeTab === "co_obligants" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Users className="h-4 w-4 text-indigo-600" /> Co-Obligants & Guarantor Information
            </h3>

            {coObligants.map((co, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wide border-b border-slate-200 pb-1">
                  Guarantor #{idx + 1} ({idx === 0 ? "Primary Co-Obligant" : "Secondary Surety"})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={co.name} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].name = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Name of guarantor" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Phone</label>
                    <input 
                      type="tel" 
                      value={co.phone} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].phone = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="10-digit phone" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Government ID (Aadhaar/PAN)</label>
                    <input 
                      type="text" 
                      value={co.govtId} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].govtId = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="ID details" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 font-mono" 
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("loan")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Loan Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("review")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                Next Step: Review & Post <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: REVIEW & POSTING */}
        {activeTab === "review" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> {existingLoan ? "Update HP Ledger Verification" : "Final Ledger Review & Posting"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-indigo-600 border-b border-slate-200 pb-1.5 mb-2 font-mono uppercase text-[10px] tracking-wide">Borrower Dossier</h4>
                <p><span className="text-slate-400 font-medium">Name:</span> <strong className="text-slate-800">{customer.name || "(Unspecified)"}</strong></p>
                <p><span className="text-slate-400 font-medium">Mobile:</span> <span className="text-slate-700 font-mono">{customer.phone || "(Unspecified)"}</span></p>
                <p><span className="text-slate-400 font-medium">Address:</span> <span className="text-slate-700">{customer.address || "(Unspecified)"}</span></p>
                <p><span className="text-slate-400 font-medium">Vehicle:</span> <strong className="text-slate-800">{vehicle.vehicleName || "Two Wheeler"} ({vehicle.rcNo})</strong></p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-indigo-600 border-b border-slate-200 pb-1.5 mb-2 font-mono uppercase text-[10px] tracking-wide">Agreement Terms</h4>
                <p><span className="text-slate-400 font-medium">Loan Book No:</span> <strong className="text-slate-800 font-mono">{loanDetails.loanNo}</strong></p>
                <p><span className="text-slate-400 font-medium">Principal Amt:</span> <strong className="text-slate-800 font-mono">₹{loanDetails.loanAmount?.toLocaleString()}</strong></p>
                <p><span className="text-slate-400 font-medium">Total Repayable:</span> <strong className="text-slate-800 font-mono">₹{Math.round(totalDueAmount)?.toLocaleString()}</strong></p>
                <p><span className="text-slate-400 font-medium">Monthly EMI:</span> <strong className="text-emerald-600 font-mono">₹{emiAmount?.toLocaleString()}/mo</strong></p>
                <p><span className="text-slate-400 font-medium">Tenure:</span> <span className="text-slate-700 font-mono">{loanDetails.durationMonths} Months</span></p>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("co_obligants")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Guarantors
              </button>
              <button 
                type="button"
                onClick={handleSubmit} 
                disabled={loading || !customer.name}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2 rounded transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {loading ? "Writing Ledger..." : existingLoan ? "Save & Update Ledger" : "Confirm & Post HP Ledger"} <CheckCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
