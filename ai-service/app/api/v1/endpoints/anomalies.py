from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_anomalies():
    """
    Placeholder for Anomaly Detection.
    Scans recent transactions/stock for weird patterns.
    """
    return {
        "anomalies": [
            {
                "type": "stock_drop",
                "message": "Product SKU-123 dropped 40% faster than usual.",
                "severity": "high"
            }
        ]
    }
