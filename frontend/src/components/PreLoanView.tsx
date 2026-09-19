/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, AlertTriangle, FileText, User, MapPin, Car, DollarSign, Eye, X, Phone, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";

interface PreLoanViewProps {
  onSuccess: () => void;
  initialIsCreating?: boolean;
  onOpenLedger?: (loanNo: string) => void;
}

export default function PreLoanView({ onSuccess, initialIsCreating = false, onOpenLedger }: PreLoanViewProps) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(initialIsCreating);
  
  // Keep isCreating updated if the prop changes
  useEffect(() => {
    setIsCreating(initialIsCreating);
  }, [initialIsCreating]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    serialNo: `PRE-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString().split("T")[0],
    name: "",
    fatherSpouseName: "",
    phone: "",
    housePhone: "",
    address: "",
    landmark: "",
    area: "Katpadi",
    vehicleName: "",
    vehicleNo: "",
    engineNo: "",
    chassisNo: "",
    rcNo: "",
    model: "2025 Standard",
    vehicleValue: 90000,
    requiredLoan: 60000,
    downPayment: 30000,
    brokerName: "Anand Brokerage",
    coObligantName: ""
  });

  // Masters loaded from API
  const [brokers, setBrokers] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  useEffect(() => {
    fetchProposals();
    fetchMasters();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/preloans");
      const data = await res.json();
      setProposals(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMasters = async () => {
    try {
      const res = await fetch("/api/masters");
      const data = await res.json();
      setBrokers(data.filter((m: any) => m.category === "broker").map((m: any) => m.name));
      setAreas(data.filter((m: any) => m.category === "area").map((m: any) => m.name));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/preloans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsCreating(false);
        setStep(1);
        // Reset form
        setFormData({
          serialNo: `PRE-${Date.now().toString().slice(-5)}`,
          date: new Date().toISOString().split("T")[0],
          name: "",
          fatherSpouseName: "",
          phone: "",
          housePhone: "",
          address: "",
          landmark: "",
          area: "Katpadi",
          vehicleName: "",
          vehicleNo: "",
          engineNo: "",
          chassisNo: "",
          rcNo: "",
          model: "2025 Standard",
          vehicleValue: 90000,
          requiredLoan: 60000,
          downPayment: 30000,
          brokerName: brokers[0] || "Anand Brokerage",
          coObligantName: ""
        });
        fetchProposals();
        onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED" | "VERIFIED", executive?: string) => {
    try {
      const res = await fetch(`/api/preloans/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedExecutive: executive })
      });
      if (res.ok) {
        fetchProposals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 font-sans uppercase">
            Pre-Loan Processing Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Initiate, verify, and underwrite customer applications prior to drafting HP loan agreements.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Application
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-4.5 max-w-3xl mx-auto shadow-sm">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>1</span>
              <span className={step >= 1 ? "text-slate-800 font-bold" : "text-slate-400"}>Personal Details</span>
            </div>
            <div className="h-0.5 w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>2</span>
              <span className={step >= 2 ? "text-slate-800 font-bold" : "text-slate-400"}>Vehicle Specs</span>
            </div>
            <div className="h-0.5 w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>3</span>
              <span className={step === 3 ? "text-slate-800 font-bold" : "text-slate-400"}>Loan & Core Review</span>
            </div>
          </div>

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-3 font-sans">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <User className="h-4 w-4 text-blue-600" /> Section 1: Customer Profile Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Serial Number / Proposal ID</label>
                  <input type="text" disabled value={formData.serialNo} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-2.5 py-1 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Applicant's Full Name</label>
                  <input type="text" required placeholder="Enter full name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Father / Husband Name</label>
                  <input type="text" placeholder="Father or Husband name" value={formData.fatherSpouseName} onChange={(e) => setFormData({...formData, fatherSpouseName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Phone Number</label>
                  <input type="tel" placeholder="Primary phone number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">House Landline / Alternate Phone</label>
                  <input type="tel" placeholder="Secondary landline phone" value={formData.housePhone} onChange={(e) => setFormData({...formData, housePhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Residential Address</label>
                  <textarea rows={2} placeholder="Complete physical home address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Residence Landmark</label>
                  <input type="text" placeholder="e.g. Near Bus Stand" value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Operating Area</label>
                  <select value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                    {areas.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Vehicle Specifications */}
          {step === 2 && (
            <div className="space-y-3 font-sans">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <Car className="h-4 w-4 text-blue-600" /> Section 2: Collateral Vehicle Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Brand & Model</label>
                  <input type="text" placeholder="e.g. Maruti Alto K10, Bajaj Rickshaw" value={formData.vehicleName} onChange={(e) => setFormData({...formData, vehicleName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vehicle Plate No (if registered)</label>
                  <input type="text" placeholder="e.g. TN-23-CD-8822" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Chassis Number</label>
                  <input type="text" placeholder="Full Chassis Engraved Number" value={formData.chassisNo} onChange={(e) => setFormData({...formData, chassisNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Engine Number</label>
                  <input type="text" placeholder="Block Engine Serial Number" value={formData.engineNo} onChange={(e) => setFormData({...formData, engineNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">RC Book / Smart Card Registration No</label>
                  <input type="text" placeholder="RC Book Serial No" value={formData.rcNo} onChange={(e) => setFormData({...formData, rcNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Manufacturing & Variant Year</label>
                  <input type="text" placeholder="e.g. 2025 Standard variant" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Loan Details & Co-obligant */}
          {step === 3 && (
            <div className="space-y-3 font-sans">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <DollarSign className="h-4 w-4 text-blue-600" /> Section 3: Loan Principal & Guarantor Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Collateral Vehicle Market Value (₹)</label>
                  <input type="number" value={formData.vehicleValue} onChange={(e) => setFormData({...formData, vehicleValue: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Required Loan Principal (₹)</label>
                  <input type="number" value={formData.requiredLoan} onChange={(e) => setFormData({...formData, requiredLoan: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Down Payment / Margin Money (₹)</label>
                  <input type="number" value={formData.downPayment} onChange={(e) => setFormData({...formData, downPayment: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sourcing Broker</label>
                  <select value={formData.brokerName} onChange={(e) => setFormData({...formData, brokerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                    {brokers.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Co-obligant / Guarantor Name</label>
                  <input type="text" placeholder="Guarantor name, relationship & contact phone" value={formData.coObligantName} onChange={(e) => setFormData({...formData, coObligantName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="flex justify-between items-center mt-6 border-t border-slate-200 pt-3">
            <button
              onClick={() => {
                if (step === 1) setIsCreating(false);
                else handlePrev();
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs transition-colors font-semibold"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
              >
                Next Step <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
              >
                {loading ? "Writing Proposal..." : "Finish & File"} <Check className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Proposals Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
          {proposals.map((pl: any) => (
            <div key={pl.id} className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                    {pl.serialNo}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">{pl.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Filed: {pl.date}</p>
                </div>
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono uppercase ${
                  pl.status === "APPROVED" ? "bg-green-50 text-green-700 border border-green-200" :
                  pl.status === "REJECTED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                  "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {pl.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                <div>
                  <p className="text-slate-500 font-medium">Required Finance</p>
                  <p className="font-bold text-slate-800 font-mono">₹{pl.requiredLoan?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Down Payment</p>
                  <p className="font-bold text-slate-700 font-mono">₹{pl.downPayment?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Vehicle Type</p>
                  <p className="text-slate-700 font-semibold">{pl.vehicleName || "Not Spec"}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Operating Area</p>
                  <p className="text-slate-700 font-semibold">{pl.area || "Katpadi"}</p>
                </div>
              </div>

              {pl.landmark && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1 bg-slate-50 p-2 rounded">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Landmark: <strong className="text-slate-700">{pl.landmark}</strong></span>
                </div>
              )}

              {/* Action Rows */}
              {pl.status === "PENDING" && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setViewingProposal(pl)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Dossier
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAction(pl.id, "REJECTED")}
                      className="border border-slate-250 hover:bg-rose-50 text-rose-600 px-2 py-1 rounded text-[11px] transition-colors font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(pl.id, "VERIFIED", "Vikram Singh")}
                      className="bg-slate-100 hover:bg-slate-205 text-slate-700 border border-slate-200 px-2 py-1 rounded text-[11px] transition-colors font-bold cursor-pointer"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleAction(pl.id, "APPROVED")}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}

              {pl.status === "VERIFIED" && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setViewingProposal(pl)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Dossier
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[10px]">Exec: <strong className="text-slate-700 font-bold">{pl.assignedExecutive}</strong></span>
                    <button
                      onClick={() => handleAction(pl.id, "APPROVED")}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}

              {pl.status === "APPROVED" && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setViewingProposal(pl)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Dossier
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono font-bold border border-green-200 uppercase">READY FOR CONTRACT</span>
                    {onOpenLedger && (
                      <button
                        onClick={() => {
                          const loanNo = `HP-${pl.serialNo ? pl.serialNo.replace("PRE-", "") : pl.id}`;
                          onOpenLedger(loanNo);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Open HP Ledger <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {pl.status === "REJECTED" && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setViewingProposal(pl)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Dossier
                  </button>
                  <span className="text-[9px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono font-bold border border-red-200 uppercase">REJECTED</span>
                </div>
              )}
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-400">
              No pre-loan proposals currently filed in system.
            </div>
          )}
        </div>
      )}

      {/* Detailed Proposal View Modal */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight uppercase">Pre-Loan Proposal Dossier</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Reference ID: {viewingProposal.serialNo} • Filed: {viewingProposal.date}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingProposal(null)} 
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Section 1: Customer Profile */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <User className="h-3.5 w-3.5 text-indigo-500" /> 1. Customer Bio-Data & Contacts
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Applicant Name</span>
                    <span className="font-bold text-slate-900 text-xs">{viewingProposal.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Father / Spouse Name</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.fatherSpouseName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Sourcing Broker</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.brokerName || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Mobile Number</span>
                    <span className="font-mono text-slate-800 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> {viewingProposal.phone || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Alternate Phone</span>
                    <span className="font-mono text-slate-800">{viewingProposal.housePhone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Operating Area</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.area}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Full Residential Address</span>
                    <span className="font-medium text-slate-800 leading-relaxed block">{viewingProposal.address || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Landmark</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.landmark || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Specs */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <Car className="h-3.5 w-3.5 text-indigo-500" /> 2. Collateral Vehicle Specifications
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Vehicle Brand/Model</span>
                    <span className="font-bold text-slate-900">{viewingProposal.vehicleName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Model Variant Year</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.model || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Smart RC Card No</span>
                    <span className="font-mono text-slate-800 font-bold">{viewingProposal.rcNo || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Vehicle Plate No</span>
                    <span className="font-mono text-slate-900 font-bold">{viewingProposal.vehicleNo || "Unregistered"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Chassis Number</span>
                    <span className="font-mono text-slate-800 font-semibold truncate block" title={viewingProposal.chassisNo}>{viewingProposal.chassisNo || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Engine Number</span>
                    <span className="font-mono text-slate-800 font-semibold truncate block" title={viewingProposal.engineNo}>{viewingProposal.engineNo || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Loan details & Underwriting */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <DollarSign className="h-3.5 w-3.5 text-indigo-500" /> 3. Loan Principal & Risk Compliance
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Vehicle Market Value</span>
                    <span className="font-mono text-slate-900 font-bold">₹{viewingProposal.vehicleValue?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Requested Principal</span>
                    <span className="font-mono text-blue-600 font-bold">₹{viewingProposal.requiredLoan?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Down Payment Margin</span>
                    <span className="font-mono text-green-600 font-bold">₹{viewingProposal.downPayment?.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Primary Guarantor / Co-Obligant</span>
                    <span className="font-semibold text-slate-800">{viewingProposal.coObligantName || "None Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-semibold">Heuristic Risk Assessment</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase ${
                      viewingProposal.riskScore >= 70 ? "text-red-600" : viewingProposal.riskScore >= 45 ? "text-amber-600" : "text-green-600"
                    }`}>
                      {viewingProposal.riskScore}% [{viewingProposal.riskScore >= 70 ? "High" : viewingProposal.riskScore >= 45 ? "Medium" : "Low"}]
                    </span>
                  </div>
                </div>
              </div>

              {viewingProposal.aiReportText && (
                <div className="space-y-1.5 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <h5 className="font-bold text-blue-800 uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600 font-bold" /> AI Underwriter Smart Verification Summary
                  </h5>
                  <p className="text-[10px] leading-relaxed text-blue-900 font-sans">{viewingProposal.aiReportText}</p>
                </div>
              )}

            </div>

            {/* Modal Footer with quick action row */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center select-none shrink-0">
              <span className="text-[10px] font-mono font-bold text-slate-400">STATUS: <strong className="text-slate-600">{viewingProposal.status}</strong></span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewingProposal(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-1.5 rounded font-bold cursor-pointer transition-colors"
                >
                  Close Dossier
                </button>
                {viewingProposal.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => {
                        handleAction(viewingProposal.id, "REJECTED");
                        setViewingProposal(null);
                      }}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded font-bold cursor-pointer transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleAction(viewingProposal.id, "APPROVED");
                        setViewingProposal(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve Loan
                    </button>
                  </>
                )}
                {viewingProposal.status === "VERIFIED" && (
                  <button
                    onClick={() => {
                      handleAction(viewingProposal.id, "APPROVED");
                      setViewingProposal(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve Loan
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
