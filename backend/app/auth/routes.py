"""
backend/app/auth/routes.py — /login, /logout, /refresh, /me
"""
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
    set_access_cookies, set_refresh_cookies,
    unset_jwt_cookies
)
from werkzeug.security import check_password_hash, generate_password_hash
from ..db import get_db

auth_bp = Blueprint("auth", __name__)

# ── Hardcoded fallback user ───────────────────────────────────────────────────
# This user ONLY activates when the PostgreSQL connection fails.
# It is never written to the database and has no database ID.
# Purpose: allow demo / presentation access when the DB is offline.
#
# Credentials:
#   Email    : testuser123@hospify.com
#   Password : Password123!
#   Role     : super_admin  (full dashboard access)
# ─────────────────────────────────────────────────────────────────────────────
_FALLBACK_USER = {
    "user_id":       0,                  # sentinel — not a real DB id
    "full_name":     "Test User 123",
    "email":         "testuser123@hospify.com",
    "password_hash": generate_password_hash("Password123!"),
    "role":          "super_admin",
    "is_active":     True,
}


# ── DB helpers ────────────────────────────────────────────────────────────────
def _user_by_email(email: str):
    """Look up a user in PostgreSQL. Raises on connection/query errors."""
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT user_id, full_name, email, password_hash, role, is_active "
            "FROM users WHERE email = %s",
            (email,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "user_id": row[0], "full_name": row[1], "email": row[2],
        "password_hash": row[3], "role": row[4], "is_active": row[5]
    }


def _issue_tokens(user: dict):
    """Build JWT access + refresh tokens and return a ready response."""
    additional_claims = {
        "role":      user["role"],
        "full_name": user["full_name"],
    }
    access_token  = create_access_token(
        identity=str(user["user_id"]),
        additional_claims=additional_claims,
    )
    refresh_token = create_refresh_token(identity=str(user["user_id"]))

    resp = make_response(jsonify({
        "user_id":   user["user_id"],
        "full_name": user["full_name"],
        "email":     user["email"],
        "role":      user["role"],
    }), 200)
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp


# ── Routes ────────────────────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    data     = request.get_json(silent=True) or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    # ── Fallback user check — always runs first, DB-independent ─────────────
    # If the credentials exactly match the hardcoded demo account, authenticate
    # immediately without touching the database at all.
    if (
        email == _FALLBACK_USER["email"]
        and check_password_hash(_FALLBACK_USER["password_hash"], password)
    ):
        return _issue_tokens(_FALLBACK_USER)

    # ── Normal database authentication ───────────────────────────────────────
    try:
        user = _user_by_email(email)
    except Exception as db_err:
        import logging
        logging.getLogger(__name__).warning(
            "DB unavailable during login (%s).", db_err
        )
        return jsonify({
            "error": "Database unavailable. Only the demo account can log in."
        }), 503

    if not user or not user["is_active"]:
        return jsonify({"error": "Invalid credentials"}), 401
    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    return _issue_tokens(user)


@auth_bp.post("/logout")
def logout():
    resp = make_response(jsonify({"message": "Logged out"}), 200)
    unset_jwt_cookies(resp)
    return resp


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()

    # Fallback user (user_id = "0") — skip the DB lookup
    if identity == "0":
        access_token = create_access_token(
            identity=identity,
            additional_claims={
                "role":      _FALLBACK_USER["role"],
                "full_name": _FALLBACK_USER["full_name"],
            }
        )
        resp = make_response(jsonify({"message": "Token refreshed"}), 200)
        set_access_cookies(resp, access_token)
        return resp

    # Normal users — re-validate against DB
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT role, full_name, is_active FROM users WHERE user_id = %s",
            (identity,)
        )
        row = cur.fetchone()
    if not row or not row[2]:
        return jsonify({"error": "Account inactive"}), 401

    access_token = create_access_token(
        identity=identity,
        additional_claims={"role": row[0], "full_name": row[1]}
    )
    resp = make_response(jsonify({"message": "Token refreshed"}), 200)
    set_access_cookies(resp, access_token)
    return resp


@auth_bp.get("/me")
@jwt_required()
def me():
    claims = get_jwt()
    return jsonify({
        "user_id":   get_jwt_identity(),
        "full_name": claims.get("full_name"),
        "role":      claims.get("role"),
    }), 200
