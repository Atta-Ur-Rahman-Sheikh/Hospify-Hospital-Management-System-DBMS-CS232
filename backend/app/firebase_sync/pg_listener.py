"""
backend/app/firebase_sync/pg_listener.py
─────────────────────────────────────────────────────────────────────────────
PostgreSQL LISTEN daemon — on any users INSERT/UPDATE it syncs the ENTIRE
PostgreSQL database to Firebase Firestore.

Run alongside Flask:
    python -m backend.app.firebase_sync.pg_listener

Flow
────
1. LISTEN on 'user_changes' channel (trigger fires on users INSERT/UPDATE).
2. On notification → read EVERY table from PostgreSQL.
3. Write each table as a Firestore collection, each row as a document keyed
   by its primary key.
4. Firestore batch writes (≤500 ops/batch) keep it efficient.
5. BYTEA columns (file_data) and password_hash are always skipped.
6. Any Firebase failure is logged but never crashes the listener.
"""

import datetime
import decimal
import json
import logging
import os
import select
import signal

import psycopg2
import psycopg2.extensions
from dotenv import load_dotenv

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [pg_listener] %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

load_dotenv()

# ── Tables to sync and their primary key column ───────────────────────────────
# Format: (table_name, primary_key_column)
# Columns listed in SKIP_COLUMNS will never be sent to Firestore.
TABLES = [
    ("users",                "user_id"),
    ("patients",             "patient_id"),
    ("wards",                "ward_id"),
    ("beds",                 "bed_id"),
    ("doctors",              "doctor_id"),
    ("nurses",               "nurse_id"),
    ("lab_technicians",      "tech_id"),
    ("pharmacists",          "pharmacist_id"),
    ("admissions",           "admission_id"),
    ("appointments",         "appointment_id"),
    ("vitals",               "vital_id"),
    ("medicines",            "medicine_id"),
    ("medicine_inventory",   "inventory_id"),
    ("prescriptions",        "prescription_id"),
    ("prescription_items",   "item_id"),
    ("media_files",          "file_id"),
    ("lab_orders",           "order_id"),
    ("lab_results",          "result_id"),
    ("bills",                "bill_id"),
    ("bill_items",           "bill_item_id"),
    ("payments",             "payment_id"),
    ("alerts",               "alert_id"),
    ("audit_log",            "log_id"),
]

# Columns that must NEVER be sent to Firestore
SKIP_COLUMNS = {"password_hash", "file_data"}

# Firestore batch write limit
BATCH_SIZE = 450   # keep under the 500-op hard limit

# ── Graceful shutdown ─────────────────────────────────────────────────────────
_running = True

def _handle_signal(sig, frame):
    global _running
    log.info("Shutdown signal received — stopping listener.")
    _running = False

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ── Type serialization ────────────────────────────────────────────────────────
def _serialize(value):
    """Convert Python types that Firestore/JSON can't handle natively."""
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, memoryview):
        # BYTEA — skip by returning a sentinel; caller filters it out
        return "__BYTEA__"
    return value


def _row_to_dict(columns: list, row: tuple) -> dict:
    """Zip column names with row values, skip sensitive/binary columns."""
    result = {}
    for col, val in zip(columns, row):
        if col in SKIP_COLUMNS:
            continue
        serialized = _serialize(val)
        if serialized == "__BYTEA__":
            continue          # silently drop BYTEA columns
        result[col] = serialized
    return result


# ── PostgreSQL helpers ────────────────────────────────────────────────────────
def _make_pg_connection():
    """Dedicated connection for LISTEN — must be AUTOCOMMIT."""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "Hospify_DBMS"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    return conn


def _make_read_connection():
    """Separate read-only connection used only during the full sync."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "Hospify_DBMS"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        options="-c default_transaction_read_only=on",
    )


def _fetch_table(cur, table: str) -> tuple[list, list]:
    """Return (column_names, rows) for a table. Falls back to empty on error."""
    try:
        cur.execute(f"SELECT * FROM {table}")  # noqa: S608 — table names are hardcoded constants
        columns = [d[0] for d in cur.description]
        rows    = cur.fetchall()
        return columns, rows
    except Exception as exc:
        log.warning("Could not read table '%s': %s", table, exc)
        return [], []


# ── Firebase helpers ──────────────────────────────────────────────────────────
def _get_firestore():
    """Returns a Firestore client (standalone init)."""
    import firebase_admin
    from firebase_admin import credentials, firestore

    creds_path = (
        os.getenv("FIREBASE_CREDENTIALS_PATH")
        or os.getenv("FB_SERVICE_ACCOUNT")
    )
    if not creds_path or not os.path.exists(creds_path):
        log.warning("Firebase credentials not found — Firestore writes disabled.")
        return None

    if not firebase_admin._apps:
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, {
            "projectId": os.getenv("FB_PROJECT_ID") or os.getenv("FIREBASE_PROJECT_ID", ""),
        })

    return firestore.client()


def _batch_write(fs_client, collection: str, pk_col: str, columns: list, rows: list):
    """
    Write all rows of a table to a Firestore collection using batch commits.
    Each row is a document; the document ID is the string of the primary key value.
    Commits every BATCH_SIZE operations to stay under Firestore's 500-op limit.
    """
    batch     = fs_client.batch()
    op_count  = 0
    doc_count = 0
    col_ref   = fs_client.collection(collection)

    for row in rows:
        data = _row_to_dict(columns, row)
        if not data:
            continue

        # Primary key → document ID (fallback to sequential if missing)
        pk_val = data.get(pk_col, doc_count)
        doc_ref = col_ref.document(str(pk_val))
        batch.set(doc_ref, data)
        op_count  += 1
        doc_count += 1

        if op_count >= BATCH_SIZE:
            batch.commit()
            log.info("  ✓ Flushed batch of %d docs → /%s", op_count, collection)
            batch    = fs_client.batch()
            op_count = 0

    if op_count > 0:
        batch.commit()

    return doc_count


# ── Full database sync ────────────────────────────────────────────────────────
def _sync_full_db(fs_client, trigger_payload: dict):
    """
    Read every table from PostgreSQL and push to Firestore.
    Called each time the users trigger fires.
    """
    op      = trigger_payload.get("operation", "?")
    user_id = trigger_payload.get("user_id", "?")
    log.info("── Full DB sync triggered (users %s, user_id=%s) ──", op, user_id)

    read_conn = _make_read_connection()
    read_cur  = read_conn.cursor()

    total_docs = 0
    total_tables = 0

    for table, pk_col in TABLES:
        columns, rows = _fetch_table(read_cur, table)
        if not columns:
            continue

        log.info("  Syncing %-25s → %d rows", table, len(rows))
        try:
            count = _batch_write(fs_client, table, pk_col, columns, rows)
            total_docs   += count
            total_tables += 1
        except Exception as exc:
            log.error("  Firestore write failed for table '%s': %s", table, exc)

    read_cur.close()
    read_conn.close()

    log.info(
        "── Sync complete: %d tables, %d documents written to Firestore ──",
        total_tables, total_docs,
    )


# ── Main listener loop ────────────────────────────────────────────────────────
def run():
    log.info("Starting pg_notify → full-DB-sync listener on channel 'user_changes'…")

    fs_client = _get_firestore()
    if fs_client is None:
        log.warning("Firestore unavailable. Listener will run but skip all writes.")

    listen_conn = _make_pg_connection()
    listen_cur  = listen_conn.cursor()
    listen_cur.execute("LISTEN user_changes;")
    log.info("Listening on 'user_changes'. Any users INSERT/UPDATE triggers a full sync.")

    while _running:
        ready = select.select([listen_conn], [], [], 5.0)
        if not ready[0]:
            continue   # timeout — check _running and loop

        listen_conn.poll()   # drain OS socket buffer → listen_conn.notifies

        while listen_conn.notifies:
            notify = listen_conn.notifies.pop(0)

            try:
                payload = json.loads(notify.payload)
            except json.JSONDecodeError as exc:
                log.error("Bad notify payload: %s — %s", notify.payload[:120], exc)
                continue

            log.info(
                "Received %s on user_id=%s",
                payload.get("operation", "?"),
                payload.get("user_id", "?"),
            )

            if fs_client:
                try:
                    _sync_full_db(fs_client, payload)
                except Exception as exc:
                    log.error("Full-DB sync failed: %s", exc)

    listen_cur.close()
    listen_conn.close()
    log.info("pg_listener stopped cleanly.")


if __name__ == "__main__":
    run()
