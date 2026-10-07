import time

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import AnalysisReport, Case

cases_bp = Blueprint("cases", __name__)

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache for dashboard/case stats
# ---------------------------------------------------------------------------
_stats_cache = {}  # key -> (data, expires_at)
STATS_CACHE_TTL = 30  # seconds


def _cache_get(key):
    if key in _stats_cache:
        data, expires_at = _stats_cache[key]
        if time.time() < expires_at:
            return data
        del _stats_cache[key]
    return None


def _cache_set(key, data, ttl=STATS_CACHE_TTL):
    _stats_cache[key] = (data, time.time() + ttl)
    return data


def _current_user_id():
    return int(get_jwt_identity())


def _find_case_or_404(case_id, user_id):
    return Case.query.filter_by(id=case_id, created_by=user_id).first()


@cases_bp.get("/")
@jwt_required()
def list_cases():
    cases = Case.query.filter_by(created_by=_current_user_id()).order_by(Case.created_at.desc()).all()
    return jsonify([case.to_dict() for case in cases]), 200


@cases_bp.post("/")
@jwt_required()
def create_case():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400
    case = Case(title=title, description=data.get("description", ""), created_by=_current_user_id())
    db.session.add(case)
    db.session.commit()
    return jsonify(case.to_dict()), 201


# Must be before /<int:case_id> to avoid route conflict
@cases_bp.get("/stats/dashboard")
@jwt_required()
def dashboard_stats():
    user_id = _current_user_id()

    cache_key = f"dashboard_stats_{user_id}"
    cached = _cache_get(cache_key)
    if cached:
        return jsonify(cached), 200

    all_cases = Case.query.filter_by(created_by=user_id).all()
    total = len(all_cases)
    active = sum(1 for c in all_cases if c.status == "open")
    total_pcaps = sum(len(c.pcap_files) for c in all_cases)
    recent = Case.query.filter_by(created_by=user_id).order_by(Case.created_at.desc()).limit(5).all()
    result = {
        "total_cases": total,
        "active_cases": active,
        "closed_cases": total - active,
        "total_pcaps": total_pcaps,
        "recent_cases": [c.to_dict() for c in recent],
    }
    _cache_set(cache_key, result)
    return jsonify(result), 200


@cases_bp.get("/<int:case_id>")
@jwt_required()
def get_case(case_id):
    case = _find_case_or_404(case_id, _current_user_id())
    if not case:
        return jsonify({"error": "Case not found"}), 404
    latest_report = (
        AnalysisReport.query.filter_by(case_id=case.id)
        .order_by(AnalysisReport.created_at.desc())
        .first()
    )
    data = case.to_dict()
    data["pcap_files"] = [pcap.to_dict() for pcap in sorted(case.pcap_files, key=lambda item: item.uploaded_at, reverse=True)]
    data["analysis_summary"] = {
        "total_packets": latest_report.total_packets,
        "anomaly_score": latest_report.anomaly_score,
    } if latest_report else None
    return jsonify(data), 200


@cases_bp.patch("/<int:case_id>")
@jwt_required()
def update_case(case_id):
    user_id = _current_user_id()
    case = _find_case_or_404(case_id, user_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    data = request.get_json(silent=True) or {}
    if "status" in data:
        if data["status"] not in {"open", "closed"}:
            return jsonify({"error": "Status must be 'open' or 'closed'"}), 400
        case.status = data["status"]
    if "title" in data and str(data["title"]).strip():
        case.title = str(data["title"]).strip()
    if "description" in data:
        case.description = data["description"]
    db.session.commit()
    # Invalidate related caches
    _stats_cache.pop(f"dashboard_stats_{user_id}", None)
    _stats_cache.pop(f"case_stats_{case_id}", None)
    return jsonify(case.to_dict()), 200


@cases_bp.delete("/<int:case_id>")
@jwt_required()
def delete_case(case_id):
    user_id = _current_user_id()
    case = _find_case_or_404(case_id, user_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    db.session.delete(case)
    db.session.commit()
    # Invalidate related caches
    _stats_cache.pop(f"dashboard_stats_{user_id}", None)
    _stats_cache.pop(f"case_stats_{case_id}", None)
    return jsonify({"message": "Case deleted"}), 200
