require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function clean() {
  console.log('🧹 Cleaning fake vacancies and unregistered / test companies...');

  const realCompanyIds = [
    '3e85a949-5e9a-4e5d-986f-b383d1c47942', // Zoho
    '8c30ab6c-7cde-4f82-ae7e-ca70559d38e2', // Accenture
  ];

  const realEmails = [
    'surya2006@gmail.com',
    'zohocompany1@gmail.com',
    'jabriadmin2005@gmail.com',
    'mohamedjabri2005@gmail.com',
    'yazhini2006@gmail.com',
    'admin@genuai.io',
    'admin@genuaiadmin.com',
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Identify fake companies
    const fakeCompaniesRes = await client.query(
      `SELECT id, name FROM companies WHERE id NOT IN ($1, $2)`,
      realCompanyIds
    );
    const fakeCompanyIds = fakeCompaniesRes.rows.map(r => r.id);
    console.log(`Found ${fakeCompanyIds.length} test/fake companies to remove.`);

    if (fakeCompanyIds.length > 0) {
      // 2. Identify fake vacancies
      const fakeVacsRes = await client.query(
        `SELECT id, title FROM company_roles WHERE company_id = ANY($1::uuid[])`,
        [fakeCompanyIds]
      );
      const fakeVacIds = fakeVacsRes.rows.map(r => r.id);
      console.log(`Found ${fakeVacIds.length} test/fake vacancies to remove.`);

      if (fakeVacIds.length > 0) {
        // Clean related vacancy records
        await client.query(`DELETE FROM candidate_interest WHERE vacancy_id = ANY($1::uuid[]) OR role_id = ANY($1::uuid[])`, [fakeVacIds]);
        await client.query(`DELETE FROM target_learning_progress WHERE target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM practice_attempts WHERE target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM assessment_requirement_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[])))`, [fakeVacIds]);
        await client.query(`DELETE FROM assessment_attempts WHERE target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM evidence_coverage WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
        await client.query(`DELETE FROM evidence WHERE vacancy_id = ANY($1::uuid[]) OR target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM target_coverage WHERE target_id IN (SELECT id FROM targets WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM human_decisions WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
        await client.query(`DELETE FROM targets WHERE role_id = ANY($1::uuid[])`, [fakeVacIds]);
        await client.query(`DELETE FROM applications WHERE role_id = ANY($1::uuid[])`, [fakeVacIds]);
        await client.query(`DELETE FROM learning_resource_requirement_map WHERE requirement_id IN (SELECT id FROM requirements WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM practice_question_requirement_map WHERE requirement_id IN (SELECT id FROM requirements WHERE role_id = ANY($1::uuid[]))`, [fakeVacIds]);
        await client.query(`DELETE FROM requirements WHERE role_id = ANY($1::uuid[])`, [fakeVacIds]);
        await client.query(`DELETE FROM vacancy_versions WHERE role_id = ANY($1::uuid[])`, [fakeVacIds]);
        await client.query(`DELETE FROM audit_logs WHERE entity_type = 'Vacancy' AND entity_id = ANY($1::text[])`, [fakeVacIds.map(String)]);
        await client.query(`DELETE FROM company_roles WHERE id = ANY($1::uuid[])`, [fakeVacIds]);
        console.log('✅ Deleted all fake vacancies and linked candidate records.');
      }

      // Clean related company records
      await client.query(`DELETE FROM audit_logs WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM recruiter_reviews WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM agreements WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM notifications WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM departments WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM company_members WHERE company_id = ANY($1::uuid[])`, [fakeCompanyIds]);
      await client.query(`DELETE FROM companies WHERE id = ANY($1::uuid[])`, [fakeCompanyIds]);
      console.log('✅ Deleted all test/unregistered companies.');
    }

    // 3. Clean test users
    const delUsersRes = await client.query(
      `DELETE FROM users WHERE email NOT IN ($1, $2, $3, $4, $5, $6, $7)
       AND (email LIKE '%@genuai.test' OR email LIKE '%@test.com' OR email LIKE '%@co.test' OR email LIKE '%@example.com')`,
      realEmails
    );
    console.log(`✅ Deleted ${delUsersRes.rowCount} test users.`);

    // 4. Ensure Zoho vacancies have Published status and vacancy_versions record so candidates see them
    const zohoVacs = await client.query(
      `SELECT id, title, status FROM company_roles WHERE company_id = $1`,
      [realCompanyIds[0]]
    );
    for (const v of zohoVacs.rows) {
      await client.query(
        `UPDATE company_roles SET status = 'PUBLISHED', published_at = COALESCE(published_at, NOW()) WHERE id = $1`,
        [v.id]
      );
      await client.query(
        `INSERT INTO vacancy_versions (role_id, company_id, version_number, status, change_summary, published_at)
         VALUES ($1, $2, 1, 'Published', 'Initial Published Version', NOW())
         ON CONFLICT (role_id, version_number) DO UPDATE SET status = 'Published'`,
        [v.id, realCompanyIds[0]]
      );
    }
    console.log(`✅ Verified and published ${zohoVacs.rows.length} real vacancies for Zoho.`);

    await client.query('COMMIT');
    console.log('🎉 Cleanup completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cleanup failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

clean();
