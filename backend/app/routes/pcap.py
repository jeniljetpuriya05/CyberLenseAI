import threading
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Case, PCAPFile
from app.services.pcap_parser import parse_pcap_background

pcap_bp = Blueprint("pcap", __name__)
ALLOWED_EXTENSIONS = {".pcap", ".pcapng"}


def _run_parser(app, pcap_file_id):
    with app.app_context():
        parse_pcap_background(pcap_file_id)


@pcap_bp.post("/upload")
@jwt_required()
def upload_pcap():
    uploaded = request.files.get("file")
    case_id = request.form.get("case_id", type=int)
    if not uploaded or not case_id:
        return jsonify({"error": "file and case_id are required"}), 400

    case = Case.query.filter_by(id=case_id, created_by=int(get_jwt_identity())).first()
    if not case:
        return jsonify({"error": "Case not found"}), 404

    original_name = secure_filename(uploaded.filename or "")
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Only .pcap and .pcapng files are allowed"}), 400

    case_dir = Path(current_app.config["UPLOAD_FOLDER"]) / str(case_id)
    case_dir.mkdir(parents=True, exist_ok=True)
    saved_name = f"{uuid.uuid4().hex}_{original_name}"
    file_path = case_dir / saved_name
    uploaded.save(file_path)

    pcap_file = PCAPFile(
        case_id=case.id,
        filename=original_name,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        parse_status="pending",
    )
    db.session.add(pcap_file)
    db.session.commit()

    app = current_app._get_current_object()
    if current_app.config.get("TESTING"):
        _run_parser(app, pcap_file.id)
    else:
        threading.Thread(target=_run_parser, args=(app, pcap_file.id), daemon=True).start()

    return jsonify({"message": "Upload successful", "pcap_id": pcap_file.id, "status": "pending"}), 202

@pcap_bp.get("/")
@jwt_required()
def list_uploaded_pcaps():
    user_id = int(get_jwt_identity())
    pcaps = (
        PCAPFile.query.join(Case)
        .filter(Case.created_by == user_id)
        .order_by(PCAPFile.uploaded_at.desc())
        .all()
    )
    return jsonify([pcap.to_dict() for pcap in pcaps]), 200

@pcap_bp.get("/<int:pcap_id>/status")
@jwt_required()
def pcap_status(pcap_id):
    pcap_file = PCAPFile.query.join(Case).filter(
        PCAPFile.id == pcap_id,
        Case.created_by == int(get_jwt_identity()),
    ).first()
    if not pcap_file:
        return jsonify({"error": "PCAP file not found"}), 404

    return jsonify({
        "pcap_id": pcap_file.id,
        "parse_status": pcap_file.parse_status,
        "packet_count": pcap_file.packet_count,
    }), 200


@pcap_bp.get("/<int:pcap_id>/download")
@jwt_required()
def download_pcap(pcap_id):
    import os
    from flask import send_file

    pcap_file = PCAPFile.query.join(Case).filter(
        PCAPFile.id == pcap_id,
        Case.created_by == int(get_jwt_identity()),
    ).first()
    if not pcap_file:
        return jsonify({"error": "PCAP file not found"}), 404

    if not pcap_file.file_path or not os.path.exists(pcap_file.file_path):
        return jsonify({"error": "PCAP file not found on disk"}), 404

    return send_file(
        pcap_file.file_path,
        as_attachment=True,
        download_name=pcap_file.filename,
        mimetype="application/vnd.tcpdump.pcap",
    )


