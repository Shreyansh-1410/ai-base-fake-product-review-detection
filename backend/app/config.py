import os
from pathlib import Path
from pydantic import BaseModel

import os
from pathlib import Path
from pydantic import BaseModel

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

def _resolve_artifacts_dir() -> Path:
    # 1. Directly in app/ml/artifacts (standard when root is backend or deployed on Vercel)
    d1 = APP_DIR / "ml" / "artifacts"
    if d1.exists():
        return d1
    # 2. In backend/app/ml/artifacts (when root is project root)
    d2 = PROJECT_ROOT / "backend" / "app" / "ml" / "artifacts"
    if d2.exists():
        return d2
    # 3. In backend/ml/artifacts
    d3 = BACKEND_DIR / "ml" / "artifacts"
    if d3.exists():
        return d3
    return d1

def _resolve_data_dir() -> Path:
    # Try backend/data first; if read-only (serverless/Vercel/Lambda), fallback to /tmp
    try:
        d = BACKEND_DIR / "data"
        d.mkdir(parents=True, exist_ok=True)
        t = d / ".perm_check"
        t.write_text("1")
        t.unlink()
        return d
    except (OSError, PermissionError):
        tmp = Path("/tmp/reviewguard_data")
        tmp.mkdir(parents=True, exist_ok=True)
        return tmp

BASE_DIR = PROJECT_ROOT if (PROJECT_ROOT / "frontend").exists() else BACKEND_DIR

class Settings(BaseModel):
    PROJECT_NAME: str = "ReviewGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = _resolve_data_dir()
    ARTIFACTS_DIR: Path = _resolve_artifacts_dir()
    
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = "reviewguard_ai"
    
    # Model & Calibration Thresholds
    UNCERTAINTY_LOWER: float = 0.42
    UNCERTAINTY_UPPER: float = 0.58
    SUSPICIOUS_THRESHOLD: float = 0.58
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
