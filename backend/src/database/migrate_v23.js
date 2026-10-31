require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V23 (AI Role Blueprint Suggestions & Approvals)...');
    await client.query('BEGIN');

    // 1. Create ai_role_blueprint_suggestions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_role_blueprint_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_master_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        role_title VARCHAR(255) NOT NULL,
        role_description TEXT,
        suggested_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggested_learning_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggested_flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggested_practice_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggested_assessment_ideas JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggested_evidence_types JSONB NOT NULL DEFAULT '[]'::jsonb,
        ai_model VARCHAR(100) NOT NULL DEFAULT 'genuai-role-intelligence-v2',
        prompt_version VARCHAR(50) NOT NULL DEFAULT 'v2.1',
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, REJECTED
        review_notes TEXT,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('ai_role_blueprint_suggestions table created.');

    // 2. Create role_blueprint_approval table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_blueprint_approval (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_blueprint_id UUID NOT NULL REFERENCES ai_role_blueprint_suggestions(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        approved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approval_notes TEXT,
        applied_requirements_count INT DEFAULT 0,
        applied_resources_count INT DEFAULT 0,
        applied_questions_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('role_blueprint_approval table created.');

    // 3. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_blueprint_company ON ai_role_blueprint_suggestions(company_id);
      CREATE INDEX IF NOT EXISTS idx_ai_blueprint_role_master ON ai_role_blueprint_suggestions(role_master_id);
      CREATE INDEX IF NOT EXISTS idx_ai_blueprint_status ON ai_role_blueprint_suggestions(status);
      CREATE INDEX IF NOT EXISTS idx_blueprint_approval_blueprint ON role_blueprint_approval(role_blueprint_id);
      CREATE INDEX IF NOT EXISTS idx_blueprint_approval_company ON role_blueprint_approval(company_id);
    `);
    console.log('indexes created.');

    await client.query('COMMIT');
    console.log('Migration V23 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V23 failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  run().then(() => pool.end()).catch(() => process.exit(1));
}

module.exports = run;
