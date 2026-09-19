/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, ShieldAlert, Users, Car, User, Settings, Landmark, RefreshCw, Plus } from "lucide-react";

interface LedgerEntryViewProps {
  onSuccess: (createdLoanNo?: string) => void;
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
        if (match.customer) setCustomer(match.customer);
        if (match.vehicle) setVehicle(match.vehicle);
        setLoanDetails({
          loanNo: match.loanNo,
          vehicleValue: match.vehicleValue || 100000,
          downPayment: match.downPayment || 30000,
          loanAmount: match.loanAmount || 70000,
          interestRate: match.interestRate || 12,
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
          hpDate: match.hpDate || new Date().toISOString().split("T")[0]
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
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
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
      loanNo: `TN23-HFL-${Date.now().toString().slice(-4)}`,
      vehicleValue: 100000,
      downPayment: 30000,
      loanAmount: 70000,
      interestRate: 12,
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

      const endpoint = "/api/loans";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdData = await res.json();
        const createdNo = createdData?.loanNo || payload.loanNo;
        alert(`HP Ledger Book ${createdNo} successfully created and posted! Form is now reset and ready for creating the next ledger.`);
        resetFormForNewLedger();
        onSuccess(createdNo);
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
    <div className="space-y-4 font-sans text-xs">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase">
            {existingLoan ? `HP Ledger Account: ${existingLoan.loanNo}` : "HP Ledger Entry Center"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {existingLoan ? `Examine customer details and transaction histories for loan book ${existingLoan.loanNo}` : "Step-by-step drafting wizard to build a fully normalized loan ledger book."}
          </p>
        </div>
        {existingLoan && (
          <button
            onClick={resetFormForNewLedger}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Create New HP Ledger
          </button>
        )}
      </div>

      {/* Sequential Wizard Step Tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("customer")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${activeTab === "customer" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          <User className="h-4 w-4" /> Step 1: Customer Info
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${activeTab === "vehicle" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          <Car className="h-4 w-4" /> Step 2: Vehicle Specs
        </button>
        <button
          onClick={() => setActiveTab("loan")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${activeTab === "loan" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          <Settings className="h-4 w-4" /> Step 3: Loan Details
        </button>
        <button
          onClick={() => setActiveTab("co_obligants")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${activeTab === "co_obligants" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          <Users className="h-4 w-4" /> Step 4: Guarantors (Co-obligant)
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-3.5 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${activeTab === "review" ? "text-blue-600 border-blue-600 font-bold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
        >
          <CheckCircle className="h-4 w-4" /> Step 5: Review & Posting
        </button>
      </div>

      {/* Wizard Step Panels */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans shadow-sm">
        
        {/* Step 1: Customer Info */}
        {activeTab === "customer" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <User className="h-4 w-4 text-blue-600" /> Step 1: Borrower Personal & Residence Details
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

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("vehicle")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                Next Step: Vehicle Specs <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Specs */}
        {activeTab === "vehicle" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Car className="h-4 w-4 text-blue-600" /> Step 2: Collateral Asset Details & Registration Specs
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Maker & Model Name</label>
                <input type="text" value={vehicle.vehicleName} onChange={(e) => setVehicle({...vehicle, vehicleName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" placeholder="e.g. Honda Unicorn, Hero Splendor" />
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

            {/* Step 2 Actions */}
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Customer Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("loan")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                Next Step: Loan Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Loan Details */}
        {activeTab === "loan" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Settings className="h-4 w-4 text-blue-600" /> Step 3: Finance Agreement Structuring & Commissions
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Broker Sourcing Commission (₹)</label>
                <input type="number" value={loanDetails.brokerCommission} onChange={(e) => setLoanDetails({...loanDetails, brokerCommission: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Dealer Outlet Commission (₹)</label>
                <input type="number" value={loanDetails.dealerCommission} onChange={(e) => setLoanDetails({...loanDetails, dealerCommission: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono mt-3">
              <div>
                <span className="text-[10px] text-blue-600 block uppercase font-bold">Total Interest</span>
                <strong className="text-slate-800 text-sm">₹{Math.round(flatInterest).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 block uppercase font-bold">Total Due Amount</span>
                <strong className="text-slate-800 text-sm">₹{Math.round(totalDueAmount).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 block uppercase font-bold">Monthly EMI Amount</span>
                <strong className="text-blue-700 text-sm">₹{emiAmount.toLocaleString()}/mo</strong>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 block uppercase font-bold">Net Dealer Disbursal</span>
                <strong className="text-slate-800 text-sm">₹{netPayable.toLocaleString()}</strong>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("vehicle")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Vehicle Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("co_obligants")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                Next Step: Guarantors (Co-obligant) <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Guarantors (Co-obligant) */}
        {activeTab === "co_obligants" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <Users className="h-4 w-4 text-blue-600" /> Step 4: Guarantors & Co-Obligant Verification Details
            </h3>

            {coObligants.map((co, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wide border-b border-slate-200 pb-1">
                  Guarantor #{idx + 1} ({idx === 0 ? "Primary Co-Obligant" : "Secondary Surety"})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Guarantor Full Name</label>
                    <input 
                      type="text" 
                      value={co.name} 
                      onChange={(e) => {
                        const updated = [...coObligants];
                        updated[idx].name = e.target.value;
                        setCoObligants(updated);
                      }}
                      placeholder="Name of guarantor" 
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
                      placeholder="10-digit phone" 
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
                      placeholder="Father/Spouse Name" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Guarantor Residential Address</label>
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

            {/* Step 4 Actions */}
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("loan")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Loan Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("review")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                Next Step: Review & Posting <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Posting */}
        {activeTab === "review" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2 uppercase tracking-wide">
              <CheckCircle className="h-4 w-4 text-green-600" /> Step 5: Complete Ledger Review & Signature Verification
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

            {/* Step 5 Actions */}
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("co_obligants")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Back: Guarantors
              </button>
              <button 
                type="button"
                onClick={handleSubmit} 
                disabled={loading || !customer.name}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2 rounded transition-all flex items-center gap-1.5 shadow-sm"
              >
                {loading ? "Writing Ledger..." : "Confirm & Post HP Ledger"} <CheckCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
