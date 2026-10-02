require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'company_admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(255) NOT NULL,
  industry              VARCHAR(100),
  description           TEXT,
  size                  VARCHAR(50),
  website               VARCHAR(255),
  official_email        VARCHAR(255),
  location              VARCHAR(255),
  hiring_contact_name   VARCHAR(150),
  hiring_contact_email  VARCHAR(255),
  hiring_contact_phone  VARCHAR(50),
  verification_status   VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED'
                          CHECK (verification_status IN ('UNVERIFIED','UNDER_REVIEW','VERIFIED','SUSPENDED')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPANY MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS company_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- ============================================================
-- COMPANY ROLES (Vacancies)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_roles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id    UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  title            VARCHAR(255) NOT NULL,
  job_description  TEXT,
  experience_level VARCHAR(50) NOT NULL
                     CHECK (experience_level IN ('entry','mid','senior','lead','executive')),
  employment_type  VARCHAR(50) NOT NULL
                     CHECK (employment_type IN ('full_time','part_time','contract','internship','freelance')),
  location         VARCHAR(255) NOT NULL,
  work_mode        VARCHAR(30) DEFAULT 'Hybrid'
                     CHECK (work_mode IN ('On-site','Remote','Hybrid')),
  salary_range     VARCHAR(100),
  vacancy_count    INTEGER NOT NULL DEFAULT 1 CHECK (vacancy_count >= 1),
  closing_date     DATE,
  status           VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','UNDER_REVIEW','VERIFIED','ACTIVE','PAUSED','CLOSED','DEACTIVATED')),
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REQUIREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS requirements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id         UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(100) NOT NULL DEFAULT 'Technical',
  req_type        VARCHAR(20) NOT NULL DEFAULT 'Required'
                    CHECK (req_type IN ('Required','Preferred')),
  priority        VARCHAR(20) NOT NULL DEFAULT 'Medium'
                    CHECK (priority IN ('High','Medium','Low')),
  proficiency     VARCHAR(30) NOT NULL DEFAULT 'Intermediate'
                    CHECK (proficiency IN ('Basic','Intermediate','Advanced','Expert')),
  eval_method     VARCHAR(100) NOT NULL DEFAULT 'Official Technical Assessment',
  req_group       VARCHAR(100) DEFAULT 'TECHNICAL',
  weight          NUMERIC(5,2) DEFAULT 1.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSESSMENT GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id     UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(100) DEFAULT 'Official Technical Assessment',
  duration    INTEGER DEFAULT 60,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVALUATION GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluation_groups (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_group_id   UUID NOT NULL REFERENCES assessment_groups(id) ON DELETE CASCADE,
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,
  mapped_requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  question_count        INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_group_id UUID NOT NULL REFERENCES evaluation_groups(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  question_type       VARCHAR(50) DEFAULT 'MCQ'
                        CHECK (question_type IN ('MCQ','Coding','DSA','Essay','Short Answer','True/False')),
  points              NUMERIC(5,2) DEFAULT 1.0,
  options             JSONB,
  correct_answer      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(50),
  location     VARCHAR(255),
  resume_url   VARCHAR(500),
  profile_data JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  role_id             UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status              VARCHAR(50) NOT NULL DEFAULT 'Applied'
                        CHECK (status IN ('Applied','Eligible','Verified','Invited','Assessed','Review','Interview','Decision','Selected','Rejected','Withdrawn')),
  verification_status VARCHAR(30) DEFAULT 'Pending'
                        CHECK (verification_status IN ('Pending','Verified','Needs Review','Failed')),
  applied_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes               TEXT,
  recruiter_notes     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, role_id)
);

-- ============================================================
-- ASSESSMENT RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_results (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  assessment_group_id UUID REFERENCES assessment_groups(id) ON DELETE SET NULL,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  overall_score       NUMERIC(5,2),
  max_score           NUMERIC(5,2) DEFAULT 100,
  status              VARCHAR(30) DEFAULT 'Pending'
                        CHECK (status IN ('Pending','In Progress','Completed','Invalidated')),
  remarks             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVIDENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id       UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  requirement_id       UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE SET NULL,
  score                NUMERIC(5,2),
  max_score            NUMERIC(5,2) DEFAULT 100,
  status               VARCHAR(30) NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending','Supporting','Limited','Gap','Not Applicable')),
  source               VARCHAR(100) DEFAULT 'Assessment',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, requirement_id)
);

-- ============================================================
-- INTERVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_mins  INTEGER DEFAULT 60,
  location       VARCHAR(255),
  video_link     VARCHAR(500),
  interview_type VARCHAR(50) DEFAULT 'Structured'
                   CHECK (interview_type IN ('Structured','Technical','HR','Panel','Final')),
  status         VARCHAR(30) DEFAULT 'Scheduled'
                   CHECK (status IN ('Scheduled','Completed','Cancelled','No Show')),
  feedback       TEXT,
  comm_score     NUMERIC(3,1),
  problem_score  NUMERIC(3,1),
  overall_score  NUMERIC(3,1),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTEGRITY SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS integrity_signals (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id       UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_type          VARCHAR(100) NOT NULL,
  severity             VARCHAR(20) NOT NULL DEFAULT 'Low'
                         CHECK (severity IN ('Low','Medium','High','Critical')),
  signal_time          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details              JSONB DEFAULT '{}',
  status               VARCHAR(30) NOT NULL DEFAULT 'New'
                         CHECK (status IN ('New','Under Review','Acknowledged','Dismissed')),
  reviewed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note          TEXT,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name  VARCHAR(200),
  actor_email VARCHAR(255),
  entity_type VARCHAR(100) NOT NULL,
  entity_id   VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  details     JSONB DEFAULT '{}',
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AGREEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agreements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id        UUID REFERENCES company_roles(id) ON DELETE CASCADE,
  agreement_type VARCHAR(100) NOT NULL,
  accepted       BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at    TIMESTAMPTZ,
  version        VARCHAR(20) DEFAULT '1.0',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  entity_type VARCHAR(100),
  entity_id   VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_members_user    ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company     ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_company   ON company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_dept      ON company_roles(department_id);
CREATE INDEX IF NOT EXISTS idx_requirements_role       ON requirements(role_id);
CREATE INDEX IF NOT EXISTS idx_requirements_company    ON requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_assessment_groups_role  ON assessment_groups(role_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_groups_ag    ON evaluation_groups(assessment_group_id);
CREATE INDEX IF NOT EXISTS idx_applications_role       ON applications(role_id);
CREATE INDEX IF NOT EXISTS idx_applications_company    ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate  ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_app  ON assessment_results(application_id);
CREATE INDEX IF NOT EXISTS idx_evidence_app            ON evidence(application_id);
CREATE INDEX IF NOT EXISTS idx_evidence_req            ON evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_interviews_app          ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company      ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_integrity_app           ON integrity_signals(application_id);
CREATE INDEX IF NOT EXISTS idx_integrity_company       ON integrity_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company           ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created           ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company   ON notifications(company_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running GenuAI migrations...');
    await client.query(MIGRATION_SQL);
    console.log('✅ All migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
