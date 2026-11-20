import json
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.ml.predictor import predictor

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("/metrics")
async def get_model_metrics():
    """Returns scientific evaluation metrics, confusion matrices, and ROC-AUC comparisons."""
    metrics_path = settings.ARTIFACTS_DIR / "training_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="Model metrics file not found. Please train models first.")
    try:
        with open(metrics_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {str(e)}")

@router.get("/status")
async def get_model_status():
    """Returns health status and available trained models."""
    return {
        "status": "ready",
        "available_models": list(predictor.models.keys()),
        "default_model": predictor.default_model_name,
        "vocabulary_size": len(predictor.tfidf.vocabulary_) if predictor.tfidf else 0,
        "uncertainty_thresholds": {
            "lower": settings.UNCERTAINTY_LOWER,
            "upper": settings.SUSPICIOUS_THRESHOLD
        }
    }
