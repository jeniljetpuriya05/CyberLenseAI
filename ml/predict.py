"""
ML Prediction Service for CyberLens AI.
Loads trained Random Forest model and feature schema to predict
threat status and confidence probabilities for network flows.
"""
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging
import joblib
import numpy as np
import pandas as pd

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ml.packet_features.feature_extractor import validate_feature_vector
from ml.preprocessing.preprocessing import bin_destination_port

logger = logging.getLogger('CyberLens.ML.Predict')
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')

MODEL_DIR = Path(__file__).resolve().parent / "models"
DEFAULT_MODEL_PATH = MODEL_DIR / "random_forest.pkl"
DEFAULT_SCHEMA_PATH = MODEL_DIR / "feature_columns.pkl"


class ThreatPredictor:
    """Singleton/reusable wrapper for loading model and executing predictions."""

    _instance: Optional['ThreatPredictor'] = None

    def __init__(self, model_path: Optional[Path] = None, schema_path: Optional[Path] = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.schema_path = Path(schema_path) if schema_path else DEFAULT_SCHEMA_PATH
        self.model = None
        self.feature_columns = None
        self._load_artifacts()

    def _load_artifacts(self):
        """Load model and schema files."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained ML model not found at {self.model_path}. Train the model first using train_model.py."
            )
        if not self.schema_path.exists():
            raise FileNotFoundError(
                f"Feature schema not found at {self.schema_path}. Train the model first to generate schema."
            )

        logger.info(f"[ML] Loading Random Forest model from {self.model_path}...")
        self.model = joblib.load(self.model_path)
        logger.info(f"[ML] Loading Feature Schema from {self.schema_path}...")
        self.feature_columns = joblib.load(self.schema_path)
        logger.info(f"[ML] Model and schema loaded successfully. Feature count: {len(self.feature_columns)}")

    @classmethod
    def get_instance(cls, force_reload: bool = False) -> 'ThreatPredictor':
        """Get or create singleton instance."""
        if cls._instance is None or force_reload:
            cls._instance = cls()
        return cls._instance

    def predict_flows(
        self,
        features_df: pd.DataFrame,
        flow_metadata: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Run inference on flow features DataFrame.

        Returns:
            Dict containing:
                total_flows: int
                normal_flows: int
                malicious_flows: int
                results: List of flow prediction records
        """
        if features_df.empty:
            return {
                "total_flows": 0,
                "normal_flows": 0,
                "malicious_flows": 0,
                "malicious_percentage": 0.0,
                "results": [],
            }

        # Validate schema and order
        validate_feature_vector(features_df, self.feature_columns)

        # Arrange features in exactly the expected schema order
        ordered_df = features_df[self.feature_columns].copy()
        if "Destination Port" in ordered_df.columns:
            ordered_df["Destination Port"] = bin_destination_port(ordered_df["Destination Port"])

        # Predictions (0 = Normal, 1 = Malicious)
        predictions = self.model.predict(ordered_df)

        # Probability confidence
        has_proba = hasattr(self.model, "predict_proba")
        if has_proba:
            probabilities = self.model.predict_proba(ordered_df)
            classes = list(self.model.classes_)
            malicious_idx = classes.index(1) if 1 in classes else 1
        else:
            probabilities = None
            malicious_idx = 0

        results = []
        normal_count = 0
        malicious_count = 0

        for i, pred in enumerate(predictions):
            pred_int = int(pred)
            is_malicious = (pred_int == 1)

            if probabilities is not None:
                class_idx = classes.index(pred_int) if pred_int in classes else 0
                confidence = float(probabilities[i][class_idx])
                malicious_prob = float(probabilities[i][malicious_idx]) if len(classes) > malicious_idx else float(pred_int)
            else:
                confidence = 1.0
                malicious_prob = float(pred_int)

            if is_malicious:
                malicious_count += 1
                label = "Malicious"
            else:
                normal_count += 1
                label = "Normal"

            meta = flow_metadata[i] if flow_metadata and i < len(flow_metadata) else {}

            flow_res = {
                "flow_id": meta.get("flow_id", f"FLOW-{i+1:04d}"),
                "src_ip": meta.get("src_ip", "Unknown"),
                "dst_ip": meta.get("dst_ip", "Unknown"),
                "src_port": meta.get("src_port", 0),
                "dst_port": meta.get("dst_port", 0),
                "protocol": meta.get("protocol", "Unknown"),
                "prediction": pred_int,
                "label": label,
                "confidence": round(confidence, 4),
                "malicious_probability": round(malicious_prob, 4),
                "duration_seconds": meta.get("duration_seconds", 0.0),
                "total_packets": meta.get("total_packets", 0),
                "total_bytes": meta.get("total_bytes", 0),
            }
            results.append(flow_res)

        total_flows = len(results)
        mal_pct = round((malicious_count / total_flows) * 100.0, 2) if total_flows > 0 else 0.0

        return {
            "total_flows": total_flows,
            "normal_flows": normal_count,
            "malicious_flows": malicious_count,
            "malicious_percentage": mal_pct,
            "results": results,
        }


def predict_pcap_flows(features_df: pd.DataFrame, flow_metadata: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Helper functional interface to predict flows using active model."""
    predictor = ThreatPredictor.get_instance()
    return predictor.predict_flows(features_df, flow_metadata)
