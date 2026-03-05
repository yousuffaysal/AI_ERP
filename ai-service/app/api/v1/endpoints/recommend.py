from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RecommendRequest(BaseModel):
    customer_id: str
    past_orders: List[str]

@router.post("/")
def get_recommendations(request: RecommendRequest):
    """
    Placeholder for cross-selling/upselling recommendations.
    """
    return {
        "customer_id": request.customer_id,
        "recommended_products": ["PROD-456", "PROD-789"],
        "reason": "Frequently bought together"
    }
