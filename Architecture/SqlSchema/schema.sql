-- ============================================================
-- Generated SQL schema (PostgreSQL) converted from Drizzle ORM
-- src/db/schema.ts
-- ============================================================

-- Extension needed for gen_random_uuid() used by defaultRandom()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- ADMIN PORTAL
-- ─────────────────────────────────────────────
CREATE TABLE admins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) NOT NULL UNIQUE,
    name        TEXT NOT NULL DEFAULT 'null',
    email       TEXT NOT NULL DEFAULT 'null',
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'admin',
    status      TEXT NOT NULL DEFAULT 'Active', -- 'Active' | 'Suspended'
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ADMIN AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL,
    actor_name  TEXT NOT NULL,
    actor_role  TEXT NOT NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    entity_name TEXT,
    description TEXT NOT NULL,
    changes     JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- STAFF / USERS / CLINIC
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    location    TEXT NOT NULL DEFAULT 'Pilot',
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    name        TEXT NOT NULL DEFAULT 'null',
    country     TEXT NOT NULL DEFAULT 'null',
    city        TEXT NOT NULL DEFAULT 'null',
    province    TEXT NOT NULL DEFAULT 'null',
    status      TEXT NOT NULL DEFAULT 'Active'
);

-- ─────────────────────────────────────────────
-- ALL ENTRIES (patients)
-- ─────────────────────────────────────────────
CREATE TABLE all_entries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phoneNumber"    TEXT NOT NULL,
    "firstName"      TEXT NOT NULL,
    "lastName"       TEXT NOT NULL DEFAULT 'null',
    father_husband   TEXT NOT NULL DEFAULT 'null',
    age              INTEGER NOT NULL,
    gender           TEXT NOT NULL,
    created_date     DATE,
    created_time     TIME,
    "consentAccepted"BOOLEAN NOT NULL DEFAULT false,   -- new
    "consentDate"    TIMESTAMPTZ,
    user_id          UUID NOT NULL REFERENCES users(id),
    email            TEXT DEFAULT 'null',
    cnic             TEXT DEFAULT 'null',
    dob              TEXT NOT NULL DEFAULT 'null',
    country          TEXT NOT NULL DEFAULT 'null',
    province         TEXT NOT NULL DEFAULT 'null',
    city             TEXT NOT NULL DEFAULT 'null',
    "stAddress"      TEXT NOT NULL DEFAULT 'null',
    languages        TEXT DEFAULT 'null',
    "surgicalHistory" TEXT DEFAULT 'null',
    "medicalHistory" TEXT DEFAULT 'null',
    "medicineHistory" TEXT DEFAULT 'null',
    allergies        TEXT DEFAULT 'null',
    vitals_recorded  BOOLEAN NOT NULL DEFAULT false,
    fcm_token        TEXT,
    token            VARCHAR(10),
    token_date       DATE,
    token_time       TIME,
    "mrNumber"       TEXT,
    "profilePhoto"   TEXT DEFAULT 'null',
    "countryCode"    TEXT DEFAULT 'null'
    consentAccepted: boolean("consentAccepted").default(false).notNull(),
    consentDate: timestamp("consentDate", { withTimezone: true }),
);

-- ─────────────────────────────────────────────
-- DOCTORS
-- ─────────────────────────────────────────────
CREATE TABLE doctors (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(20) NOT NULL,
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    password         TEXT NOT NULL,
    phone            VARCHAR(20),
    gender           TEXT,
    photo            TEXT,
    specializations  JSONB NOT NULL DEFAULT '[]',
    qualifications   JSONB NOT NULL DEFAULT '[]',
    experience       INTEGER DEFAULT 0,
    city             TEXT,
    "doctorStatus"   TEXT DEFAULT 'offline',
    user_id          UUID REFERENCES users(id),
    created_date     DATE NOT NULL DEFAULT now(),
    created_time     TIME DEFAULT now(),
    updated_date     DATE NOT NULL DEFAULT now(),
    updated_time     TIME DEFAULT now(),
    fcm_token        TEXT
);

-- ─────────────────────────────────────────────
-- DOCTOR SESSIONS  (NEW — was missing)
-- ─────────────────────────────────────────────
CREATE TABLE doctor_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    login_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    logout_at     TIMESTAMPTZ,
    logout_reason TEXT
);

-- ─────────────────────────────────────────────
-- DOCTOR SCHEDULES (weekly recurring availability)  (NEW — was missing)
-- ─────────────────────────────────────────────
CREATE TABLE doctor_schedules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week  INTEGER NOT NULL, -- 1=Monday ... 7=Sunday
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_date DATE NOT NULL DEFAULT now(),
    created_time TIME DEFAULT now()
);

-- ─────────────────────────────────────────────
-- VITALS
-- ─────────────────────────────────────────────
CREATE TABLE vitals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "PulseRate"       TEXT,
    "BloodOxygen"     TEXT,
    "Diastolic"       TEXT,
    "Systolic"        TEXT,
    "Temperature"     TEXT,
    "temperatureUnit" TEXT,
    "Weight"          TEXT,
    "Height"          TEXT,
    "heightUnit"      TEXT,
    symptoms          TEXT,
    bmi               TEXT,
    token             VARCHAR(10),
    "patientType"     TEXT DEFAULT 'Walk-in',
    created_date      DATE,
    created_time      TIME,

    -- Video call fields
    room_url          TEXT,
    room_name         TEXT,
    call_status       TEXT DEFAULT 'idle',
    called_doctor_id  UUID REFERENCES doctors(id),

    patient_id        UUID NOT NULL REFERENCES all_entries(id)
);

-- ─────────────────────────────────────────────
-- RAPID TESTING
-- ─────────────────────────────────────────────
CREATE TABLE rapid_testing (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_sugar        TEXT DEFAULT 'Not Performed',
    ecg                TEXT DEFAULT 'Not Performed',
    "ecgLink"          TEXT DEFAULT 'Not Performed',
    hiv                TEXT DEFAULT 'Not Performed',
    hepatitis          TEXT DEFAULT 'Not Performed',
    hbsag              TEXT DEFAULT 'Not Performed',
    hcv_ab             TEXT DEFAULT 'Not Performed',
    hiv_ab             TEXT DEFAULT 'Not Performed',
    dengue_ns1_ag      TEXT DEFAULT 'Not Performed',
    syphilis_ab        TEXT DEFAULT 'Not Performed',
    typhoid_ab         TEXT DEFAULT 'Not Performed',
    tuberculosis       TEXT DEFAULT 'Not Performed',
    malaria_pf_pv_ag   TEXT DEFAULT 'Not Performed',
    hemoglobin         TEXT DEFAULT 'Not Performed',
    cholesterol        TEXT DEFAULT 'Not Performed',
    body_fat           TEXT DEFAULT 'Not Performed',
    created_date       DATE,
    created_time       TIME,
    vitals_id          UUID NOT NULL REFERENCES vitals(id)
);

-- ─────────────────────────────────────────────
-- EYE TESTING
-- ─────────────────────────────────────────────
CREATE TABLE eye_testing (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_type       TEXT NOT NULL DEFAULT 'Not Performed',
    left_eye         TEXT NOT NULL DEFAULT 'Not Performed',
    right_eye        TEXT NOT NULL DEFAULT 'Not Performed',
    "leftEyeResult"  TEXT NOT NULL DEFAULT 'Not Performed',
    "rightEyeResult" TEXT NOT NULL DEFAULT 'Not Performed',
    created_date     DATE,
    created_time     TIME,
    vitals_id        UUID NOT NULL REFERENCES vitals(id)
);

-- ─────────────────────────────────────────────
-- COLOR BLIND TESTING
-- ─────────────────────────────────────────────
CREATE TABLE color_blind_testing (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_1             TEXT NOT NULL DEFAULT 'Not Performed',
    plate_2             TEXT NOT NULL DEFAULT 'Not Performed',
    plate_3             TEXT NOT NULL DEFAULT 'Not Performed',
    color_blind_result  TEXT NOT NULL DEFAULT 'Not Performed',
    created_date        DATE,
    created_time        TIME,
    vitals_id           UUID NOT NULL REFERENCES vitals(id)
);

-- ─────────────────────────────────────────────
-- HEARING TESTING
-- ─────────────────────────────────────────────
CREATE TABLE hearing_testing (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    left_ear          TEXT NOT NULL DEFAULT 'Not Performed',
    right_ear         TEXT NOT NULL DEFAULT 'Not Performed',
    left_ear_result   TEXT NOT NULL DEFAULT 'Not Performed',
    right_ear_result  TEXT NOT NULL DEFAULT 'Not Performed',
    created_date      DATE,
    created_time      TIME,
    vitals_id         UUID NOT NULL REFERENCES vitals(id)
);

-- ─────────────────────────────────────────────
-- CALLS
-- ─────────────────────────────────────────────
CREATE TABLE calls (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vitals_id    UUID NOT NULL REFERENCES vitals(id),
    doctor_id    UUID NOT NULL REFERENCES doctors(id),
    status       TEXT DEFAULT 'pending', -- pending, accepted, declined_by_doctor, declined_by_patient, doctor_not_responding, completed
    created_date DATE,
    created_time TIME
);

-- ─────────────────────────────────────────────
-- PRESCRIPTIONS (Header)
-- ─────────────────────────────────────────────
CREATE TABLE prescriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID NOT NULL REFERENCES all_entries(id) ON DELETE CASCADE,
    doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    token               VARCHAR(10) NOT NULL,
    prescription_date   DATE NOT NULL DEFAULT now(),
    prescription_time   TIME DEFAULT now(),
    diagnosis           TEXT,
    "hematologicalTest" TEXT,
    "radiologicalTest"  TEXT,
    clinical_notes      TEXT,
    created_date        DATE NOT NULL DEFAULT now(),
    created_time        TIME DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PRESCRIPTION MEDICINES (One row per medicine)
-- ─────────────────────────────────────────────
CREATE TABLE prescription_medicines (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id  UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name    TEXT NOT NULL,
    morning          BOOLEAN NOT NULL DEFAULT false,
    afternoon        BOOLEAN NOT NULL DEFAULT false,
    night            BOOLEAN NOT NULL DEFAULT false,
    before_meal      BOOLEAN NOT NULL DEFAULT false,
    after_meal       BOOLEAN NOT NULL DEFAULT true, -- default after meal as common
    dosage           TEXT,    -- e.g. "500mg", "1 tablet"
    duration         TEXT     -- e.g. "3 days", "1 week"
);

-- ─────────────────────────────────────────────
-- DOCTOR ACTIVITY LOGS (Logout Reasons)
-- ─────────────────────────────────────────────
CREATE TABLE doctor_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    action       TEXT NOT NULL DEFAULT 'logout',
    reason       TEXT NOT NULL, -- e.g. "Meal Break", "Shift Ends"
    created_date DATE NOT NULL DEFAULT now(),
    created_time TIME DEFAULT now()
);

-- ─────────────────────────────────────────────
-- MEDICINE INVENTORY
-- ─────────────────────────────────────────────
CREATE TABLE medicines_inventry (
    id           SERIAL PRIMARY KEY,
    name         TEXT,
    "row"        INTEGER NOT NULL DEFAULT 1,
    "column"     INTEGER NOT NULL DEFAULT 1,
    quantity     INTEGER NOT NULL DEFAULT 1,
    created_date DATE NOT NULL DEFAULT now(),
    created_time TIME DEFAULT now()
);