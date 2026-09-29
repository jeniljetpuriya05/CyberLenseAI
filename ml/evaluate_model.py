"""
Model evaluation module for CyberLens AI.
Calculates Accuracy, Precision, Recall, F1-Score, Confusion Matrix,
and generates JSON metrics and visual plots.
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from typing import Dict, Any, Optional
import json
import logging
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

logger = logging.getLogger('CyberLens.ML.Evaluation')
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    save_results: bool = True,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Evaluate binary classification predictions.
    Generates dynamic scikit-learn metrics and confusion matrix plot.
    """
    out_dir = Path(output_dir) if output_dir else RESULTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred)
    report_str = classification_report(y_true, y_pred, target_names=["Normal (0)", "Malicious (1)"], zero_division=0)
    report_dict = classification_report(y_true, y_pred, target_names=["Normal (0)", "Malicious (1)"], output_dict=True, zero_division=0)

    metrics = {
        "accuracy": round(acc, 6),
        "precision": round(prec, 6),
        "recall": round(rec, 6),
        "f1_score": round(f1, 6),
        "confusion_matrix": cm.tolist(),
        "total_samples": int(len(y_true)),
        "true_negatives": int(cm[0, 0]) if cm.shape == (2, 2) else 0,
        "false_positives": int(cm[0, 1]) if cm.shape == (2, 2) else 0,
        "false_negatives": int(cm[1, 0]) if cm.shape == (2, 2) else 0,
        "true_positives": int(cm[1, 1]) if cm.shape == (2, 2) else 0,
        "classification_report": report_dict,
    }

    print("\n" + "=" * 60)
    print("           CYBERLENS AI — MODEL EVALUATION RESULTS")
    print("=" * 60)
    print(f"Total Test Samples: {len(y_true):,}")
    print(f"Accuracy:           {acc * 100:.2f}% ({acc:.6f})")
    print(f"Precision:          {prec * 100:.2f}% ({prec:.6f})")
    print(f"Recall:             {rec * 100:.2f}% ({rec:.6f})")
    print(f"F1-Score:           {f1 * 100:.2f}% ({f1:.6f})")
    print("\nConfusion Matrix:")
    print(f"  [TN={cm[0,0] if cm.shape==(2,2) else 0:8d}  FP={cm[0,1] if cm.shape==(2,2) else 0:8d}]")
    print(f"  [FN={cm[1,0] if cm.shape==(2,2) else 0:8d}  TP={cm[1,1] if cm.shape==(2,2) else 0:8d}]")
    print("\nDetailed Classification Report:")
    print(report_str)
    print("=" * 60 + "\n")

    if save_results:
        # Save metrics JSON
        metrics_file = out_dir / "model_metrics.json"
        with open(metrics_file, "w") as f:
            json.dump(metrics, f, indent=4)
        logger.info(f"[ML] Metrics saved to {metrics_file}")

        # Save Confusion Matrix Plot
        cm_plot_file = out_dir / "confusion_matrix.png"
        plt.figure(figsize=(6, 5))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=["Normal (0)", "Malicious (1)"],
            yticklabels=["Normal (0)", "Malicious (1)"],
        )
        plt.title("CyberLens AI — Confusion Matrix")
        plt.xlabel("Predicted Label")
        plt.ylabel("Actual Label")
        plt.tight_layout()
        plt.savefig(cm_plot_file, dpi=300)
        plt.close()
        logger.info(f"[ML] Confusion matrix heatmap saved to {cm_plot_file}")

    return metrics


if __name__ == "__main__":
    from ml.dataset.loader import load_dataset
    from ml.preprocessing.preprocessing import preprocess_data, split_train_test

    model_file = Path(__file__).resolve().parent / "models" / "random_forest.pkl"
    schema_file = Path(__file__).resolve().parent / "models" / "feature_columns.pkl"

    if not model_file.exists() or not schema_file.exists():
        print(f"Trained ML model or schema not found in {model_file.parent}. Train the model first.")
        sys.exit(1)

    print("[ML] Loading model and dataset for evaluation...")
    model = joblib.load(model_file)
    schema = joblib.load(schema_file)

    try:
        raw_df = load_dataset()
        X, y, orig_labels = preprocess_data(raw_df, feature_columns=schema)
        _, X_test, _, y_test, _, _ = split_train_test(X, y, orig_labels, test_size=0.2, random_state=42)
        y_pred = model.predict(X_test)
        evaluate_predictions(y_test.values, y_pred)
    except FileNotFoundError as e:
        print(f"[ML] Error: {e}")
        sys.exit(1)
