# 🚀 ReviewGuard AI – Deployment Guide

ReviewGuard is packaged as a **unified full-stack application**. The FastAPI backend automatically serves the pre-compiled React production bundle (`frontend/dist`) as static assets, meaning:
- **No separate frontend hosting needed**
- **Zero CORS issues**
- **Single public URL** for presentation & evaluation

---

## 🌟 Method 1: Deploy on Render.com (Recommended & Free)

Render provides free cloud hosting with automatic deployment directly from GitHub.

### Step-by-Step:
1. Go to [Render.com](https://render.com/) and Sign in with your **GitHub account**.
2. Click the **"New +"** button in the top navbar and select **"Web Service"**.
3. Under **"Connect a repository"**, select your repository:  
   `Shreyansh-1410/ai-base-fake-product-review-detection`
4. Fill in the deployment settings:
   - **Name**: `reviewguard-ai` (or any name you prefer)
   - **Region**: `Oregon (US West)` or `Singapore`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     python backend/run_server.py
     ```
   - **Instance Type**: `Free`
5. Click **"Create Web Service"**.
6. Wait 2–3 minutes for the build to finish. Once done, Render gives you a live public HTTPS URL:  
   `https://reviewguard-ai.onrender.com`

---

## 🚆 Method 2: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **"New Project"** ➔ **"Deploy from GitHub repo"**.
3. Choose `Shreyansh-1410/ai-base-fake-product-review-detection`.
4. Railway automatically detects the `Dockerfile` or `Procfile`.
5. Under Settings ➔ Networking, click **"Generate Domain"** to get a public URL.

---

## 🐳 Method 3: Run with Docker (Local or Any VPS)

Build and run the production container locally or on any cloud server:

```bash
# 1. Build Docker image
docker build -t reviewguard-ai .

# 2. Run container on port 5000
docker run -d -p 5000:5000 --name reviewguard reviewguard-ai

# 3. Access web application
# Open: http://localhost:5000
```

---

## 🛠️ Verification & Health Check

Once deployed, you can verify your service status:
- Web App UI: `https://<your-deployed-domain>/`
- API Health Endpoint: `https://<your-deployed-domain>/health`
- Swagger API Docs: `https://<your-deployed-domain>/docs`
