import os
import django
import asyncio
from uuid import uuid4

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from utils.ai_client import ai_client
from django.core.cache import cache

async def main():
    company_id = uuid4()
    
    print(f"\n--- Testing AIClient for Company: {company_id} ---")
    
    # Ensure cache is clear for this company
    await cache.adelete(f"ai_health_score_{company_id}")
    
    print("\n1. First call (Should hit FastAPI)...")
    result1 = await ai_client.get_health_score(company_id)
    print("Result:", result1)
    
    print("\n2. Second call (Should hit Redis Cache instantly)...")
    result2 = await ai_client.get_health_score(company_id)
    print("Result:", result2)
    
    print("\n--- Testing Forecast ---")
    hist_sales = [{"date": "2023-01-01", "quantity": 10}, {"date": "2023-01-02", "quantity": 12}, {"date": "2023-01-03", "quantity": 15}, {"date": "2023-01-04", "quantity": 10}, {"date": "2023-01-05", "quantity": 12}, {"date": "2023-01-06", "quantity": 15}, {"date": "2023-01-07", "quantity": 10}]
    forecast = await ai_client.forecast_demand("PROD-123", hist_sales, days=3)
    print("Forecast:", forecast)

if __name__ == "__main__":
    asyncio.run(main())
