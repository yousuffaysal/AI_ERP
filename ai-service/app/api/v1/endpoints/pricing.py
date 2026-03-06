from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.pricing import PricingOptimizer

router = APIRouter()

class PricingRequest(BaseModel):
    product_id: str
    historical_data: List[Dict[str, float]]
    unit_cost: float
    current_velocity: float
    competitor_price: Optional[float] = None

@router.post("/optimize")
def optimize_pricing(request: PricingRequest):
    """
    Intelligent Machine Learning Price Optimization.
    Calculates the exact price point to maximize Profit Margins based on 
    Demand Elasticity, Unit Cost, and Competitor parameters.
    """
    optimal_price, pred_qty, max_profit, conf = PricingOptimizer.optimize(
        historical_data=request.historical_data,
        unit_cost=request.unit_cost,
        current_velocity=request.current_velocity,
        competitor_price=request.competitor_price
    )
    
    return {
        "product_id": request.product_id,
        "optimal_price": optimal_price,
        "predicted_quantity": pred_qty,
        "projected_profit": max_profit,
        "confidence_score": conf
    }
