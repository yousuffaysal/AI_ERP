import numpy as np
import pandas as pd
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Tuple

class PricingOptimizer:
    """
    Price optimization ML logic.
    Fits a polynomial regression curve (Demand Curve) to historical price-quantity pairs,
    and then calculates the price point that maximizes Revenue (Price * Quantity).
    """
    
    @staticmethod
    def optimize(historical_data: List[Dict[str, float]]) -> Tuple[float, float, float]:
        """
        Input format: [{"price": 10.0, "quantity_sold": 150.0}, ...]
        Returns:
            - optimal_price: The price that maximizes revenue
            - predicted_quantity: The quantity expected to be sold at that price
            - max_revenue: The resulting maximum revenue
        """
        if not historical_data or len(historical_data) < 3:
            # Not enough data points to fit a curve
            if historical_data:
                avg_price = sum(d["price"] for d in historical_data) / len(historical_data)
                return round(avg_price, 2), 0.0, 0.0
            return 0.0, 0.0, 0.0
            
        df = pd.DataFrame(historical_data)
        
        # We model Quantity = f(Price). Usually a downward sloping curve.
        X = df[['price']].values
        y = df['quantity_sold'].values
        
        # Degree 2 polynomial: Q = a*P^2 + b*P + c
        poly = PolynomialFeatures(degree=2)
        X_poly = poly.fit_transform(X)
        
        model = LinearRegression()
        model.fit(X_poly, y)
        
        # We want to find P that maximizes Revenue R = P * Q(P)
        # We use a grid search over a reasonable price range to find the discrete max revenue
        min_price = max(0.1, df['price'].min() * 0.5)
        max_price = df['price'].max() * 1.8
        
        test_prices = np.linspace(min_price, max_price, 1000)
        test_prices_poly = poly.transform(test_prices.reshape(-1, 1))
        
        predicted_quantities = model.predict(test_prices_poly)
        
        # Cannot sell negative quantity
        predicted_quantities = np.maximum(0, predicted_quantities)
        
        # Revenue = Price * Quantity
        revenues = test_prices * predicted_quantities
        
        best_idx = np.argmax(revenues)
        optimal_price = test_prices[best_idx]
        max_revenue = revenues[best_idx]
        pred_qty = predicted_quantities[best_idx]
        
        return round(float(optimal_price), 2), round(float(pred_qty), 2), round(float(max_revenue), 2)
