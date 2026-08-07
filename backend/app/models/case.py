from datetime import datetime

from app.extensions import db


class Case(db.Model):
    __tablename__ = "cases"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.Text, default="open", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    creator = db.relationship("User", back_populates="cases")
    pcap_files = db.relationship("PCAPFile", back_populates="case", cascade="all, delete-orphan")
    analysis_reports = db.relationship("AnalysisReport", back_populates="case", cascade="all, delete-orphan")
    final_reports = db.relationship("FinalReport", back_populates="case", cascade="all, delete-orphan")

    def to_dict(self, include_counts=True):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
        if include_counts:
            data["pcap_count"] = len(self.pcap_files)
        return data
