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

  // Restore true requested path if rewritten by Vercel
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
  if (matchedPath && typeof matchedPath === "string" && matchedPath.startsWith("/api")) {
    req.url = matchedPath;
  } else if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = "/api/" + p;
  }

  return (app as any)(req, res);
}
