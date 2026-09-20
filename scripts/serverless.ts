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
  const originalUrl = req.url || "";
  console.log(`[Vercel Serverless] Incoming: ${req.method} ${originalUrl}`);

  // Reconstruct path if Vercel internal rewrite passed it via query or headers
  if (
    originalUrl.startsWith("/api/index.js") || 
    originalUrl.startsWith("/api/index") || 
    originalUrl === "/api" ||
    originalUrl.includes("[...path]")
  ) {
    if (req.query && req.query.path) {
      const p = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
      req.url = "/api/" + p.replace(/^\//, "");
    } else if (req.headers && req.headers["x-matched-path"]) {
      req.url = req.headers["x-matched-path"];
    } else if (req.headers && req.headers["x-original-url"]) {
      req.url = req.headers["x-original-url"];
    } else if (req.headers && req.headers["x-forwarded-uri"]) {
      req.url = req.headers["x-forwarded-uri"];
    }
  }

  console.log(`[Vercel Serverless] Delegating to Express: ${req.method} ${req.url}`);
  return (app as any)(req, res);
}
