"""
Dataset loader for CIC-IDS2017 CSV files.
Discovers, cleans, and standardizes dataset for training.
"""
from pathlib import Path
from typing import List, Optional, Tuple
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger('CyberLens.ML.Dataset')
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')

DEFAULT_DATASET_DIR = Path(__file__).resolve().parent

# Target label column variants found in CIC-IDS2017 files
LABEL_COLUMN_CANDIDATES = ['Label', 'label', ' Label', 'Label ']


def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace and normalize column names."""
    df = df.copy()
    df.columns = [col.strip() for col in df.columns]
    return df


def find_dataset_files(dataset_dir: Optional[Path] = None) -> List[Path]:
    """Find all CSV files in the dataset directory."""
    dir_path = Path(dataset_dir) if dataset_dir else DEFAULT_DATASET_DIR
    if not dir_path.exists():
        return []
    csv_files = sorted(dir_path.glob('*.csv'))
    return csv_files


def find_label_column(df: pd.DataFrame) -> str:
    """Find the label column in dataframe."""
    for col in df.columns:
        if col.strip().lower() == 'label':
            return col
    raise ValueError("Target label column not found in dataset. Expected 'Label' column.")


def map_labels_to_binary(labels: pd.Series) -> Tuple[pd.Series, pd.Series]:
    """
    Map target labels to binary:
    BENIGN -> 0
    All other attack classes -> 1

    Returns (binary_series, original_cleaned_series).
    """
    original_cleaned = labels.astype(str).str.strip()
    # Case-insensitive comparison for BENIGN
    is_benign = original_cleaned.str.upper() == 'BENIGN'
    binary_target = (~is_benign).astype(int)
    return binary_target, original_cleaned


def load_dataset(dataset_dir: Optional[Path] = None, max_rows_per_file: Optional[int] = None) -> pd.DataFrame:
    """
    Load and combine all discovered CIC-IDS2017 CSV files.

    Raises:
        FileNotFoundError: If no CSV files are found in dataset_dir.
        ValueError: If loaded data is invalid or empty.
    """
    dir_path = Path(dataset_dir) if dataset_dir else DEFAULT_DATASET_DIR
    files = find_dataset_files(dir_path)

    if not files:
        err_msg = f"CIC-IDS2017 dataset not found. Place the CSV files inside {dir_path}."
        logger.error(f"[ML] {err_msg}")
        raise FileNotFoundError(err_msg)

    logger.info(f"[ML] Loading CIC-IDS2017 dataset from {dir_path}...")
    logger.info(f"[ML] Discovered {len(files)} CSV file(s): {[f.name for f in files]}")

    dataframes = []
    for f in files:
        logger.info(f"[ML] Reading file: {f.name}")
        try:
            # Low_memory=False and on_bad_lines='skip' for robust parsing
            df_part = pd.read_csv(f, nrows=max_rows_per_file, low_memory=False, encoding='utf-8', on_bad_lines='skip')
        except UnicodeDecodeError:
            df_part = pd.read_csv(f, nrows=max_rows_per_file, low_memory=False, encoding='latin-1', on_bad_lines='skip')

        df_part = clean_column_names(df_part)
        logger.info(f"[ML] File '{f.name}' loaded with shape: {df_part.shape}")
        dataframes.append(df_part)

    if not dataframes:
        raise ValueError("No data could be loaded from dataset files.")

    combined_df = pd.concat(dataframes, ignore_index=True)
    logger.info(f"[ML] Combined dataset shape: {combined_df.shape}")

    label_col = find_label_column(combined_df)
    logger.info(f"[ML] Detected target label column: '{label_col}'")

    raw_distribution = combined_df[label_col].astype(str).str.strip().value_counts()
    logger.info(f"[ML] Dataset original label distribution:\n{raw_distribution.to_string()}")

    return combined_df
