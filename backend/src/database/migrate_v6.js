require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_V6_SQL = `
-- 1. Expand Targets status check constraint
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_status_check;

ALTER TABLE targets ADD CONSTRAINT targets_status_check
  CHECK (status IN (
    'TARGETED',
    'PREPARING',
    'ASSESSMENT_PENDING',
    'ASSESSMENT_COMPLETED',
    'EVIDENCE_SUBMITTED',
    'UNDER_REVIEW',
    'MORE_INFORMATION_REQUESTED',
    'INTERVIEW',
    'HOLD',
    'DECIDED',
    'WITHDRAWN',
    'CLOSED'
  ));

-- 2. Enhance candidates table for rich Global Candidate Profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='education') THEN
    ALTER TABLE candidates ADD COLUMN education JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='general_skills') THEN
    ALTER TABLE candidates ADD COLUMN general_skills JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='experience_summary') THEN
    ALTER TABLE candidates ADD COLUMN experience_summary TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='employment_history') THEN
    ALTER TABLE candidates ADD COLUMN employment_history JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='github_url') THEN
    ALTER TABLE candidates ADD COLUMN github_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='portfolio_url') THEN
    ALTER TABLE candidates ADD COLUMN portfolio_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='linkedin_url') THEN
    ALTER TABLE candidates ADD COLUMN linkedin_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='languages') THEN
    ALTER TABLE candidates ADD COLUMN languages JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='work_preferences') THEN
    ALTER TABLE candidates ADD COLUMN work_preferences JSONB DEFAULT '{"workMode": "Any", "availability": "Immediate"}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='accessibility_needs') THEN
    ALTER TABLE candidates ADD COLUMN accessibility_needs TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='privacy_settings') THEN
    ALTER TABLE candidates ADD COLUMN privacy_settings JSONB DEFAULT '{"profile_visibility": "TARGETED_COMPANIES_ONLY", "notifications_enabled": true}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='updated_at') THEN
    ALTER TABLE candidates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Create Candidate Notifications table
CREATE TABLE IF NOT EXISTS candidate_notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  type         VARCHAR(50) DEFAULT 'INFO',
  link         VARCHAR(500),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cand_notif_candidate ON candidate_notifications(candidate_id);

-- 4. Create Accommodation Requests table
CREATE TABLE IF NOT EXISTS accommodation_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  target_id    UUID REFERENCES targets(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL,
  description  TEXT NOT NULL,
  status       VARCHAR(50) DEFAULT 'SUBMITTED',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accomm_req_candidate ON accommodation_requests(candidate_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Candidate Workspace Migration (v6)...');
    await client.query('BEGIN');
    await client.query(MIGRATION_V6_SQL);
    await client.query('COMMIT');
    console.log('✅ Migration v6 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration v6 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
