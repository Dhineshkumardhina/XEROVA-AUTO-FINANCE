import { Router } from "express";
import { 
  MasterModel, 
  UserModel, 
  CustomerModel, 
  SettingModel, 
  AuditLogModel, 
  LoanModel, 
  ReceiptModel, 
  SeizedVehicleModel,
  EmployeeSessionModel
} from "@xerova/database";

const router = Router();

// 1. Sourcing Masters
router.get("/masters", async (req, res) => {
  try {
    const list = await MasterModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching masters" });
  }
});

router.post("/masters", async (req, res) => {
  try {
    const body = req.body;
    const item = await MasterModel.create({
      ...body,
      id: body.id || `MST-${Date.now().toString().slice(-5)}`
    });
    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Admin",
      action: "CREATE_MASTER",
      details: `Created master directory entity: ${item.name} (${item.category || "dealer"})`
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Error creating master" });
  }
});

router.delete("/masters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterModel.findOneAndDelete({ id });
    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Admin",
      action: "DELETE_MASTER",
      details: `Deleted master entity: ${deleted?.name || id}`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error deleting master" });
  }
});

// 2. Staff Users
router.get("/users", async (req, res) => {
  try {
    const list = await UserModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// 3. Customers (Borrowers)
router.get("/customers", async (req, res) => {
  try {
    const list = await CustomerModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching customers" });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const body = req.body;
    const item = await CustomerModel.create({
      ...body,
      id: body.id || `CUST-${Date.now().toString().slice(-4)}`
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Error creating customer profile" });
  }
});

// 4. System Settings
router.get("/settings", async (req, res) => {
  try {
    const list = await SettingModel.find();
    const map: any = {};
    list.forEach((s) => { map[s.key] = s.value; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: "Error fetching settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const body = req.body;
    for (const key of Object.keys(body)) {
      await SettingModel.findOneAndUpdate(
        { key },
        { value: body[key] },
        { upsert: true, new: true }
      );
    }
    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Admin",
      action: "SETTINGS_UPDATED",
      details: "Global ERP parameters and financial metrics updated."
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error updating settings" });
  }
});

// 5. Audit Logs
router.get("/audit-logs", async (req, res) => {
  try {
    const list = await AuditLogModel.find().sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching audit trails" });
  }
});

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 6. Global Search
router.get("/search", async (req, res) => {
  try {
    const rawQ = typeof req.query.q === "string" ? req.query.q : "";
    const q = rawQ.trim();
    if (!q) {
      const [loans, customers, receipts, seized] = await Promise.all([
        LoanModel.find().sort({ createdAt: -1 }).limit(50),
        CustomerModel.find().sort({ createdAt: -1 }).limit(50),
        ReceiptModel.find().sort({ createdAt: -1 }).limit(50),
        SeizedVehicleModel.find().sort({ createdAt: -1 }).limit(50)
      ]);
      return res.json({ loans, customers, receipts, seized });
    }

    const escaped = escapeRegExp(q);
    const regex = new RegExp(escaped, "i");

    const [loans, customers, receipts, seized] = await Promise.all([
      LoanModel.find({ $or: [{ loanNo: regex }, { "customer.name": regex }, { "vehicle.rcNo": regex }] }).limit(10),
      CustomerModel.find({ $or: [{ name: regex }, { phone: regex }, { panNo: regex }] }).limit(10),
      ReceiptModel.find({ $or: [{ receiptNo: regex }, { customerName: regex }] }).limit(10),
      SeizedVehicleModel.find({ $or: [{ rcNo: regex }, { customerName: regex }] }).limit(10)
    ]);

    res.json({ loans, customers, receipts, seized });
  } catch (err) {
    res.status(500).json({ error: "Error performing global search" });
  }
});

// 7. Employee Sessions (accessible at /api/employee/sessions)
router.get("/employee/sessions", async (req, res) => {
  try {
    const sessions = await EmployeeSessionModel.find().sort({ createdAt: -1 }).limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Error fetching session logs" });
  }
});

router.post("/employee/sessions", async (req, res) => {
  try {
    const { userId, name, username, role, loginTime, logoutTime } = req.body;
    let duration = req.body.duration || null;
    if (!duration && loginTime && logoutTime) {
      const diffMins = Math.round((new Date(logoutTime).getTime() - new Date(loginTime).getTime()) / (1000 * 60));
      if (diffMins > 0) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
      } else {
        duration = "1 min";
      }
    }

    const session = await EmployeeSessionModel.create({
      ...req.body,
      id: req.body.id || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sessionId: req.body.sessionId || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: userId || "usr-1",
      name: name || username || "Staff Member",
      username: username || name || "staff",
      role: role || "Staff Operator",
      loginTime: loginTime || new Date().toISOString(),
      logoutTime: logoutTime || null,
      duration,
      status: logoutTime ? "CLOSED" : "ACTIVE",
      ipAddress: req.ip || "127.0.0.1"
    });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: session.name,
      action: "USER_LOGIN",
      details: `Shift Attendance Logged: ${session.name} (${session.role}) - ${session.status === "ACTIVE" ? "Continuous On-Shift" : "Completed Shift: " + session.duration}`
    });

    res.status(201).json(session);
  } catch (err) {
    console.error("[Sessions] Error creating session:", err);
    res.status(500).json({ error: "Error creating employee session record" });
  }
});

router.post("/employee/sessions/:id/logout", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await EmployeeSessionModel.findOne({ $or: [{ id }, { sessionId: id }] });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const now = new Date().toISOString();
    session.logoutTime = now;
    session.status = "CLOSED";

    if (session.loginTime) {
      const diffMins = Math.round((new Date(now).getTime() - new Date(session.loginTime).getTime()) / (1000 * 60));
      if (diffMins > 0) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        session.duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
      } else {
        session.duration = "1 min";
      }
    }
    await session.save();

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: now,
      user: session.name || session.username || "Staff",
      action: "USER_LOGOUT",
      details: `Shift Clocked Out: ${session.name || session.username} (${session.role}). Total Shift Duration: ${session.duration}`
    });

    res.json(session);
  } catch (err) {
    console.error("[Sessions] Error clocking out:", err);
    res.status(500).json({ error: "Error logging out session" });
  }
});

export default router;
