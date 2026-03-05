from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.forecasting import DemandForecaster

router = APIRouter()

class ForecastRequest(BaseModel):
    product_id: str
    historical_sales: List[Dict[str, Any]]
    days_to_predict: int = 30
    current_stock: int = 0

@router.post("/demand/")
def predict_demand(request: ForecastRequest):
    """
    Machine Learning Demand Forecasting using ARIMA.
    Analyzes historical time-series data to predict future demand volume.
    """
    forecast_points, total_demand, conf_int = DemandForecaster.forecast(
        historical_sales=request.historical_sales,
        days_to_predict=request.days_to_predict
    )
    
    # Simple reorder logic: if we predict we need 100, but have 40, restock 60.
    suggested_restock = max(0, total_demand - request.current_stock)
    
    return {
        "product_id": request.product_id,
        "forecast": forecast_points,
        "total_predicted_demand": total_demand,
        "confidence_interval": conf_int,
        "suggested_restock_quantity": suggested_restock
    }
