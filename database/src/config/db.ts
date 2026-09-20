import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

let pgPool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let isConnected = false;

export async function executeQuery(text: string, params: any[] = []): Promise<any[]> {
  if (pgPool) {
    const res = await pgPool.query(text, params);
    return res.rows;
  } else if (pgliteInstance) {
    const res = await pgliteInstance.query(text, params);
    return res.rows;
  } else {
    throw new Error("[PostgreSQL] Database not connected. Call connectDB() first.");
  }
}

const TABLE_NAMES = [
  "users",
  "customers",
  "loans",
  "receipts",
  "pre_loans",
  "consultancies",
  "masters",
  "seized_vehicles",
  "vouchers",
  "deposits",
  "hand_loans",
  "bad_debts",
  "auction_sales",
  "employee_sessions",
  "settings",
  "audit_logs"
];

async function initializeTables(): Promise<void> {
  for (const table of TABLE_NAMES) {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  console.log(`[PostgreSQL] All 16 ERP database tables verified/created successfully.`);
}

export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    try {
      console.log(`[PostgreSQL] Connecting to PostgreSQL database at ${connectionString.split("@")[1] || "configured URI"}...`);
      const isSslNeeded = connectionString.includes("ssl") || connectionString.includes("neon.tech") || connectionString.includes("supabase.co") || connectionString.includes("pooler");
      pgPool = new Pool({
        connectionString,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 10000
      });
      // Test connection
      await pgPool.query("SELECT 1");
      console.log(`[PostgreSQL] Successfully connected to PostgreSQL database.`);
      isConnected = true;
      await initializeTables();
      return;
    } catch (error) {
      console.warn(`[PostgreSQL] Primary connection failed: ${(error as Error).message}`);
      pgPool = null;
    }
  }

  // Local/Offline Fallback: Embedded PGlite engine
  try {
    const pglitePath = process.env.VERCEL ? undefined : (process.env.PGLITE_DATA_DIR || path.resolve(process.cwd(), ".pgdata"));
    console.log(`[PostgreSQL] Initializing embedded local PostgreSQL (PGlite${pglitePath ? ` at ${pglitePath}` : " in-memory"})...`);
    pgliteInstance = pglitePath ? new PGlite(pglitePath) : new PGlite();
    await pgliteInstance.waitReady;
    console.log(`[PostgreSQL] Embedded PGlite engine ready.`);
    isConnected = true;
    await initializeTables();
  } catch (fallbackError) {
    console.error(`[PostgreSQL] Fatal error initializing database:`, fallbackError);
    throw fallbackError;
  }
}

export async function disconnectDB(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (pgliteInstance) {
    await pgliteInstance.close();
    pgliteInstance = null;
  }
  isConnected = false;
  console.log(`[PostgreSQL] Disconnected.`);
}
