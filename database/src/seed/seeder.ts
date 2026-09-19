import { connectDB, disconnectDB } from "../config/db.js";
import { UserModel } from "../models/User.js";
import { MasterModel } from "../models/Master.js";
import { SettingModel } from "../models/FinanceModels.js";
import { AuditLogModel } from "../models/FinanceModels.js";

async function runSeed() {
  await connectDB();

  console.log("[Seeder] Checking existing data in PostgreSQL...");
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) {
    console.log("[Seeder] Database already contains records. Skipping seed.");
    await disconnectDB();
    return;
  }

  console.log("[Seeder] Seeding initial users...");
  await UserModel.create([
    { id: "usr-1", username: "admin", role: "Super Admin", name: "Executive Managing Director", email: "director@xerova.in", phone: "+91 98421 00001" },
    { id: "usr-2", username: "manager", role: "Branch Manager", name: "Suresh Kumar", email: "suresh.k@xerova.in", phone: "+91 98421 00002" },
    { id: "usr-3", username: "cashier", role: "Cashier", name: "Anitha R", email: "anitha.r@xerova.in", phone: "+91 98421 00003" },
    { id: "usr-4", username: "officer", role: "Recovery Officer", name: "Rajesh Kannan", email: "rajesh.k@xerova.in", phone: "+91 98421 00004" }
  ]);

  console.log("[Seeder] Seeding masters...");
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

  console.log("[Seeder] Seeding settings...");
  await SettingModel.create([
    { key: "companyName", value: "XEROVA AUTO FINANCE & LEASING" },
    { key: "branchCode", value: "MADURAI-#01" },
    { key: "defaultInterestRate", value: 16.5 },
    { key: "overduePenaltyPerDay", value: 100 },
    { key: "gracePeriodDays", value: 5 }
  ]);

  console.log("[Seeder] Seeding sample audit log...");
  await AuditLogModel.create({
    id: "LOG-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "SYSTEM_SEEDER",
    action: "DATABASE_INITIALIZED",
    details: "Initialized PostgreSQL database with default staff, dealers, and corporate parameters."
  });

  console.log("[Seeder] Seed completed successfully!");
  await disconnectDB();
}

runSeed().catch((e) => {
  console.error("[Seeder] Error running seeder:", e);
  process.exit(1);
});
