import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Tuple, Optional

class PricingOptimizer:
    """
    Advanced Intelligent Pricing ML logic.
    Models price elasticity alongside feature variables like sales_velocity, margin, and competitor_price.
    """
    
    @staticmethod
    def optimize(
        historical_data: List[Dict[str, float]],
        unit_cost: float,
        current_velocity: float,
        competitor_price: Optional[float] = None
    ) -> Tuple[float, float, float, float]:
        """
        Input format: [{"price": 10.0, "quantity_sold": 150.0}, ...]
        Returns:
            - optimal_price
            - predicted_quantity at optimal price
            - max_profit (Price - Cost) * Quantity
            - confidence_score (0-1.0)
        """
        if not historical_data or len(historical_data) < 3:
            return 0.0, 0.0, 0.0, 0.0
            
        df = pd.DataFrame(historical_data)
        
        # In a real multivariate model, historical_data would include competitor_price at that time, etc.
        # Here we do a standard Price -> Quantity regression, and then adjust the "optimal" logic
        # to maximize Profit Margin, rather than gross Revenue, and apply penalties for
        # drifting too far from current market realities (velocity, competitor).
        
        X = df[['price']].values
        y = df['quantity_sold'].values
        
        # Fit Linear model (or Polynomial degree 1). Note real elasticity curves are power or exp curves.
        model = LinearRegression()
        model.fit(X, y)
        
        # Score the R^2 to determine our confidence in the demand curve
        confidence_score = float(model.score(X, y))
        # If R^2 is negative or very low, floor the confidence
        confidence_score = max(0.1, min(1.0, confidence_score))
        
        min_price = unit_cost * 1.05 # At least 5% margin
        max_price = df['price'].max() * 2.0
        
        # If competitor price exists, we cap our upper search near it to remain competitive
        if competitor_price:
            max_price = min(max_price, competitor_price * 1.3)
            
        test_prices = np.linspace(min_price, max_price, 1000)
        
        # Predict Quantity for each test price
        predicted_quantities = model.predict(test_prices.reshape(-1, 1))
        
        # Can't sell negative
        predicted_quantities = np.maximum(0, predicted_quantities)
        
        # We maximize PROFIT, not Revenue
        # Profit = (Price - Cost) * Quantity
        profits = (test_prices - unit_cost) * predicted_quantities
        
        # Penalize prices that would drastically reduce our current sales velocity
        # If a price drops our velocity by >50%, we subtract heavily from its "profit" score
        for i, q in enumerate(predicted_quantities):
            if q < (current_velocity * 0.5):
                profits[i] *= 0.5
        
        best_idx = np.argmax(profits)
        optimal_price = test_prices[best_idx]
        max_profit = profits[best_idx]
        pred_qty = predicted_quantities[best_idx]
        
        return (
            round(float(optimal_price), 2), 
            round(float(pred_qty), 2), 
            round(float(max_profit), 2),
            round(confidence_score, 2)
        )
