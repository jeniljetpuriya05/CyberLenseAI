from pathlib import Path

from flask import Flask, jsonify
from sqlalchemy import inspect, text

from app.config import Config
from app.extensions import bcrypt, cors, db, jwt
from app.routes.analysis import analysis_bp
from app.routes.auth import auth_bp
from app.routes.cases import cases_bp
from app.routes.pcap import pcap_bp
from app.routes.reports import reports_bp

ANALYSIS_REPORT_COLUMNS = {
    "capture_duration": "FLOAT DEFAULT 0.0",
    "top_src_ips": "TEXT DEFAULT '{}'",
    "top_dst_ips": "TEXT DEFAULT '{}'",
    "avg_packet_size": "FLOAT DEFAULT 0.0",
    "packet_timeline": "TEXT DEFAULT '[]'",
    "ml_model_status": "TEXT DEFAULT 'none'",
    "ml_total_flows": "INTEGER DEFAULT 0",
    "ml_normal_flows": "INTEGER DEFAULT 0",
    "ml_malicious_flows": "INTEGER DEFAULT 0",
    "ml_detection_results": "TEXT DEFAULT '[]'",
}


def ensure_sqlite_schema():
    if db.engine.dialect.name != "sqlite":
        return

    inspector = inspect(db.engine)
    if "analysis_reports" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("analysis_reports")}
    missing = [(name, ddl) for name, ddl in ANALYSIS_REPORT_COLUMNS.items() if name not in existing]
    for name, ddl in missing:
        db.session.execute(text(f"ALTER TABLE analysis_reports ADD COLUMN {name} {ddl}"))
    if missing:
        db.session.commit()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)
    Path(app.config["REPORT_FOLDER"]).mkdir(parents=True, exist_ok=True)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"].split(",")}},
        supports_credentials=True,
    )

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(cases_bp, url_prefix="/api/v1/cases")
    app.register_blueprint(pcap_bp, url_prefix="/api/v1/pcap")
    app.register_blueprint(analysis_bp, url_prefix="/api/v1")
    app.register_blueprint(reports_bp, url_prefix="/api/v1")

    with app.app_context():
        db.create_all()
        ensure_sqlite_schema()

    @app.get("/api/v1/health")
    def health():
        return jsonify({"status": "ok", "service": "CyberLens AI API"})

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(_error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app


