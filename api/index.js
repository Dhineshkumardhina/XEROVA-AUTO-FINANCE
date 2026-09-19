/**
 * Vercel Serverless Function Handler for XEROVA Auto Finance API
 */
const { app, initDB } = require("../backend/dist/app.js");

let initPromise = null;

async function ensureDB() {
  if (!initPromise) {
    initPromise = initDB().catch((err) => {
      console.error("[Vercel Serverless] Error initializing database:", err);
      initPromise = null;
    });
  }
  return initPromise;
}

module.exports = async (req, res) => {
  await ensureDB();
  return app(req, res);
};
