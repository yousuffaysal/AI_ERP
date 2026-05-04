import logging
import json
from typing import Dict, Any, List
from uuid import UUID

from django.conf import settings

logger = logging.getLogger(__name__)


def _get_groq_client():
    from groq import Groq
    return Groq(api_key=settings.GROQ_API_KEY)


def _chat(messages: List[Dict[str, str]], temperature: float = 0.3) -> str:
    """Send messages to Groq and return the text response."""
    client = _get_groq_client()
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def _parse_json(text: str) -> Dict[str, Any]:
    """Extract and parse JSON from an LLM response, stripping markdown fences."""
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON found in response: {text[:200]}")
    return json.loads(text[start:end])


class AIClient:
    """
    Groq-powered AI client for ERP intelligence features.
    Uses llama-3.3-70b-versatile via Groq's API for fast inference.
    """

    async def get_health_score(self, company_id: UUID, metrics: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a business health score. Tries Dedicated AI Service first, falls back to Groq.
        """
        # 1. Try Dedicated AI Service (FastAPI)
        try:
            import httpx
            url = f"{settings.AI_SERVICE_URL}/api/v1/health/score"
            async with httpx.AsyncClient() as http_client:
                response = await http_client.get(url, params={"company_id": str(company_id)}, timeout=5.0)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"AI Service returned {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"AI Service health score failed, falling back to Groq: {e}")

        # 2. Fallback to Groq LLM logic
        if not settings.GROQ_API_KEY:
            return self._fallback_health_score(company_id)

        metrics_text = json.dumps(metrics or {}, indent=2) if metrics else "No metrics provided."

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a senior ERP business analyst. Analyze company metrics and return "
                        "a JSON object with these exact keys: score (float 0-100), status (one of: "
                        "Excellent/Good/Fair/Poor), explanation (2-3 sentences), "
                        "recommendations (list of 3 strings). Respond with JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Company ID: {company_id}\n\nMetrics:\n{metrics_text}",
                },
            ]
            # _chat is synchronous, so we run it in a thread to avoid blocking the event loop
            import asyncio
            raw = await asyncio.to_thread(_chat, messages)
            data = _parse_json(raw)
            data["company_id"] = str(company_id)
            return data

        except Exception as e:
            logger.error(f"Groq health score error: {e}")
            return self._fallback_health_score(company_id)

    def forecast_demand(self, product_id: str, historical_sales: List[Dict[str, Any]], days: int = 30) -> Dict[str, Any]:
        """
        Forecast demand for a product using historical sales data.
        """
        if not settings.GROQ_API_KEY:
            return {"error": "AI not configured", "forecast": []}

        history_text = json.dumps(historical_sales[-20:], indent=2)  # last 20 data points

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are an expert demand forecasting analyst. Given historical sales data, "
                        "return a JSON object with these keys: "
                        "predicted_demand (integer, units for the next period), "
                        "trend (one of: increasing/stable/decreasing), "
                        "confidence (float 0-1), "
                        "reorder_suggestion (string), "
                        "insights (list of 2 strings). "
                        "Respond with JSON only, no markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Product ID: {product_id}\n"
                        f"Forecast horizon: {days} days\n"
                        f"Historical sales (most recent last):\n{history_text}"
                    ),
                },
            ]
            raw = _chat(messages)
            data = _parse_json(raw)
            data["product_id"] = product_id
            data["days"] = days
            return data

        except Exception as e:
            logger.error(f"Groq demand forecast error: {e}")
            return {"product_id": product_id, "error": str(e), "forecast": []}

    def optimize_pricing(self, product_id: str, historical_data: List[Dict[str, float]],
                         unit_cost: float, current_velocity: float) -> Dict[str, Any]:
        """
        Recommend optimal pricing based on cost, velocity, and historical performance.
        """
        if not settings.GROQ_API_KEY:
            return {"error": "AI not configured"}

        history_text = json.dumps(historical_data[-10:], indent=2)

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a pricing optimization expert. Given product cost and sales velocity, "
                        "return a JSON object with these keys: "
                        "recommended_price (float), "
                        "min_price (float), "
                        "max_price (float), "
                        "margin_percent (float), "
                        "strategy (string: premium/competitive/penetration), "
                        "rationale (string, 2 sentences). "
                        "Respond with JSON only, no markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Product ID: {product_id}\n"
                        f"Unit cost: ${unit_cost}\n"
                        f"Current sales velocity: {current_velocity} units/day\n"
                        f"Historical price/sales data:\n{history_text}"
                    ),
                },
            ]
            raw = _chat(messages)
            data = _parse_json(raw)
            data["product_id"] = product_id
            return data

        except Exception as e:
            logger.error(f"Groq pricing optimization error: {e}")
            return {"product_id": product_id, "error": str(e)}

    def detect_anomalies(self, data: List[Dict[str, Any]], feature_cols: List[str]) -> Dict[str, Any]:
        """
        Detect anomalies and suspicious patterns in financial/operational data.
        """
        if not settings.GROQ_API_KEY:
            return {"anomalies_detected": 0, "anomalous_data": []}

        sample = json.dumps(data[:30], indent=2)

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a financial anomaly detection expert. Analyze the provided data and "
                        "return a JSON object with: "
                        "anomalies_detected (integer), "
                        "risk_level (one of: low/medium/high/critical), "
                        "anomalous_indices (list of integers), "
                        "findings (list of strings describing each anomaly), "
                        "recommended_action (string). "
                        "Respond with JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Features to analyze: {', '.join(feature_cols)}\n\n"
                        f"Data sample:\n{sample}"
                    ),
                },
            ]
            raw = _chat(messages)
            return _parse_json(raw)

        except Exception as e:
            logger.error(f"Groq anomaly detection error: {e}")
            return {"anomalies_detected": 0, "anomalous_data": [], "error": str(e)}

    def generate_insight(self, context: str, question: str = None) -> str:
        """
        Generate a free-form AI insight or answer a business question about ERP data.
        """
        if not settings.GROQ_API_KEY:
            return "AI insights unavailable. Configure GROQ_API_KEY to enable."

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a senior ERP business analyst. Give concise, actionable insights "
                        "based on company data. Be specific, use numbers when available. "
                        "Keep responses under 150 words."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question or 'What are the key insights and recommended actions?'}",
                },
            ]
            return _chat(messages, temperature=0.5)

        except Exception as e:
            logger.error(f"Groq insight error: {e}")
            return f"Unable to generate insight: {str(e)}"

    def _fallback_health_score(self, company_id: UUID) -> Dict[str, Any]:
        return {
            "company_id": str(company_id),
            "score": 0.0,
            "status": "Unknown",
            "explanation": "AI service unavailable. Configure GROQ_API_KEY to enable.",
            "recommendations": [],
        }


# Singleton
ai_client = AIClient()
