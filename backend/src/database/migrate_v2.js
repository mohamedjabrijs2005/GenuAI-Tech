require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

// ============================================================
// GenuAI v2 Additive Migration
// Adds: vacancy_versions, assessment_versions, evidence_coverage,
//       recruiter_reviews, human_decisions, and schema improvements
// All statements use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
// Safe to run repeatedly.
// ============================================================

const V2_SQL = `

-- ============================================================
-- VACANCY VERSIONS
-- When requirements/assessment config changes after recruitment
-- activity starts, create a new version. Candidates are always
-- linked to the version they applied under.
-- ============================================================
CREATE TABLE IF NOT EXISTS vacancy_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id         UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL DEFAULT 1,
  status          VARCHAR(30) NOT NULL DEFAULT 'Draft'
                    CHECK (status IN ('Draft','Under Review','Verified','Active','Paused','Closed','Superseded')),
  change_summary  TEXT,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_vac_versions_role ON vacancy_versions(role_id);
CREATE INDEX IF NOT EXISTS idx_vac_versions_status ON vacancy_versions(status);

-- Link applications to exact vacancy version
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='applications' AND column_name='vacancy_version_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Link requirements to a vacancy version (requirements are versioned)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requirements' AND column_name='vacancy_version_id'
  ) THEN
    ALTER TABLE requirements ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add status/suggestion_source to requirements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requirements' AND column_name='req_status'
  ) THEN
    ALTER TABLE requirements ADD COLUMN req_status VARCHAR(30) NOT NULL DEFAULT 'Confirmed'
      CHECK (req_status IN ('AI Suggestion','Under Review','Confirmed','Archived'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requirements' AND column_name='suggestion_source'
  ) THEN
    ALTER TABLE requirements ADD COLUMN suggestion_source VARCHAR(50) DEFAULT 'Manual';
  END IF;
END $$;

-- ============================================================
-- ASSESSMENT VERSIONS
-- Official assessment versions are immutable once candidates start.
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_versions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_group_id UUID NOT NULL REFERENCES assessment_groups(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  version_number      INTEGER NOT NULL DEFAULT 1,
  status              VARCHAR(30) NOT NULL DEFAULT 'Draft'
                        CHECK (status IN ('Draft','Active','Locked','Archived')),
  config              JSONB DEFAULT '{}',
  locked_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_group_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_assess_versions_group ON assessment_versions(assessment_group_id);

-- Link assessment results to exact assessment version
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_results' AND column_name='assessment_version_id'
  ) THEN
    ALTER TABLE assessment_results ADD COLUMN assessment_version_id UUID REFERENCES assessment_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Link evidence to exact assessment version
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='evidence' AND column_name='assessment_version_id'
  ) THEN
    ALTER TABLE evidence ADD COLUMN assessment_version_id UUID REFERENCES assessment_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='evidence' AND column_name='vacancy_version_id'
  ) THEN
    ALTER TABLE evidence ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='evidence' AND column_name='evaluation_group_id'
  ) THEN
    ALTER TABLE evidence ADD COLUMN evaluation_group_id UUID REFERENCES evaluation_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='evidence' AND column_name='source_type'
  ) THEN
    ALTER TABLE evidence ADD COLUMN source_type VARCHAR(100) DEFAULT 'Official Assessment'
      CHECK (source_type IN ('Official Assessment','Structured Interview','Project Evaluation',
                             'Credential','Candidate Submission','Resume / Experience','Recruiter Evaluation'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='evidence' AND column_name='integrity_context'
  ) THEN
    ALTER TABLE evidence ADD COLUMN integrity_context JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================================
-- EVIDENCE COVERAGE SNAPSHOT
-- Pre-computed per application for fast matrix display.
-- Recalculated whenever evidence changes.
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_coverage (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  vacancy_version_id  UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  total_requirements  INTEGER NOT NULL DEFAULT 0,
  supporting_count    INTEGER NOT NULL DEFAULT 0,
  pending_count       INTEGER NOT NULL DEFAULT 0,
  limited_count       INTEGER NOT NULL DEFAULT 0,
  gap_count           INTEGER NOT NULL DEFAULT 0,
  na_count            INTEGER NOT NULL DEFAULT 0,
  coverage_pct        NUMERIC(5,2) DEFAULT 0,
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id)
);
CREATE INDEX IF NOT EXISTS idx_coverage_app ON evidence_coverage(application_id);
CREATE INDEX IF NOT EXISTS idx_coverage_company ON evidence_coverage(company_id);

-- ============================================================
-- RECRUITER REVIEWS
-- Human-authored review per application, pre-decision.
-- ============================================================
CREATE TABLE IF NOT EXISTS recruiter_reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary        TEXT,
  evidence_note  TEXT,
  gap_note       TEXT,
  integrity_note TEXT,
  interview_note TEXT,
  overall_note   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON recruiter_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON recruiter_reviews(company_id);

-- ============================================================
-- HUMAN DECISIONS
-- Final human-led hiring decision — separate from application status.
-- Immutable after creation.
-- ============================================================
CREATE TABLE IF NOT EXISTS human_decisions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  decided_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decision         VARCHAR(30) NOT NULL
                     CHECK (decision IN ('Selected','Rejected','On Hold','Deferred')),
  rationale        TEXT,
  evidence_summary TEXT,
  decided_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id)
);
CREATE INDEX IF NOT EXISTS idx_decisions_app ON human_decisions(application_id);
CREATE INDEX IF NOT EXISTS idx_decisions_company ON human_decisions(company_id);

-- ============================================================
-- AGREEMENTS — add vacancy_version_id + explicit types
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agreements' AND column_name='vacancy_version_id'
  ) THEN
    ALTER TABLE agreements ADD COLUMN vacancy_version_id UUID REFERENCES vacancy_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agreements' AND column_name='terms_hash'
  ) THEN
    ALTER TABLE agreements ADD COLUMN terms_hash VARCHAR(64);
  END IF;
END $$;

-- ============================================================
-- ASSESSMENT GROUPS — add integrity_config and status
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_groups' AND column_name='status'
  ) THEN
    ALTER TABLE assessment_groups ADD COLUMN status VARCHAR(30) DEFAULT 'Draft'
      CHECK (status IN ('Draft','Active','Locked','Archived'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_groups' AND column_name='integrity_config'
  ) THEN
    ALTER TABLE assessment_groups ADD COLUMN integrity_config JSONB DEFAULT '{
      "tab_monitoring": true,
      "copy_paste_detection": true,
      "webcam_required": false,
      "multi_person_detection": false,
      "audio_monitoring": false,
      "environment_snapshot": false
    }';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_groups' AND column_name='randomize_questions'
  ) THEN
    ALTER TABLE assessment_groups ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_groups' AND column_name='max_attempts'
  ) THEN
    ALTER TABLE assessment_groups ADD COLUMN max_attempts INTEGER DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='assessment_groups' AND column_name='availability_window_days'
  ) THEN
    ALTER TABLE assessment_groups ADD COLUMN availability_window_days INTEGER DEFAULT 7;
  END IF;
END $$;

-- ============================================================
-- AUDIT LOGS — add role + action_category columns
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='audit_logs' AND column_name='actor_role'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN actor_role VARCHAR(100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='audit_logs' AND column_name='prev_state'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN prev_state JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='audit_logs' AND column_name='new_state'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN new_state JSONB;
  END IF;
END $$;

`;

async function migrateV2() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running GenuAI v2 additive migration...');
    await client.query(V2_SQL);
    console.log('✅ v2 migration completed successfully.');
  } catch (err) {
    console.error('❌ v2 migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV2().catch(() => process.exit(1));
