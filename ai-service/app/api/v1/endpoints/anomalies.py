from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.anomaly import AnomalyDetector

router = APIRouter()

class AnomalyRequest(BaseModel):
    # Expects [{"id": "txn1", "amount": 1450, "employee_id": 5}]
    data: List[Dict[str, Any]]
    # Keys in the dict to analyze for outliers/duplicates
    feature_cols: List[str] = ["amount"]
    # What % of the dataset is expected to be anomalous out of the box (e.g. 0.05 = 5%)
    contamination: float = 0.05

@router.post("/detect")
def detect_anomalies(request: AnomalyRequest):
    """
    Advanced Machine Learning Anomaly Detection.
    Detects abnormal invoices, suspicious employee sales spikes, and duplicate transactions.
    Provides explainable reasons for every flagged anomaly.
    """
    results = AnomalyDetector.detect(
        data=request.data,
        feature_cols=request.feature_cols,
        contamination=request.contamination
    )
    
    anomalies = [r for r in results if r["is_anomaly"]]
    
    return {
        "total_analyzed": len(results),
        "anomalies_detected": len(anomalies),
        "anomalous_data": anomalies
    }
