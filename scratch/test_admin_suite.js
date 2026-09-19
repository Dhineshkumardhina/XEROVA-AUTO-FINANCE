/**
 * Test script for ERP Administration: Masters, Settings, Audit Logs, AI Finance Audit, and Shift Sessions
 */
const http = require("http");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE ADMINISTRATION A-TO-Z AUDIT SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(name, condition, details = "") {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} - Details: ${details}`);
    }
  }

  try {
    // 1. Get Masters
    console.log("\n--- Testing Sourcing Masters ---");
    const getMasters = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/masters",
      method: "GET"
    });
    assert("1. GET /api/masters returns 200 array", getMasters.status === 200 && Array.isArray(getMasters.data));

    // 2. Create Master
    const newMaster = {
      name: "Apex Yamaha Two-Wheelers Sourcing",
      category: "dealer",
      phone: "+91 98401 23456",
      commissionPct: "2.5"
    };
    const createMaster = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/masters",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, newMaster);
    assert("2. POST /api/masters creates new dealer", createMaster.status === 201 && createMaster.data.id && createMaster.data.name === newMaster.name);
    const createdMasterId = createMaster.data?.id;

    // 3. Delete Master
    if (createdMasterId) {
      const deleteMaster = await request({
        hostname: "localhost",
        port: 3000,
        path: `/api/masters/${createdMasterId}`,
        method: "DELETE"
      });
      assert("3. DELETE /api/masters/:id succeeds", deleteMaster.status === 200 && deleteMaster.data.success);
    }

    // 4. Settings GET & PUT
    console.log("\n--- Testing Global Parameters Settings ---");
    const getSettings = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/settings",
      method: "GET"
    });
    assert("4. GET /api/settings returns settings object", getSettings.status === 200 && typeof getSettings.data === "object");

    const updatedSettings = {
      companyName: "XEROVA AUTO FINANCE & LEASING PVT LTD",
      branchCode: "MDU-HQ-001",
      defaultInterestRate: 15.5,
      overduePenaltyPerDay: 120,
      gracePeriodDays: 7,
      smsGateway: "Twilio Global SMS API"
    };
    const putSettings = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/settings",
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    }, updatedSettings);
    assert("5. PUT /api/settings commits updates", putSettings.status === 200 && putSettings.data.success);

    const getSettingsAfter = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/settings",
      method: "GET"
    });
    assert("6. GET /api/settings verifies persisted changes", 
      getSettingsAfter.data.companyName === updatedSettings.companyName &&
      Number(getSettingsAfter.data.defaultInterestRate) === 15.5 &&
      getSettingsAfter.data.smsGateway === "Twilio Global SMS API"
    );

    // 5. Employee Shift Sessions
    console.log("\n--- Testing Staff Shift Sessions ---");
    const createSession = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/employee/sessions",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      userId: "usr-admin-1",
      name: "Suresh Kumar",
      username: "suresh.admin",
      role: "Super Admin",
      loginTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // logged in 4 hours ago
    });
    assert("7. POST /api/employee/sessions starts active shift", createSession.status === 201 && createSession.data.status === "ACTIVE");
    const sessionId = createSession.data?.id;

    // Clock out shift session
    if (sessionId) {
      const clockOut = await request({
        hostname: "localhost",
        port: 3000,
        path: `/api/employee/sessions/${sessionId}/logout`,
        method: "POST"
      });
      assert("8. POST /api/employee/sessions/:id/logout ends shift", 
        clockOut.status === 200 && 
        clockOut.data.status === "CLOSED" && 
        Boolean(clockOut.data.logoutTime) &&
        Boolean(clockOut.data.duration)
      );
      console.log(`   Session duration recorded: ${clockOut.data?.duration}`);
    }

    // 6. AI Financial Audit
    console.log("\n--- Testing AI Financial Audit ---");
    const aiAudit = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/ai/finance-audit",
      method: "POST"
    });
    assert("9. POST /api/ai/finance-audit executes successfully", aiAudit.status === 200 && aiAudit.data);
    assert("10. AI audit output has UI-compatible verdict and opinion",
      Boolean(aiAudit.data?.auditorVerdict) && 
      aiAudit.data?.integrityScore !== undefined &&
      Boolean(aiAudit.data?.auditorCertifiedOpinion) &&
      Array.isArray(aiAudit.data?.anomaliesFound)
    );
    console.log(`   Auditor Verdict: ${aiAudit.data?.auditorVerdict}, Integrity Score: ${aiAudit.data?.integrityScore}`);

    // 7. Audit Logs
    console.log("\n--- Testing Audit Logs & Security Trails ---");
    const getAuditLogs = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/audit-logs",
      method: "GET"
    });
    assert("11. GET /api/audit-logs returns log entries", getAuditLogs.status === 200 && Array.isArray(getAuditLogs.data));
    const actions = getAuditLogs.data?.map(l => l.action) || [];
    assert("12. Audit log recorded administrative actions", 
      actions.includes("SETTINGS_UPDATED") || 
      actions.includes("CREATE_MASTER") || 
      actions.includes("USER_LOGIN") ||
      actions.includes("SYSTEM_FINANCIAL_AUDIT")
    );

    console.log(`\n================================`);
    console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
    console.log(`================================`);
  } catch (err) {
    console.error("Test runner error:", err);
  }
}

runTests();
