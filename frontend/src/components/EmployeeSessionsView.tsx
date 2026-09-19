import React, { useState, useEffect } from "react";
import { Users, Search, Printer, Clock, Activity, RefreshCw, SlidersHorizontal, CheckCircle2 } from "lucide-react";

export default function EmployeeSessionsView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Manual session logging state
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loginDate, setLoginDate] = useState(new Date().toISOString().split("T")[0]);
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutDate, setLogoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [logoutTime, setLogoutTime] = useState("18:00");
  const [isStillOnShift, setIsStillOnShift] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Filter logic
  const filteredSessions = sessions.filter((sess) => {
    const matchesSearch = 
      sess.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sess.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sess.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = 
      roleFilter === "ALL" || 
      sess.role?.toUpperCase() === roleFilter.toUpperCase() ||
      (roleFilter === "ADMIN" && (sess.role === "Super Admin" || sess.role === "Owner")) ||
      (roleFilter === "EMPLOYEE" && sess.role !== "Super Admin" && sess.role !== "Owner");

    const matchesStatus = 
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !sess.logoutTime) ||
      (statusFilter === "COMPLETED" && sess.logoutTime);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Analytics Calculations
  const totalShifts = sessions.length;
  const activeShifts = sessions.filter((s) => !s.logoutTime).length;
  const uniqueOperators = new Set(sessions.map((s) => s.username)).size;
  
  // Average completed shift duration calculation in minutes
  const completedShifts = sessions.filter((s) => s.logoutTime);
  let avgDurationStr = "—";
  if (completedShifts.length > 0) {
    const totalMins = completedShifts.reduce((acc, s) => {
      const start = new Date(s.loginTime).getTime();
      const end = new Date(s.logoutTime).getTime();
      return acc + Math.round((end - start) / (1000 * 60));
    }, 0);
    const avgMins = Math.round(totalMins / completedShifts.length);
    if (avgMins < 60) {
      avgDurationStr = `${avgMins} mins`;
    } else {
      const hrs = Math.floor(avgMins / 60);
      const remainingMins = avgMins % 60;
      avgDurationStr = `${hrs}h ${remainingMins}m`;
    }
  }

  const handleSubmitManualShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!selectedUserId) {
      setErrorMsg("Please select a staff member profile.");
      return;
    }

    const matchedUser = users.find((u) => u.id === selectedUserId);
    if (!matchedUser) {
      setErrorMsg("Invalid staff member selected.");
      return;
    }

    const loginDateTimeStr = new Date(`${loginDate}T${loginTime}:00`).toISOString();
    let logoutDateTimeStr = null;
    if (!isStillOnShift) {
      logoutDateTimeStr = new Date(`${logoutDate}T${logoutTime}:00`).toISOString();
      if (new Date(logoutDateTimeStr).getTime() <= new Date(loginDateTimeStr).getTime()) {
        setErrorMsg("Shift end time must be after shift start time.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: matchedUser.id,
          name: matchedUser.name,
          username: matchedUser.username,
          role: matchedUser.role,
          loginTime: loginDateTimeStr,
          logoutTime: logoutDateTimeStr
        })
      });

      if (res.ok) {
        setSuccessMsg("Manual login-logout timing entry created successfully!");
        setShowForm(false);
        setSelectedUserId("");
        setLoginDate(new Date().toISOString().split("T")[0]);
        setLoginTime("09:00");
        setLogoutDate(new Date().toISOString().split("T")[0]);
        setLogoutTime("18:00");
        setIsStillOnShift(false);
        fetchSessions();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to log manual shift timing.");
      }
    } catch (err) {
      setErrorMsg("Network error saving manual shift timing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/sessions/${id}/logout`, { method: "POST" });
      if (res.ok) {
        fetchSessions();
        setSuccessMsg("Staff member clocked out successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to clock out session.");
      }
    } catch (err) {
      setErrorMsg("Network error clocking out shift session.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-xl p-5 shadow-sm gap-4 no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Users className="h-4 w-4 text-indigo-600" /> Employee Shift Attendance & Sessions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Real-time shift log, login-logout details, active session tracking, and compliance reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5" />
            {showForm ? "Cancel Manual Shift" : "Record Shift Entry"}
          </button>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 disabled:opacity-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Manual Login/Logout Shift timing entry Form */}
      {showForm && (
        <form onSubmit={handleSubmitManualShift} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in no-print">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-600" /> Record Manual Shift Timing Entry
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Enter official login and logout times for back-office or field staff attendance ledger logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Staff member dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Staff Member</label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="">-- Choose Profile --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) - ID: {u.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Login Date */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Start Date (Login)</label>
              <input
                type="date"
                required
                value={loginDate}
                onChange={(e) => setLoginDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-medium"
              />
            </div>

            {/* Login Time */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Start Time (Login)</label>
              <input
                type="time"
                required
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-medium"
              />
            </div>

            {/* On Shift Checkbox */}
            <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="isStillOnShift"
                checked={isStillOnShift}
                onChange={(e) => setIsStillOnShift(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isStillOnShift" className="text-xs text-slate-600 font-semibold cursor-pointer">
                Employee is currently active and still on shift (leave Shift End / Logout blank)
              </label>
            </div>

            {!isStillOnShift && (
              <>
                {/* Logout Date */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift End Date (Logout)</label>
                  <input
                    type="date"
                    required={!isStillOnShift}
                    value={logoutDate}
                    onChange={(e) => setLogoutDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                </div>

                {/* Logout Time */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift End Time (Logout)</label>
                  <input
                    type="time"
                    required={!isStillOnShift}
                    value={logoutTime}
                    onChange={(e) => setLogoutTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                </div>
              </>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Logging timing..." : "Save Timing Entry"}
            </button>
          </div>
        </form>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold animate-fade-in no-print">
          {successMsg}
        </div>
      )}

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Shifts</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{totalShifts}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg relative">
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Shifts</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{activeShifts} Online</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Session</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{avgDurationStr}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Staff Members</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{uniqueOperators} Active</p>
          </div>
        </div>
      </div>

      {/* Filter & Table block */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden no-print">
        {/* Filters bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff name, ID, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 font-semibold font-mono text-[10px] uppercase">
              <SlidersHorizontal className="h-3 w-3" /> Filters:
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Super Admin / Owner</option>
              <option value="EMPLOYEE">Employees Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Shifts (Online)</option>
              <option value="COMPLETED">Completed Shifts</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-wider font-mono border-b border-slate-200">
                <th className="px-5 py-3.5 font-bold">Staff Member details</th>
                <th className="px-5 py-3.5 font-bold">Designated Role</th>
                <th className="px-5 py-3.5 font-bold">Shift Start (Login)</th>
                <th className="px-5 py-3.5 font-bold">Shift End (Logout)</th>
                <th className="px-5 py-3.5 font-bold">Total Duration</th>
                <th className="px-5 py-3.5 font-bold text-right">Activity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 font-medium">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-mono">
                    No active or historical shift sessions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const initials = sess.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2) || "ST";
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{sess.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Staff ID: {sess.userId} • Username: {sess.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sess.role === "Super Admin" || sess.role === "Owner"
                            ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                            : "bg-amber-50 border border-amber-200 text-amber-700"
                        }`}>
                          {sess.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {formatTime(sess.loginTime)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {sess.logoutTime ? formatTime(sess.logoutTime) : <span className="text-slate-400 italic">Continuous Shift</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                        {sess.duration || <span className="text-green-600 font-bold animate-pulse">Running...</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!sess.logoutTime ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Active On-Shift
                            </span>
                            <button
                              onClick={() => handleClockOut(sess.id)}
                              className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1 rounded text-[9px] font-bold font-mono transition-colors cursor-pointer"
                              title="End staff shift immediately"
                            >
                              Clock Out
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
                            Shift Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Formatted Print Block */}
      <div className="hidden printable-print-block">
        <div className="text-center border-b-2 border-double border-slate-900 pb-4">
          <p className="font-sans font-bold text-lg uppercase tracking-wider text-black">XEROVA AUTO FINANCE LIMITED</p>
          <p className="text-[10px] font-mono uppercase mt-0.5">Corporate Branch Madurai • Shift Attendance Audit Summary Report</p>
          <p className="text-[9px] font-mono mt-1 text-slate-600">Generated on: {new Date().toLocaleString("en-IN")}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 border-b border-slate-300 py-3 my-4 text-[10px]">
          <div>
            <span className="font-bold">Total Shift Records: </span>
            <span className="font-mono">{totalShifts}</span>
          </div>
          <div>
            <span className="font-bold">Active Operators: </span>
            <span className="font-mono">{activeShifts}</span>
          </div>
          <div>
            <span className="font-bold">Staff Coverage count: </span>
            <span className="font-mono">{uniqueOperators} members</span>
          </div>
        </div>

        <table className="w-full text-left text-[10px] border-collapse mt-4">
          <thead>
            <tr className="border-b-2 border-slate-900 text-black uppercase font-bold font-mono">
              <th className="py-2">Staff ID & Name</th>
              <th className="py-2">Designation</th>
              <th className="py-2">Shift Start</th>
              <th className="py-2">Shift End</th>
              <th className="py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-medium">
            {filteredSessions.map((sess) => (
              <tr key={sess.id} className="py-2">
                <td className="py-2 font-bold text-black">
                  {sess.name} <span className="font-mono text-[8px] font-normal text-slate-600">({sess.userId})</span>
                </td>
                <td className="py-2 font-mono uppercase">{sess.role}</td>
                <td className="py-2 font-mono">{formatTime(sess.loginTime)}</td>
                <td className="py-2 font-mono">{sess.logoutTime ? formatTime(sess.logoutTime) : "ON-SHIFT ACTIVE"}</td>
                <td className="py-2 text-right font-bold font-mono">{sess.duration || "RUNNING"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 pt-8 border-t border-dashed border-slate-400 grid grid-cols-2 text-[10px]">
          <div>
            <p className="font-bold">Audited & Certified By:</p>
            <div className="h-10 mt-2 border-b border-slate-400 w-44"></div>
            <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600 font-mono">Chief Security Officer / Auditor</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Verified Executive Signature:</p>
            <div className="h-10 mt-2 border-b border-slate-400 w-44 ml-auto"></div>
            <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600 font-mono">System Administrator</p>
          </div>
        </div>
      </div>

    </div>
  );
}
