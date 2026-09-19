import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, UserModel, MasterModel, SettingModel, AuditLogModel } from "@xerova/database";

// Routes
import authRoutes from "./routes/authRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import preloanRoutes from "./routes/preloanRoutes.js";
import consultancyRoutes from "./routes/consultancyRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

export const app = express();

// Security & Request Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: origin not allowed"));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

let dbInitPromise: Promise<void> | null = null;

export async function initDB(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDB();
      try {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
          console.log("[Backend] Empty database detected. Auto-seeding default ERP data...");
          await UserModel.create([
            { id: "usr-1", username: "admin", role: "Super Admin", name: "Executive Managing Director", email: "director@xerova.in", phone: "+91 98421 00001" },
            { id: "usr-2", username: "manager", role: "Branch Manager", name: "Suresh Kumar", email: "suresh.k@xerova.in", phone: "+91 98421 00002" },
            { id: "usr-3", username: "cashier", role: "Cashier", name: "Anitha R", email: "anitha.r@xerova.in", phone: "+91 98421 00003" },
            { id: "usr-4", username: "officer", role: "Recovery Officer", name: "Rajesh Kannan", email: "rajesh.k@xerova.in", phone: "+91 98421 00004" }
          ]);
          await MasterModel.create([
            { id: "dlr-101", name: "Supreme Honda, Katpadi West", category: "dealer", phone: "+91 98400 11223", commissionPct: 2.5 },
            { id: "dlr-102", name: "Vellore Motors (Hero & Bajaj)", category: "dealer", phone: "+91 98400 33445", commissionPct: 2.0 },
            { id: "dlr-103", name: "Sri Murugan Autos, Ranipet", category: "dealer", phone: "+91 98400 55667", commissionPct: 3.0 },
            { id: "brk-201", name: "K. Senthil Nathan (Auto Broker)", category: "broker", phone: "+91 94431 88990", commissionPct: 1.5 },
            { id: "brk-202", name: "M. Abdul Rahman (Direct Agent)", category: "broker", phone: "+91 94432 77889", commissionPct: 2.0 },
            { id: "are-301", name: "Vellore North & Gandhinagar", category: "area", phone: "N/A" },
            { id: "are-302", name: "Katpadi & VIT University Zone", category: "area", phone: "N/A" },
            { id: "are-303", name: "Sathuvachari & Collectorate Area", category: "area", phone: "N/A" }
          ]);
          await SettingModel.create([
            { key: "companyName", value: "XEROVA AUTO FINANCE & LEASING" },
            { key: "branchCode", value: "MADURAI-#01" },
            { key: "defaultInterestRate", value: 16.5 },
            { key: "overduePenaltyPerDay", value: 100 },
            { key: "gracePeriodDays", value: 5 }
          ]);
          await AuditLogModel.create({
            id: "LOG-" + Date.now(),
            timestamp: new Date().toISOString(),
            user: "SYSTEM_BOOT",
            action: "DATABASE_INITIALIZED",
            details: "Auto-initialized database with default staff, dealers, and corporate parameters."
          });
          console.log("[Backend] Auto-seed completed successfully!");
        }
      } catch (seedErr) {
        console.error("[Backend] Error during auto-seeding:", seedErr);
      }
    })();
  }
  return dbInitPromise;
}

// DB connection middleware for all API requests
app.use(async (req, res, next) => {
  try {
    await initDB();
  } catch (err) {
    console.warn("[Backend DB Middleware Warning]", (err as Error).message);
  }
  next();
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/preloans", preloanRoutes);
app.use("/api/consultancies", consultancyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", masterRoutes);
app.use("/api", financeRoutes);

// Root & Health check endpoints
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    res.setHeader("Content-Type", "text/html");
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XEROVA Auto Finance - API Server</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #090d16 100%);
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(99, 102, 241, 0.25);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15);
            border-radius: 20px;
            max-width: 620px;
            width: 100%;
            padding: 36px;
            backdrop-filter: blur(12px);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.35);
            color: #34d399;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .pulse {
            width: 8px;
            height: 8px;
            background: #34d399;
            border-radius: 50%;
            box-shadow: 0 0 10px #34d399;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
          }
          h1 {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 16px;
            letter-spacing: -0.02em;
          }
          p.subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin-top: 6px;
            line-height: 1.5;
          }
          .cta-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            padding: 14px 20px;
            border-radius: 12px;
            margin-top: 24px;
            transition: all 0.2s ease;
            box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.5);
          }
          .cta-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 24px -5px rgba(79, 70, 229, 0.7);
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 24px;
          }
          .stat {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(51, 65, 85, 0.5);
            border-radius: 12px;
            padding: 12px 16px;
          }
          .stat-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .stat-value {
            font-size: 14px;
            color: #f1f5f9;
            font-weight: 600;
            margin-top: 4px;
            font-family: 'JetBrains Mono', monospace;
          }
          .endpoints-list {
            margin-top: 20px;
            border-top: 1px solid rgba(51, 65, 85, 0.6);
            padding-top: 16px;
          }
          .endpoints-list h3 {
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .endpoint-tag {
            display: inline-block;
            background: #1e293b;
            color: #818cf8;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 6px;
            margin: 3px 4px 3px 0;
            text-decoration: none;
            border: 1px solid #334155;
          }
          .endpoint-tag:hover {
            border-color: #6366f1;
            color: #c7d2fe;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">
            <span class="pulse"></span>
            Server Online &amp; Ready
          </div>
          <h1>XEROVA Auto Finance API</h1>
          <p class="subtitle">Backend REST API server with embedded PostgreSQL database engine is running smoothly.</p>

          <a href="http://localhost:5173" class="cta-btn">
            Open Frontend Application &rarr;
          </a>

          <div class="grid">
            <div class="stat">
              <div class="stat-label">API Port</div>
              <div class="stat-value">3000 (HTTP)</div>
            </div>
            <div class="stat">
              <div class="stat-label">Database</div>
              <div class="stat-value">PGlite (Active)</div>
            </div>
            <div class="stat">
              <div class="stat-label">Status</div>
              <div class="stat-value" style="color: #34d399;">200 OK</div>
            </div>
            <div class="stat">
              <div class="stat-label">Server Time</div>
              <div class="stat-value">${new Date().toISOString().split("T")[1].slice(0, 8)} UTC</div>
            </div>
          </div>

          <div class="endpoints-list">
            <h3>Key API Endpoints</h3>
            <a href="/health" class="endpoint-tag">GET /health</a>
            <a href="/api/loans" class="endpoint-tag">GET /api/loans</a>
            <a href="/api/customers" class="endpoint-tag">GET /api/customers</a>
            <a href="/api/receipts" class="endpoint-tag">GET /api/receipts</a>
            <a href="/api/masters" class="endpoint-tag">GET /api/masters</a>
            <a href="/api/settings" class="endpoint-tag">GET /api/settings</a>
            <a href="/api/audit-logs" class="endpoint-tag">GET /api/audit-logs</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    status: "OK",
    service: "XEROVA Auto Finance API Server",
    port: 3000,
    database: "CONNECTED",
    frontend: "http://localhost:5173",
    timestamp: new Date().toISOString()
  });
});

app.get("/api", (req, res) => {
  res.json({
    status: "OK",
    service: "XEROVA Auto Finance API Server",
    endpoints: [
      "/api/auth/login",
      "/api/loans",
      "/api/customers",
      "/api/receipts",
      "/api/preloans",
      "/api/consultancies",
      "/api/masters",
      "/api/settings",
      "/api/audit-logs",
      "/api/employee/sessions"
    ]
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), service: "XEROVA Auto Finance API Server" });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), service: "XEROVA Auto Finance API Server" });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Backend Global Error]", err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : (err.message || "An unexpected error occurred")
  });
});

export default app;
