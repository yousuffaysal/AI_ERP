from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.pricing import PricingOptimizer

router = APIRouter()

class PricingRequest(BaseModel):
    # Expects [{"price": 10.0, "quantity_sold": 150.0}]
    historical_data: List[Dict[str, float]]
    product_id: str

@router.post("/optimize")
def optimize_pricing(request: PricingRequest):
    """
    Machine Learning Price Optimization.
    Finds the price point that maximizes revenue based on historical demand elasticity.
    """
    optimal_price, pred_qty, max_rev = PricingOptimizer.optimize(
        historical_data=request.historical_data
    )
    
    return {
        "product_id": request.product_id,
        "optimal_price": optimal_price,
        "predicted_quantity_at_optimal_price": pred_qty,
        "projected_revenue": max_rev
    }
