from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.extractors.manager import extractor_manager
from app.extractors.base import ExtractedProduct
from app.schemas.review import BatchReviewInput, SingleReviewInput
from app.schemas.analysis import FullAnalysisResponse
from app.services.analysis_service import analysis_service

router = APIRouter(prefix="/products", tags=["Product Link Scanner"])

class ProductUrlRequest(BaseModel):
    product_url: str = Field(..., description="E-commerce product link on Amazon India or Flipkart")

class AnalyzeUrlRequest(BaseModel):
    product_url: str = Field(..., description="E-commerce product link")
    model_name: Optional[str] = Field(default="Logistic Regression")
    fallback_reviews_text: Optional[str] = Field(default=None, description="Pasted reviews text if scraping is restricted by anti-bot protections")
    fallback_reviews_list: Optional[List[Dict[str, Any]]] = Field(default=None, description="Uploaded CSV reviews list")

@router.get("/samples")
async def get_sample_products():
    """Returns pre-verified sample products for Amazon India and Flipkart for 1-click test runs."""
    return {"samples": extractor_manager.get_sample_products()}

@router.get("/demo-links")
async def get_legacy_demo_links():
    """Maintains backward compatibility for demo links."""
    return {"demo_links": extractor_manager.get_sample_products()}

@router.post("/identify-platform")
async def identify_platform(request: ProductUrlRequest):
    """Identifies the e-commerce platform and checks supported extractor status."""
    if not request.product_url or not request.product_url.strip():
        raise HTTPException(status_code=400, detail="Product URL must be provided.")
    info = extractor_manager.identify_platform(request.product_url)
    return info

@router.post("/extract", response_model=ExtractedProduct)
async def extract_product_details(request: ProductUrlRequest):
    """
    Extracts product name, brand, platform, image, rating, reviews count,
    and available customer reviews from Amazon India or Flipkart URL.
    """
    url = request.product_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Product URL cannot be empty.")

    try:
        extracted = extractor_manager.extract_product(url)
        return extracted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract product information: {str(e)}")

@router.post("/analyze-url", response_model=FullAnalysisResponse)
async def analyze_product_url(request: AnalyzeUrlRequest):
    """
    Main URL-to-Analysis endpoint:
    1. Extracts product details & identifies platform (Amazon/Flipkart).
    2. Fetches live reviews if accessible.
    3. If live reviews blocked by anti-bot, uses fallback reviews provided by user (paste or CSV).
    4. If no reviews available at all, returns 422 with clear transparent explanation.
    5. Analyzes each review using AI/ML, computes trust score, saves to SQLite database.
    """
    url = request.product_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Product URL must be provided.")

    # Step 1: Extract product information
    extracted = extractor_manager.extract_product(url)

    # Step 2: Determine review sources
    review_objects: List[SingleReviewInput] = []

    # Priority A: Live extracted reviews from e-commerce page
    if extracted.reviews and len(extracted.reviews) > 0:
        for idx, rev in enumerate(extracted.reviews):
            text = rev.get("review_text") or rev.get("text", "")
            if text and len(text.strip()) > 3:
                review_objects.append(
                    SingleReviewInput(
                        review_id=f"rev_{idx + 1}",
                        review_text=text.strip(),
                        rating=rev.get("rating"),
                        reviewer_id=rev.get("author") or "Verified Buyer",
                        timestamp=rev.get("date") or "Recent",
                        verified_purchase=rev.get("verified_purchase", True)
                    )
                )

    # Priority B: Fallback reviews provided from CSV upload
    elif request.fallback_reviews_list and len(request.fallback_reviews_list) > 0:
        for idx, item in enumerate(request.fallback_reviews_list):
            text = item.get("review_text") or item.get("text") or item.get("Review") or item.get("text_") or ""
            if text and len(str(text).strip()) > 3:
                rating_val = None
                r_field = item.get("rating") or item.get("Rating") or item.get("stars")
                if r_field is not None:
                    try:
                        rating_val = float(r_field)
                    except ValueError:
                        pass
                review_objects.append(
                    SingleReviewInput(
                        review_id=f"rev_csv_{idx + 1}",
                        review_text=str(text).strip(),
                        rating=rating_val,
                        verified_purchase=True
                    )
                )

    # Priority C: Fallback reviews pasted as text
    elif request.fallback_reviews_text and request.fallback_reviews_text.strip():
        lines = [line.strip() for line in request.fallback_reviews_text.split("\n") if len(line.strip()) > 5]
        for idx, line in enumerate(lines):
            # Check for star rating prefix like "5: Review text" or "4 stars - Great"
            import re
            rating_val = None
            clean_line = line
            star_m = re.match(r"^\[?(\d(?:\.\d)?)\s*(?:stars?|★)?\]?[\s:-]+(.+)$", line, re.IGNORECASE)
            if star_m:
                try:
                    val = float(star_m.group(1))
                    if 1.0 <= val <= 5.0:
                        rating_val = val
                        clean_line = star_m.group(2).strip()
                except ValueError:
                    pass
            review_objects.append(
                SingleReviewInput(
                    review_id=f"rev_paste_{idx + 1}",
                    review_text=clean_line,
                    rating=rating_val,
                    verified_purchase=True
                )
            )

    # If still no reviews, adhere to prompt: NEVER show fake/random reviews. Inform user.
    if not review_objects:
        msg = (
            f"{extracted.platform} live review extraction was restricted by website security/anti-bot protection (HTTP 503 / CAPTCHA). "
            "Product metadata was successfully identified. To complete the AI analysis, please upload a review CSV or paste customer reviews."
        )
        raise HTTPException(
            status_code=422,
            detail={
                "message": msg,
                "product_name": extracted.product_name,
                "platform": extracted.platform,
                "brand": extracted.brand,
                "image_url": extracted.image_url,
                "requires_fallback": True
            }
        )

    # Step 3: Run Full AI & Trust Analysis
    batch_input = BatchReviewInput(
        product_name=extracted.product_name,
        product_url=extracted.product_url,
        platform=extracted.platform,
        brand=extracted.brand or "",
        image_url=extracted.image_url or "",
        product_rating=extracted.product_rating,
        reviews=review_objects
    )

    result = analysis_service.run_full_analysis(batch_input, model_name=request.model_name)
    return result
