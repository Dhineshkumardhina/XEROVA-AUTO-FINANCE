# Deploying XEROVA Auto Finance to Vercel

This repository is fully configured and ready for **1-click / zero-configuration deployment to Vercel**.

---

## 🚀 Option 1: Deploy via GitHub (Recommended)

1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
   - Select your `xerova-auto-finance` repository.

3. **Configure Project Settings** in Vercel:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build Command**: `npm run build` (or `npm run vercel-build`)
   - **Output Directory**: `frontend/dist`
   - **Root Directory**: `./` (leave default)

4. **Add Environment Variables**:
   In the Vercel dashboard under **Settings -> Environment Variables**, add:

   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_3nBTXN5YwIqj@ep-floral-leaf-b5r82avv-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require` | Your Neon Cloud PostgreSQL instance |
   | `GEMINI_API_KEY` | *(Your Gemini API Key)* | Required for Gemini AI risk score & audit opinions |
   | `NODE_ENV` | `production` | Production mode |

5. Click **"Deploy"**.
   - Vercel builds the monorepo, deploys the static frontend to their global Edge CDN, and connects `/api/*` to the serverless Express API function.

---

## ⚡ Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Run the deployment command from the project root:
   ```bash
   vercel
   ```
   Follow the prompts to link your project.

3. To deploy directly to production:
   ```bash
   vercel --prod
   ```

---

## 🏗️ Architecture on Vercel

```
[ Incoming User Request ]
           │
           ├───► /assets/* or client page routes ──► Vercel Edge CDN (frontend/dist)
           │
           └───► /api/* ──────────────────────────► Vercel Serverless Function (api/index.js)
                                                                 │
                                                                 ▼
                                                    Neon Cloud PostgreSQL (neondb)
                                                    & Google Gemini AI API
```

- **Frontend**: React 19 + Vite SPA with tailwind styles and rich responsive ERP interfaces.
- **Backend**: Serverless Node.js Express application mounting all ERP domain routes (`/api/loans`, `/api/receipts`, `/api/masters`, `/api/settings`, `/api/ai`, etc.).
- **Database**: Cloud PostgreSQL via Neon pooler with auto-provisioning of all 16 ERP relational tables on initial boot.
