from fastapi import APIRouter

from .endpoints import anomalies, forecast, recommend, health, pricing

api_router = APIRouter()

api_router.include_router(forecast.router, prefix="/forecast", tags=["forecasting"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomaly-detection"])
api_router.include_router(recommend.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["pricing"])
