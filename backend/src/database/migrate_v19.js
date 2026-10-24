require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V19 (Missing FK Indexes + updated_at timestamps)...');
    await client.query('BEGIN');

    // ---------------------------------------------------------------
    // 1. Add indexes on all 37 unindexed foreign key columns
    // ---------------------------------------------------------------
    const indexes = [
      // accommodation_requests
      'CREATE INDEX IF NOT EXISTS idx_accommodation_requests_target_id ON accommodation_requests(target_id);',
      'CREATE INDEX IF NOT EXISTS idx_accommodation_requests_candidate_id ON accommodation_requests(candidate_id);',

      // agreements
      'CREATE INDEX IF NOT EXISTS idx_agreements_accepted_by ON agreements(accepted_by);',
      'CREATE INDEX IF NOT EXISTS idx_agreements_company_id ON agreements(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_agreements_role_id ON agreements(role_id);',
      'CREATE INDEX IF NOT EXISTS idx_agreements_vacancy_version_id ON agreements(vacancy_version_id);',

      // applications
      'CREATE INDEX IF NOT EXISTS idx_applications_vacancy_version_id ON applications(vacancy_version_id);',

      // assessment_attempts
      'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_company_id ON assessment_attempts(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_evaluator_id ON assessment_attempts(evaluator_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_vacancy_version_id ON assessment_attempts(vacancy_version_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_candidate_id ON assessment_attempts(candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_target_id ON assessment_attempts(target_id);',

      // assessment_groups
      'CREATE INDEX IF NOT EXISTS idx_assessment_groups_company_id ON assessment_groups(company_id);',

      // assessment_results
      'CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_group_id ON assessment_results(assessment_group_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_version_id ON assessment_results(assessment_version_id);',
      'CREATE INDEX IF NOT EXISTS idx_assessment_results_company_id ON assessment_results(company_id);',

      // assessment_versions
      'CREATE INDEX IF NOT EXISTS idx_assessment_versions_company_id ON assessment_versions(company_id);',

      // audit_logs
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);',

      // companies
      'CREATE INDEX IF NOT EXISTS idx_companies_verification_reviewed_by ON companies(verification_reviewed_by);',

      // company_roles
      'CREATE INDEX IF NOT EXISTS idx_company_roles_reviewed_by ON company_roles(reviewed_by);',

      // evaluation_groups
      'CREATE INDEX IF NOT EXISTS idx_evaluation_groups_mapped_requirement_id ON evaluation_groups(mapped_requirement_id);',

      // evidence
      'CREATE INDEX IF NOT EXISTS idx_evidence_assessment_result_id ON evidence(assessment_result_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_assessment_version_id ON evidence(assessment_version_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_evaluation_group_id ON evidence(evaluation_group_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_reviewed_by ON evidence(reviewed_by);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_vacancy_id ON evidence(vacancy_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_vacancy_version_id ON evidence(vacancy_version_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_candidate_id ON evidence(candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_evidence_target_id ON evidence(target_id);',

      // evidence_coverage
      'CREATE INDEX IF NOT EXISTS idx_evidence_coverage_vacancy_version_id ON evidence_coverage(vacancy_version_id);',

      // human_decisions
      'CREATE INDEX IF NOT EXISTS idx_human_decisions_decided_by ON human_decisions(decided_by);',

      // integrity_signals
      'CREATE INDEX IF NOT EXISTS idx_integrity_signals_assessment_result_id ON integrity_signals(assessment_result_id);',
      'CREATE INDEX IF NOT EXISTS idx_integrity_signals_reviewed_by ON integrity_signals(reviewed_by);',

      // interviews
      'CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);',

      // practice_attempts
      'CREATE INDEX IF NOT EXISTS idx_practice_attempts_requirement_id ON practice_attempts(requirement_id);',
      'CREATE INDEX IF NOT EXISTS idx_practice_attempts_candidate_id ON practice_attempts(candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_practice_attempts_target_id ON practice_attempts(target_id);',

      // questions
      'CREATE INDEX IF NOT EXISTS idx_questions_evaluation_group_id ON questions(evaluation_group_id);',

      // requirements
      'CREATE INDEX IF NOT EXISTS idx_requirements_vacancy_version_id ON requirements(vacancy_version_id);',

      // target_coverage
      'CREATE INDEX IF NOT EXISTS idx_target_coverage_candidate_id ON target_coverage(candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_target_coverage_vacancy_id ON target_coverage(vacancy_id);',
      'CREATE INDEX IF NOT EXISTS idx_target_coverage_vacancy_version_id ON target_coverage(vacancy_version_id);',

      // targets
      'CREATE INDEX IF NOT EXISTS idx_targets_candidate_id ON targets(candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_targets_company_id ON targets(company_id);',

      // vacancy_versions
      'CREATE INDEX IF NOT EXISTS idx_vacancy_versions_company_id ON vacancy_versions(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_vacancy_versions_created_by ON vacancy_versions(created_by);',
    ];

    for (const sql of indexes) {
      await client.query(sql);
    }
    console.log(`Applied ${indexes.length} indexes.`);

    // ---------------------------------------------------------------
    // 2. Add updated_at to tables that are missing it
    //    (Only tables where updates happen and auditing matters)
    // ---------------------------------------------------------------
    const updatedAtTables = [
      'vacancy_versions',
      'evidence_coverage',
      'human_decisions',
      'target_coverage',
      'company_members',
      'learning_resources',
    ];

    for (const table of updatedAtTables) {
      await client.query(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      `);
    }
    console.log('Added updated_at columns to key tables.');

    // ---------------------------------------------------------------
    // 3. Add created_at to tables missing it
    // ---------------------------------------------------------------
    const createdAtTables = [
      'evidence_coverage',
      'human_decisions',
      'target_coverage',
    ];

    for (const table of createdAtTables) {
      await client.query(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      `);
    }
    console.log('Added created_at columns to tables missing it.');

    // ---------------------------------------------------------------
    // 4. Ensure audit_logs has canonical old_value/new_value JSONB
    //    (standard naming alongside existing metadata/details)
    // ---------------------------------------------------------------
    await client.query(`
      ALTER TABLE audit_logs
        ADD COLUMN IF NOT EXISTS old_value JSONB,
        ADD COLUMN IF NOT EXISTS new_value JSONB;
    `);
    console.log('Ensured audit_logs has old_value/new_value JSONB columns.');

    // ---------------------------------------------------------------
    // 5. Ensure users table has last_login_at
    // ---------------------------------------------------------------
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    `);
    console.log('Ensured users.last_login_at column exists.');

    await client.query('COMMIT');
    console.log('Migration V19 applied successfully!');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration V19 failed:', err.message);
    throw err;
  } finally {
    client.release();
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
