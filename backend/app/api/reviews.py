from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Optional
from app.schemas.review import BatchReviewInput, SingleReviewInput, ProductVerificationInput
from app.schemas.analysis import FullAnalysisResponse
from app.services.analysis_service import analysis_service
from app.services.file_parser import parse_uploaded_file

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/analyze", response_model=FullAnalysisResponse)
async def analyze_reviews(
    batch_input: BatchReviewInput,
    model_name: Optional[str] = Query(default="Logistic Regression")
):
    """
    Submits a batch of customer reviews for full AI/NLP analysis.
    """
    if not batch_input.reviews:
        raise HTTPException(status_code=400, detail="At least one customer review must be provided.")
    try:
        result = analysis_service.run_full_analysis(batch_input, model_name=model_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.post("/upload", response_model=FullAnalysisResponse)
async def upload_reviews_file(
    file: UploadFile = File(...),
    product_name: Optional[str] = Form(default=None),
    model_name: Optional[str] = Form(default="Logistic Regression"),
    has_verification_evidence: bool = Form(default=False),
    serial_number: Optional[str] = Form(default=None),
    inspection_result: Optional[str] = Form(default="not_verified"),
    evidence_notes: Optional[str] = Form(default=None)
):
    """
    Uploads a CSV or Excel file containing customer reviews.
    Automatically parses column aliases and performs full analysis.
    """
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx/.xls files are supported.")
        
    try:
        content = await file.read()
        detected_name, parsed_reviews = parse_uploaded_file(content, file.filename)
        
        final_product_name = product_name.strip() if (product_name and product_name.strip()) else detected_name
        
        verification = ProductVerificationInput(
            has_verification_evidence=has_verification_evidence,
            serial_number=serial_number,
            inspection_result=inspection_result,
            evidence_notes=evidence_notes or ""
        )
        
        batch_input = BatchReviewInput(
            product_name=final_product_name,
            reviews=parsed_reviews,
            product_verification=verification
        )
        
        result = analysis_service.run_full_analysis(batch_input, model_name=model_name)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
