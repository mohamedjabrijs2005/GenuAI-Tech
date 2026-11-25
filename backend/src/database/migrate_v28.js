require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V28 — Missing Core Product Spine Tables:
 * 1. vacancy_skill_checklists — checklist approval & lock lifecycle per vacancy
 *    (separate from individual `requirements` rows).
 * 2. resumes                  — uploaded candidate resume metadata & storage ref.
 * 3. parsed_resumes           — structured extracted skills/experience before candidate confirmation.
 * 4. consent_records          — explicit candidate/user privacy & data-processing consent ledger.
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V28 (Core Spine: vacancy_skill_checklists, resumes, parsed_resumes, consent_records)...');
    await client.query('BEGIN');

    // 1. vacancy_skill_checklists — approval wrapper around a vacancy's requirements
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacancy_skill_checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vacancy_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(30) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'ai_generated', 'approved', 'locked', 'archived')),
        source VARCHAR(20) NOT NULL DEFAULT 'ai'
          CHECK (source IN ('ai', 'manual', 'template')),
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (vacancy_id, version)
      );
      CREATE INDEX IF NOT EXISTS idx_vsc_vacancy ON vacancy_skill_checklists(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_vsc_status ON vacancy_skill_checklists(status);
    `);
    console.log('vacancy_skill_checklists table ensured.');

    // 2. resumes — raw uploaded resume metadata
    await client.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120),
        file_size_bytes INTEGER,
        storage_url TEXT,
        raw_text TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_resumes_candidate ON resumes(candidate_id);
    `);
    console.log('resumes table ensured.');

    // 3. parsed_resumes — structured extraction awaiting candidate confirmation
    await client.query(`
      CREATE TABLE IF NOT EXISTS parsed_resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        parser_source VARCHAR(30) NOT NULL DEFAULT 'rules'
          CHECK (parser_source IN ('rules', 'ai', 'manual')),
        extracted_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        extracted_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
        extracted_education JSONB NOT NULL DEFAULT '[]'::jsonb,
        confirmed_by_candidate BOOLEAN NOT NULL DEFAULT FALSE,
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_parsed_resumes_candidate ON parsed_resumes(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_parsed_resumes_resume ON parsed_resumes(resume_id);
    `);
    console.log('parsed_resumes table ensured.');

    // 4. consent_records — explicit candidate & company privacy/AI consent audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS consent_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
        consent_type VARCHAR(60) NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT TRUE,
        policy_version VARCHAR(30) NOT NULL DEFAULT '1.0',
        ip_address VARCHAR(64),
        user_agent TEXT,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);
    `);
    console.log('consent_records table ensured.');

    await client.query('COMMIT');
    console.log('Migration V28 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V28 failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = run;
