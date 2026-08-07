from datetime import datetime

from app.extensions import db


class FinalReport(db.Model):
    __tablename__ = "final_reports"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id"), nullable=False, index=True)
    report_path = db.Column(db.Text)
    generated_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_court_ready = db.Column(db.Boolean, default=False, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    case = db.relationship("Case", back_populates="final_reports")
    generator = db.relationship("User")
