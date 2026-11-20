from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.analysis_service import analysis_service
from app.sqlite_db import delete_analysis_record, clear_all_history

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/history/list")
async def get_analysis_history(limit: int = 30):
    """Returns recent analysis summaries stored permanently in SQLite database."""
    try:
        reports = analysis_service.get_history(limit=limit)
        return {"count": len(reports), "reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/clear")
async def clear_history():
    """Clears all stored analysis reports from SQLite."""
    try:
        deleted = clear_all_history()
        return {"status": "success", "deleted_count": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Deletes an analysis report by ID from SQLite."""
    success = delete_analysis_record(analysis_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Analysis report '{analysis_id}' not found.")
    return {"status": "deleted", "analysis_id": analysis_id}

@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Retrieves an existing analysis by ID from SQLite database."""
    result = analysis_service.get_analysis_by_id(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Analysis report '{analysis_id}' not found.")
    return result
