import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetector:
    """
    Advanced Anomaly detection ML logic using Scikit-Learn IsolationForest.
    Detects outliers across multiple dimensions (e.g. amount + frequency) and generates explainable reasons.
    """
    
    @staticmethod
    def detect(data: List[Dict[str, Any]], feature_cols: List[str], contamination: float = 0.05) -> List[Dict[str, Any]]:
        """
        Input format: [{"id": "inv-1", "amount": 1500, "employee_id": "emp-1"}, ...]
        feature_cols: ["amount"] or ["amount", "duration"], etc.
        """
        if not data or len(data) < 10:
            results = []
            for item in data:
                new_item = item.copy()
                new_item["is_anomaly"] = False
                new_item["anomaly_score"] = 0.0
                new_item["reason"] = "Insufficient data to detect anomalies"
                results.append(new_item)
            return results
            
        df = pd.DataFrame(data)
        
        # Check for exact duplicates based on the features provided
        # A transaction is a duplicate if all feature columns match exactly another transaction
        # and they are close in time (we'll just flag exact feature matches for now)
        duplicate_mask = df.duplicated(subset=feature_cols, keep=False)
        
        # Ensure all feature columns exist in the dataframe
        valid_features = [col for col in feature_cols if col in df.columns]
        if not valid_features:
            raise ValueError(f"None of the feature columns {feature_cols} found in data")

        # Fill missing numeric values with 0
        X = df[valid_features].select_dtypes(include=[np.number]).fillna(0).values
        
        if X.shape[1] == 0:
             raise ValueError("No numeric features found for Isolation Forest")

        # Fit model
        model = IsolationForest(contamination=contamination, random_state=42)
        model.fit(X)
        
        # Predict endpoints: returns 1 for normal, -1 for anomaly
        predictions = model.predict(X)
        
        # Raw decision scores: lower score implies greater abnormality
        scores = model.decision_function(X)
        
        # Calculate feature medians to explain *why* it's anomalous
        medians = df[valid_features].median()
        
        results = []
        for idx, row in df.iterrows():
            item = row.to_dict()
            is_iso_anomaly = bool(predictions[idx] == -1)
            is_duplicate = bool(duplicate_mask.iloc[idx])
            
            item["is_anomaly"] = is_iso_anomaly or is_duplicate
            item["anomaly_score"] = float(scores[idx])
            
            reasons = []
            if is_duplicate:
                reasons.append(f"Exact duplicate detected for features: {', '.join(valid_features)}")
                
            if is_iso_anomaly:
                # Find which feature drove the anomaly
                for col in valid_features:
                    val = row[col]
                    median_val = medians[col]
                    if pd.api.types.is_numeric_dtype(type(val)):
                        if median_val > 0 and val > (median_val * 3):
                            reasons.append(f"Unusually high {col} ({val} vs median {median_val})")
                        elif median_val > 0 and val < (median_val * 0.1):
                            reasons.append(f"Unusually low {col} ({val} vs median {median_val})")
                
                if not reasons:
                    reasons.append("Data pattern structure irregular compared to dataset norms")
                    
            item["reason"] = " | ".join(reasons) if item["is_anomaly"] else None
            results.append(item)
            
        return results
