"""
Global pytest fixtures for CyberLens AI test suite.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import tempfile
import pytest
from flask_jwt_extended import create_access_token
from scapy.all import IP, TCP, Raw, wrpcap

from app import create_app
from app.config import TestConfig
from app.extensions import bcrypt, db
from app.models import User


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def test_user_id(app):
    with app.app_context():
        user = User(
            name="Test Investigator",
            email="investigator@cyberlens.ai",
            password_hash=bcrypt.generate_password_hash("password123").decode("utf-8"),
        )
        db.session.add(user)
        db.session.commit()
        return user.id


@pytest.fixture
def auth_headers(app, test_user_id):
    with app.app_context():
        token = create_access_token(identity=str(test_user_id))
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_pcap_bytes():
    pkt = IP(src="192.168.1.100", dst="10.0.0.1") / TCP(sport=12345, dport=80) / Raw(load=b"GET / HTTP/1.1\r\n\r\n")
    pkt.time = 1000.0
    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as tmp:
        tmp_path = tmp.name
    wrpcap(tmp_path, [pkt])
    with open(tmp_path, "rb") as f:
        data = f.read()
    Path(tmp_path).unlink(missing_ok=True)
    return data
