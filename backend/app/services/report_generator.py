import json
import uuid
from pathlib import Path

from flask import current_app, has_app_context
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.extensions import db
from app.models import AnalysisReport, Case, FinalReport, User


def _latest_analysis(case_id):
    return (
        AnalysisReport.query.filter_by(case_id=case_id)
        .order_by(AnalysisReport.created_at.desc())
        .first()
    )


def generate_pdf(case_id, user_id, final_report_id=None):
    if has_app_context():
        app = current_app._get_current_object()
    else:
        from app import create_app
        app = create_app()
    with app.app_context():
        case = db.session.get(Case, case_id)
        user = db.session.get(User, user_id)
        final_report = db.session.get(FinalReport, final_report_id) if final_report_id else None
        if not case or not user:
            return None
        if not final_report:
            final_report = FinalReport(case_id=case_id, generated_by=user_id)
            db.session.add(final_report)
            db.session.commit()

        analysis = _latest_analysis(case_id)
        protocols = json.loads(analysis.protocols or "{}") if analysis else {}
        threats = json.loads(analysis.threats_detected or "[]") if analysis else []
        src_ips = json.loads(analysis.unique_src_ips or "[]") if analysis else []
        dst_ips = json.loads(analysis.unique_dst_ips or "[]") if analysis else []
        top_protocol = max(protocols, key=protocols.get) if protocols else "N/A"

        report_dir = Path(app.config["REPORT_FOLDER"]) / str(case_id)
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / f"{uuid.uuid4().hex}.pdf"

        styles = getSampleStyleSheet()
        story = [
            Paragraph("CyberLens AI", styles["Title"]),
            Spacer(1, 24),
            Paragraph(f"Forensic Report: {case.title}", styles["Heading1"]),
            Paragraph(f"Investigator: {user.name}", styles["Normal"]),
            Paragraph(f"Case Status: {case.status}", styles["Normal"]),
            Paragraph(f"Generated Date: {final_report.generated_at.strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
            PageBreak(),
            Paragraph("Executive Summary", styles["Heading1"]),
            Paragraph(f"Total packets analyzed: {analysis.total_packets if analysis else 0}", styles["Normal"]),
            Paragraph(f"Threats found: {len(threats)}", styles["Normal"]),
            Paragraph(f"Anomaly score: {analysis.anomaly_score if analysis else 0.0}", styles["Normal"]),
            Paragraph(f"Top protocol: {top_protocol}", styles["Normal"]),
            PageBreak(),
            Paragraph("Threats Table", styles["Heading1"]),
        ]

        threat_rows = [["Type", "Severity", "Source IP", "Packet Count"]]
        threat_rows.extend([
            [t.get("type", "N/A"), t.get("severity", "N/A"), t.get("src_ip", "N/A"), t.get("packet_count", 0)]
            for t in threats
        ] or [["No threats detected", "-", "-", "-"]])
        threat_table = Table(threat_rows, repeatRows=1)
        threat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D4ED8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.extend([threat_table, PageBreak(), Paragraph("IP Address Analysis", styles["Heading1"])])

        ip_rows = [["Top Source IPs", "Top Destination IPs"]]
        for index in range(max(len(src_ips[:10]), len(dst_ips[:10]), 1)):
            ip_rows.append([
                src_ips[index] if index < len(src_ips[:10]) else "",
                dst_ips[index] if index < len(dst_ips[:10]) else "",
            ])
        ip_table = Table(ip_rows, repeatRows=1)
        ip_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.extend([
            ip_table,
            PageBreak(),
            Paragraph("Chain of Custody", styles["Heading1"]),
            Paragraph(
                "This report was generated from uploaded packet capture evidence recorded in CyberLens AI. "
                "The investigator confirms that evidence handling, preservation, and review followed the "
                "institutional forensic workflow.",
                styles["Normal"],
            ),
            Spacer(1, 72),
            Paragraph("Investigator Signature: ______________________________", styles["Normal"]),
        ])

        SimpleDocTemplate(str(report_path), pagesize=letter).build(story)
        final_report.report_path = str(report_path)
        final_report.is_court_ready = True
        db.session.commit()
        return final_report.id
