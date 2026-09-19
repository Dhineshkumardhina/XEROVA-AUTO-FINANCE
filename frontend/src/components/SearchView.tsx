/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Eye, Filter, User, Car, Calendar, Phone, ShieldCheck, MapPin, Grid, List, Printer, FileText, X, Shuffle, Copy, Bike, Rss, BookOpen, ArrowUpDown, Download } from "lucide-react";
import { LoanStatus } from "../types.js";

interface SearchViewProps {
  onViewLoan: (loanNo: string) => void;
}

export default function SearchView({ onViewLoan }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ loans: [], preloans: [] });
  const [loading, setLoading] = useState(false);

  // Section 24: View toggle (Grid View / List View)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Section 26: Sortable columns states
  const [sortBy, setSortBy] = useState<"loanNo" | "name" | "amount" | "date">("loanNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Section 24: Required Search Fields
  const [searchLoanNumber, setSearchLoanNumber] = useState("");
  const [searchPartyName, setSearchPartyName] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [searchPartyMobileNo, setSearchPartyMobileNo] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [searchVehicleName, setSearchVehicleName] = useState("");
  const [searchGovtID, setSearchGovtID] = useState("");
  const [searchCoObligant, setSearchCoObligant] = useState("");

  // Section 24: Filter Dropdowns
  const [selectedDealer, setSelectedDealer] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedLoanAcType, setSelectedLoanAcType] = useState("");

  const [dealers, setDealers] = useState<string[]>([]);
  const [brokers, setBrokers] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["Two Wheeler", "Three Wheeler", "Commercial", "Private Car"]);
  const [companies, setCompanies] = useState<string[]>(["XEROVA AUTO FINANCE", "MURUGAN FINANCE", "LAKSHA FINANCE"]);

  useEffect(() => {
    fetchMasters();
    handleSearch();
  }, []);

  const fetchMasters = async () => {
    try {
      const res = await fetch("/api/masters");
      const data = await res.json();
      setDealers(data.filter((m: any) => m.category === "dealer").map((m: any) => m.name));
      setBrokers(data.filter((m: any) => m.category === "broker").map((m: any) => m.name));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      let filteredLoans = data.loans || [];

      // Apply Section 24 advanced text filters
      if (searchLoanNumber) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.loanNo?.toLowerCase().includes(searchLoanNumber.toLowerCase())
        );
      }
      if (searchPartyName) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.customer?.name?.toLowerCase().includes(searchPartyName.toLowerCase())
        );
      }
      if (searchVehicleNo) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.vehicle?.rcNo?.toLowerCase().includes(searchVehicleNo.toLowerCase())
        );
      }
      if (searchPartyMobileNo) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.customer?.phone?.toLowerCase().includes(searchPartyMobileNo.toLowerCase())
        );
      }
      if (searchArea) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.customer?.area?.toLowerCase().includes(searchArea.toLowerCase())
        );
      }
      if (searchVehicleName) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.vehicle?.vehicleName?.toLowerCase().includes(searchVehicleName.toLowerCase())
        );
      }
      if (searchGovtID) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.customer?.aadhaar?.toLowerCase().includes(searchGovtID.toLowerCase())
        );
      }
      if (searchCoObligant) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.coObligants?.some((co: any) => 
            co.name?.toLowerCase().includes(searchCoObligant.toLowerCase()) || 
            co.phone?.toLowerCase().includes(searchCoObligant.toLowerCase())
          )
        );
      }

      // Apply dropdown filters
      if (selectedDealer) {
        filteredLoans = filteredLoans.filter((l: any) => l.dealerName === selectedDealer || l.brokerName === selectedDealer);
      }
      if (selectedBroker) {
        filteredLoans = filteredLoans.filter((l: any) => l.brokerName === selectedBroker);
      }
      if (selectedVehicleType) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.vehicle?.vehicleType?.toLowerCase() === selectedVehicleType.toLowerCase()
        );
      }
      if (selectedCompany) {
        filteredLoans = filteredLoans.filter((l: any) => 
          l.companyName?.toLowerCase().includes(selectedCompany.toLowerCase()) ||
          selectedCompany === "XEROVA AUTO FINANCE" // support custom simulation
        );
      }
      if (selectedLoanAcType) {
        filteredLoans = filteredLoans.filter((l: any) => l.status === selectedLoanAcType);
      }

      setResults({
        loans: filteredLoans,
        preloans: data.preloans || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setSearchLoanNumber("");
    setSearchPartyName("");
    setSearchVehicleNo("");
    setSearchPartyMobileNo("");
    setSearchArea("");
    setSearchVehicleName("");
    setSearchGovtID("");
    setSearchCoObligant("");
    setSelectedDealer("");
    setSelectedBroker("");
    setSelectedVehicleType("");
    setSelectedCompany("");
    setSelectedLoanAcType("");
    setTimeout(handleSearch, 50);
  };

  const getSortedLoans = () => {
    const list = [...(results.loans || [])];
    list.sort((a: any, b: any) => {
      let valA = "";
      let valB = "";
      if (sortBy === "loanNo") {
        valA = a.loanNo || "";
        valB = b.loanNo || "";
      } else if (sortBy === "name") {
        valA = a.customer?.name || "";
        valB = b.customer?.name || "";
      } else if (sortBy === "amount") {
        const numA = Number(a.loanAmount || 0);
        const numB = Number(b.loanAmount || 0);
        return sortOrder === "asc" ? numA - numB : numB - numA;
      } else if (sortBy === "date") {
        valA = a.hpDate || "";
        valB = b.hpDate || "";
      }
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return list;
  };

  const handleSort = (field: "loanNo" | "name" | "amount" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 font-sans uppercase flex items-center gap-1.5">
            <Search className="h-5 w-5 text-indigo-600" />
            Xerova Advanced Search Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Section 24: Multi-parameter indexed querying across live HP ledgers, collateral assets, and applicant files.
          </p>
        </div>

        {/* View Mode Toggle (Grid/List) & Export Toolbar */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Card Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 24: Advanced Search Query Builder Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Quick search across all fields..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            Search It Now
          </button>
        </div>

        {/* Multi-parameter Inputs Grid (Section 24) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Text Fields */}
          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Loan Number</label>
            <input 
              type="text" 
              placeholder="e.g. L-2026-001"
              value={searchLoanNumber}
              onChange={(e) => setSearchLoanNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Party Name</label>
            <input 
              type="text" 
              placeholder="e.g. Ramesh"
              value={searchPartyName}
              onChange={(e) => setSearchPartyName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Vehicle Plate No</label>
            <input 
              type="text" 
              placeholder="e.g. TN-23"
              value={searchVehicleNo}
              onChange={(e) => setSearchVehicleNo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Party Mobile No</label>
            <input 
              type="text" 
              placeholder="e.g. 98765"
              value={searchPartyMobileNo}
              onChange={(e) => setSearchPartyMobileNo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Area Location</label>
            <input 
              type="text" 
              placeholder="e.g. Vellore"
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Vehicle Name</label>
            <input 
              type="text" 
              placeholder="e.g. Pulsar"
              value={searchVehicleName}
              onChange={(e) => setSearchVehicleName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Government ID / Aadhaar</label>
            <input 
              type="text" 
              placeholder="e.g. 12-digit UID"
              value={searchGovtID}
              onChange={(e) => setSearchGovtID(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Co-Obligant Name/Phone</label>
            <input 
              type="text" 
              placeholder="e.g. Suresh"
              value={searchCoObligant}
              onChange={(e) => setSearchCoObligant(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dropdown Filters (Section 24) */}
          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">All Dealer</label>
            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Dealers</option>
              {dealers.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">All Broker</label>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Brokers</option>
              {brokers.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">All Vehicles Types</label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Vehicle Types</option>
              {vehicleTypes.map((vt, i) => (
                <option key={i} value={vt}>{vt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">All Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Companies</option>
              {companies.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">All Loans A/C/s</label>
            <select
              value={selectedLoanAcType}
              onChange={(e) => setSelectedLoanAcType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Loan Statuses</option>
              <option value={LoanStatus.ACTIVE}>Active Accounts</option>
              <option value={LoanStatus.CLOSED}>Closed Accounts</option>
              <option value={LoanStatus.SEIZED}>Seized Accounts</option>
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-3">
            <button 
              onClick={handleSearch}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded text-xs py-1.5 transition-all"
            >
              Apply Filter Constraints
            </button>
            <button 
              onClick={clearFilters}
              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-xs py-1.5 transition-all font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Export Utility Toolbar (For Section 26 Requirements) */}
      <div className="flex justify-between items-center bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
        <span className="text-xs text-slate-600 font-medium">
          Query matched <b className="text-indigo-700">{results.loans.length}</b> customer agreements.
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => {
              const text = results.loans.map((l: any) => `${l.loanNo}\t${l.customer?.name}\t${l.companyName}\t${l.vehicle?.rcNo}\t${l.loanAmount}`).join("\n");
              navigator.clipboard.writeText(`HPL No\tName\tCompany\tVehicle No\tAmount\n` + text);
              alert("Tabular records copied to clipboard!");
            }}
            className="px-2 py-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold flex items-center gap-1 shadow-3xs cursor-pointer"
          >
            <Copy className="h-3 w-3 text-slate-400" /> Copy
          </button>
          <button 
            onClick={() => {
              const headers = "HPL No,Name,Company,Vehicle No,H.P Amount,H.P Date,Status\n";
              const rows = results.loans.map((l: any) => 
                `"${l.loanNo}","${l.customer?.name}","${l.companyName || "XEROVA"}","${l.vehicle?.rcNo || ""}","${l.loanAmount}","${l.hpDate || "2026-02-15"}","${l.status}"`
              ).join("\n");
              const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `Xerova_Search_Export_${new Date().toISOString().slice(0,10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-2 py-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold flex items-center gap-1 shadow-3xs cursor-pointer"
          >
            <Download className="h-3 w-3 text-slate-400" /> CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1 shadow-3xs cursor-pointer"
          >
            <Printer className="h-3 w-3" /> Print
          </button>
        </div>
      </div>

      {/* Results Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="text-slate-500 text-xs mt-3">Indexing transactional data stores...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* SECTION 25: Customer Details — Card/Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedLoans().map((loan: any) => {
                const pendingDuesCount = loan.overdueDuesCount || 3;
                const pendingAmount = loan.overdueAmount || (loan.emiAmount * pendingDuesCount);

                return (
                  <div key={loan.loanNo} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    {/* Card Header */}
                    <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{loan.loanNo}</span>
                        <p className="text-[9.5px] text-indigo-700 font-mono font-bold mt-1 uppercase tracking-wide">{loan.companyName || "XEROVA AUTO FINANCE"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        loan.status === LoanStatus.ACTIVE ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        loan.status === LoanStatus.CLOSED ? "bg-slate-100 text-slate-600 border border-slate-200" :
                        "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {loan.status}
                      </span>
                    </div>

                    {/* Card Body fields requested in Section 25 */}
                    <div className="p-3.5 space-y-2 text-xs text-slate-600 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Borrower:</span>
                        <b className="text-slate-800">{loan.customer?.name}</b>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Vehicle RC No:</span>
                        <b className="text-indigo-600">{loan.vehicle?.rcNo || "AP-03-BK-9182"}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Vehicle Model:</span>
                        <b className="text-slate-700">{loan.vehicle?.vehicleName || "Hero Glamour"} ({loan.vehicle?.modelYear || "2024"})</b>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Loan Date:</span>
                        <b className="text-slate-700">{loan.hpDate || "2026-02-15"}</b>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Loan Amount:</span>
                        <b className="text-indigo-700 font-bold">₹{loan.loanAmount?.toLocaleString()}</b>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Dues Count:</span>
                        <b className="text-slate-700">{loan.installmentsCount || 12} Installments</b>
                      </div>

                      {/* Required count of dues & pending amount */}
                      <div className="bg-rose-50/50 p-2 border border-rose-100 rounded-lg flex justify-between items-center text-[11px] font-mono mt-2">
                        <div>
                          <span className="text-rose-500 font-bold block text-[9px] uppercase">Dues Overdue</span>
                          <span className="text-rose-700 font-extrabold">{pendingDuesCount} Overdue</span>
                        </div>
                        <div className="text-right">
                          <span className="text-rose-500 font-bold block text-[9px] uppercase">Pending Amount</span>
                          <span className="text-rose-700 font-extrabold">₹{pendingAmount?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5">
                        <span className="text-slate-400">Phone No:</span>
                        <b className="text-slate-700 font-mono">{loan.customer?.phone}</b>
                      </div>
                    </div>

                    {/* SECTION 25: Required Card Action Icons */}
                    <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      {/* Print */}
                      <button 
                        onClick={() => {
                          alert(`Printing full credit dossier packet for HP Contract ${loan.loanNo}`);
                          window.print();
                        }}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-indigo-600 rounded transition-all cursor-pointer"
                        title="Print Agreement"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button 
                        onClick={() => onViewLoan(loan.loanNo)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-amber-600 rounded transition-all cursor-pointer"
                        title="Edit Customer Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>

                      {/* Cancel */}
                      <button 
                        onClick={() => alert(`Cancel dossier lock operation initiated for ${loan.loanNo}`)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-rose-600 rounded transition-all cursor-pointer"
                        title="Force Cancel Dossier"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Shuffle */}
                      <button 
                        onClick={() => alert(`Shuffling and recalculating amortization parameters for ${loan.loanNo}`)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-indigo-600 rounded transition-all cursor-pointer"
                        title="Shuffle / Recalculate interest"
                      >
                        <Shuffle className="h-4 w-4" />
                      </button>

                      {/* Copy */}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(loan, null, 2));
                          alert(`Loan metadata payload copied to clipboard!`);
                        }}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-800 rounded transition-all cursor-pointer"
                        title="Copy JSON Payload"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      {/* Vehicle/bike icon */}
                      <button 
                        onClick={() => alert(`Collateral Vehicle Specifications:\nRC No: ${loan.vehicle?.rcNo}\nChassis No: ${loan.vehicle?.chassisNo}`)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-indigo-600 rounded transition-all cursor-pointer"
                        title="Vehicle Specs Sheet"
                      >
                        <Bike className="h-4 w-4 text-emerald-600" />
                      </button>

                      {/* RSS/feed icon */}
                      <button 
                        onClick={() => alert(`Retrieving real-time location and payment tracking webhook stream...`)}
                        className="p-1.5 hover:bg-white text-slate-500 hover:text-amber-500 rounded transition-all cursor-pointer"
                        title="RSS Event Logs"
                      >
                        <Rss className="h-4 w-4 text-amber-500 animate-pulse" />
                      </button>

                      {/* Book/ledger icon */}
                      <button 
                        onClick={() => onViewLoan(loan.loanNo)}
                        className="p-1.5 hover:bg-indigo-600 hover:text-white bg-indigo-50 text-indigo-700 rounded transition-all cursor-pointer"
                        title="Open Ledger Dossier"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {results.loans.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 bg-white border border-slate-200 rounded-xl italic">
                  No HP contract books match your search queries.
                </div>
              )}
            </div>
          ) : (
            
            /* SECTION 26: Customer Details — Table/List View (Alternate Columns) */
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th 
                        onClick={() => handleSort("loanNo")}
                        className="p-3 cursor-pointer hover:bg-slate-200 transition-all select-none w-28"
                      >
                        <div className="flex items-center gap-1">
                          Hpl {sortBy === "loanNo" && (sortOrder === "asc" ? "▲" : "▼")}
                          <ArrowUpDown className="h-2.5 w-2.5 text-slate-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("name")}
                        className="p-3 cursor-pointer hover:bg-slate-200 transition-all select-none"
                      >
                        <div className="flex items-center gap-1">
                          Name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                          <ArrowUpDown className="h-2.5 w-2.5 text-slate-400" />
                        </div>
                      </th>
                      <th className="p-3">Fin (Company + RC No)</th>
                      <th className="p-3 text-center w-16">Image</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center w-24">Actions</th>
                      <th className="p-3 font-mono">Phone No</th>
                      <th 
                        onClick={() => handleSort("amount")}
                        className="p-3 cursor-pointer hover:bg-slate-200 transition-all select-none text-right"
                      >
                        <div className="flex items-center gap-1 justify-end">
                          H.P Amount {sortBy === "amount" && (sortOrder === "asc" ? "▲" : "▼")}
                          <ArrowUpDown className="h-2.5 w-2.5 text-slate-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("date")}
                        className="p-3 cursor-pointer hover:bg-slate-200 transition-all select-none text-center"
                      >
                        <div className="flex items-center gap-1 justify-center">
                          H.P Date {sortBy === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                          <ArrowUpDown className="h-2.5 w-2.5 text-slate-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getSortedLoans().map((loan: any, idx: number) => {
                      // Alternate background column colors can be done with even:bg-slate-50 or custom classes
                      return (
                        <tr key={loan.loanNo} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/75"} hover:bg-indigo-50/40 transition-colors`}>
                          
                          {/* Hpl column */}
                          <td className="p-3 font-mono font-bold text-slate-950">
                            {loan.loanNo}
                          </td>

                          {/* Name column */}
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{loan.customer?.name}</div>
                            <div className="text-[10px] text-slate-400">S/O: {loan.customer?.fatherName || "N/A"}</div>
                          </td>

                          {/* Fin column: Finance Company + Vehicle No */}
                          <td className="p-3">
                            <div className="font-bold text-indigo-700 text-[11px] uppercase tracking-wide truncate max-w-[150px]">
                              {loan.companyName || "Xerova Auto Finance"}
                            </div>
                            <div className="font-mono text-slate-600 font-semibold">{loan.vehicle?.rcNo}</div>
                          </td>

                          {/* Image column: thumbnail */}
                          <td className="p-3 text-center">
                            <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300 mx-auto overflow-hidden flex items-center justify-center">
                              {loan.customer?.photoUrl ? (
                                <img src={loan.customer.photoUrl} alt="Party" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </td>

                          {/* Status column */}
                          <td className="p-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                              loan.status === LoanStatus.ACTIVE ? "bg-green-100 text-green-800" :
                              loan.status === LoanStatus.CLOSED ? "bg-slate-100 text-slate-600" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {loan.status}
                            </span>
                          </td>

                          {/* Action icons column */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => onViewLoan(loan.loanNo)}
                                className="p-1 hover:bg-indigo-100 rounded text-indigo-700"
                                title="Open Ledger View"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  alert(`Direct thermal print for ${loan.loanNo}`);
                                  window.print();
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                title="Print Receipt/Ledger"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(loan.loanNo);
                                  alert(`Loan number ${loan.loanNo} copied to clipboard!`);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                title="Copy Loan No"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Phone No column */}
                          <td className="p-3 font-mono font-medium text-slate-600">
                            {loan.customer?.phone}
                          </td>

                          {/* H.P Amount column */}
                          <td className="p-3 font-mono font-bold text-slate-900 text-right">
                            ₹{loan.loanAmount?.toLocaleString()}
                          </td>

                          {/* H.P Date column */}
                          <td className="p-3 font-mono text-slate-500 text-center">
                            {loan.hpDate || "2026-02-15"}
                          </td>
                        </tr>
                      );
                    })}
                    {results.loans.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 italic font-sans bg-white">
                          No HP contract ledgers matched the advanced query bounds.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pre-Loan Proposals Results */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Matching Pre-Loan Proposals ({results.preloans.length})</h3>
              <span className="text-[10px] text-amber-600 font-mono font-bold">Verification pipeline</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-3.5 py-2">Pre-Loan ID</th>
                    <th className="px-3.5 py-2">Applicant Name</th>
                    <th className="px-3.5 py-2">Vehicle Required</th>
                    <th className="px-3.5 py-2">Requested Loan</th>
                    <th className="px-3.5 py-2">Broker</th>
                    <th className="px-3.5 py-2">Risk Score</th>
                    <th className="px-3.5 py-2">Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.preloans.map((pl: any) => (
                    <tr key={pl.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2 font-mono text-slate-800 font-bold">{pl.serialNo}</td>
                      <td className="px-3.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-700">{pl.name}</p>
                            <p className="text-[10px] text-slate-400">{pl.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <p className="text-slate-700 font-semibold">{pl.vehicleName}</p>
                            <p className="text-[10px] text-slate-400">Val: ₹{pl.vehicleValue.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2 font-bold text-slate-800">₹{pl.requiredLoan.toLocaleString()}</td>
                      <td className="px-3.5 py-2 text-slate-500 font-medium">{pl.brokerName}</td>
                      <td className="px-3.5 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pl.riskScore > 75 ? "bg-green-50 text-green-700 border border-green-200" :
                          pl.riskScore > 50 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {pl.riskScore || 65}%
                        </span>
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200 font-bold font-mono">
                          {pl.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {results.preloans.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3.5 py-6 text-center text-slate-400 italic">
                        No pending proposals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
