import os
import psycopg2
from flask import Flask
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

app = Flask(__name__)

# Initialize Firebase
cred = credentials.Certificate(os.getenv("FB_SERVICE_ACCOUNT"))
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv("FB_DB_URL")
})

# PostgreSQL Connection Helper
def get_pg_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

@app.route('/add-data', methods=['POST'])
def add_data():
    # Example data
    name = "Atta"
    email = "Atta@hospify.com"
    role = "super_admin"
    
    # 1. Update PostgreSQL
    conn = get_pg_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users(full_name,email,password_hash,role) VALUES(%s,%s,%s,%s) "
            "ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name RETURNING user_id",
            (name, email, generate_password_hash("Password123!"), role))
        uid[email] = cur.fetchone()[0]
        conn.commit()

        # 2. Sync to Firebase Realtime DB
        # We map the SQL row to a JSON path
        ref = db.reference(f'/users/{name}')
        ref.set({
            'name': name,
            'last_updated': 'server_timestamp' # Realtime DB feature
        })
        
        return {"status": "Synced Successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cur.close()
        conn.close()