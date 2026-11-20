from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProductVerificationInput(BaseModel):
    has_verification_evidence: bool = Field(default=False, description="Whether independent physical/manufacturer evidence exists")
    serial_number: Optional[str] = Field(default=None, description="Verified manufacturer product/serial identifier")
    authorized_seller: Optional[bool] = Field(default=None, description="Whether purchased directly from authorized distributor")
    inspection_result: Optional[str] = Field(default="not_verified", description="'verified_genuine', 'verified_counterfeit', 'suspected_counterfeit', or 'not_verified'")
    evidence_notes: Optional[str] = Field(default="", description="Supporting notes from manufacturer or lab audit")

class SingleReviewInput(BaseModel):
    review_id: Optional[str] = None
    review_text: str = Field(..., min_length=2, description="The customer review text")
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0, description="Customer star rating (1 to 5)")
    reviewer_id: Optional[str] = Field(default=None, description="Optional anonymous reviewer ID")
    timestamp: Optional[str] = Field(default=None, description="Optional ISO timestamp or date string")
    verified_purchase: Optional[bool] = Field(default=None, description="Optional verified purchase badge")

class BatchReviewInput(BaseModel):
    product_name: str = Field(default="Product Under Analysis", description="Name or identifier of the product")
    product_url: Optional[str] = Field(default="", description="Source product link on Amazon or Flipkart")
    platform: Optional[str] = Field(default="E-Commerce Platform", description="E-commerce marketplace")
    brand: Optional[str] = Field(default="", description="Product brand name")
    image_url: Optional[str] = Field(default="", description="Product photo/thumbnail")
    product_rating: Optional[float] = Field(default=None, description="Aggregated platform product rating")
    reviews: List[SingleReviewInput] = Field(..., min_items=1, description="List of reviews to analyze")
    product_verification: Optional[ProductVerificationInput] = Field(default_factory=ProductVerificationInput)

class ReviewAnalysisOutput(BaseModel):
    review_id: str
    review_text: str
    rating: Optional[float] = None
    author: Optional[str] = Field(default=None, description="Reviewer name / author")
    date: Optional[str] = Field(default=None, description="Date of review")
    sentiment: str = Field(..., description="'Positive', 'Negative', or 'Neutral'")
    sentiment_score: float = Field(..., description="Continuous polarity score [-1.0, 1.0]")
    classification: str = Field(default="GENUINE", description="'GENUINE', 'FAKE', or 'SUSPICIOUS'")
    authenticity_label: str = Field(default="GENUINE", description="'GENUINE', 'FAKE', or 'SUSPICIOUS'")
    confidence_score: float = Field(default=0.0, description="Confidence percentage [0.0 - 100.0]")
    calibrated_confidence: float = Field(default=0.0, description="Calibrated confidence score [0.0, 1.0]")
    deception_probability: float = Field(default=0.0, description="Probability review is deceptive/fake [0.0, 1.0]")
    reason: str = Field(default="", description="Human-interpretable explanation of classification")
    explanation: str = Field(default="", description="Detailed explanation of the classification")
    is_suspicious_positive: bool = Field(default=False, description="Flagged as misleading positive review")
    rating_mismatch: bool = Field(default=False, description="Identified discrepancy between star rating and text sentiment")
    is_duplicate: bool = Field(default=False, description="Flagged as duplicate or copy-pasted review")
    indicators: List[str] = Field(default_factory=list, description="Specific triggers/markers identified")
    aspect_claims: Dict[str, str] = Field(default_factory=dict, description="Extracted claims by aspect (e.g., {'battery': 'drains fast'})")
