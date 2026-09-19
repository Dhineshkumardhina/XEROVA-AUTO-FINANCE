import app, { initDB } from "./app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`[Backend] XEROVA Auto Finance API Server started`);
      console.log(`[Backend] Listening on port ${PORT} (http://localhost:${PORT})`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error("[Backend] Failed to start API server:", err);
    process.exit(1);
  }
}

startServer();
