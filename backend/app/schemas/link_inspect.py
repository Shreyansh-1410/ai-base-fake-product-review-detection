from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.analysis import FullAnalysisResponse

class ProductLinkInspectInput(BaseModel):
    product_url: str = Field(..., description="E-commerce product link (Amazon, Flipkart, etc.)")
    product_name: Optional[str] = Field(default=None, description="Optional product name")
    seller_name: Optional[str] = Field(default=None, description="Seller or store name")
    listed_price: Optional[float] = Field(default=None, description="Current selling price")
    original_mrp: Optional[float] = Field(default=None, description="Original list price / MRP")
    reviews_text: Optional[str] = Field(default=None, description="Optional raw customer reviews from the page")

class ProductLegitimacyAssessment(BaseModel):
    product_status: str = Field(..., description="'Likely Authentic', 'High Counterfeit Risk / Suspected Fake', or 'Caution - Unverified Listing'")
    counterfeit_risk_score: float = Field(..., description="Risk score [0 - 100%]")
    risk_category: str = Field(..., description="'Low Risk (Genuine)', 'Moderate Risk (Verification Recommended)', 'High Risk (Likely Fake)'")
    marketplace: str = Field(..., description="E-commerce platform detected (Amazon, Flipkart, etc.)")
    product_identifier: Optional[str] = Field(default=None, description="Extracted ASIN, SKU, or Product Code")
    price_anomaly_detected: bool = Field(default=False)
    discount_percentage: Optional[float] = None
    seller_credibility: str = Field(default="Standard")
    counterfeit_signals_in_reviews: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)
    summary_verdict: str

class ProductLinkInspectResponse(BaseModel):
    product_url: str
    product_name: str
    assessment: ProductLegitimacyAssessment
    review_analysis: FullAnalysisResponse
