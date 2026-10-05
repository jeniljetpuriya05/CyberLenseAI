"""
Preprocessing pipeline for CIC-IDS2017 dataset and network flow feature vectors.
Maintains canonical feature order, handles NaN/Inf, and splits dataset.
"""
import sys
from pathlib import Path
from typing import List, Tuple, Optional
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ml.dataset.loader import (
    clean_column_names,
    find_label_column,
    map_labels_to_binary,
)

logger = logging.getLogger('CyberLens.ML.Preprocessing')
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')

# Canonical single source of truth for flow feature schema
FEATURE_COLUMNS: List[str] = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Packet Length Mean",
    "Packet Length Std",
]

# Port ranges for binning Destination Port into categories
_PORT_BINS = [0, 1024, 49152, 65536]
_PORT_LABELS = [0, 1, 2]  # 0=well-known, 1=registered, 2=dynamic/private


def bin_destination_port(port_series_or_val):
    """Bin raw port values into standard categories (0=well-known, 1=registered, 2=dynamic)."""
    return pd.cut(
        pd.Series(port_series_or_val).clip(0, 65535),
        bins=_PORT_BINS,
        labels=_PORT_LABELS,
        include_lowest=True,
    ).astype(float)


def verify_feature_columns(df: pd.DataFrame, expected_features: Optional[List[str]] = None) -> List[str]:
    """
    Verify that expected features exist in the DataFrame.
    Stops and raises ValueError if any required feature is missing.
    """
    features = expected_features or FEATURE_COLUMNS
    cleaned_df_cols = [c.strip() for c in df.columns]
    missing = [f for f in features if f not in cleaned_df_cols]

    if missing:
        err_msg = (
            f"[ML] Missing required features in dataset:\n"
            f"  Missing: {missing}\n"
            f"  Available columns in dataset: {cleaned_df_cols[:15]}... (total {len(cleaned_df_cols)})\n"
            f"Training aborted. Feature set is incompatible."
        )
        logger.error(err_msg)
        raise ValueError(err_msg)

    logger.info(f"[ML] Verified {len(features)} required feature columns successfully.")
    return features


def preprocess_data(
    df: pd.DataFrame,
    feature_columns: Optional[List[str]] = None,
) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Clean and preprocess dataset:
    1. Clean column names.
    2. Verify and select required features.
    3. Convert features to numeric.
    4. Replace +/- inf with NaN.
    5. Drop rows containing NaN or infinite values in features or target.
    6. Map labels to binary (0 = BENIGN, 1 = Malicious).

    Returns:
        X (pd.DataFrame): Cleaned feature dataframe strictly matching FEATURE_COLUMNS order.
        y (pd.Series): Binary target labels (0 / 1).
        orig_labels (pd.Series): Corresponding original multi-class labels for evaluation.
    """
    logger.info("[ML] Cleaning data and preparing feature matrix...")
    df_clean = clean_column_names(df)

    selected_features = verify_feature_columns(df_clean, feature_columns)
    label_col = find_label_column(df_clean)

    # Subset required columns + label column
    working_df = df_clean[selected_features + [label_col]].copy()

    initial_row_count = len(working_df)
    logger.info(f"[ML] Initial dataset row count: {initial_row_count}")

    # Convert features to numeric
    for col in selected_features:
        working_df[col] = pd.to_numeric(working_df[col], errors='coerce')

    # Bin Destination Port into categories instead of using raw port numbers
    if "Destination Port" in selected_features:
        working_df["Destination Port"] = bin_destination_port(working_df["Destination Port"])

    # Replace +/- infinity with NaN
    working_df.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Check for NaN / missing values
    nan_counts = working_df.isna().sum()
    if nan_counts.sum() > 0:
        logger.warning(f"[ML] Detected missing / invalid values in columns:\n{nan_counts[nan_counts > 0].to_string()}")

    # Drop any rows with NaN
    working_df.dropna(inplace=True)
    valid_row_count = len(working_df)
    dropped_count = initial_row_count - valid_row_count
    logger.info(f"[ML] Valid rows after cleaning: {valid_row_count} (dropped {dropped_count} invalid/inf/NaN rows)")

    if valid_row_count == 0:
        raise ValueError("No valid rows remaining after preprocessing and NaN/Inf cleaning.")

    # Target variable mapping
    y, orig_labels = map_labels_to_binary(working_df[label_col])

    # Ensure strictly ordered feature columns
    X = working_df[selected_features].copy()

    class_counts = y.value_counts().to_dict()
    logger.info(f"[ML] Preprocessing completed. Binary target distribution: 0 (Normal)={class_counts.get(0, 0)}, 1 (Malicious)={class_counts.get(1, 0)}")

    return X, y, orig_labels


def split_train_test(
    X: pd.DataFrame,
    y: pd.Series,
    orig_labels: Optional[pd.Series] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, Optional[pd.Series], Optional[pd.Series]]:
    """
    Split data into train and test sets.
    Uses contiguous block split (last N% as test) to prevent temporal data leakage
    from correlated network flows in the CIC-IDS2017 dataset.
    """
    n = len(X)
    split_idx = int(n * (1 - test_size))

    logger.info(
        f"[ML] Splitting dataset: first {split_idx:,} rows for training, "
        f"last {n - split_idx:,} rows for testing (contiguous split to prevent data leakage)."
    )

    X_train = X.iloc[:split_idx]
    X_test = X.iloc[split_idx:]
    y_train = y.iloc[:split_idx]
    y_test = y.iloc[split_idx:]

    orig_train = orig_labels.iloc[:split_idx] if orig_labels is not None else None
    orig_test = orig_labels.iloc[split_idx:] if orig_labels is not None else None

    return X_train, X_test, y_train, y_test, orig_train, orig_test
