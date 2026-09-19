import app, { initDB } from "../backend/src/app.js";

let initPromise: Promise<void> | null = null;

async function ensureDB() {
  if (!initPromise) {
    initPromise = initDB().catch((err: any) => {
      console.error("[Vercel Serverless] Error initializing database:", err);
      initPromise = null;
    });
  }
  return initPromise;
}

export default async function handler(req: any, res: any) {
  // Ensure DB connection
  await ensureDB();

  // If URL arrived without /api prefix, also ensure matching
  return (app as any)(req, res);
}
