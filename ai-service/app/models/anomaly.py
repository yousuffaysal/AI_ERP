import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetector:
    """
    Anomaly detection ML logic using Scikit-Learn IsolationForest.
    Identifies outliers in time-series data without requiring labeled examples.
    """
    
    @staticmethod
    def detect(time_series: List[Dict[str, Any]], feature_col: str = "value", contamination: float = 0.05) -> List[Dict[str, Any]]:
        """
        Input format: [{"date": "2023-01-01", "value": 1500}, ...]
        Returns the original list, but appending 'is_anomaly' (bool) and 'anomaly_score' (float).
        """
        if not time_series or len(time_series) < 10:
            # Need a baseline amount of data to correctly find anomalies
            results = []
            for item in time_series:
                new_item = item.copy()
                new_item["is_anomaly"] = False
                new_item["anomaly_score"] = 0.0
                results.append(new_item)
            return results
            
        df = pd.DataFrame(time_series)
        
        # Prepare 2D array feature for Scikit-Learn IsolationForest
        X = df[[feature_col]].fillna(0).values
        
        # Fit model
        model = IsolationForest(contamination=contamination, random_state=42)
        model.fit(X)
        
        # Predict endpoints: returns 1 for normal, -1 for anomaly
        predictions = model.predict(X)
        
        # Raw decision scores: lower score implies greater abnormality
        scores = model.decision_function(X)
        
        # Map values back into standard dict representation
        results = []
        for idx, row in df.iterrows():
            item = row.to_dict()
            item["is_anomaly"] = bool(predictions[idx] == -1)
            item["anomaly_score"] = float(scores[idx])
            results.append(item)
            
        return results
