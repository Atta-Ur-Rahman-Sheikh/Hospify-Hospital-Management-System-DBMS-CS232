# Hospital Management System — DBMS Semester Project
## Master Prompt & Build Instructions for AI-Assisted Development

---

## 🧠 What You Are Building

A full-cycle **Hospital Management System (HMS)** web application.  
It manages patient admissions, doctor scheduling, ward/bed management, pharmacy, lab reports, vitals tracking, and billing.  
It uses **PostgreSQL** as the primary relational database and **Firebase Firestore** for real-time data (bed availability, live OT status, patient queues).  
A one-click sync exists between Postgres and Firebase in both directions.  
Media files (X-rays, lab result PDFs, patient photos) are stored in Postgres and/or Firebase Storage.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Flask (Python) |
| Primary Database | PostgreSQL |
| Cloud NoSQL DB | Firebase Firestore + Firebase Storage |
| ORM / DB Driver | psycopg2 (raw SQL) — NO ORM, write raw SQL to satisfy course requirements |
| DB Migrations | Alembic |
| Firebase SDK | firebase-admin (Python) |
| Containerization | Docker + Docker Compose (written manually by developer) |
| CI/CD | GitHub Actions (written manually by developer) |
| Auth | Flask-JWT-Extended (JWT tokens) |
| Media Generation | Google Gemini API (generates synthetic patient photos, X-rays, lab PDFs for seed data) |
| Python Environment | `.venv` (Windows) — activate with `.venv\Scripts\activate` before running any script |

---

## 👤 User Types & Their Access

| Role | Permissions |
|---|---|
| **Super Admin** | Full access — manage all staff accounts, system config |
| **Receptionist** | Register patients, book appointments, assign beds, view real-time bed availability |
| **Doctor** | View patient history, write prescriptions, order lab/radiology tests, add clinical notes |
| **Nurse** | Log vitals per shift, mark medications as administered, flag abnormal readings |
| **Lab Technician** | Receive test orders, upload result PDFs/images, update order status |
| **Pharmacist** | View prescriptions, dispense medicines, manage drug inventory, low-stock alerts |
| **Billing Staff** | Auto-generate bills from services used, record payments, issue receipts |

---

## 🗄️ Database Schema — All Tables (Normalized to 3NF)

```sql
-- USERS & ROLES
users (user_id PK, full_name, email, password_hash, role, is_active, created_at)

-- PATIENTS
patients (patient_id PK, full_name, dob, gender, cnic, phone, address, blood_group, emergency_contact, created_at)

-- STAFF
doctors (doctor_id PK, user_id FK, specialization, qualification, phone, available_days)
nurses (nurse_id PK, user_id FK, ward_id FK, shift)
lab_technicians (tech_id PK, user_id FK)
pharmacists (pharmacist_id PK, user_id FK)

-- WARDS & BEDS
wards (ward_id PK, ward_name, ward_type, floor_number, total_beds)
beds (bed_id PK, ward_id FK, bed_number, bed_type, status) -- status: available/occupied/maintenance

-- ADMISSIONS
admissions (admission_id PK, patient_id FK, bed_id FK, doctor_id FK, admitted_at, discharged_at, admission_type, status, notes)

-- APPOINTMENTS
appointments (appointment_id PK, patient_id FK, doctor_id FK, scheduled_at, status, reason)

-- VITALS
vitals (vital_id PK, admission_id FK, nurse_id FK, recorded_at, temperature, blood_pressure_sys, blood_pressure_dia, pulse, oxygen_saturation, weight, notes)

-- PRESCRIPTIONS
prescriptions (prescription_id PK, admission_id FK, doctor_id FK, prescribed_at, notes)
prescription_items (item_id PK, prescription_id FK, medicine_id FK, dosage, frequency, duration_days, instructions)

-- MEDICINES
medicines (medicine_id PK, generic_name, brand_name, category, unit, description)
medicine_inventory (inventory_id PK, medicine_id FK, quantity_available, reorder_level, last_updated)

-- LAB
lab_orders (order_id PK, admission_id FK, doctor_id FK, test_name, ordered_at, status, priority)
lab_results (result_id PK, order_id FK, tech_id FK, result_summary, result_file_id FK, resulted_at, notes)

-- MEDIA FILES
media_files (file_id PK, entity_type, entity_id, file_name, file_type, file_data BYTEA, firebase_url, uploaded_at, uploaded_by FK)

-- BILLING
bills (bill_id PK, admission_id FK, generated_by FK, generated_at, total_amount, discount, paid_amount, status)
bill_items (bill_item_id PK, bill_id FK, service_type, description, quantity, unit_price, total_price)
payments (payment_id PK, bill_id FK, paid_at, amount, payment_method, received_by FK)

-- ALERTS & AUDIT
alerts (alert_id PK, alert_type, entity_id, message, is_resolved, created_at)
audit_log (log_id PK, user_id FK, action, table_name, record_id, timestamp, old_value, new_value)
```

---

## ⚙️ Required SQL Implementations

### FUNCTIONS
```sql
-- 1. Calculate patient age from DOB
CREATE OR REPLACE FUNCTION calculate_age(dob DATE) RETURNS INTEGER

-- 2. Calculate total bill for an admission
CREATE OR REPLACE FUNCTION calculate_bill_total(p_admission_id INT) RETURNS NUMERIC

-- 3. Get bed occupancy rate for a ward
CREATE OR REPLACE FUNCTION bed_occupancy_rate(p_ward_id INT) RETURNS NUMERIC

-- 4. Get minutes per goal (repurposed: average vitals reading per patient)
CREATE OR REPLACE FUNCTION average_vital(p_admission_id INT, p_vital TEXT) RETURNS NUMERIC
```

### STORED PROCEDURES
```sql
-- 1. Full discharge pipeline — updates bed, finalizes bill, archives admission
CREATE OR REPLACE PROCEDURE discharge_patient(p_admission_id INT, p_discharged_by INT)

-- 2. Admit a patient — assigns bed, creates admission record, notifies Firebase
CREATE OR REPLACE PROCEDURE admit_patient(p_patient_id INT, p_bed_id INT, p_doctor_id INT, p_type TEXT)

-- 3. Generate itemized bill from all services in an admission
CREATE OR REPLACE PROCEDURE generate_bill(p_admission_id INT, p_generated_by INT)
```

### VIEWS
```sql
-- 1. All currently active admissions with patient + doctor + ward info
CREATE VIEW active_admissions_view AS ...

-- 2. Today's doctor schedule with appointment count
CREATE VIEW doctor_schedule_today AS ...

-- 3. All pending lab orders with patient name and priority
CREATE VIEW pending_lab_orders_view AS ...

-- 4. Ward occupancy summary — total beds, occupied, available per ward
CREATE VIEW ward_occupancy_view AS ...

-- 5. Top prescribed medicines this month
CREATE VIEW top_medicines_this_month AS ...
```

### JOINS
- Patient + Admission + Bed + Ward + Doctor on admission dashboard
- Prescription + PrescriptionItems + Medicine for pharmacist dispense view
- Bill + BillItems + Payment for billing summary
- LabOrders + LabResults + MediaFiles for lab report view

### SUBQUERIES
```sql
-- Patients admitted more than 3 times in the last year
-- Doctors with highest active patient load
-- Medicines below reorder level (used in pharmacist alert)
-- Admissions with no vitals recorded in last 12 hours (nurse alert)
```

### CURSORS
```sql
-- Loop through all active admissions, flag any patient admitted 30+ days
-- Loop through medicine inventory, insert alert for items below reorder level
```

### TRIGGERS
```sql
-- On bed assignment → UPDATE beds SET status = 'occupied'
-- On discharge → UPDATE beds SET status = 'available'
-- On medicine dispensed → DECREMENT medicine_inventory quantity
-- On inventory quantity < reorder_level → INSERT into alerts
-- On any admission/discharge → INSERT into audit_log
-- On vitals insert with abnormal values → INSERT alert for nurse supervisor
```

### INDEXES
```sql
CREATE INDEX idx_patients_cnic ON patients(cnic);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_medicines_name ON medicines(generic_name);
```

### TRANSACTIONS
```sql
-- Discharge: update admission status + bed status + finalize bill — all or rollback
-- Admit: create admission + update bed status — all or rollback
-- Payment: record payment + update bill paid_amount + status — all or rollback
-- Transfer: close old bed, open new bed, update admission — all or rollback
```

---

## 🔥 Firebase Integration

### What lives in Firestore (real-time, read-heavy):
- `beds` collection — real-time bed availability board (synced from Postgres on every admit/discharge)
- `ot_status` collection — operation theater live status
- `patient_queue` collection — receptionist waiting list display
- `alerts` collection — live alert feed for nurses/pharmacists

### What lives in Firebase Storage:
- Patient profile photos
- Lab result PDFs and images
- X-ray image files

### One-Click Backup Logic:
**Postgres → Firebase:**  
Read all `admissions`, `beds`, `patients` from Postgres → write/overwrite to Firestore collections

**Firebase → Postgres:**  
Read Firestore `beds` and `alerts` → upsert into Postgres tables

Both triggered via a single button in the Admin dashboard, calling `/api/admin/backup/push` or `/api/admin/backup/pull`

---

## 📁 Project Folder Structure

```
hms/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # DB config, Firebase config, JWT secret
│   │   ├── db.py                # psycopg2 connection pool
│   │   ├── firebase.py          # firebase-admin initialization
│   │   ├── auth/
│   │   │   ├── routes.py        # /login, /logout, /refresh
│   │   │   └── middleware.py    # JWT role-based decorators
│   │   ├── patients/
│   │   │   ├── routes.py
│   │   │   └── queries.py       # Raw SQL queries
│   │   ├── admissions/
│   │   ├── doctors/
│   │   ├── nurses/
│   │   ├── lab/
│   │   ├── pharmacy/
│   │   ├── billing/
│   │   ├── wards/
│   │   ├── media/
│   │   ├── firebase_sync/
│   │   │   └── routes.py        # /backup/push, /backup/pull
│   │   └── admin/
│   ├── migrations/              # Alembic migrations
│   ├── sql/
│   │   ├── schema.sql           # All CREATE TABLE statements
│   │   ├── functions.sql        # All FUNCTION definitions
│   │   ├── procedures.sql       # All STORED PROCEDURE definitions
│   │   ├── views.sql            # All VIEW definitions
│   │   ├── triggers.sql         # All TRIGGER definitions
│   │   └── indexes.sql          # All INDEX definitions
│   ├── seed/
│   │   ├── seed_data.py         # Insert sample HMS data into Postgres
│   │   └── media_generator.py   # Gemini API script — generates + stores media for first 10 patients
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx    # Role-based dashboard
│   │   │   ├── Patients.jsx
│   │   │   ├── Admissions.jsx
│   │   │   ├── Wards.jsx
│   │   │   ├── Lab.jsx
│   │   │   ├── Pharmacy.jsx
│   │   │   ├── Billing.jsx
│   │   │   └── Admin.jsx
│   │   ├── api/                 # Axios API calls per module
│   │   ├── context/             # Auth context, role context
│   │   └── App.jsx
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml           # Written manually by developer
├── Dockerfile.backend           # Written manually by developer
├── Dockerfile.frontend          # Written manually by developer
├── .github/
│   └── workflows/
│       └── ci.yml               # Written manually by developer
└── prompt.md                    # This file
```

---

## 🔢 Step-by-Step Build Process

Follow this exact order. Do not skip steps.

### PHASE 1 — Environment Setup
- [x] ~~1. Initialize Git repo, create `.gitignore`~~ *(already done by developer)*
- [x] ~~2. Write `docker-compose.yml`~~ *(written manually by developer)*
- [x] ~~3. Write `Dockerfile.backend`~~ *(written manually by developer)*
- [x] ~~4. Write `Dockerfile.frontend`~~ *(written manually by developer)*
- [ ] 5. Set up Firebase project, download `serviceAccountKey.json`, place at `backend/serviceAccountKey.json`
- [x] ~~6. Create `.env` file~~ *(created manually by developer — see `.env.template` for required keys)*
- [ ] 7. Activate `.venv` on Windows: `.venv\Scripts\activate`
- [ ] 8. Install all backend dependencies: `pip install -r backend/requirements.txt`

### PHASE 2 — Database Schema
- [ ] 9. Write `sql/schema.sql` — all tables in dependency order (no FK violations)
- [ ] 10. Write `sql/indexes.sql`
- [ ] 11. Write `sql/functions.sql`
- [ ] 12. Write `sql/triggers.sql`
- [ ] 13. Write `sql/procedures.sql`
- [ ] 14. Write `sql/views.sql`
- [ ] 15. Run all SQL files against Postgres, verify zero errors
- [ ] 16. Set up Alembic, create initial migration from schema

### PHASE 3 — Seed Data
- [ ] 17. Write `seed/seed_data.py` — insert realistic HMS data:
  - 8 users (one per role)
  - 3 wards, 20 beds
  - 10 patients
  - 5 doctors, 3 nurses
  - 20 admissions (mix of active and discharged)
  - 30 prescriptions with items
  - 20 lab orders with results
  - Medicine inventory (50 medicines)
  - 10 bills with payments
- [ ] 18. Run seed_data.py, verify data integrity in Postgres
- [ ] 19. Write `seed/media_generator.py` — Gemini API script that:
  - Reads first 10 patients from Postgres by patient_id order
  - For each patient generates:
    - **Profile photo** — realistic human face image (described via Gemini, rendered as JPEG)
    - **Lab result PDF** — formatted PDF with patient name, test name, values, reference ranges, date
    - **X-ray image** — grayscale chest X-ray style image (PNG)
  - Stores each file:
    - As BYTEA in `media_files.file_data` in Postgres
    - As a file in Firebase Storage under `patients/{patient_id}/` folder
    - Saves the Firebase download URL back into `media_files.firebase_url`
  - Inserts a row into `media_files` for each file linking to the patient
  - Runs fully from `.venv` — requires `GEMINI_API_KEY` and `FIREBASE_CREDENTIALS_PATH` from `.env`
- [ ] 20. Run media_generator.py, verify files appear in both Postgres and Firebase Storage

### PHASE 4 — Flask Backend
- [ ] 21. Set up Flask app factory in `app/__init__.py`
- [ ] 22. Set up psycopg2 connection pool in `app/db.py`
- [ ] 23. Initialize firebase-admin in `app/firebase.py`
- [ ] 24. Build auth module — JWT login, role-based decorators
- [ ] 25. Build each module's routes + queries in this order:
  - patients
  - wards + beds
  - admissions (call stored procedures here)
  - doctors + appointments
  - nurses + vitals
  - lab
  - pharmacy
  - billing
  - media upload/download
  - firebase_sync (backup push/pull)
  - admin
- [ ] 26. Test every endpoint with Postman or curl before moving to frontend

### PHASE 5 — React Frontend
- [ ] 27. Initialize React app with Vite, install Tailwind CSS
- [ ] 28. Set up Axios instance with base URL + JWT interceptor
- [ ] 29. Build Auth context + protected routes with role-based redirect
- [ ] 30. Build Login page
- [ ] 31. Build role-based Dashboard (different view per role on login)
- [ ] 32. Build pages in this order:
  - Patients (list, register, detail)
  - Wards (bed availability grid — pulls from Firebase real-time)
  - Admissions (admit, discharge, active list)
  - Doctors + Appointments
  - Vitals entry (Nurse view)
  - Lab orders + result upload (Lab Tech view)
  - Pharmacy dispense (Pharmacist view)
  - Billing (generate + payment)
  - Admin panel (user management + one-click backup button)
- [ ] 33. Connect all pages to backend API

### PHASE 6 — Firebase Real-time Features
- [ ] 34. Set up Firestore listeners in React for bed availability page
- [ ] 35. Set up Firestore listener for live alerts feed
- [ ] 36. Test one-click backup push (Postgres → Firebase)
- [ ] 37. Test one-click backup pull (Firebase → Postgres)

### PHASE 7 — Media Storage (Runtime Uploads)
- [ ] 38. Implement patient photo upload via frontend → Flask → store BYTEA in Postgres + URL in Firebase Storage
- [ ] 39. Implement lab result PDF/image upload → same dual storage pipeline
- [ ] 40. Implement file retrieval endpoint and display in frontend (patient profile, lab report viewer)

### PHASE 8 — Docker & Final Integration
- [ ] 41. Verify full Docker Compose stack runs cold start to working app
- [ ] 42. Test all role workflows end-to-end in containerized environment
- [x] ~~CI/CD pipeline~~ *(written manually by developer)*
- [x] ~~Phase 9 Documentation~~ *(handled manually by developer)*

---

## ⚠️ Critical Rules for AI-Assisted (Vibe) Coding

1. **Never use an ORM for the SQL requirements.** SQLAlchemy models are fine for config, but all queries involving functions, procedures, triggers, cursors, views must be raw SQL via psycopg2. The examiner will check this.

2. **Write all SQL files separately** in the `sql/` folder before touching the backend. Schema first, always.

3. **Triggers and stored procedures must be tested manually** in psql or pgAdmin before assuming they work. AI gets the syntax subtly wrong on PostgreSQL-specific features.

4. **Cursors in PostgreSQL** use `DECLARE`, `OPEN`, `FETCH`, `CLOSE` syntax inside PL/pgSQL — not the same as MySQL. Verify this.

5. **Transactions in Flask** — use `conn.autocommit = False`, then `conn.commit()` or `conn.rollback()` explicitly. Never rely on autocommit for the discharge/admit procedures.

6. **Firebase sync** — always write a try/except around Firebase calls. If Firebase is down, Postgres operations must not fail.

7. **JWT tokens** — store in `httpOnly` cookies on frontend, not localStorage. Prevents XSS.

8. **Role checks** — implement as Flask decorators, not inline if-statements. Clean and reusable.

9. **Media files** — set a max upload size (10MB) in Flask config. Do not store raw video in Postgres bytea — Firebase Storage only for video.

10. **Never commit** `serviceAccountKey.json` or `.env` to Git. Add both to `.gitignore` on day one.

---

## 📊 Submission Checklist

- [ ] App description written
- [ ] All user types documented with specific requirements
- [ ] Flowcharts/diagrams complete
- [ ] Full ERD submitted
- [ ] Data is in normalized form (3NF minimum)
- [ ] Functions implemented and demonstrated
- [ ] Stored Procedures implemented and demonstrated
- [ ] Views implemented and demonstrated
- [ ] Joins used in at least 3 major queries
- [ ] SubQueries used in at least 3 places
- [ ] Cursors implemented and demonstrated
- [ ] Triggers implemented and demonstrated (min 4 triggers)
- [ ] Indexes created on all major search/filter columns
- [ ] Transactions used for all multi-table write operations
- [ ] Flask backend connected to Postgres
- [ ] React frontend connected to Flask
- [ ] Firebase Firestore integrated
- [ ] One-click backup working (both directions)
- [ ] Media storage working (images/PDFs) — both Postgres BYTEA and Firebase Storage
- [ ] media_generator.py successfully ran for first 10 patients
- [ ] Docker Compose runs full stack
