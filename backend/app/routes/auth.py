from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from app.extensions import bcrypt, db
from app.models import User

auth_bp = Blueprint("auth", __name__)


def _required(data, fields):
    return all(str(data.get(field, "")).strip() for field in fields)


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    if not _required(data, ("name", "email", "password")):
        return jsonify({"error": "Missing required fields"}), 400

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        name=data["name"].strip(),
        email=email,
        password_hash=bcrypt.generate_password_hash(data["password"]).decode("utf-8"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully", "user_id": user.id}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    if not _required(data, ("email", "password")):
        return jsonify({"error": "Missing required fields"}), 400

    user = User.query.filter_by(email=data["email"].strip().lower()).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": token, "user": user.to_dict()}), 200
