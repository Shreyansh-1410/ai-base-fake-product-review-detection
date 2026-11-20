from fastapi import APIRouter, HTTPException, Response
from app.services.analysis_service import analysis_service
from app.services.pdf_generator import generate_pdf_report
from app.schemas.analysis import FullAnalysisResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{analysis_id}/pdf")
async def download_analysis_pdf(analysis_id: str):
    """Generates and downloads a publication-grade PDF report for a saved analysis."""
    analysis = analysis_service.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Analysis report '{analysis_id}' not found.")
    
    try:
        pdf_bytes = generate_pdf_report(analysis)
        filename = f"ReviewGuard_{analysis.product_name.replace(' ', '_')}_{analysis_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.post("/export/pdf")
async def export_current_analysis_pdf(analysis: FullAnalysisResponse):
    """Directly exports the provided analysis payload to PDF."""
    try:
        pdf_bytes = generate_pdf_report(analysis)
        filename = f"ReviewGuard_{analysis.product_name.replace(' ', '_')}_{analysis.analysis_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {str(e)}")
