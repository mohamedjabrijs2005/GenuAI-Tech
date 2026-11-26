require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./pool');

/**
 * Idempotent pilot seed script.
 * Creates:
 *   - 1 APPROVED pilot company ("GenuAI Pilot Company") + owner user
 *   - 1 department ("Product Engineering")
 *   - 1 PUBLISHED vacancy ("Full-Stack Product Engineer") with requirements + approved blueprint
 *   - 1 locked vacancy_skill_checklists row
 *   - 5 verified candidate users with 1 TARGETED application each
 */
async function seedPilot() {
  const client = await pool.connect();
  try {
    console.log('Starting Pilot Database Seeding...');
    await client.query('BEGIN');

    const pilotCompanyPass = process.env.PILOT_COMPANY_PASSWORD || 'PilotCompany@2026!';
    const pilotCandPass = process.env.PILOT_CANDIDATE_PASSWORD || 'PilotCandidate@2026!';
    const companyHash = await bcrypt.hash(pilotCompanyPass, 10);
    const candHash = await bcrypt.hash(pilotCandPass, 10);

    // 1. Pilot Company (APPROVED)
    const companyEmail = 'pilot-hr@genuai-pilot.test';
    let company = (await client.query(
      'SELECT id FROM companies WHERE official_email = $1',
      [companyEmail]
    )).rows[0];
    if (!company) {
      company = (await client.query(
        `INSERT INTO companies (name, official_email, website, industry, description, location, verification_status, onboarding_submitted)
         VALUES ('GenuAI Pilot Company', $1, 'https://pilot.genuai.test', 'Software & AI', 'Pilot hiring organization for GenuAI Phase 1 validation', 'Bengaluru, IN', 'APPROVED', TRUE)
         RETURNING id`,
        [companyEmail]
      )).rows[0];
    } else {
      await client.query(
        `UPDATE companies SET verification_status = 'APPROVED', onboarding_submitted = TRUE WHERE id = $1`,
        [company.id]
      );
    }

    // Company owner user
    let owner = (await client.query('SELECT id FROM users WHERE email = $1', [companyEmail])).rows[0];
    if (!owner) {
      owner = (await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, 'Pilot', 'Recruiter', 'COMPANY_OWNER', TRUE, TRUE)
         RETURNING id`,
        [companyEmail, companyHash]
      )).rows[0];
    }
    await client.query(
      `INSERT INTO company_members (company_id, user_id, member_role)
       VALUES ($1, $2, 'COMPANY_OWNER') ON CONFLICT DO NOTHING`,
      [company.id, owner.id]
    );

    // 2. Department
    let dept = (await client.query(
      'SELECT id FROM departments WHERE company_id = $1 AND name = $2',
      [company.id, 'Product Engineering']
    )).rows[0];
    if (!dept) {
      dept = (await client.query(
        `INSERT INTO departments (company_id, name, description)
         VALUES ($1, 'Product Engineering', 'Core engineering team') RETURNING id`,
        [company.id]
      )).rows[0];
    }

    // 3. Published Vacancy
    const vacTitle = 'Full-Stack Product Engineer';
    let vacancy = (await client.query(
      'SELECT id, approved_role_blueprint_id FROM company_roles WHERE company_id = $1 AND title = $2',
      [company.id, vacTitle]
    )).rows[0];
    if (!vacancy) {
      vacancy = (await client.query(
        `INSERT INTO company_roles
           (company_id, department_id, title, job_description, experience_level, employment_type,
            location, work_mode, salary_range, vacancy_count, status, approved_at, published_at)
         VALUES ($1, $2, $3,
                 'Build and ship customer-facing web apps with TypeScript, React, Node.js, and PostgreSQL.',
                 'mid', 'full_time', 'Bengaluru / Remote', 'Hybrid', '$70k - $95k', 2, 'PUBLISHED', NOW(), NOW())
         RETURNING id, approved_role_blueprint_id`,
        [company.id, dept.id, vacTitle]
      )).rows[0];
    } else {
      await client.query(
        `UPDATE company_roles SET status = 'PUBLISHED', published_at = COALESCE(published_at, NOW()) WHERE id = $1`,
        [vacancy.id]
      );
    }

    // Approved role blueprint linkage
    let blueprintId = vacancy.approved_role_blueprint_id;
    if (!blueprintId) {
      const bp = (await client.query(
        `INSERT INTO ai_role_blueprint_suggestions
           (company_id, vacancy_id, role_title, suggested_skills, status, prompt_version, ai_model)
         VALUES ($1, $2, $3, '[]'::jsonb, 'APPROVED', 'v2.1', 'genuai-pilot-seed')
         RETURNING id`,
        [company.id, vacancy.id, vacTitle]
      )).rows[0];
      blueprintId = bp.id;
      await client.query(
        'UPDATE company_roles SET approved_role_blueprint_id = $1 WHERE id = $2',
        [blueprintId, vacancy.id]
      );
    }

    // Requirements
    const existingReqs = (await client.query(
      'SELECT COUNT(*)::int AS count FROM requirements WHERE role_id = $1',
      [vacancy.id]
    )).rows[0].count;
    if (existingReqs === 0) {
      const skills = [
        { name: 'TypeScript', importance: 'REQUIRED', reqType: 'Required', priority: 'High' },
        { name: 'React', importance: 'REQUIRED', reqType: 'Required', priority: 'High' },
        { name: 'Node.js', importance: 'REQUIRED', reqType: 'Required', priority: 'High' },
        { name: 'PostgreSQL', importance: 'REQUIRED', reqType: 'Required', priority: 'Medium' },
        { name: 'System Design', importance: 'PREFERRED', reqType: 'Preferred', priority: 'Medium' },
      ];
      for (let i = 0; i < skills.length; i++) {
        const s = skills[i];
        await client.query(
          `INSERT INTO requirements
             (role_id, company_id, name, category, req_type, priority, proficiency, eval_method, importance, display_order, weight)
           VALUES ($1, $2, $3, 'Technical', $4, $5, 'Intermediate', 'Official Technical Assessment', $6, $7, 1.0)`,
          [vacancy.id, company.id, s.name, s.reqType, s.priority, s.importance, i + 1]
        );
      }
    }

    // Locked skill checklist
    const existingCl = (await client.query(
      'SELECT id FROM vacancy_skill_checklists WHERE vacancy_id = $1',
      [vacancy.id]
    )).rows[0];
    if (!existingCl) {
      await client.query(
        `INSERT INTO vacancy_skill_checklists
           (vacancy_id, company_id, version, status, source, approved_by, approved_at, notes)
         VALUES ($1, $2, 1, 'locked', 'manual', $3, NOW(), 'Locked pilot checklist')`,
        [vacancy.id, company.id, owner.id]
      );
    }

    // Vacancy version
    let ver = (await client.query(
      `SELECT id FROM vacancy_versions WHERE role_id = $1 ORDER BY version_number DESC LIMIT 1`,
      [vacancy.id]
    )).rows[0];
    if (!ver) {
      ver = (await client.query(
        `INSERT INTO vacancy_versions (role_id, company_id, version_number, status, change_summary, published_at)
         VALUES ($1, $2, 1, 'Published', 'Pilot Seed Version', NOW()) RETURNING id`,
        [vacancy.id, company.id]
      )).rows[0];
    }

    // 4. 5 Test Candidates + 1 TARGETED row each
    const pilotCandidates = [
      { email: 'pilot-cand-1@genuai-pilot.test', first: 'Aarav', last: 'Mehta' },
      { email: 'pilot-cand-2@genuai-pilot.test', first: 'Diya', last: 'Nair' },
      { email: 'pilot-cand-3@genuai-pilot.test', first: 'Rohan', last: 'Kapoor' },
      { email: 'pilot-cand-4@genuai-pilot.test', first: 'Sneha', last: 'Iyer' },
      { email: 'pilot-cand-5@genuai-pilot.test', first: 'Kabir', last: 'Verma' },
    ];

    for (const c of pilotCandidates) {
      let user = (await client.query('SELECT id FROM users WHERE email = $1', [c.email])).rows[0];
      if (!user) {
        user = (await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
           VALUES ($1, $2, $3, $4, 'CANDIDATE', TRUE, TRUE) RETURNING id`,
          [c.email, candHash, c.first, c.last]
        )).rows[0];
      }

      let cand = (await client.query('SELECT id FROM candidates WHERE email = $1', [c.email])).rows[0];
      if (!cand) {
        cand = (await client.query(
          `INSERT INTO candidates (first_name, last_name, email, phone, location, onboarding_submitted)
           VALUES ($1, $2, $3, '+91-9000000000', 'India', TRUE) RETURNING id`,
          [c.first, c.last, c.email]
        )).rows[0];
      }

      const existingTarget = (await client.query(
        `SELECT id FROM targets WHERE candidate_id = $1 AND vacancy_id = $2 AND status NOT IN ('WITHDRAWN', 'CLOSED')`,
        [cand.id, vacancy.id]
      )).rows[0];
      if (!existingTarget) {
        await client.query(
          `INSERT INTO targets (candidate_id, company_id, vacancy_id, role_id, vacancy_version_id, status, targeted_at, last_activity_at)
           VALUES ($1, $2, $3, $3, $4, 'TARGETED', NOW(), NOW())`,
          [cand.id, company.id, vacancy.id, ver.id]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Pilot database seeding completed successfully.');
    console.log(`Company owner: ${companyEmail}`);
    console.log(`Candidates: pilot-cand-1@genuai-pilot.test .. pilot-cand-5@genuai-pilot.test`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Pilot seed failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  seedPilot().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedPilot;
