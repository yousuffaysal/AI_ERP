import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import warnings
from typing import List, Dict, Any, Tuple

# Suppress statsmodels convergence warnings for the API
warnings.filterwarnings("ignore")

class DemandForecaster:
    """
    Demand Forecasting core ML logic using ARIMA (AutoRegressive Integrated Moving Average).
    """
    
    @staticmethod
    def forecast(historical_sales: List[Dict[str, Any]], days_to_predict: int = 30) -> Tuple[List[Dict[str, Any]], int, Dict[str, int]]:
        """
        Input format for historical_sales: [{"date": "2023-01-01", "quantity": 10}, ...]
        Returns:
            - forecast_points: [{"date": "...", "predicted_demand": 12}, ...]
            - total_demand: Sum of predictions over the horizon
            - confidence_interval: {"lower": ..., "upper": ...}
        """
        if not historical_sales or len(historical_sales) < 7:
            # Not enough data for ARIMA, fallback to returning 0
            return [], 0, {"lower": 0, "upper": 0}
            
        df = pd.DataFrame(historical_sales)
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate by day in case there are multiple sales entries per day
        df = df.groupby('date')['quantity'].sum().reset_index()
        df.set_index('date', inplace=True)
        
        # Reindex to fill missing days with 0 (no sales on those days)
        idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
        df = df.reindex(idx, fill_value=0)
        
        # Fit ARIMA model
        # Using (1, 1, 1) as a general default for short general sales sequences
        try:
            model = ARIMA(df['quantity'], order=(1, 1, 1))
            fitted = model.fit()
            
            # Forecast
            forecast_result = fitted.get_forecast(steps=days_to_predict)
            predictions = forecast_result.predicted_mean
            conf_int = forecast_result.conf_int()
            
            # Prepare standard output
            forecast_points = []
            for date, pred in predictions.items():
                val = max(0, int(round(pred))) # Can't have negative demand
                forecast_points.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "predicted_demand": val
                })
                
            total_predicted = sum(p["predicted_demand"] for p in forecast_points)
            
            # Calculate aggregate confidence interval sums for the total horizon
            lower_sum = max(0, int(round(conf_int.iloc[:, 0].sum())))
            upper_sum = max(0, int(round(conf_int.iloc[:, 1].sum())))
            
            confidence_interval = {
                "lower": lower_sum,
                "upper": upper_sum
            }
            
            return forecast_points, total_predicted, confidence_interval
            
        except Exception as e:
            # Fallback to simple moving average if ARIMA fails entirely (e.g. constant 0 data)
            avg_daily = df['quantity'].mean()
            total_predicted = int(round(avg_daily * days_to_predict))
            
            last_date = df.index.max()
            forecast_points = []
            for i in range(1, days_to_predict + 1):
                next_date = last_date + pd.Timedelta(days=i)
                forecast_points.append({
                    "date": next_date.strftime("%Y-%m-%d"),
                    "predicted_demand": max(0, int(round(avg_daily)))
                })
                
            return forecast_points, total_predicted, {
                "lower": int(total_predicted * 0.8), 
                "upper": int(total_predicted * 1.2)
            }
