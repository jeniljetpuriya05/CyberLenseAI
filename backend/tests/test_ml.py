"""
Unit and integration tests for CyberLens AI ML Threat Detection module.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import math
import tempfile
import joblib
import numpy as np
import pandas as pd
import pytest
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.packet import Raw

from ml.dataset.loader import (
    clean_column_names,
    find_dataset_files,
    find_label_column,
    map_labels_to_binary,
    load_dataset,
)
from ml.preprocessing.preprocessing import (
    FEATURE_COLUMNS,
    preprocess_data,
    split_train_test,
    verify_feature_columns,
)
from ml.packet_features.feature_extractor import (
    extract_flows_from_packets,
    validate_feature_vector,
)
from ml.predict import ThreatPredictor


# =========================================================================
# 1. DATASET LOADER & PREPROCESSING TESTS
# =========================================================================

def test_clean_column_names():
    df = pd.DataFrame({" Destination Port ": [80], " Flow Duration": [100], "Label ": ["BENIGN"]})
    cleaned = clean_column_names(df)
    assert list(cleaned.columns) == ["Destination Port", "Flow Duration", "Label"]


def test_map_labels_to_binary():
    labels = pd.Series(["BENIGN", "PortScan", "BENIGN", "DDoS", "FTP-Patator", "benign"])
    binary, orig = map_labels_to_binary(labels)
    assert binary.tolist() == [0, 1, 0, 1, 1, 0]


def test_missing_dataset_directory_raises_clear_error():
    with tempfile.TemporaryDirectory() as temp_dir:
        with pytest.raises(FileNotFoundError) as exc_info:
            load_dataset(dataset_dir=Path(temp_dir))
        assert "CIC-IDS2017 dataset not found" in str(exc_info.value)


def test_verify_feature_columns_catches_missing():
    df = pd.DataFrame({"Destination Port": [80], "Flow Duration": [500]})
    with pytest.raises(ValueError) as exc_info:
        verify_feature_columns(df, FEATURE_COLUMNS)
    assert "Missing required features" in str(exc_info.value)


def test_preprocessing_inf_nan_cleaning():
    data = {
        "Destination Port": [80, 443, 22, 8080],
        "Flow Duration": [1000, np.inf, 2000, 3000],
        "Total Fwd Packets": [5, 10, np.nan, 2],
        "Total Backward Packets": [3, 2, 1, 1],
        "Total Length of Fwd Packets": [500, 1000, 100, 200],
        "Total Length of Bwd Packets": [300, 400, 50, 100],
        "Flow Bytes/s": [800.0, 1400.0, 150.0, -np.inf],
        "Flow Packets/s": [8.0, 12.0, 2.0, 3.0],
        "Packet Length Mean": [100.0, 120.0, 75.0, 100.0],
        "Packet Length Std": [10.0, 15.0, 5.0, 0.0],
        "Label": ["BENIGN", "PortScan", "BENIGN", "DDoS"],
    }
    df = pd.DataFrame(data)
    X, y, orig_labels = preprocess_data(df)

    assert len(X) == 1
    assert list(X.columns) == FEATURE_COLUMNS
    assert y.tolist() == [0]


def test_stratified_train_test_split():
    rows = []
    for i in range(50):
        rows.append({f: float(i + 1) for f in FEATURE_COLUMNS} | {"Label": "BENIGN"})
        rows.append({f: float(i + 100) for f in FEATURE_COLUMNS} | {"Label": "PortScan"})
    df = pd.DataFrame(rows)

    X, y, orig_labels = preprocess_data(df)
    X_train, X_test, y_train, y_test, orig_tr, orig_te = split_train_test(
        X, y, orig_labels, test_size=0.2, random_state=42
    )

    assert len(X_train) == 80
    assert len(X_test) == 20
    assert (y_train == 0).sum() == 40
    assert (y_train == 1).sum() == 40
    assert (y_test == 0).sum() == 10
    assert (y_test == 1).sum() == 10


# =========================================================================
# 2. PCAP FLOW EXTRACTION & FEATURE RECONSTRUCTION TESTS
# =========================================================================

def test_packet_flow_extraction_bidirectional():
    pkt1 = IP(src="192.168.1.10", dst="10.0.0.1") / TCP(sport=54321, dport=80) / Raw(load=b"GET / HTTP/1.1\r\n\r\n")
    pkt1.time = 1000.0

    pkt2 = IP(src="10.0.0.1", dst="192.168.1.10") / TCP(sport=80, dport=54321) / Raw(load=b"HTTP/1.1 200 OK\r\n\r\nHello")
    pkt2.time = 1000.05

    pkt3 = IP(src="192.168.1.10", dst="10.0.0.1") / TCP(sport=54321, dport=80) / Raw(load=b"ACK")
    pkt3.time = 1000.10

    packets = [pkt1, pkt2, pkt3]

    features_df, metadata = extract_flows_from_packets(packets)

    assert len(features_df) == 1
    assert len(metadata) == 1

    assert list(features_df.columns) == FEATURE_COLUMNS
    validate_feature_vector(features_df, FEATURE_COLUMNS)

    meta = metadata[0]
    assert meta["src_ip"] == "192.168.1.10"
    assert meta["dst_ip"] == "10.0.0.1"
    assert meta["src_port"] == 54321
    assert meta["dst_port"] == 80
    assert meta["protocol"] == "TCP"
    assert meta["total_packets"] == 3

    flow_feat = features_df.iloc[0]
    assert flow_feat["Destination Port"] == 80.0
    assert flow_feat["Total Fwd Packets"] == 2.0
    assert flow_feat["Total Backward Packets"] == 1.0
    assert flow_feat["Flow Duration"] > 0.0
    assert flow_feat["Flow Bytes/s"] > 0.0
    assert flow_feat["Flow Packets/s"] > 0.0
    assert not math.isnan(flow_feat["Packet Length Mean"])
    assert not math.isnan(flow_feat["Packet Length Std"])


def test_zero_duration_flow_safety():
    pkt = IP(src="192.168.1.5", dst="8.8.8.8") / UDP(sport=50000, dport=53) / Raw(load=b"\x00\x01\x00\x00")
    pkt.time = 500.0

    features_df, metadata = extract_flows_from_packets([pkt])

    assert len(features_df) == 1
    flow_feat = features_df.iloc[0]
    assert flow_feat["Flow Duration"] == 0.0
    assert flow_feat["Flow Bytes/s"] == 0.0
    assert flow_feat["Flow Packets/s"] == 0.0
    assert flow_feat["Total Fwd Packets"] == 1.0
    assert flow_feat["Total Backward Packets"] == 0.0
    assert not math.isnan(flow_feat["Packet Length Mean"])
    assert not math.isnan(flow_feat["Packet Length Std"])


def test_validate_feature_vector_catches_schema_mismatch():
    invalid_df = pd.DataFrame({"WrongColumn": [1], "Flow Duration": [100]})
    with pytest.raises(ValueError) as exc_info:
        validate_feature_vector(invalid_df, FEATURE_COLUMNS)
    assert "Feature schema mismatch" in str(exc_info.value)


# =========================================================================
# 3. END-TO-END PREDICTION SERVICE TESTS
# =========================================================================

def test_threat_predictor_missing_model():
    with pytest.raises(FileNotFoundError) as exc_info:
        ThreatPredictor(
            model_path=Path("non_existent_model.pkl"),
            schema_path=Path("non_existent_schema.pkl"),
        )
    assert "Trained ML model not found" in str(exc_info.value)


def test_threat_predictor_with_trained_model():
    from sklearn.ensemble import RandomForestClassifier

    X_mock = pd.DataFrame([
        {f: 80.0 if f == "Destination Port" else 10.0 for f in FEATURE_COLUMNS},
        {f: 4444.0 if f == "Destination Port" else 50000.0 for f in FEATURE_COLUMNS},
    ])
    y_mock = pd.Series([0, 1])

    rf = RandomForestClassifier(n_estimators=10, random_state=42)
    rf.fit(X_mock, y_mock)

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        model_file = temp_path / "test_rf.pkl"
        schema_file = temp_path / "test_schema.pkl"

        joblib.dump(rf, model_file)
        joblib.dump(FEATURE_COLUMNS, schema_file)

        predictor = ThreatPredictor(model_path=model_file, schema_path=schema_file)
        output = predictor.predict_flows(X_mock, flow_metadata=[
            {"flow_id": "FLOW-0001", "src_ip": "10.0.0.2", "dst_ip": "10.0.0.1", "protocol": "TCP"},
            {"flow_id": "FLOW-0002", "src_ip": "192.168.1.100", "dst_ip": "10.0.0.5", "protocol": "TCP"},
        ])

        assert output["total_flows"] == 2
        assert output["normal_flows"] >= 0
        assert output["malicious_flows"] >= 0
        assert len(output["results"]) == 2
        assert output["results"][0]["confidence"] >= 0.0
        assert output["results"][0]["confidence"] <= 1.0
        assert output["results"][0]["label"] in ["Normal", "Malicious"]
