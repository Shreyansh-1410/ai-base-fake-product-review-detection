from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ExtractedProduct(BaseModel):
    product_url: str
    platform: str = Field(default="E-Commerce Platform")
    platform_code: str = Field(default="generic")
    product_id: Optional[str] = None
    product_name: str = Field(default="Product Under Analysis")
    brand: Optional[str] = "Generic / Unspecified"
    image_url: Optional[str] = None
    product_rating: Optional[float] = None
    total_reviews_count: Optional[int] = 0
    reviews: List[Dict[str, Any]] = Field(default_factory=list)
    extraction_status: str = Field(default="success")  # "success", "anti_bot_restricted", "partial", "error"
    status_message: str = Field(default="")
    requires_fallback: bool = Field(default=False)

class BaseProductExtractor(ABC):
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Returns True if this extractor can handle the given URL."""
        pass

    @abstractmethod
    def extract(self, url: str) -> ExtractedProduct:
        """Extracts product information and customer reviews from the given URL."""
        pass
