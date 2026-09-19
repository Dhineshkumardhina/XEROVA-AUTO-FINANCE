/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, ShieldAlert, Users, Car, User, Settings, Landmark, RefreshCw } from "lucide-react";

interface LedgerEntryViewProps {
  onSuccess: () => void;
  selectedLoanNo?: string | null;
}

export default function LedgerEntryView({ onSuccess, selectedLoanNo }: LedgerEntryViewProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "vehicle" | "loan" | "co_obligants" | "review">("customer");
  const [loading, setLoading] = useState(false);
  const [existingLoan, setExistingLoan] = useState<any | null>(null);

  // Core Form State for HP Ledger
  const [customer, setCustomer] = useState({
    name: "",
    dob: "1990-01-01",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
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
    interestRate: 12, // flat rate %
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

  // Supporting multiple co-obligants (Primary & Secondary)
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
      const res = await fetch("/api/loans");
      const loans = await res.json();
      const match = loans.find((l: any) => l.loanNo === no);
      if (match) {
        setExistingLoan(match);
        setCustomer(match.customer);
        setVehicle(match.vehicle);
        setLoanDetails({
          loanNo: match.loanNo,
          vehicleValue: match.vehicleValue,
          downPayment: match.downPayment,
          loanAmount: match.loanAmount,
          interestRate: match.interestRate,
          durationMonths: match.durationMonths,
          penaltyRatePerDay: match.penaltyRatePerDay || 5,
          documentationCharge: match.documentationCharge || 1500,
          brokerCommission: match.brokerCommission || 1000,
          dealerCommission: match.dealerCommission || 1500,
          brokerName: match.brokerName,
          dealerName: match.dealerName,
          dealerAmount: match.dealerAmount || 0,
          handloanAmount: match.handloanAmount || 0,
          handloanRemarks: match.handloanRemarks || "",
          payMode: match.payMode || "CASH",
          remarks: match.remarks || "",
          hpDate: match.hpDate
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

  // Math conversions
  const handleValueChange = (field: string, val: number) => {
    setLoanDetails((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "vehicleValue" || field === "downPayment") {
        next.loanAmount = Math.max(0, next.vehicleValue - next.downPayment);
      }
      return next;
    });
  };

  const flatInterest = (loanDetails.loanAmount * (loanDetails.interestRate / 100) * loanDetails.durationMonths) / 12;
  const totalDueAmount = loanDetails.loanAmount + flatInterest;
  const emiAmount = loanDetails.durationMonths > 0 ? Math.round(totalDueAmount / loanDetails.durationMonths) : 0;
  const netPayable = loanDetails.loanAmount - loanDetails.documentationCharge - loanDetails.brokerCommission - loanDetails.dealerCommission;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        loanNo: loanDetails.loanNo,
        customer,
        vehicle,
        coObligants: coObligants.filter((co) => co.name), // filter out blank
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

      const endpoint = "/api/loans";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert("Error creating ledger: " + err.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-slate-800 font-sans uppercase">
          {existingLoan ? `HP Ledger Account: ${existingLoan.loanNo}` : "HP Ledger Entry Center"}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {existingLoan ? `Examine customer details and transaction histories for loan book ${existingLoan.loanNo}` : "Step-by-step drafting wizard to build a fully normalized loan ledger book."}
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 text-xs gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("customer")}
          className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "customer" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          1. Customer Info
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "vehicle" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          2. Vehicle Specs
        </button>
        <button
          onClick={() => setActiveTab("loan")}
          className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "loan" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          3. Loan Details
        </button>
        <button
          onClick={() => setActiveTab("co_obligants")}
          className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "co_obligants" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          4. Guarantors (Co-obligant)
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-3 py-2 border-b-2 font-semibold transition-all ${activeTab === "review" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          5. Review & Posting
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans shadow-sm">
        
        {/* Customer Tab */}
        {activeTab === "customer" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wide">
              <User className="h-4 w-4 text-blue-600" /> Borrower Personal & Residence Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Borrower Full Name</label>
                <input type="text" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Full name of party" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date of Birth (DOB)</label>
                <input type="date" value={customer.dob} onChange={(e) => setCustomer({...customer, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Father's Name</label>
                <input type="text" value={customer.fatherName} onChange={(e) => setCustomer({...customer, fatherName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Father's full name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Spouse Name</label>
                <input type="text" value={customer.spouseName} onChange={(e) => setCustomer({...customer, spouseName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Spouse name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Mobile Phone No</label>
                <input type="tel" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="10-digit phone" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">House Phone / Alternative No</label>
                <input type="tel" value={customer.housePhone} onChange={(e) => setCustomer({...customer, housePhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Alternate phone" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Occupation & Industry</label>
                <input type="text" value={customer.occupation} onChange={(e) => setCustomer({...customer, occupation: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Monthly Verifiable Income (₹)</label>
                <input type="number" value={customer.income} onChange={(e) => setCustomer({...customer, income: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Residential Address</label>
                <textarea rows={2} value={customer.address} onChange={(e) => setCustomer({...customer, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Complete home address" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nearest Landmark</label>
                <input type="text" value={customer.landmark} onChange={(e) => setCustomer({...customer, landmark: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">House Type Ownership</label>
                <select value={customer.houseType} onChange={(e) => setCustomer({...customer, houseType: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500">
                  <option value="OWN">OWNED RESIDENCE</option>
                  <option value="RENTED">RENTED/LEASE RESIDENCE</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Tab */}
        {activeTab === "vehicle" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wide">
              <Car className="h-4 w-4 text-blue-600" /> Collateral Asset Details & Registration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Classification</label>
                <select value={vehicle.vehicleType} onChange={(e) => setVehicle({...vehicle, vehicleType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500">
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Three Wheeler">Three Wheeler</option>
                  <option value="Car">Car</option>
                  <option value="Used Vehicle">Used Vehicle</option>
                  <option value="Tractor">Tractor</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Maker Name</label>
                <input type="text" value={vehicle.vehicleName} onChange={(e) => setVehicle({...vehicle, vehicleName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="e.g. Honda Unicorn, Tata Ace" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Registration Plate Number (RC Book No)</label>
                <input type="text" value={vehicle.rcNo} onChange={(e) => setVehicle({...vehicle, rcNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" placeholder="e.g. TN-23-CD-1122" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">RC Book Type</label>
                <select value={vehicle.rcBookType} onChange={(e) => setVehicle({...vehicle, rcBookType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500">
                  <option value="Smart Card RC">Smart Card RC</option>
                  <option value="Paper RC Book">Paper RC Book</option>
                  <option value="Temp Registration Only">Temp Registration Only</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Engine Number</label>
                <input type="text" value={vehicle.engineNo} onChange={(e) => setVehicle({...vehicle, engineNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Chassis Number</label>
                <input type="text" value={vehicle.chassisNo} onChange={(e) => setVehicle({...vehicle, chassisNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Insurance Company Partner</label>
                <input type="text" value={vehicle.insuranceCompany} onChange={(e) => setVehicle({...vehicle, insuranceCompany: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Insurance Expiry Date</label>
                <input type="date" value={vehicle.insuranceExpiry} onChange={(e) => setVehicle({...vehicle, insuranceExpiry: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Tab */}
        {activeTab === "loan" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wide">
              <Settings className="h-4 w-4 text-blue-600" /> Finance Agreement Structuring & Commissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Agreement / Loan Book ID</label>
                <input type="text" value={loanDetails.loanNo} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-2.5 py-1 font-mono font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Agreement Date (HP Date)</label>
                <input type="date" value={loanDetails.hpDate} onChange={(e) => setLoanDetails({...loanDetails, hpDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Purchase Value (₹)</label>
                <input type="number" value={loanDetails.vehicleValue} onChange={(e) => handleValueChange("vehicleValue", Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Down Payment Received (₹)</label>
                <input type="number" value={loanDetails.downPayment} onChange={(e) => handleValueChange("downPayment", Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">HP Finance Principal Amount (₹)</label>
                <input type="number" disabled value={loanDetails.loanAmount} className="w-full bg-slate-100 border border-slate-200 text-blue-600 rounded px-2.5 py-1 font-mono font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Flat Rate Interest (% p.a)</label>
                <input type="number" value={loanDetails.interestRate} onChange={(e) => setLoanDetails({...loanDetails, interestRate: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Amortization Tenure (Months)</label>
                <input type="number" value={loanDetails.durationMonths} onChange={(e) => setLoanDetails({...loanDetails, durationMonths: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sourcing Broker Name</label>
                <select value={loanDetails.brokerName} onChange={(e) => setLoanDetails({...loanDetails, brokerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                  {brokers.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Dealer Showroom Outlet</label>
                <select value={loanDetails.dealerName} onChange={(e) => setLoanDetails({...loanDetails, dealerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                  {dealers.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Charges */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Documentation File Charges (₹)</label>
                <input type="number" value={loanDetails.documentationCharge} onChange={(e) => setLoanDetails({...loanDetails, documentationCharge: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Broker Commission Payout (₹)</label>
                <input type="number" value={loanDetails.brokerCommission} onChange={(e) => setLoanDetails({...loanDetails, brokerCommission: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Dealer Subsidy Commission (₹)</label>
                <input type="number" value={loanDetails.dealerCommission} onChange={(e) => setLoanDetails({...loanDetails, dealerCommission: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>

              {/* Handloan auxiliary */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Auxiliary Handloan (₹)</label>
                <input type="number" value={loanDetails.handloanAmount} onChange={(e) => setLoanDetails({...loanDetails, handloanAmount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Handloan Remarks / Purpose</label>
                <input type="text" value={loanDetails.handloanRemarks} onChange={(e) => setLoanDetails({...loanDetails, handloanRemarks: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="Reason for auxiliary advance" />
              </div>
            </div>

            {/* Live calculations preview banner */}
            <div className="bg-slate-50 rounded border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 mt-3.5 p-3 text-xs font-mono shadow-inner">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Calculated Flat Interest</p>
                <p className="text-xs font-bold text-slate-800">₹{Math.round(flatInterest).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Agreement Value</p>
                <p className="text-xs font-bold text-slate-800">₹{Math.round(totalDueAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expected Monthly EMI</p>
                <p className="text-xs font-bold text-blue-600">₹{emiAmount.toLocaleString()}/mo</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net Payable to Showroom</p>
                <p className="text-xs font-bold text-green-700">₹{netPayable.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Co-obligants Tab */}
        {activeTab === "co_obligants" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Users className="h-4 w-4 text-blue-600" /> Multiple Guarantors & Co-obligants (Primary & Secondary)
            </h3>

            {coObligants.map((co, idx) => (
              <div key={idx} className="bg-slate-50 rounded p-3 border border-slate-200 space-y-3">
                <h4 className="text-[10px] font-bold text-blue-600 font-mono uppercase tracking-wider">Guarantor Profile #{idx + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Guarantor Name</label>
                    <input 
                      type="text" 
                      value={co.name} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].name = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Guarantor name" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Father / Spouse Name</label>
                    <input 
                      type="text" 
                      value={co.fatherSpouseName} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].fatherSpouseName = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Guarantor father/spouse" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Guarantor Mobile Phone</label>
                    <input 
                      type="tel" 
                      value={co.phone} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].phone = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Mobile number" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Residence Address</label>
                    <input 
                      type="text" 
                      value={co.address} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].address = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Physical home address" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Guarantor Government ID No</label>
                    <input 
                      type="text" 
                      value={co.govtId} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].govtId = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Aadhaar or PAN Card details" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review & Saving Tab */}
        {activeTab === "review" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <CheckCircle className="h-4 w-4 text-green-600" /> Complete Ledger Review & Signature Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-blue-600 border-b border-slate-200 pb-1.5 mb-2 font-mono uppercase text-[10px] tracking-wide">Borrower Dossier</h4>
                <p><span className="text-slate-400 font-medium font-mono">Name:</span> <strong className="text-slate-800">{customer.name || "(Unspecified)"}</strong></p>
                <p><span className="text-slate-400 font-medium font-mono">DOB:</span> <span className="text-slate-700">{customer.dob}</span></p>
                <p><span className="text-slate-400 font-medium font-mono">Address:</span> <span className="text-slate-700">{customer.address || "(Unspecified)"}</span></p>
                <p><span className="text-slate-400 font-medium font-mono">Mobile:</span> <span className="text-slate-700 font-mono">{customer.phone || "(Unspecified)"}</span></p>
                <p><span className="text-slate-400 font-medium font-mono">Income:</span> <span className="text-slate-700 font-mono">₹{customer.income?.toLocaleString()}/mo</span></p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-blue-600 border-b border-slate-200 pb-1.5 mb-2 font-mono uppercase text-[10px] tracking-wide">Agreement Terms</h4>
                <p><span className="text-slate-400 font-medium font-mono">Loan Book No:</span> <strong className="text-slate-800 font-mono">{loanDetails.loanNo}</strong></p>
                <p><span className="text-slate-400 font-medium font-mono">Principal Amt:</span> <strong className="text-slate-800 font-mono">₹{loanDetails.loanAmount?.toLocaleString()}</strong></p>
                <p><span className="text-slate-400 font-medium font-mono">Total Repayable:</span> <strong className="text-slate-800 font-mono">₹{Math.round(totalDueAmount)?.toLocaleString()}</strong></p>
                <p><span className="text-slate-400 font-medium font-mono">Monthly EMI:</span> <strong className="text-blue-600 font-mono">₹{emiAmount?.toLocaleString()}/mo</strong></p>
                <p><span className="text-slate-400 font-medium font-mono">Duration:</span> <span className="text-slate-700 font-mono">{loanDetails.durationMonths} Months</span></p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 font-sans">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Biometric Sign-off & Document Verification Checks</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 bg-white" />
                  <span>Aadhaar Verified</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 bg-white" />
                  <span>GPS Track Configured</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 bg-white" />
                  <span>RC Title Clear</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 bg-white" />
                  <span>Broker Signed</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button 
                onClick={handleSubmit} 
                disabled={loading || !customer.name}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-1.5 rounded transition-all flex items-center gap-1.5 shadow-sm"
              >
                {loading ? "Writing Ledger..." : "Commit Loan Agreement Book"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
