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
    next();
  } catch (err) {
    console.error("[Backend] DB connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
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
