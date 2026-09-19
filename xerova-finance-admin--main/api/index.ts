import app, { initDB } from "../backend/dist/app.js";

export default async function handler(req: any, res: any) {
  await initDB();
  return app(req, res);
}
