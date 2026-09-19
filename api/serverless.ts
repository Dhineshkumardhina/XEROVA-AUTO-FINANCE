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

  // Log incoming request details for Vercel runtime logs
  console.log(`[Vercel Serverless] ${req.method} ${req.url}`);

  // Only if req.url was literally rewritten to the file path itself, attempt fallback
  if (req.url === "/api/index.js" || req.url === "/api/index" || req.url?.includes("[...path]")) {
    if (req.query && req.query.path) {
      const p = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
      req.url = "/api/" + p.replace(/^\//, "");
    } else if (req.headers && req.headers["x-original-url"]) {
      req.url = req.headers["x-original-url"];
    } else if (req.headers && req.headers["x-forwarded-uri"]) {
      req.url = req.headers["x-forwarded-uri"];
    }
  }

  return (app as any)(req, res);
}

