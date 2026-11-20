from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from app.schemas.review import ReviewAnalysisOutput, ProductVerificationInput

class AspectContradictionItem(BaseModel):
    aspect: str = Field(..., description="The aspect/feature under dispute (e.g. Battery, Sound)")
    claim_a: str = Field(..., description="First claim extracted from customer reviews")
    claim_b: str = Field(..., description="Contradicting claim extracted from customer reviews")
    review_id_a: Optional[str] = None
    review_id_b: Optional[str] = None
    relationship: str = Field(default="Contradictory claims", description="Identified relationship")
    severity: str = Field(default="High", description="'High', 'Medium', or 'Low' conflict")
    explanation: str = Field(..., description="Clear explanation of the factual dispute")

class SuspiciousPositiveReviewItem(BaseModel):
    review_id: str
    review_text: str
    rating: Optional[float] = None
    suspicion_indicators: List[str]
    explanation: str
    pattern_type: str = Field(default="Puffery / Promotional Cluster")

class AspectSentimentSummary(BaseModel):
    aspect: str
    positive_mentions: int
    negative_mentions: int
    net_sentiment: float
    summary: str

class AnalysisSummary(BaseModel):
    total_reviews: int
    genuine_count: int
    fake_count: int
    suspicious_count: int
    uncertain_count: int = 0
    genuine_percentage: float = 0.0
    fake_percentage: float = 0.0
    suspicious_percentage: float = 0.0
    suspicious_positives_count: int = 0
    
    # Review Trust Score (0 - 100)
    review_trust_score: Optional[float] = Field(default=None, description="Score 0 - 100 on review veracity (None if insufficient data)")
    review_trust_category: str = Field(default="Insufficient Data", description="'High Review Trust', 'Moderate Review Trust', 'Low Review Trust', 'Very Low Review Trust'")
    trust_score_explanation: str = Field(default="", description="Transparent explanation of trust score")
    
    # Quality & Verification
    reported_product_quality_score: float = Field(default=50.0, description="Score 0 - 100 on customer-reported performance")
    reported_quality_category: str = Field(default="Fair Quality", description="'Excellent Quality', 'Good Quality', 'Fair Quality', 'Poor / Defective'")
    product_authenticity_status: str = Field(default="Not Verified", description="'Verified Genuine', 'Verified Counterfeit', 'Suspected Counterfeit', or 'Not Verified'")
    product_authenticity_notes: str = Field(default="")

class FullAnalysisResponse(BaseModel):
    analysis_id: str
    product_name: str
    product_url: Optional[str] = ""
    platform: Optional[str] = "E-Commerce Platform"
    brand: Optional[str] = ""
    image_url: Optional[str] = ""
    product_rating: Optional[float] = None
    timestamp: str
    summary: AnalysisSummary
    reviews: List[ReviewAnalysisOutput]
    suspicious_positives: List[SuspiciousPositiveReviewItem] = Field(default_factory=list)
    contradictions: List[AspectContradictionItem] = Field(default_factory=list)
    aspect_insights: Union[List[AspectSentimentSummary], Dict[str, Any], List[Any]] = Field(default_factory=list)
    top_defects: List[str] = Field(default_factory=list)
    model_name: str = "Logistic Regression"
    is_live_db: bool = True
