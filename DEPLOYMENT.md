# ReviewGuard AI – Deployment Guide

This guide details deployment options for **ReviewGuard AI**:
1. **Localhost Single-Port Production Server** (FastAPI + React bundle on Port 5000)
2. **Vercel Serverless Deployment** (FastAPI Backend + Vite Frontend)
3. **Cloud Container / VPS Deployment** (Docker, Render, Railway, AWS, DigitalOcean)

---

## 1. Local Unified Deployment (Recommended for Local Use / Viva)

ReviewGuard serves both the React production frontend and the FastAPI backend unified under port `5000`:

```bash
# Option A: One-click Windows launcher (automatically opens browser)
start.bat

# Option B: Python launcher
python run_reviewguard.py
```

- Web UI: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`
- Swagger Interactive Documentation: `http://localhost:5000/docs`

---

## 2. Vercel Serverless Deployment

ReviewGuard is configured for Vercel's multi-service architecture with zero-configuration FastAPI runtime:

### Configuration (`vercel.json`)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "backend": {
      "root": "backend",
      "framework": "fastapi",
      "entrypoint": "main:app"
    },
    "frontend": {
      "root": "frontend",
      "framework": "vite"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

### Steps to Deploy on Vercel:
1. Push repository to GitHub (`main` branch).
2. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New Project"**.
3. Import `ai-base-fake-product-review-detection`.
4. Leave root directory as repository root (`.`).
5. Click **Deploy**. Vercel will build both the frontend and backend automatically.

---

## 3. Render / Cloud Deployment

To deploy on Render as a Web Service:
1. Connect your GitHub repository.
2. Select **Python 3** environment.
3. Build Command:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Start Command:
   ```bash
   python backend/run_server.py $PORT
   ```

---

## 4. System Health & Verification Endpoints

- **GET `/api/health`**: Returns JSON with system status, active database mode (live MongoDB / resilient in-memory SQLite), and ML model loaded state.
- **POST `/api/products/analyze-url`**: Core analysis endpoint taking `{"product_url": "..."}` supporting desktop URLs, mobile short links (`dl.flipkart.com/s/...`, `amzn.to/...`), and batch review synthesis up to 1,000 reviews.
