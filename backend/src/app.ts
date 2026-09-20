import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { 
  connectDB, 
  UserModel, 
  MasterModel, 
  SettingModel, 
  AuditLogModel,
  CustomerModel,
  LoanModel,
  ReceiptModel,
  PreLoanModel,
  ConsultancyModel,
  SeizedVehicleModel,
  DepositModel,
  HandLoanModel
} from "@xerova/database";

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
    if (
      !origin || 
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.includes("vercel.app") || 
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      process.env.NODE_ENV !== "production"
    ) {
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

          // Seed Customers
          await CustomerModel.create([
            {
              id: "CUST-1001",
              name: "M. Ramesh Kumar",
              phone: "+91 98421 55667",
              address: "No. 14, Gandhi Road, Sathuvachari",
              city: "Vellore",
              state: "Tamil Nadu",
              pincode: "632009",
              panNo: "ABCDE1234F",
              aadhaarNo: "4567 8901 2345",
              occupation: "Transport Business",
              monthlyIncome: 45000,
              guarantors: [{ name: "P. Murugan", phone: "+91 98421 88990", address: "Gandhi Road, Vellore" }]
            },
            {
              id: "CUST-1002",
              name: "K. Priya Dharshini",
              phone: "+91 94432 11223",
              address: "Plot 8A, Phase 2, TNHB",
              city: "Katpadi",
              state: "Tamil Nadu",
              pincode: "632014",
              panNo: "FGHIJ5678K",
              aadhaarNo: "7890 1234 5678",
              occupation: "Software Professional",
              monthlyIncome: 68000,
              guarantors: [{ name: "K. Karthikeyan", phone: "+91 94432 99001", address: "TNHB Katpadi" }]
            },
            {
              id: "CUST-1003",
              name: "S. Arumugam",
              phone: "+91 97890 33445",
              address: "12/4 Bazaar Street",
              city: "Ranipet",
              state: "Tamil Nadu",
              pincode: "632401",
              panNo: "KLMNO9012P",
              aadhaarNo: "2345 6789 0123",
              occupation: "Dairy Farming & Milk Supply",
              monthlyIncome: 35000
            },
            {
              id: "CUST-1004",
              name: "G. Venkatesh",
              phone: "+91 98944 66778",
              address: "45 Anna Salai",
              city: "Vellore",
              state: "Tamil Nadu",
              pincode: "632001",
              panNo: "QRSTU3456V",
              aadhaarNo: "9012 3456 7890",
              occupation: "Retail Merchant",
              monthlyIncome: 52000
            }
          ]);

          // Helper for realistic installments
          const buildInstallments = (count: number, emi: number, startYear: number, startMonth: number, paidCount: number, rcpPrefix: number) => {
            const list = [];
            for (let i = 1; i <= count; i++) {
              const d = new Date(startYear, startMonth - 1 + (i - 1), 10);
              const dueDate = d.toISOString().split("T")[0];
              const isPaid = i <= paidCount;
              list.push({
                instNo: i,
                dueDate,
                emiAmount: emi,
                principalPart: Math.round(emi * 0.75),
                interestPart: Math.round(emi * 0.25),
                status: isPaid ? ("PAID" as const) : ("PENDING" as const),
                paidAmount: isPaid ? emi : 0,
                paidDate: isPaid ? dueDate : undefined,
                receiptNo: isPaid ? `RCP-${rcpPrefix + i}` : undefined
              });
            }
            return list;
          };

          // Seed Loans
          await LoanModel.create([
            {
              loanNo: "LN-2025-001",
              borrowerId: "CUST-1001",
              customer: { id: "CUST-1001", name: "M. Ramesh Kumar", phone: "+91 98421 55667" },
              vehicle: { vehicleName: "Honda Activa 6G 110cc", rcNo: "TN 23 BK 4092", engineNo: "JF91E881290", chassisNo: "ME4JF913LK10239", modelYear: "2023" },
              loanAmount: 65000,
              interestRate: 16.5,
              durationMonths: 18,
              emiAmount: 4104,
              totalDueAmount: 73872,
              totalPaidAmount: 8208,
              pendingAmount: 65664,
              disbursementDate: "2025-01-10",
              status: "ACTIVE",
              installments: buildInstallments(18, 4104, 2025, 2, 2, 8800)
            },
            {
              loanNo: "LN-2025-002",
              borrowerId: "CUST-1002",
              customer: { id: "CUST-1002", name: "K. Priya Dharshini", phone: "+91 94432 11223" },
              vehicle: { vehicleName: "TVS Jupiter 125 Disc", rcNo: "TN 23 CF 8104", engineNo: "TVSJ125E4402", chassisNo: "MD626AJ19PC0492", modelYear: "2024" },
              loanAmount: 85000,
              interestRate: 15.0,
              durationMonths: 24,
              emiAmount: 4124,
              totalDueAmount: 98976,
              totalPaidAmount: 4124,
              pendingAmount: 94852,
              disbursementDate: "2025-02-15",
              status: "ACTIVE",
              installments: buildInstallments(24, 4124, 2025, 3, 1, 8802)
            },
            {
              loanNo: "LN-2024-003",
              borrowerId: "CUST-1003",
              customer: { id: "CUST-1003", name: "S. Arumugam", phone: "+91 97890 33445" },
              vehicle: { vehicleName: "Bajaj Pulsar 150 Neon", rcNo: "TN 73 H 2948", engineNo: "DHGBNA33091", chassisNo: "MD2A11CY7NP8402", modelYear: "2022" },
              loanAmount: 70000,
              interestRate: 18.0,
              durationMonths: 12,
              emiAmount: 6417,
              totalDueAmount: 77004,
              totalPaidAmount: 77004,
              pendingAmount: 0,
              disbursementDate: "2024-03-01",
              status: "CLOSED",
              installments: buildInstallments(12, 6417, 2024, 4, 12, 8700)
            }
          ]);

          // Seed Receipts
          await ReceiptModel.create([
            {
              receiptNo: "RCP-8801",
              loanNo: "LN-2025-001",
              customerName: "M. Ramesh Kumar",
              amount: 4104,
              paymentMode: "UPI",
              referenceNo: "UPI/390129482/YES",
              date: "2025-02-10",
              collectorName: "Anitha R"
            },
            {
              receiptNo: "RCP-8802",
              loanNo: "LN-2025-001",
              customerName: "M. Ramesh Kumar",
              amount: 4104,
              paymentMode: "CASH",
              date: "2025-03-10",
              collectorName: "Rajesh Kannan"
            },
            {
              receiptNo: "RCP-8803",
              loanNo: "LN-2025-002",
              customerName: "K. Priya Dharshini",
              amount: 4124,
              paymentMode: "BANK",
              referenceNo: "NEFT-HDFC-9938102",
              date: "2025-03-15",
              collectorName: "Anitha R"
            }
          ]);

          // Seed PreLoans
          await PreLoanModel.create([
            {
              id: "PL-101",
              applicantName: "V. Saravanan",
              phone: "+91 94881 22334",
              address: "9 Railway Station Road, Katpadi",
              vehicleModel: "Royal Enfield Hunter 350",
              vehicleModelYear: "2024",
              vehicleValue: 185000,
              requestedAmount: 120000,
              status: "PENDING",
              aiRiskScore: 18,
              aiFraudFlag: false,
              date: "2025-03-18"
            },
            {
              id: "PL-102",
              applicantName: "D. Manikandan",
              phone: "+91 98401 77665",
              address: "24 Old Bye-Pass Road, Vellore",
              vehicleModel: "Hero Splendor Plus XTEC",
              vehicleModelYear: "2023",
              vehicleValue: 82000,
              requestedAmount: 60000,
              status: "APPROVED",
              aiRiskScore: 12,
              aiFraudFlag: false,
              date: "2025-03-19"
            }
          ]);

          // Seed Consultancy
          await ConsultancyModel.create([
            {
              id: "CON-501",
              type: "PURCHASE",
              vehicleName: "Hyundai i20 Magna 1.2 Petrol",
              vehicleNo: "TN 23 AP 5510",
              makeYear: 2021,
              purchasePrice: 420000,
              marketValuation: 480000,
              sellerName: "R. Balaji",
              phone: "+91 98432 55443",
              status: "IN_STOCK",
              callHistory: [],
              rcBookHistory: [],
              date: "2025-03-01"
            },
            {
              id: "CON-502",
              type: "SALE",
              vehicleName: "Maruti Suzuki Swift VXi",
              vehicleNo: "TN 23 BM 1882",
              makeYear: 2020,
              purchasePrice: 380000,
              soldPrice: 435000,
              commissionEarned: 15000,
              sellerName: "K. Elango",
              buyerName: "T. Chandran",
              buyerPhone: "+91 98421 99112",
              status: "SOLD",
              callHistory: [],
              rcBookHistory: [],
              date: "2025-02-14"
            }
          ]);

          // Seed Seized Vehicle
          await SeizedVehicleModel.create({
            id: "SZ-701",
            loanNo: "LN-2024-089",
            customerName: "P. Chandrasekar",
            vehicleName: "Yamaha FZ-S V3 (Matt Blue)",
            rcNo: "TN 23 CJ 7721",
            seizureDate: "2025-02-28",
            godownLocation: "Katpadi Central Godown - Bay 4",
            valuationAmount: 58000,
            loanBalance: 64200,
            status: "IN_YARD"
          });

          // Seed Deposits
          await DepositModel.create([
            {
              id: "DEP-901",
              depositorName: "Dr. N. Sundararajan",
              amount: 500000,
              interestRatePct: 11.5,
              termMonths: 12,
              startDate: "2024-06-01",
              maturityDate: "2025-06-01",
              maturityAmount: 557500,
              status: "ACTIVE"
            },
            {
              id: "DEP-902",
              depositorName: "Mrs. Revathi Ramanathan",
              amount: 250000,
              interestRatePct: 12.0,
              termMonths: 24,
              startDate: "2024-09-15",
              maturityDate: "2026-09-15",
              maturityAmount: 310000,
              status: "ACTIVE"
            }
          ]);

          // Seed HandLoan
          await HandLoanModel.create({
            id: "HL-301",
            borrowerName: "V. Thangavel",
            phone: "+91 98421 33221",
            amount: 25000,
            interestRatePerMonth: 2.0,
            givenDate: "2025-03-01",
            promisedReturnDate: "2025-04-01",
            status: "ACTIVE"
          });

          await AuditLogModel.create({
            id: "LOG-" + Date.now(),
            timestamp: new Date().toISOString(),
            user: "SYSTEM_BOOT",
            action: "DATABASE_INITIALIZED",
            details: "Auto-initialized database with default staff, dealers, loans, and corporate parameters."
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

// Mount Routes (with /api prefix and root prefix for serverless compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/preloans", preloanRoutes);
app.use("/api/consultancies", consultancyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", masterRoutes);
app.use("/api", financeRoutes);

app.use("/auth", authRoutes);
app.use("/loans", loanRoutes);
app.use("/receipts", receiptRoutes);
app.use("/preloans", preloanRoutes);
app.use("/consultancies", consultancyRoutes);
app.use("/ai", aiRoutes);
app.use("/", masterRoutes);
app.use("/", financeRoutes);

// Serve frontend static assets in unified production mode if available
const frontendDist = fs.existsSync(path.resolve(process.cwd(), "dist"))
  ? path.resolve(process.cwd(), "dist")
  : path.resolve(process.cwd(), "frontend/dist");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

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

// SPA fallback for non-API routes
if (fs.existsSync(frontendDist)) {
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.url.startsWith("/api") || req.url.startsWith("/health")) {
      return next();
    }
    const indexPath = path.join(frontendDist, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Backend Global Error]", err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : (err.message || "An unexpected error occurred")
  });
});

export default app;
