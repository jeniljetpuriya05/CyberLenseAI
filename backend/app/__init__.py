from pathlib import Path

from flask import Flask, jsonify

from app.config import Config
from app.extensions import bcrypt, cors, db, jwt
from app.routes.analysis import analysis_bp
from app.routes.auth import auth_bp
from app.routes.cases import cases_bp
from app.routes.pcap import pcap_bp
from app.routes.reports import reports_bp


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
