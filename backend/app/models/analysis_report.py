from datetime import datetime

from app.extensions import db


class AnalysisReport(db.Model):
    __tablename__ = "analysis_reports"

    id = db.Column(db.Integer, primary_key=True)
    pcap_id = db.Column(db.Integer, db.ForeignKey("pcap_files.id"), nullable=False, index=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id"), nullable=False, index=True)
    total_packets = db.Column(db.Integer, default=0)
    unique_src_ips = db.Column(db.Text, default="[]")
    unique_dst_ips = db.Column(db.Text, default="[]")
    protocols = db.Column(db.Text, default="{}")
    threats_detected = db.Column(db.Text, default="[]")
    anomaly_score = db.Column(db.Float, default=0.0)
    capture_duration = db.Column(db.Float, default=0.0)
    top_src_ips = db.Column(db.Text, default="{}")
    top_dst_ips = db.Column(db.Text, default="{}")
    avg_packet_size = db.Column(db.Float, default=0.0)
    packet_timeline = db.Column(db.Text, default="[]")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    pcap_file = db.relationship("PCAPFile", back_populates="analysis_reports")
    case = db.relationship("Case", back_populates="analysis_reports")
