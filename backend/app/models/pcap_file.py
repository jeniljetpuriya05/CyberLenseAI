from datetime import datetime

from app.extensions import db


class PCAPFile(db.Model):
    __tablename__ = "pcap_files"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id"), nullable=False, index=True)
    filename = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    file_size = db.Column(db.Integer)
    packet_count = db.Column(db.Integer)
    parse_status = db.Column(db.Text, default="pending", nullable=False)
    parse_progress = db.Column(db.Integer, default=0, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    case = db.relationship("Case", back_populates="pcap_files")
    analysis_reports = db.relationship("AnalysisReport", back_populates="pcap_file", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "filename": self.filename,
            "file_size": self.file_size,
            "packet_count": self.packet_count,
            "parse_status": self.parse_status,
            "parse_progress": self.parse_progress or 0,
            "uploaded_at": self.uploaded_at.isoformat(),
        }
