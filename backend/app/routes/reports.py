import os
import threading
from pathlib import Path

from flask import Blueprint, current_app, jsonify, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Case, FinalReport
from app.services.report_generator import generate_pdf

reports_bp = Blueprint("reports", __name__)


def _run_report_generation(app, case_id, user_id, final_report_id):
    with app.app_context():
        generate_pdf(case_id, user_id, final_report_id)


@reports_bp.post("/cases/<int:case_id>/report/generate")
@jwt_required()
def generate_case_report(case_id):
    user_id = int(get_jwt_identity())
    case = Case.query.filter_by(id=case_id, created_by=user_id).first()
    if not case:
        return jsonify({"error": "Case not found"}), 404

    final_report = FinalReport(case_id=case_id, generated_by=user_id, is_court_ready=False)
    db.session.add(final_report)
    db.session.commit()
    app = current_app._get_current_object()
    threading.Thread(
        target=_run_report_generation,
        args=(app, case_id, user_id, final_report.id),
        daemon=True,
    ).start()
    return jsonify({"message": "Report generation started", "report_id": final_report.id}), 202


@reports_bp.get("/cases/<int:case_id>/report")
@jwt_required()
def get_case_report(case_id):
    user_id = int(get_jwt_identity())
    case = Case.query.filter_by(id=case_id, created_by=user_id).first()
    if not case:
        return jsonify({"error": "Case not found"}), 404

    final_report = (
        FinalReport.query.filter_by(case_id=case_id)
        .order_by(FinalReport.generated_at.desc())
        .first()
    )
    if not final_report:
        return jsonify({"error": "Report not found"}), 404

    return jsonify({
        "id": final_report.id,
        "case_id": final_report.case_id,
        "case_title": case.title,
        "report_path": final_report.report_path,
        "is_court_ready": final_report.is_court_ready,
        "generated_at": final_report.generated_at.isoformat(),
        "download_url": f"/api/v1/cases/{case_id}/report/download",
    }), 200


@reports_bp.get("/cases/<int:case_id>/report/download")
@jwt_required()
def download_case_report(case_id):
    user_id = int(get_jwt_identity())
    case = Case.query.filter_by(id=case_id, created_by=user_id).first()
    if not case:
        return jsonify({"error": "Case not found"}), 404

    final_report = (
        FinalReport.query.filter_by(case_id=case_id)
        .order_by(FinalReport.generated_at.desc())
        .first()
    )
    if not final_report or not final_report.report_path:
        return jsonify({"error": "Report not yet generated or available"}), 404

    report_path = Path(final_report.report_path)
    if not report_path.is_file():
        return jsonify({"error": "Report file not found on disk"}), 404

    clean_case_title = "".join(c for c in case.title if c.isalnum() or c in ("-", "_", " ")).strip()
    download_name = f"Forensic_Report_{clean_case_title or case_id}.pdf"

    return send_file(
        str(report_path),
        as_attachment=True,
        download_name=download_name,
        mimetype="application/pdf",
    )


@reports_bp.get("/reports/all")
@jwt_required()
def get_all_reports():
    user_id = int(get_jwt_identity())
    reports = (
        FinalReport.query.join(Case)
        .filter(Case.created_by == user_id)
        .order_by(FinalReport.generated_at.desc())
        .all()
    )
    results = []
    for r in reports:
        file_size_bytes = 0
        if r.report_path and os.path.exists(r.report_path):
            file_size_bytes = os.path.getsize(r.report_path)
        results.append({
            "id": r.id,
            "case_id": r.case_id,
            "case_title": r.case.title if r.case else f"Case #{r.case_id}",
            "is_court_ready": r.is_court_ready,
            "generated_at": r.generated_at.isoformat(),
            "file_size": file_size_bytes,
            "download_url": f"/api/v1/cases/{r.case_id}/report/download",
        })
    return jsonify(results), 200
