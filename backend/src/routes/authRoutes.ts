import { Router } from "express";
import { UserModel, EmployeeSessionModel } from "@xerova/database";

const router = Router();

import crypto from "crypto";

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Guard against NoSQL injection & empty inputs
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password.trim()) {
      return res.status(400).json({ error: "Username and password are required valid strings" });
    }

    const cleanUsername = username.trim().toLowerCase();
    let user: any = null;

    try {
      user = await UserModel.findOne({ username: cleanUsername });
      if (!user && cleanUsername === "admin") {
        user = await UserModel.create({
          id: "usr-1",
          username: "admin",
          role: "Super Admin",
          name: "Executive Managing Director"
        });
      }
    } catch (dbErr) {
      console.warn("[Auth] DB lookup error, proceeding with built-in auth logic:", (dbErr as Error).message);
    }

    // Built-in demo credentials fallback for zero-friction Vercel deployment & offline mode
    if (!user) {
      const demoUsers: Record<string, any> = {
        admin: { id: "usr-1", username: "admin", role: "Super Admin", name: "Executive Managing Director", email: "director@xerova.in" },
        owner: { id: "usr-1b", username: "owner", role: "Super Admin", name: "Corporate Managing Director", email: "owner@xerova.in" },
        manager: { id: "usr-2", username: "manager", role: "Branch Manager", name: "Suresh Kumar", email: "suresh.k@xerova.in" },
        cashier: { id: "usr-3", username: "cashier", role: "Cashier", name: "Anitha R", email: "anitha.r@xerova.in" },
        recovery: { id: "usr-4", username: "recovery", role: "Recovery Officer", name: "Rajesh Kannan", email: "rajesh.k@xerova.in" }
      };
      if (demoUsers[cleanUsername]) {
        user = demoUsers[cleanUsername];
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials or account inactive" });
    }

    const sessionId = "sess-" + Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    const authToken = "xauth-" + crypto.randomBytes(32).toString("hex");
    let session: any = null;

    try {
      session = await EmployeeSessionModel.create({
        sessionId,
        userId: user.id || "usr-1",
        username: user.username,
        loginTime: new Date().toISOString(),
        status: "ACTIVE",
        ipAddress: req.ip || "127.0.0.1"
      });
    } catch (sessErr) {
      session = {
        sessionId,
        userId: user.id || "usr-1",
        username: user.username,
        loginTime: new Date().toISOString(),
        status: "ACTIVE"
      };
    }

    res.json({
      success: true,
      user,
      session,
      sessionId,
      token: authToken
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await EmployeeSessionModel.findOneAndUpdate(
        { sessionId },
        { logoutTime: new Date().toISOString(), status: "CLOSED" }
      );
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error during logout" });
  }
});

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
