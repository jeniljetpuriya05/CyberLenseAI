"""
Model training script for CyberLens AI.
Loads CIC-IDS2017 dataset, extracts canonical flow features, performs 80/20 stratified
split, trains Random Forest Classifier, evaluates on test set, and saves model artifacts.
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import argparse
import logging
import joblib
from sklearn.ensemble import RandomForestClassifier

from ml.dataset.loader import load_dataset
from ml.preprocessing.preprocessing import (
    FEATURE_COLUMNS,
    preprocess_data,
    split_train_test,
)
from ml.evaluate_model import evaluate_predictions

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')
logger = logging.getLogger('CyberLens.ML.Trainer')

BASE_ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_ML_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train(
    dataset_dir: Path = None,
    n_estimators: int = 100,
    max_depth: int = None,
    max_rows_per_file: int = None,
    output_model_path: Path = None,
    output_schema_path: Path = None,
):
    """Main training routine."""
    print("\n" + "=" * 65)
    print("      CYBERLENS AI — RANDOM FOREST THREAT CLASSIFIER TRAINING")
    print("=" * 65)

    model_path = output_model_path or (MODELS_DIR / "random_forest.pkl")
    schema_path = output_schema_path or (MODELS_DIR / "feature_columns.pkl")

    try:
        # Phase 1: Load Dataset
        logger.info("[ML] Loading CIC-IDS2017 dataset...")
        raw_df = load_dataset(dataset_dir=dataset_dir, max_rows_per_file=max_rows_per_file)
        logger.info(f"[ML] Dataset loaded: {raw_df.shape[0]:,} rows, {raw_df.shape[1]} columns.")

        # Phase 2: Preprocess and verify feature selection
        logger.info("[ML] Cleaning data and verifying feature columns...")
        X, y, orig_labels = preprocess_data(raw_df, feature_columns=FEATURE_COLUMNS)
        logger.info(f"[ML] Selected features ({len(FEATURE_COLUMNS)}):\n  " + "\n  ".join(FEATURE_COLUMNS))

        # Save feature schema immediately so inference and training stay in sync
        joblib.dump(FEATURE_COLUMNS, schema_path)
        logger.info(f"[ML] Feature schema saved to {schema_path}")

        # Phase 3: 80/20 Stratified Split
        X_train, X_test, y_train, y_test, orig_train, orig_test = split_train_test(
            X, y, orig_labels, test_size=0.2, random_state=42
        )
        logger.info(f"[ML] Train set: {len(X_train):,} samples | Test set: {len(X_test):,} samples")

        # Phase 4: Random Forest Training
        logger.info(f"[ML] Training Random Forest (n_estimators={n_estimators}, n_jobs=-1, random_state=42)...")
        rf = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42,
            n_jobs=-1,
        )
        rf.fit(X_train, y_train)
        logger.info("[ML] Model training completed.")

        # Phase 5: Evaluation on Independent Test Set
        logger.info("[ML] Evaluating model on test set...")
        y_pred = rf.predict(X_test)
        metrics = evaluate_predictions(y_test.values, y_pred)

        # Phase 6: Save Model Artifact
        joblib.dump(rf, model_path)
        logger.info(f"[ML] Model saved to {model_path}")

        print("\n[SUCCESS] Model training and evaluation completed successfully!")
        print(f"Artifacts saved:\n  - Model:  {model_path}\n  - Schema: {schema_path}\n")
        return rf, metrics

    except FileNotFoundError as e:
        logger.error(f"[ML] Training failed: {e}")
        print(f"\n[ERROR] {e}\n")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"[ML] Unexpected error during training: {e}")
        print(f"\n[ERROR] Training failed with error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CyberLens AI Random Forest Threat Detection Model")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Directory containing CIC-IDS2017 CSV files")
    parser.add_argument("--n-estimators", type=int, default=100, help="Number of trees in Random Forest (default: 100)")
    parser.add_argument("--max-depth", type=int, default=None, help="Maximum tree depth (default: None)")
    parser.add_argument("--max-rows", type=int, default=None, help="Max rows to read per CSV file (useful for rapid testing)")
    args = parser.parse_args()

    train(
        dataset_dir=Path(args.dataset_dir) if args.dataset_dir else None,
        n_estimators=args.n_estimators,
        max_depth=args.max_depth,
        max_rows_per_file=args.max_rows,
    )
