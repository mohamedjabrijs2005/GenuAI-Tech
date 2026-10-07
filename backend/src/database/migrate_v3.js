require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_V3_SQL = `
-- ============================================================
-- 1. COMPANIES: Add review fields & update verification_status
-- ============================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_review_note TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;

-- Drop existing verification_status check constraint
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_verification_status_check;

-- Backfill legacy statuses
UPDATE companies SET verification_status = 'PENDING_VERIFICATION' WHERE verification_status IN ('UNVERIFIED', 'Pending', 'pending');
UPDATE companies SET verification_status = 'APPROVED' WHERE verification_status IN ('VERIFIED', 'Verified', 'verified', 'Approved');
UPDATE companies SET verification_status = 'UNDER_REVIEW' WHERE verification_status IN ('Under Review', 'under_review');
UPDATE companies SET verification_status = 'SUSPENDED' WHERE verification_status IN ('Suspended', 'suspended');

-- Add canonical constraint
ALTER TABLE companies ADD CONSTRAINT companies_verification_status_check
  CHECK (verification_status IN (
    'PENDING_VERIFICATION',
    'UNDER_REVIEW',
    'ADDITIONAL_INFORMATION_REQUIRED',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'ARCHIVED'
  ));

ALTER TABLE companies ALTER COLUMN verification_status SET DEFAULT 'PENDING_VERIFICATION';

-- ============================================================
-- 2. COMPANY_ROLES (Vacancies): Add review fields & update status
-- ============================================================
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS experience_min INTEGER DEFAULT 0;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS experience_max INTEGER DEFAULT 10;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS application_deadline DATE;

-- Drop existing status check constraint
ALTER TABLE company_roles DROP CONSTRAINT IF EXISTS company_roles_status_check;

-- Backfill legacy statuses
UPDATE company_roles SET status = 'PENDING_ADMIN_REVIEW' WHERE status IN ('UNDER_REVIEW', 'Pending Review', 'pending');
UPDATE company_roles SET status = 'APPROVED' WHERE status IN ('VERIFIED', 'Verified');
UPDATE company_roles SET status = 'PUBLISHED' WHERE status IN ('ACTIVE', 'Active', 'published');
UPDATE company_roles SET status = 'ARCHIVED' WHERE status IN ('DEACTIVATED', 'Archived');
UPDATE company_roles SET status = 'DRAFT' WHERE status IN ('Draft', 'draft');

-- Add canonical constraint
ALTER TABLE company_roles ADD CONSTRAINT company_roles_status_check
  CHECK (status IN (
    'DRAFT',
    'PENDING_ADMIN_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'PUBLISHED',
    'PAUSED',
    'CLOSED',
    'ARCHIVED',
    'REJECTED'
  ));

ALTER TABLE company_roles ALTER COLUMN status SET DEFAULT 'DRAFT';

-- ============================================================
-- 3. AUDIT_LOGS: Add canonical actor, reason & status columns
-- ============================================================
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_status VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_status VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Backfill user_id to actor_user_id if present
UPDATE audit_logs SET actor_user_id = user_id WHERE actor_user_id IS NULL AND user_id IS NOT NULL;

-- ============================================================
-- 4. REQUIREMENTS: Ensure type, importance, evaluation methods
-- ============================================================
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS requirement_type VARCHAR(50) DEFAULT 'SKILL';
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS importance VARCHAR(30) DEFAULT 'REQUIRED';
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS evaluation_methods JSONB DEFAULT '["ASSESSMENT"]';
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE';

-- Backfill requirement fields
UPDATE requirements SET requirement_type = UPPER(category) WHERE requirement_type = 'SKILL' AND category IS NOT NULL;
UPDATE requirements SET importance = UPPER(req_type) WHERE req_type IS NOT NULL;

-- ============================================================
-- 5. VACANCY_VERSIONS status constraint update
-- ============================================================
ALTER TABLE vacancy_versions DROP CONSTRAINT IF EXISTS vacancy_versions_status_check;
ALTER TABLE vacancy_versions ADD CONSTRAINT vacancy_versions_status_check
  CHECK (status IN ('Draft','Pending Review','Approved','Published','Paused','Closed','Superseded','Archived','Rejected'));

-- ============================================================
-- 6. INDEXES for fast governance queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_company_roles_status ON company_roles(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running GenuAI v3 Status Normalization Migration...');
    await client.query('BEGIN');
    await client.query(MIGRATION_V3_SQL);
    await client.query('COMMIT');
    console.log('✅ v3 Status Normalization Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration v3 failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
