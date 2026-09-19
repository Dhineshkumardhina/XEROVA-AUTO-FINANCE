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
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Error creating master" });
  }
});

router.delete("/masters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await MasterModel.findOneAndDelete({ id });
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
    const { userId, username, loginTime, logoutTime } = req.body;
    const session = await EmployeeSessionModel.create({
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: userId || "usr-1",
      username: username || "staff",
      loginTime: loginTime || new Date().toISOString(),
      logoutTime: logoutTime || null,
      status: logoutTime ? "CLOSED" : "ACTIVE",
      ipAddress: req.ip || "127.0.0.1"
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: "Error creating employee session record" });
  }
});

export default router;
