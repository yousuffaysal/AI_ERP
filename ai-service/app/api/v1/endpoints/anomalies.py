from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.anomaly import AnomalyDetector

router = APIRouter()

class AnomalyRequest(BaseModel):
    # Expects [{"date": "2024-01-01", "value": 1450}]
    time_series: List[Dict[str, Any]]
    # Key in the dict to analyze
    feature_col: str = "value"
    # What % of the dataset is expected to be anomalous out of the box (e.g. 0.05 = 5%)
    contamination: float = 0.05

@router.post("/detect")
def detect_anomalies(request: AnomalyRequest):
    """
    Machine Learning Anomaly Detection using Isolation Forest.
    Pass in daily sales, metrics, or server response times.
    """
    results = AnomalyDetector.detect(
        time_series=request.time_series,
        feature_col=request.feature_col,
        contamination=request.contamination
    )
    
    anomalies = [r for r in results if r["is_anomaly"]]
    
    return {
        "total_analyzed": len(results),
        "anomalies_detected": len(anomalies),
        "anomalous_data": anomalies
    }
