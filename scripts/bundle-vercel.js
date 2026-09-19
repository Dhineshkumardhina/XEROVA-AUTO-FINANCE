const fs = require("fs");
const { execSync } = require("child_process");

console.log("[Build] Copying frontend/dist to dist...");
if (fs.existsSync("frontend/dist")) {
  fs.cpSync("frontend/dist", "dist", { recursive: true });
}

console.log("[Build] Bundling standalone serverless API handlers for Vercel...");
execSync("npx esbuild api/serverless.ts --bundle --platform=node --target=node22 --external:@electric-sql/pglite --outfile=api/index.js", { stdio: "inherit" });
fs.copyFileSync("api/index.js", "api/[...path].js");
console.log("[Build] Standalone serverless API bundled successfully!");
