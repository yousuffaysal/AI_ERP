import logging
import httpx
from typing import Dict, Any, List, Optional
from uuid import UUID

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class AIClient:
    """
    Asynchronous HTTP Client connecting the Django Backend to the FastAPI AI Service.
    Implements timeouts, error handling, and Redis caching.
    """
    
    def __init__(self):
        self.base_url = settings.AI_SERVICE_URL.rstrip('/')
        # Default 5 second timeout to prevent hanging the Django WSGI/ASGI workers
        self.timeout = httpx.Timeout(5.0, connect=2.0)
        
    async def get_health_score(self, company_id: UUID) -> Dict[str, Any]:
        """
        Fetches the Business Health Score.
        Caches the result for 1 hour to avoid re-aggregating complex DB queries on every dashboard load.
        """
        cache_key = f"ai_health_score_{company_id}"
        
        # 1. Check Redis Cache
        cached_result = await cache.aget(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for health score: {company_id}")
            return cached_result
            
        # 2. Make Async HTTP Request
        url = f"{self.base_url}/api/v1/health/score"
        params = {"company_id": str(company_id)}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                # 3. Save to Redis Cache (3600 seconds = 1 hour)
                await cache.aset(cache_key, data, timeout=3600)
                
                return data
                
        except httpx.TimeoutException:
            logger.error(f"AI Service Timeout for health score: {company_id}")
            return self._fallback_health_score(company_id)
            
        except httpx.HTTPError as e:
            logger.error(f"AI Service HTTP Error: {str(e)}")
            return self._fallback_health_score(company_id)

    async def forecast_demand(self, product_id: str, historical_sales: List[Dict[str, Any]], days: int = 30) -> Dict[str, Any]:
        """
        Requests ARIMA demand forecasting.
        Caches for 24 hours since forecasts don't change minute-by-minute.
        """
        # Hashing the request parameters could be safer, but product_id is sufficient for demo cache key
        cache_key = f"ai_forecast_{product_id}_{days}"
        
        cached_result = await cache.aget(cache_key)
        if cached_result:
            return cached_result
            
        url = f"{self.base_url}/api/v1/forecast/demand/"
        payload = {
            "product_id": str(product_id),
            "historical_sales": historical_sales,
            "days_to_predict": days
        }
        
        try:
            # ML inference might take longer, increase timeout slightly
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Cache for 24 hours limit
                await cache.aset(cache_key, data, timeout=86400)
                return data
                
        except httpx.RequestError as e:
            logger.error(f"AI Service Demand Forecast Error: {str(e)}")
            raise e # Let Django handle or return generic error to frontend

    async def detect_anomalies(self, data: List[Dict[str, Any]], feature_cols: List[str]) -> Dict[str, Any]:
        """
        Runs Isolation Forest anomaly detection.
        Usually run on demand, caching might not be appropriate if passing live changing arrays,
        so we skip caching here.
        """
        url = f"{self.base_url}/api/v1/anomalies/detect"
        payload = {
            "data": data,
            "feature_cols": feature_cols,
            "contamination": 0.05
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
                
        except httpx.RequestError as e:
            logger.error(f"AI Service Anomaly Detection Error: {str(e)}")
            return {"anomalies_detected": 0, "anomalous_data": [], "error": str(e)}

    async def optimize_pricing(self, product_id: str, historical_data: List[Dict[str, float]], unit_cost: float, current_velocity: float) -> Dict[str, Any]:
        """
        Requests Intelligent Pricing bounds.
        """
        url = f"{self.base_url}/api/v1/pricing/optimize"
        payload = {
            "product_id": str(product_id),
            "historical_data": historical_data,
            "unit_cost": unit_cost,
            "current_velocity": current_velocity
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
                
        except httpx.RequestError as e:
            logger.error(f"AI Service Pricing Optimization Error: {str(e)}")
            raise e

    def _fallback_health_score(self, company_id: UUID) -> Dict[str, Any]:
        """Safe fallback if FastAPI is down."""
        return {
            "company_id": str(company_id),
            "score": 0.0,
            "status": "Unknown",
            "explanation": "AI Service currently unavailable. Try again later.",
            "metrics": {}
        }

# Singleton instance for easy importing
ai_client = AIClient()
