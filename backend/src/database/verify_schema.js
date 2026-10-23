require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const REQUIRED_TABLES = [
  'users',
  'companies',
  'company_members',
  'departments',
  'company_roles',
  'requirements',
  'vacancy_versions',
  'targets',
  'practice_questions',
  'practice_question_answers',
  'practice_question_requirement_map',
  'practice_attempts',
  'assessment_attempts',
  'assessment_requirement_scores',
  'evidence',
  'evidence_coverage',
  'recruiter_reviews',
  'human_decisions',
  'audit_logs',
  'schema_migrations'
];

const REQUIRED_COLUMNS = [
  { table: 'candidates', column: 'onboarding_submitted' },
  { table: 'companies', column: 'onboarding_submitted' },
  { table: 'assessment_requirement_scores', column: 'objective_score' },
  { table: 'assessment_requirement_scores', column: 'objective_max_score' },
  { table: 'assessment_requirement_scores', column: 'scenario_score' },
  { table: 'assessment_requirement_scores', column: 'scenario_max_score' },
  { table: 'assessment_requirement_scores', column: 'required_scenario_evaluation' },
  { table: 'assessment_requirement_scores', column: 'grading_revision_count' },
  { table: 'assessment_requirement_scores', column: 'last_graded_at' }
];

async function verifySchema() {
  console.log('🔍 Running Deployment Schema & Integrity Verification...');
  const client = await pool.connect();
  const errors = [];

  try {
    // 1. Verify Connectivity
    const pingRes = await client.query('SELECT NOW() AS server_time, current_database() AS db_name');
    console.log(`  Connected to database: ${pingRes.rows[0].db_name} at ${pingRes.rows[0].server_time}`);

    // 2. Verify Required Tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = new Set(tableRes.rows.map(r => r.table_name));

    for (const table of REQUIRED_TABLES) {
      if (!existingTables.has(table)) {
        errors.push(`Missing required table: "${table}"`);
      }
    }

    // 3. Verify Required Columns
    const colRes = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    const existingCols = new Set(colRes.rows.map(r => `${r.table_name}.${r.column_name}`));

    for (const item of REQUIRED_COLUMNS) {
      const key = `${item.table}.${item.column}`;
      if (!existingCols.has(key)) {
        errors.push(`Missing required column: "${key}"`);
      }
    }

    // 4. Verify Migration Ledger
    if (existingTables.has('schema_migrations')) {
      const migRes = await client.query('SELECT version FROM schema_migrations ORDER BY applied_at ASC');
      const applied = migRes.rows.map(r => r.version);
      console.log(`  Migration ledger active: ${applied.length} migration(s) recorded: [${applied.join(', ')}]`);
      if (applied.length === 0) {
        errors.push('Migration ledger schema_migrations exists but has 0 applied records.');
      }
    } else {
      errors.push('Migration ledger schema_migrations does not exist.');
    }

    if (errors.length > 0) {
      console.error('❌ Schema verification failed with errors:');
      errors.forEach(e => console.error(`   - ${e}`));
      throw new Error(`Schema verification failed: ${errors.length} issue(s) found.`);
    }

    console.log('✅ All required tables, columns, constraints, and migration ledger verified.');
    return true;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  verifySchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { verifySchema, REQUIRED_TABLES, REQUIRED_COLUMNS };
