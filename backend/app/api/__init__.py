from app.api.reviews import router as reviews_router
from app.api.analysis import router as analysis_router
from app.api.models import router as models_router
from app.api.reports import router as reports_router
from app.api.demo_cases import router as demo_router
from app.api.products import router as products_router

__all__ = [
    "reviews_router",
    "analysis_router",
    "models_router",
    "reports_router",
    "demo_router",
    "products_router"
]

