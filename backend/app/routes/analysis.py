import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import AnalysisReport, Case

analysis_bp = Blueprint("analysis", __name__)


def _latest_report(case_id, user_id):
    case = Case.query.filter_by(id=case_id, created_by=user_id).first()
    if not case:
        return None, None
    report = (
        AnalysisReport.query.filter_by(case_id=case_id)
        .order_by(AnalysisReport.created_at.desc())
        .first()
    )
    return case, report


def _empty_analysis(case_id):
    return {
        "case_id": case_id,
        "total_packets": 0,
        "unique_src_ips": [],
        "unique_dst_ips": [],
        "protocols": {},
        "threats_detected": [],
        "anomaly_score": 0.0,
        "capture_duration": 0.0,
        "top_src_ips": {},
        "top_dst_ips": {},
        "avg_packet_size": 0.0,
        "packet_timeline": [],
        "ml_model_status": "none",
        "ml_total_flows": 0,
        "ml_normal_flows": 0,
        "ml_malicious_flows": 0,
        "ml_detection_results": [],
        "large_file_mode": False,
        "flows_page": 1,
        "flows_per_page": 50,
        "flows_total": 0,
        "flows_total_pages": 1,
    }


@analysis_bp.get("/cases/<int:case_id>/analysis")
@jwt_required()
def case_analysis(case_id):
    case, report = _latest_report(case_id, int(get_jwt_identity()))
    if not case:
        return jsonify({"error": "Case not found"}), 404
    if not report:
        return jsonify(_empty_analysis(case_id)), 200

    # Pagination for ML flow results
    flows_page = request.args.get("flows_page", 1, type=int)
    flows_per_page = min(request.args.get("flows_per_page", 50, type=int), 200)
    all_flows = json.loads(getattr(report, "ml_detection_results", "[]") or "[]")
    total_flows_stored = len(all_flows)
    start = (flows_page - 1) * flows_per_page
    end = start + flows_per_page
    paginated_flows = all_flows[start:end]

    return jsonify({
        "case_id": case_id,
        "pcap_filename": report.pcap_file.filename if report.pcap_file else "",
        "total_packets": report.total_packets,
        "unique_src_ips": json.loads(report.unique_src_ips or "[]"),
        "unique_dst_ips": json.loads(report.unique_dst_ips or "[]"),
        "protocols": json.loads(report.protocols or "{}"),
        "threats_detected": json.loads(report.threats_detected or "[]"),
        "anomaly_score": report.anomaly_score or 0.0,
        "capture_duration": report.capture_duration or 0.0,
        "top_src_ips": json.loads(report.top_src_ips or "{}"),
        "top_dst_ips": json.loads(report.top_dst_ips or "{}"),
        "avg_packet_size": report.avg_packet_size or 0.0,
        "packet_timeline": json.loads(report.packet_timeline or "[]"),
        # ML threat detection fields
        "ml_model_status": getattr(report, "ml_model_status", "none") or "none",
        "ml_total_flows": getattr(report, "ml_total_flows", 0) or 0,
        "ml_normal_flows": getattr(report, "ml_normal_flows", 0) or 0,
        "ml_malicious_flows": getattr(report, "ml_malicious_flows", 0) or 0,
        "ml_detection_results": paginated_flows,
        # Pagination metadata
        "flows_page": flows_page,
        "flows_per_page": flows_per_page,
        "flows_total": total_flows_stored,
        "flows_total_pages": max(1, (total_flows_stored + flows_per_page - 1) // flows_per_page),
        # Large file mode flag
        "large_file_mode": getattr(report, "large_file_mode", False) or False,
    }), 200


@analysis_bp.get("/cases/<int:case_id>/stats")
@jwt_required()
def case_stats(case_id):
    case, report = _latest_report(case_id, int(get_jwt_identity()))
    if not case:
        return jsonify({"error": "Case not found"}), 404
    if not report:
        return jsonify({
            "total_packets": 0,
            "threats_count": 0,
            "anomaly_score": 0.0,
            "top_protocol": None,
            "ml_malicious_flows": 0,
        }), 200

    protocols = json.loads(report.protocols or "{}")
    threats = json.loads(report.threats_detected or "[]")
    top_protocol = max(protocols, key=protocols.get) if protocols else None
    return jsonify({
        "total_packets": report.total_packets,
        "threats_count": len(threats),
        "anomaly_score": report.anomaly_score or 0.0,
        "top_protocol": top_protocol,
        "ml_malicious_flows": getattr(report, "ml_malicious_flows", 0) or 0,
    }), 200
