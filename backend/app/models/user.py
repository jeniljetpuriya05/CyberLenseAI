from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.Text, default="investigator", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    cases = db.relationship("Case", back_populates="creator", cascade="all, delete-orphan")
    admin_profile = db.relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    api_keys = db.relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}
