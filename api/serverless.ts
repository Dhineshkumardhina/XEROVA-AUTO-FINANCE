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

  // Reconstruct exact API URL from Vercel rewrite parameter or headers
  if (req.query && req.query.__path) {
    const p = Array.isArray(req.query.__path) ? req.query.__path.join("/") : req.query.__path;
    req.url = "/api/" + p.replace(/^\//, "");
  } else if (req.headers && req.headers["x-matched-path"]) {
    req.url = req.headers["x-matched-path"];
  }

  // Remove query param artifact from URL if present
  if (req.url && req.url.includes("?__path=")) {
    req.url = req.url.split("?__path=")[0];
  }

  return (app as any)(req, res);
}
