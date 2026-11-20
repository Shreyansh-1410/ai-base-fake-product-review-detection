from typing import Optional, List
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    product_name: str
    category: Optional[str] = "Electronics"
    brand: Optional[str] = None
    serial_number: Optional[str] = None
    authorized_seller: Optional[bool] = None

class ProductResponse(BaseModel):
    product_id: str
    product_name: str
    category: Optional[str] = "Electronics"
    total_reviews_analyzed: int = 0
    latest_review_trust_score: Optional[float] = None
    latest_quality_score: Optional[float] = None
    authenticity_status: str = "Not Verified"
