require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V25 (Role Master & Vacancy Blueprint Integration Linkages)...');
    await client.query('BEGIN');

    // 1. Extend company_roles with role_master_id and approved_role_blueprint_id
    await client.query(`
      ALTER TABLE company_roles 
      ADD COLUMN IF NOT EXISTS role_master_id UUID REFERENCES company_roles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS approved_role_blueprint_id UUID REFERENCES ai_role_blueprint_suggestions(id) ON DELETE SET NULL;
    `);
    console.log('company_roles columns added (role_master_id, approved_role_blueprint_id).');

    // 2. Extend ai_role_blueprint_suggestions with vacancy_id
    await client.query(`
      ALTER TABLE ai_role_blueprint_suggestions
      ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES company_roles(id) ON DELETE SET NULL;
    `);
    console.log('ai_role_blueprint_suggestions column added (vacancy_id).');

    // 3. Extend role_blueprint_approval with vacancy_id
    await client.query(`
      ALTER TABLE role_blueprint_approval
      ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES company_roles(id) ON DELETE SET NULL;
    `);
    console.log('role_blueprint_approval column added (vacancy_id).');

    // 4. Create Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_roles_role_master_id ON company_roles(role_master_id);
      CREATE INDEX IF NOT EXISTS idx_company_roles_blueprint_id ON company_roles(approved_role_blueprint_id);
      CREATE INDEX IF NOT EXISTS idx_ai_blueprint_vacancy_id ON ai_role_blueprint_suggestions(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_blueprint_approval_vacancy_id ON role_blueprint_approval(vacancy_id);
    `);
    console.log('Indexes created for role blueprint linkages.');

    await client.query('COMMIT');
    console.log('Migration V25 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V25 failed:', err);
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
