PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id TEXT PRIMARY KEY,
  synthetic_bool INTEGER NOT NULL CHECK (synthetic_bool = 1),
  name TEXT NOT NULL,
  dob TEXT NOT NULL,
  sex TEXT,
  summary_text TEXT
);

CREATE TABLE IF NOT EXISTS doctor_patients (
  doctor_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  active_from TEXT NOT NULL,
  active_to TEXT,
  PRIMARY KEY (doctor_id, patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS encounters (
  encounter_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  encounter_type TEXT NOT NULL,
  title TEXT NOT NULL,
  chief_complaint TEXT,
  soap_note_text TEXT,
  diagnosis_codes_json TEXT NOT NULL DEFAULT '[]',
  medications_json TEXT NOT NULL DEFAULT '[]',
  vitals_json TEXT NOT NULL DEFAULT '{}',
  consent_category TEXT NOT NULL DEFAULT 'general',
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

CREATE TABLE IF NOT EXISTS transcripts (
  transcript_id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  segment_id TEXT PRIMARY KEY,
  transcript_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  speaker TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_final INTEGER NOT NULL,
  consent_category TEXT NOT NULL,
  documentation_status TEXT NOT NULL DEFAULT 'spoken_only',
  FOREIGN KEY (transcript_id) REFERENCES transcripts(transcript_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS diagnoses (
  diagnosis_id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  code_system TEXT NOT NULL,
  code TEXT NOT NULL,
  display TEXT NOT NULL,
  diagnosed_on TEXT NOT NULL,
  consent_category TEXT NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS observations (
  observation_id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  value_num REAL,
  value_text TEXT,
  unit TEXT,
  observed_at TEXT NOT NULL,
  consent_category TEXT NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS medication_events (
  medication_event_id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  documented_reason TEXT,
  consent_category TEXT NOT NULL DEFAULT 'medications',
  FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS allergies (
  allergy_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  display TEXT NOT NULL,
  consent_category TEXT NOT NULL DEFAULT 'general',
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS consent_flags (
  patient_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'behavioral_health', 'medications')),
  consented_bool INTEGER NOT NULL,
  last_updated TEXT NOT NULL,
  version INTEGER NOT NULL,
  PRIMARY KEY (patient_id, category),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  notes_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

CREATE TABLE IF NOT EXISTS live_transcript_segments (
  segment_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  speaker TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_final INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
  answer_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  response_json TEXT NOT NULL,
  consent_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_tasks (
  task_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  text TEXT NOT NULL,
  due_date TEXT,
  completed_bool INTEGER NOT NULL DEFAULT 0,
  local_only_bool INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doctor_patients_doctor
  ON doctor_patients(doctor_id, active_to, patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient_date
  ON encounters(patient_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_observations_patient_date
  ON observations(patient_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient_date
  ON diagnoses(patient_id, diagnosed_on);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_patient
  ON transcript_segments(patient_id, transcript_id, start_ms);
