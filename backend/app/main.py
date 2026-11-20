import os
import sys
import logging
from pathlib import Path

# Ensure 'backend' directory is in sys.path so 'import app...' works in any runner (e.g. Vercel)
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.api import reviews_router, analysis_router, models_router, reports_router, demo_router, products_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("reviewguard.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Grade AI-Based Fake Product Review Detection System using NLP & Machine Learning",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    from app.database import db
    return {
        "status": "healthy",
        "database": "live_mongodb" if not db.is_mock else "resilient_in_memory_mock",
        "models_loaded": True
    }

# Static frontend mount if built
FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept API or docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Resource Not Found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "operational",
            "documentation": "/docs"
        }
