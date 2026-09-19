/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  PlusCircle, 
  PhoneCall, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Clipboard, 
  Trash, 
  Printer, 
  Coins, 
  Car, 
  DollarSign, 
  UserCheck, 
  History, 
  Tag, 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  FileCheck
} from "lucide-react";

interface ConsultancyViewProps {
  initialTab?: "purchase" | "sales" | "view_sales" | "pending";
  onTabChange?: (tab: "purchase" | "sales" | "view_sales" | "pending") => void;
}

export default function ConsultancyView({ initialTab = "purchase", onTabChange }: ConsultancyViewProps) {
  const [activeTab, setActiveTab] = useState<"purchase" | "sales" | "view_sales" | "pending">(initialTab);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [selectedPrintRecord, setSelectedPrintRecord] = useState<any | null>(null);
  
  // Modals / Dropdowns / Popover States
  const [isBuyoutOpen, setIsBuyoutOpen] = useState(false);
  const [buyoutRecord, setBuyoutRecord] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDeleteRecord = async (id: string, vehicleNo: string) => {
    if (!window.confirm(`Delete vehicle record ${vehicleNo} (${id}) from consultancy stock?`)) return;
    try {
      const res = await fetch(`/api/consultancies/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Stock record ${vehicleNo} removed successfully.`);
        if (selectedRecord?.id === id) setSelectedRecord(null);
        fetchRecords();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Purchase / Procurement Entry Form State
  const [procurementForm, setProcurementForm] = useState({
    vehicleNo: "",
    vehicleName: "",
    model: "2023",
    makeYear: 2023,
    vehicleValue: 120000,
    mileage: "15,000 km",
    condition: "Good",
    name: "",
    phone: "",
    address: "",
    landmark: "",
    area: "Vellore Main",
    brokerName: "Anand Brokerage",
    remarks: ""
  });

  // Sales Registration Entry Form State
  const [salesForm, setSalesForm] = useState({
    vehicleNo: "",
    vehicleName: "",
    model: "2024",
    makeYear: 2024,
    vehicleValue: 240000, // Demanded price
    floorPrice: 210000,   // Minimum acceptable price
    fuelType: "Petrol",
    ownerCount: "1st Owner",
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0],
    name: "", // Owner/Seller Name
    phone: "", // Owner/Seller Phone
    address: "",
    area: "Katpadi",
    brokerName: "Classic Auto Brokers",
    remarks: ""
  });

  // Buyout / Final Purchase Checkout Form State
  const [buyoutForm, setBuyoutForm] = useState({
    buyerName: "",
    buyerPhone: "",
    soldPrice: 230000,
    rtoTransferCharges: 4500,
    paymentMode: "CASH",
    remarks: "Client opted for cash settlement with instant RC transfer authorization."
  });

  const [callNotes, setCallNotes] = useState("");
  const [rcNotes, setRcNotes] = useState("");

  // Keep state synchronized with parent triggers (e.g. sidebar navigation clicks)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setSelectedRecord(null);
      setIsBuyoutOpen(false);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/consultancies");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error("Failed to fetch consultancy records:", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleTabClick = (tab: "purchase" | "sales" | "view_sales" | "pending") => {
    setActiveTab(tab);
    setSelectedRecord(null);
    setIsBuyoutOpen(false);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Submit Procured / Purchased Vehicle to Database (type: "PURCHASE")
  const handleProcurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serialNo = `PROC-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: serialNo,
        serialNo,
        type: "PURCHASE",
        date: new Date().toISOString().split("T")[0],
        ...procurementForm,
        sellerName: procurementForm.name,
        purchasePrice: Number(procurementForm.vehicleValue || 0),
        marketValuation: Number(procurementForm.vehicleValue || 0),
        status: "OPEN", // Active procurement
        callHistory: [{ date: new Date().toISOString().split("T")[0], summary: "Procurement record created. Vehicle verified in yard." }],
        rcBookHistory: [{ date: new Date().toISOString().split("T")[0], status: "Paperwork collected. Initiated RTO verification." }]
      };

      const res = await fetch("/api/consultancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Vehicle Procured Successfully! Registration No: ${procurementForm.vehicleNo}`);
        setProcurementForm({
          vehicleNo: "",
          vehicleName: "",
          model: "2023",
          makeYear: 2023,
          vehicleValue: 120000,
          mileage: "15,000 km",
          condition: "Good",
          name: "",
          phone: "",
          address: "",
          landmark: "",
          area: "Vellore Main",
          brokerName: "Anand Brokerage",
          remarks: ""
        });
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
      showToast("Error recording procurement entry");
    }
  };

  // Submit Vehicle Listed for Sale (type: "SALE")
  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serialNo = `SALE-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: serialNo,
        type: "SALE",
        serialNo,
        date: new Date().toISOString().split("T")[0],
        ...salesForm,
        status: "FOR_SALE", // Available for purchase/buyout
        callHistory: [{ date: new Date().toISOString().split("T")[0], summary: "Listed for brokerage sales stock. Target demo: retail buyer." }],
        rcBookHistory: [{ date: new Date().toISOString().split("T")[0], status: "Seller RC original copy secured in safety box." }]
      };

      const res = await fetch("/api/consultancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Sales Vehicle Listed Successfully! Stock Plate: ${salesForm.vehicleNo}`);
        setSalesForm({
          vehicleNo: "",
          vehicleName: "",
          model: "2024",
          makeYear: 2024,
          vehicleValue: 240000,
          floorPrice: 210000,
          fuelType: "Petrol",
          ownerCount: "1st Owner",
          insuranceExpiry: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0],
          name: "",
          phone: "",
          address: "",
          area: "Katpadi",
          brokerName: "Classic Auto Brokers",
          remarks: ""
        });
        fetchRecords();
        setActiveTab("view_sales"); // Take user to view directory automatically!
      }
    } catch (err) {
      console.error(err);
      showToast("Error registering sales listing");
    }
  };

  // Process Buyout Action (Buyer Purchases the Listed Vehicle)
  const handleBuyoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyoutRecord) return;

    try {
      const updatedCalls = [
        ...buyoutRecord.callHistory, 
        { date: new Date().toISOString().split("T")[0], summary: `Transaction closed with buyer ${buyoutForm.buyerName}. Agreed Price: ₹${buyoutForm.soldPrice.toLocaleString()}. Remarks: ${buyoutForm.remarks}` }
      ];
      const updatedRcs = [
        ...buyoutRecord.rcBookHistory,
        { date: new Date().toISOString().split("T")[0], status: `Sold. Instigated RTO transfer ownership to ${buyoutForm.buyerName}. Transfer Fee: ₹${buyoutForm.rtoTransferCharges}.` }
      ];

      const payload = {
        status: "SOLD",
        buyerName: buyoutForm.buyerName,
        buyerPhone: buyoutForm.buyerPhone,
        soldPrice: Number(buyoutForm.soldPrice),
        rtoTransferCharges: Number(buyoutForm.rtoTransferCharges),
        paymentMode: buyoutForm.paymentMode,
        buyoutRemarks: buyoutForm.remarks,
        purchaseDate: new Date().toISOString().split("T")[0],
        callHistory: updatedCalls,
        rcBookHistory: updatedRcs
      };

      const res = await fetch(`/api/consultancies/${buyoutRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Purchase Completed! Sold ${buyoutRecord.vehicleName} to ${buyoutForm.buyerName}`);
        setIsBuyoutOpen(false);
        setBuyoutRecord(null);
        fetchRecords();
        setBuyoutForm({
          buyerName: "",
          buyerPhone: "",
          soldPrice: 230000,
          rtoTransferCharges: 4500,
          paymentMode: "CASH",
          remarks: "Client opted for cash settlement with instant RC transfer authorization."
        });
      }
    } catch (err) {
      console.error(err);
      showToast("Error recording buyout transaction");
    }
  };

  // Add Interactive Call Logs on Selected Record
  const addCallLog = async () => {
    if (!selectedRecord || !callNotes) return;
    const updatedCalls = [...(selectedRecord.callHistory || []), { date: new Date().toISOString().split("T")[0], summary: callNotes }];
    try {
      const res = await fetch(`/api/consultancies/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callHistory: updatedCalls })
      });
      if (res.ok) {
        setCallNotes("");
        const updated = await res.json();
        setSelectedRecord(updated);
        fetchRecords();
        showToast("Consultancy call log added successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Interactive RC Book Updates
  const updateRcStatus = async () => {
    if (!selectedRecord || !rcNotes) return;
    const updatedRc = [...(selectedRecord.rcBookHistory || []), { date: new Date().toISOString().split("T")[0], status: rcNotes }];
    try {
      const res = await fetch(`/api/consultancies/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rcBookHistory: updatedRc })
      });
      if (res.ok) {
        setRcNotes("");
        const updated = await res.json();
        setSelectedRecord(updated);
        fetchRecords();
        showToast("RTO RC status updated.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter lists based on Tab Choice
  const purchaseRecords = records.filter(r => r.type === "PURCHASE");
  const salesRecords = records.filter(r => r.type === "SALE");
  const pendingRecords = records.filter(r => r.status === "OPEN" || r.status === "FOR_SALE" || r.status === "PENDING");

  return (
    <div className="space-y-5" id="consultancy-root">
      
      {/* Toast Alert System */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header and Brand Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase font-sans flex items-center gap-2">
            <Car className="h-5 w-5 text-indigo-600" />
            Xerova Auto Consultancy
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Manage pre-owned vehicle acquisitions, track showroom sales stock, execute buyouts, and trace RTO transfer documents.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner shrink-0 select-none font-sans">
          <button 
            onClick={() => handleTabClick("purchase")}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === "purchase" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Procure / Purchase
          </button>
          <button 
            onClick={() => handleTabClick("sales")}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === "sales" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Record Sales Stock
          </button>
          <button 
            onClick={() => handleTabClick("view_sales")}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === "view_sales" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            View Sales Directory
          </button>
          <button 
            onClick={() => handleTabClick("pending")}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Pending Follow-ups
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. PURCHASE TAB: PROCURE / BUY PRE-OWNED VEHICLE */}
      {/* ========================================================== */}
      {activeTab === "purchase" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 font-sans">
          
          {/* Procurement Form Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-1">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono">
                Procurement Engine
              </span>
              <h2 className="text-sm font-bold text-slate-800 mt-2">Record Procurement Purchase</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Enter buying details of a pre-owned vehicle acquired by Xerova.</p>
            </div>

            <form onSubmit={handleProcurementSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Registration Plate No</label>
                <input 
                  type="text" 
                  placeholder="e.g. TN-23-ZZ-5566" 
                  required 
                  value={procurementForm.vehicleNo} 
                  onChange={(e) => setProcurementForm({...procurementForm, vehicleNo: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Maker & Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Honda City" 
                    required 
                    value={procurementForm.vehicleName} 
                    onChange={(e) => setProcurementForm({...procurementForm, vehicleName: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year / Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2022 VXi" 
                    value={procurementForm.model} 
                    onChange={(e) => setProcurementForm({...procurementForm, model: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cost Valuation (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={procurementForm.vehicleValue} 
                    onChange={(e) => setProcurementForm({...procurementForm, vehicleValue: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mileage / Odo</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 24,000 km" 
                    value={procurementForm.mileage} 
                    onChange={(e) => setProcurementForm({...procurementForm, mileage: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condition Rating</label>
                  <select 
                    value={procurementForm.condition} 
                    onChange={(e) => setProcurementForm({...procurementForm, condition: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Excellent">Excellent (Pristine)</option>
                    <option value="Good">Good (Minor wear)</option>
                    <option value="Fair">Fair (Needs grooming)</option>
                    <option value="Needs Repairs">Needs Mechanical Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Procuring Broker</label>
                  <input 
                    type="text" 
                    value={procurementForm.brokerName} 
                    onChange={(e) => setProcurementForm({...procurementForm, brokerName: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2.5 mt-1 space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Seller (Source Party) Information</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Seller Name</label>
                    <input 
                      type="text" 
                      placeholder="Contact Name" 
                      required 
                      value={procurementForm.name} 
                      onChange={(e) => setProcurementForm({...procurementForm, name: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Seller Phone</label>
                    <input 
                      type="tel" 
                      placeholder="Phone" 
                      required 
                      value={procurementForm.phone} 
                      onChange={(e) => setProcurementForm({...procurementForm, phone: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Residential Area</label>
                  <input 
                    type="text" 
                    value={procurementForm.area} 
                    onChange={(e) => setProcurementForm({...procurementForm, area: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 uppercase"
                >
                  <Plus className="h-4 w-4" /> Save Procurement Entry
                </button>
              </div>
            </form>
          </div>

          {/* Purchased / Procured Vehicle Inventory List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Procured Purchase Listings</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Historical list of pre-owned vehicles acquired from brokers & sellers</p>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {purchaseRecords.length} vehicles
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                      <th className="px-4 py-3">Registration & ID</th>
                      <th className="px-4 py-3">Vehicle Specifications</th>
                      <th className="px-4 py-3">Procurement Cost</th>
                      <th className="px-4 py-3">Seller Details</th>
                      <th className="px-4 py-3 text-center">RTO RC Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                    {purchaseRecords.map((rec) => (
                      <tr 
                        key={rec.id}
                        onClick={() => setSelectedRecord(rec)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedRecord?.id === rec.id ? "bg-indigo-50/50" : ""}`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-slate-900 font-bold uppercase">{rec.vehicleNo}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{rec.serialNo}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{rec.vehicleName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Model: {rec.model} • Condition: <span className="font-semibold text-indigo-600">{rec.condition}</span></p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-bold text-slate-900 text-xs">₹{Number(rec.vehicleValue || 0).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{rec.date}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{rec.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{rec.phone} • {rec.area}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            <Clock className="h-2.5 w-2.5" /> Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                    {purchaseRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs">No vehicle procurement entries stored.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick stats banner */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Procurement Outflow</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    ₹{purchaseRecords.reduce((sum, r) => sum + Number(r.vehicleValue || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Yard Stock Count</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    {purchaseRecords.length} Units
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">RTO Ingress Rate</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    100% Verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. SALES TAB: REGISTER VEHICLE FOR SALE */}
      {/* ========================================================== */}
      {activeTab === "sales" && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
          <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800">
            <span className="text-[9px] bg-indigo-500 text-white font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-wide">
              Showroom Sales Registry
            </span>
            <h2 className="text-base font-bold mt-2">Register Pre-Owned Vehicle Stock for Sale</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit a vehicle to list on the Sales Directory. Potential buyers can purchase this vehicle.
            </p>
          </div>

          <form onSubmit={handleSalesSubmit} className="p-5 space-y-4">
            
            {/* Vehicle Specifications Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 uppercase tracking-wide">1. Vehicle Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plate Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TN-23-CD-8899" 
                    required 
                    value={salesForm.vehicleNo} 
                    onChange={(e) => setSalesForm({...salesForm, vehicleNo: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Maker & Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hyundai i10" 
                    required 
                    value={salesForm.vehicleName} 
                    onChange={(e) => setSalesForm({...salesForm, vehicleName: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Manufacturing Year</label>
                  <input 
                    type="number" 
                    required 
                    value={salesForm.makeYear} 
                    onChange={(e) => setSalesForm({...salesForm, makeYear: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fuel Type</label>
                  <select 
                    value={salesForm.fuelType} 
                    onChange={(e) => setSalesForm({...salesForm, fuelType: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric (EV)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Count</label>
                  <select 
                    value={salesForm.ownerCount} 
                    onChange={(e) => setSalesForm({...salesForm, ownerCount: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="1st Owner">1st Owner (Single hand)</option>
                    <option value="2nd Owner">2nd Owner</option>
                    <option value="3rd+ Owner">3rd+ Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Insurance Expiration</label>
                  <input 
                    type="date" 
                    value={salesForm.insuranceExpiry} 
                    onChange={(e) => setSalesForm({...salesForm, insuranceExpiry: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Pricing Parameters */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 uppercase tracking-wide">2. Pricing & Broker Parameters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Demanded Listing Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={salesForm.vehicleValue} 
                    onChange={(e) => setSalesForm({...salesForm, vehicleValue: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Floor Bottom-Line Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={salesForm.floorPrice} 
                    onChange={(e) => setSalesForm({...salesForm, floorPrice: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sourcing Broker Agent</label>
                  <input 
                    type="text" 
                    value={salesForm.brokerName} 
                    onChange={(e) => setSalesForm({...salesForm, brokerName: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Seller Info Group */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1.5 uppercase tracking-wide">3. Consignment Seller Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Name</label>
                  <input 
                    type="text" 
                    placeholder="Seller Full Name" 
                    required 
                    value={salesForm.name} 
                    onChange={(e) => setSalesForm({...salesForm, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Mobile Phone" 
                    required 
                    value={salesForm.phone} 
                    onChange={(e) => setSalesForm({...salesForm, phone: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Region Area</label>
                  <input 
                    type="text" 
                    value={salesForm.area} 
                    onChange={(e) => setSalesForm({...salesForm, area: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Address</label>
                <input 
                  type="text" 
                  placeholder="Apartment, Street Address, City" 
                  value={salesForm.address} 
                  onChange={(e) => setSalesForm({...salesForm, address: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-lg shadow-emerald-50 transition-all uppercase flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" /> Publish Sales Stock Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. VIEW SALES DIRECTORY TAB */}
      {/* ========================================================== */}
      {activeTab === "view_sales" && (
        <div className="font-sans space-y-4">
          
          {/* Main Sales Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesRecords.map((item) => {
              const isSold = item.status === "SOLD";
              return (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${isSold ? "border-slate-200 bg-slate-50/40 opacity-90" : "border-slate-200"}`}
                >
                  
                  {/* Visual Ribbon/Badge for Sale Status */}
                  <div className="absolute top-3.5 right-3.5 z-10 select-none">
                    {isSold ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 uppercase">
                        <Check className="h-2.5 w-2.5 stroke-[3px]" /> SOLD OUT
                      </span>
                    ) : (
                      <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                        FOR SALE
                      </span>
                    )}
                  </div>

                  {/* Vehicle Hero Details Card */}
                  <div className="p-4.5 space-y-3 flex-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider uppercase block">{item.serialNo}</span>
                      <h4 className="text-base font-bold text-slate-800 mt-1">{item.vehicleName}</h4>
                      <p className="font-mono text-[11px] text-slate-500 uppercase tracking-tight mt-0.5">{item.vehicleNo}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-1 border-t border-b border-slate-100 py-2.5 text-[11px] text-slate-600">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Model Year</span>
                        <span className="font-bold text-slate-800">{item.makeYear || item.model}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Fuel & Engine</span>
                        <span className="font-bold text-slate-800">{item.fuelType || "Petrol"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Ownership</span>
                        <span className="font-bold text-slate-800">{item.ownerCount || "1st Owner"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Sourcing Agent</span>
                        <span className="font-bold text-slate-800 truncate block">{item.brokerName}</span>
                      </div>
                    </div>

                    {/* Cost Metrics */}
                    <div className="flex justify-between items-baseline pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Retail Asking Price</span>
                        <span className="text-base font-black text-slate-800 font-mono">₹{Number(item.vehicleValue).toLocaleString()}</span>
                      </div>
                      {!isSold && (
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase font-semibold block">Floor Min Price</span>
                          <span className="text-xs font-bold text-slate-400 font-mono">₹{Number(item.floorPrice || item.vehicleValue * 0.9).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* If SOLD, Display Buyer Card Info */}
                    {isSold && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg space-y-1 mt-2">
                        <p className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="h-3 w-3" /> Sale Acquisition Confirmed
                        </p>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          <p>Buyer: <span className="font-bold">{item.buyerName}</span> ({item.buyerPhone})</p>
                          <p>Sold Price: <span className="font-extrabold font-mono text-emerald-900">₹{Number(item.soldPrice).toLocaleString()}</span></p>
                          <p className="text-[9px] text-emerald-500 font-mono mt-0.5">Date: {item.purchaseDate || item.date}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchase Interactive Action (Bottom of card) */}
                  {!isSold && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setBuyoutRecord(item);
                          setBuyoutForm({
                            buyerName: "",
                            buyerPhone: "",
                            soldPrice: Number(item.vehicleValue),
                            rtoTransferCharges: 4500,
                            paymentMode: "CASH",
                            remarks: `Acquired through brokerage by direct buyer. Listed price ₹${Number(item.vehicleValue).toLocaleString()}.`
                          });
                          setIsBuyoutOpen(true);
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 uppercase shadow-sm"
                      >
                        <Coins className="h-3.5 w-3.5 text-amber-400" /> Complete Purchase (Sale)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {salesRecords.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-400 rounded-xl">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700">No Showroom Listings Added</h4>
                <p className="text-xs mt-1">Please use the "Record Sales Stock" tab to create pre-owned vehicles available for purchase.</p>
              </div>
            )}
          </div>

          {/* Checkout Purchase Modal Popup overlay */}
          {isBuyoutOpen && buyoutRecord && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
                
                {/* Header */}
                <div className="bg-slate-950 text-white px-5 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Vehicle Checkout Order</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Purchasing: {buyoutRecord.vehicleName} ({buyoutRecord.vehicleNo})</p>
                  </div>
                  <button 
                    onClick={() => { setIsBuyoutOpen(false); setBuyoutRecord(null); }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleBuyoutSubmit} className="p-5 space-y-4">
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-lg grid grid-cols-2 gap-3 text-xs text-slate-700">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px]">Retail Listed Value</p>
                      <p className="font-extrabold font-mono text-sm text-slate-900">₹{Number(buyoutRecord.vehicleValue).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px]">Sourcing Broker Agent</p>
                      <p className="font-bold text-slate-900">{buyoutRecord.brokerName || "None"}</p>
                    </div>
                  </div>

                  {/* Buyer Contact Particulars */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">1. Customer / Buyer Particulars</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer Full Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Anand Murugan"
                          value={buyoutForm.buyerName} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, buyerName: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer Mobile Phone</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="98765 43210"
                          value={buyoutForm.buyerPhone} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, buyerPhone: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deal Financial Terms */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">2. Financial Closure Terms</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Final Agreed Sale Price (₹)</label>
                        <input 
                          type="number" 
                          required 
                          value={buyoutForm.soldPrice} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, soldPrice: Number(e.target.value)})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">RTO RC Transfer Fees (₹)</label>
                        <input 
                          type="number" 
                          required 
                          value={buyoutForm.rtoTransferCharges} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, rtoTransferCharges: Number(e.target.value)})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Settlement Payment Mode</label>
                        <select 
                          value={buyoutForm.paymentMode} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, paymentMode: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="CASH">CASH AT COUNTER</option>
                          <option value="BANK">IMPS/NEFT BANK TRANSFER</option>
                          <option value="UPI">UPI (GPay / PhonePe)</option>
                          <option value="FINANCE">HP FINANCE SCHEME</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sale Invoice Memo</label>
                        <input 
                          type="text" 
                          value={buyoutForm.remarks} 
                          onChange={(e) => setBuyoutForm({...buyoutForm, remarks: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 text-xs border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => { setIsBuyoutOpen(false); setBuyoutRecord(null); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition-all border border-slate-300 uppercase"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit" 
                      className="bg-slate-950 hover:bg-slate-850 text-white px-5 py-2 rounded-lg font-black transition-all flex items-center gap-1.5 uppercase shadow-md"
                    >
                      <Check className="h-4 w-4 text-emerald-400 stroke-[3px]" /> Authorize Order Execution
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. PENDING RC BOOK & RTO TRANSFER FOLLOWUPS */}
      {/* ========================================================== */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 font-sans">
          
          {/* List panel */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm lg:col-span-2">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Pending Documents & Client History</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Filter for active follow-ups, pending RC transfers, and buyer logs</p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full">
                {pendingRecords.length} Active Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Vehicle particulars</th>
                    <th className="px-4 py-2.5">Primary Party</th>
                    <th className="px-4 py-2.5 text-center">Transfer Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {pendingRecords.map((rec) => (
                    <tr 
                      key={rec.id} 
                      onClick={() => setSelectedRecord(rec)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedRecord?.id === rec.id ? "bg-indigo-50/50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase border ${rec.type === "PURCHASE" ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-slate-900 font-bold uppercase">{rec.vehicleNo}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{rec.vehicleName} • model {rec.model}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{rec.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rec.phone} • {rec.area}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pendingRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">
                        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs">All vehicle transfers are closed.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Detail Log Updates Side Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm lg:col-span-1">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200 uppercase font-mono">
                    {selectedRecord.type} Registry
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1.5">{selectedRecord.vehicleName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Plate: <span className="uppercase text-slate-800 font-bold">{selectedRecord.vehicleNo}</span></p>
                </div>

                <div className="space-y-4">
                  {/* RC Book History */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" /> RTO RC Book Transfer Status
                    </h4>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-sans max-h-[140px] overflow-y-auto space-y-2 shadow-inner">
                      {selectedRecord.rcBookHistory?.map((rc: any, idx: number) => (
                        <div key={idx} className="border-b border-slate-200 pb-1.5 last:border-0 last:pb-0 space-y-0.5">
                          <p className="text-slate-700 font-semibold">{rc.status}</p>
                          <p className="text-slate-400 font-mono text-[9px]">{rc.date}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        placeholder="e.g. Received SmartCard, sent to buyer..." 
                        value={rcNotes}
                        onChange={(e) => setRcNotes(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={updateRcStatus} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0"
                      >
                        Add Status
                      </button>
                    </div>
                  </div>

                  {/* Call Log History */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                      <PhoneCall className="h-3.5 w-3.5 text-indigo-600" /> Consultancy Follow-up Call Logs
                    </h4>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-sans max-h-[140px] overflow-y-auto space-y-2 shadow-inner">
                      {selectedRecord.callHistory?.map((call: any, idx: number) => (
                        <div key={idx} className="border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex justify-between text-slate-400 text-[9px] font-mono">
                            <span className="font-bold">Call Minute</span>
                            <span>{call.date}</span>
                          </div>
                          <p className="text-slate-700 font-medium mt-0.5">{call.summary}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        placeholder="e.g. Spoke to buyer about RTO stamp..." 
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={addCallLog} 
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0"
                      >
                        Log Minutes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 font-sans text-[11px]">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedPrintRecord(selectedRecord)}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-500" /> Print Certificate
                    </button>
                    <button 
                      onClick={() => handleDeleteRecord(selectedRecord.id, selectedRecord.vehicleNo)}
                      className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Trash className="h-3.5 w-3.5 text-rose-500" /> Remove
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`WhatsApp dispatch simulation: Dispatched document checklist and current status of plate ${selectedRecord.vehicleNo} to ${selectedRecord.phone}`);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp Update
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center font-sans border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ShieldAlert className="h-8 w-8 stroke-1 mb-2.5 text-slate-300" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select a follow-up card</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Pick a vehicle row from the left table directory to log calls and RTO document progress.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Vehicle Valuation & Brokerage Certificate Modal */}
      {selectedPrintRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center select-none">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Car className="h-4 w-4 text-amber-400" /> Valuation & Sourcing Certificate
              </span>
              <button onClick={() => setSelectedPrintRecord(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 printable-print-block">
              <div className="border-4 border-double border-indigo-900/20 p-5 rounded-lg space-y-4 bg-slate-50/50">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h2 className="text-base font-black text-indigo-950 uppercase tracking-tight">XEROVA AUTO CONSULTANCY</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Pre-Owned Automobile Valuation & Title Registry Desk</p>
                  <p className="text-[10px] font-mono font-bold text-indigo-800 mt-1 uppercase">VEHICLE APPRAISAL & SOURCING CERTIFICATE</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Registry Stock ID</span>
                    <span className="font-mono font-black text-slate-900">{selectedPrintRecord.serialNo || selectedPrintRecord.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Registration Plate</span>
                    <span className="font-mono font-black text-indigo-900 uppercase text-sm">{selectedPrintRecord.vehicleNo}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Description:</span>
                    <strong className="text-slate-900">{selectedPrintRecord.vehicleName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model / Make Year:</span>
                    <strong className="text-slate-900">{selectedPrintRecord.makeYear || selectedPrintRecord.model}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category Type:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPrintRecord.type}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5">
                    <span className="text-slate-500">Appraised Valuation:</span>
                    <span className="font-mono font-black text-slate-950 text-sm">₹{Number(selectedPrintRecord.vehicleValue || 0).toLocaleString()}</span>
                  </div>
                  {selectedPrintRecord.status === "SOLD" && (
                    <div className="flex justify-between text-emerald-800 border-t border-dashed border-slate-200 pt-1.5 font-bold">
                      <span>Purchased By:</span>
                      <span>{selectedPrintRecord.buyerName} (₹{Number(selectedPrintRecord.soldPrice || 0).toLocaleString()})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Contact / Owner:</span>
                    <span>{selectedPrintRecord.name} ({selectedPrintRecord.phone})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 pt-4 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300">
                  <div>
                    <div className="h-6"></div>
                    <p className="border-t border-slate-400 pt-1 font-bold text-slate-700">Appraiser Signature</p>
                  </div>
                  <div>
                    <div className="h-6 flex items-center justify-center">
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">SEAL & VERIFIED</span>
                    </div>
                    <p className="border-t border-slate-400 pt-1 font-bold text-slate-700">Consultancy Branch Manager</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setSelectedPrintRecord(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded font-bold text-xs uppercase"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 uppercase shadow-sm cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Appraisal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
