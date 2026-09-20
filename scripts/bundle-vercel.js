const fs = require("fs");
const { execSync } = require("child_process");

console.log("[Build] Copying frontend/dist to dist...");
if (fs.existsSync("frontend/dist")) {
  fs.cpSync("frontend/dist", "dist", { recursive: true });
}

console.log("[Build] Bundling standalone serverless API handler for Vercel...");
if (!fs.existsSync("api")) {
  fs.mkdirSync("api", { recursive: true });
}

execSync(
  'npx --yes esbuild scripts/serverless.ts --bundle --platform=node --target=node20 --external:@electric-sql/pglite --outfile=api/index.js --footer:js="const _h = module.exports.default || module.exports; module.exports = _h; module.exports.default = _h;"',
  { stdio: "inherit" }
);

console.log("[Build] Standalone serverless API bundled successfully at api/index.js!");
