"""
End-to-end integration test for CyberLens AI ML Threat Detection Pipeline:
PCAP -> Scapy Flow Extraction -> Feature Validation -> ML Prediction -> Database -> Flask API.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import io
import json
import joblib
import pandas as pd
import pytest
from scapy.all import IP, TCP, UDP, Raw, wrpcap
from sklearn.ensemble import RandomForestClassifier

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import Case, User, PCAPFile, AnalysisReport
from app.services.pcap_parser import _parse_and_store
from ml.preprocessing.preprocessing import FEATURE_COLUMNS


@pytest.fixture
def app_with_model(tmp_path):
    # 1. Train a model on synthetic CIC-IDS2017 schema to test real end-to-end inference
    X_syn = pd.DataFrame([
        {f: 80.0 if f == "Destination Port" else 10.0 for f in FEATURE_COLUMNS},
        {f: 4444.0 if f == "Destination Port" else 50000.0 for f in FEATURE_COLUMNS},
    ])
    y_syn = pd.Series([0, 1])
    rf = RandomForestClassifier(n_estimators=10, random_state=42)
    rf.fit(X_syn, y_syn)

    # Save synthetic model artifacts in pytest temp storage and inject the predictor singleton.
    models_dir = tmp_path / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_file = models_dir / "random_forest.pkl"
    schema_file = models_dir / "feature_columns.pkl"

    joblib.dump(rf, model_file)
    joblib.dump(FEATURE_COLUMNS, schema_file)

    from ml.predict import ThreatPredictor
    ThreatPredictor._instance = ThreatPredictor(model_path=model_file, schema_path=schema_file)

    # 2. Setup Flask app with TestConfig
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_end_to_end_pcap_ml_analysis(app_with_model, tmp_path):
    with app_with_model.app_context():
        # Create test user and case
        user = User(name="Analyst", email="analyst@cyberlens.ai", password_hash="dummy")
        db.session.add(user)
        db.session.commit()

        case = Case(title="Test ML Case", created_by=user.id)
        db.session.add(case)
        db.session.commit()

        # Create synthetic PCAP file with Scapy
        pcap_path = tmp_path / "sample_traffic.pcap"
        pkt1 = IP(src="192.168.1.100", dst="10.0.0.1") / TCP(sport=50000, dport=80) / Raw(load=b"GET /index.html HTTP/1.1\r\n\r\n")
        pkt1.time = 1700000000.0
        pkt2 = IP(src="10.0.0.1", dst="192.168.1.100") / TCP(sport=80, dport=50000) / Raw(load=b"HTTP/1.1 200 OK\r\n\r\nWelcome")
        pkt2.time = 1700000000.05
        pkt3 = IP(src="192.168.1.200", dst="10.0.0.2") / TCP(sport=60000, dport=4444) / Raw(load=b"EXPLOIT_PAYLOAD")
        pkt3.time = 1700000001.0

        wrpcap(str(pcap_path), [pkt1, pkt2, pkt3])

        pcap_file = PCAPFile(
            case_id=case.id,
            filename="sample_traffic.pcap",
            file_path=str(pcap_path),
            file_size=pcap_path.stat().st_size,
            parse_status="pending",
        )
        db.session.add(pcap_file)
        db.session.commit()

        # Run PCAP parsing + ML flow extraction & classification
        _parse_and_store(pcap_file.id)

        # Verify database record
        pcap_refreshed = db.session.get(PCAPFile, pcap_file.id)
        assert pcap_refreshed.parse_status == "done"
        assert pcap_refreshed.packet_count == 3

        report = AnalysisReport.query.filter_by(case_id=case.id).first()
        assert report is not None
        assert report.total_packets == 3
        assert report.ml_model_status == "completed"
        assert report.ml_total_flows == 2  # Two distinct 5-tuple flows
        assert report.ml_normal_flows >= 0
        assert report.ml_malicious_flows >= 0

        flow_results = json.loads(report.ml_detection_results)
        assert len(flow_results) == 2
        for f in flow_results:
            assert "flow_id" in f
            assert "src_ip" in f
            assert "dst_ip" in f
            assert "prediction" in f
            assert "confidence" in f
            assert "label" in f
            assert f["label"] in ["Normal", "Malicious"]
            assert 0.0 <= f["confidence"] <= 1.0


