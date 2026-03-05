from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.health_service import BusinessHealthService

router = APIRouter()

@router.get("/score")
async def get_health_score(
    company_id: UUID = Query(..., description="The ID of the company to analyze"),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate the real-time Business Health Score.
    Metrics analyzed:
    - Revenue Growth (30%)
    - Cash Stability (30%)
    - Inventory Turnover (20%)
    - Employee Productivity (20%)
    """
    health_service = BusinessHealthService(db, company_id)
    result = await health_service.get_health_score()
    
    # Add the requested company ID to the response standard
    result["company_id"] = str(company_id)
    return result
