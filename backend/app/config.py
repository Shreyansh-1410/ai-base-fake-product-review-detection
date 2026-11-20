import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "ReviewGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    ARTIFACTS_DIR: Path = BASE_DIR / "backend" / "app" / "ml" / "artifacts"
    
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
