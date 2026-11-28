require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');
const bcrypt = require('bcrypt');

/**
 * GenuAI Pilot Seed Script
 *
 * All credentials are read from environment variables — no hardcoded fake data.
 * Set these in your .env or deployment environment before running.
 *
 * Required env vars:
 *   PILOT_OWNER_EMAIL
 *   PILOT_OWNER_PASSWORD
 *   PILOT_OWNER_FIRST_NAME
 *   PILOT_OWNER_LAST_NAME
 *   PILOT_COMPANY_NAME
 *   PILOT_COMPANY_LOCATION
 *   PILOT_COMPANY_EMAIL
 *   PILOT_VACANCY_TITLE
 *
 * Optional:
 *   PILOT_RECRUITER_EMAIL
 *   PILOT_RECRUITER_PASSWORD
 *   PILOT_RECRUITER_FIRST_NAME
 *   PILOT_RECRUITER_LAST_NAME
 *   PILOT_REQUIREMENTS         (comma-separated, e.g. "React,Node.js,PostgreSQL")
 *
 * Usage: node src/database/seed_pilot.js
 * Safe to re-run — skips if owner email already exists.
 */

function requireEnv(key) {
  const val = (process.env[key] || '').trim();
  if (!val) {
    console.error(`\n❌  Missing required env var: ${key}`);
    console.error('    Set it in your .env file and re-run.\n');
    process.exit(1);
  }
  return val;
}

async function run() {
  const ownerEmail          = requireEnv('PILOT_OWNER_EMAIL');
  const ownerPassword       = requireEnv('PILOT_OWNER_PASSWORD');
  const ownerFirstName      = requireEnv('PILOT_OWNER_FIRST_NAME');
  const ownerLastName       = requireEnv('PILOT_OWNER_LAST_NAME');
  const companyName         = requireEnv('PILOT_COMPANY_NAME');
  const companyLocation     = requireEnv('PILOT_COMPANY_LOCATION');
  const companyEmail        = requireEnv('PILOT_COMPANY_EMAIL');
  const vacancyTitle        = requireEnv('PILOT_VACANCY_TITLE');

  const recruiterEmail      = (process.env.PILOT_RECRUITER_EMAIL || '').trim() || null;
  const recruiterPassword   = (process.env.PILOT_RECRUITER_PASSWORD || ownerPassword).trim();
  const recruiterFirst      = (process.env.PILOT_RECRUITER_FIRST_NAME || 'Pilot').trim();
  const recruiterLast       = (process.env.PILOT_RECRUITER_LAST_NAME || 'Recruiter').trim();

  const rawRequirements = (process.env.PILOT_REQUIREMENTS || 'React,Node.js,PostgreSQL,REST API Design,TypeScript').trim();
  const requirements = rawRequirements.split(',').map((r) => r.trim()).filter(Boolean);

  const client = await pool.connect();
  try {
    console.log('\n🌱  GenuAI Pilot Seed — starting...\n');
    await client.query('BEGIN');

    // Skip if already seeded
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
    if (existing.rowCount > 0) {
      console.log(`⏭  Owner ${ownerEmail} already exists. Skipping seed.`);
      await client.query('ROLLBACK');
      return;
    }

    const ownerHash = await bcrypt.hash(ownerPassword, 10);

    // ── 1. Owner user ───────────────────────────────────────────────
    const ownerUser = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1,$2,$3,$4,'COMPANY_OWNER',TRUE,TRUE) RETURNING id`,
      [ownerEmail, ownerHash, ownerFirstName, ownerLastName]
    );
    const ownerUserId = ownerUser.rows[0].id;

    // ── 2. Company ──────────────────────────────────────────────────
    const company = await client.query(
      `INSERT INTO companies (name, legal_name, industry, description, size, official_email,
         location, verification_status, created_by)
       VALUES ($1,$1,'Software','Pilot partner for GenuAI evaluation.','11-50',$2,$3,'APPROVED',$4)
       RETURNING id`,
      [companyName, companyEmail, companyLocation, ownerUserId]
    );
    const companyId = company.rows[0].id;

    // Owner company membership
    await client.query(
      `INSERT INTO company_members (company_id, user_id, member_role, is_active)
       VALUES ($1,$2,'COMPANY_OWNER',TRUE)`,
      [companyId, ownerUserId]
    );
    console.log(`✅  Company  : ${companyName} (${companyId})`);
    console.log(`    Owner   : ${ownerEmail}`);

    // ── 3. Optional recruiter ───────────────────────────────────────
    if (recruiterEmail) {
      const recruiterHash = await bcrypt.hash(recruiterPassword, 10);
      const recUser = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1,$2,$3,$4,'COMPANY_RECRUITER',TRUE,TRUE) RETURNING id`,
        [recruiterEmail, recruiterHash, recruiterFirst, recruiterLast]
      );
      await client.query(
        `INSERT INTO company_members (company_id, user_id, member_role, is_active, invited_by)
         VALUES ($1,$2,'COMPANY_RECRUITER',TRUE,$3)`,
        [companyId, recUser.rows[0].id, ownerUserId]
      );
      console.log(`    Recruiter: ${recruiterEmail}`);
    }

    // ── 4. Vacancy ──────────────────────────────────────────────────
    const vacancy = await client.query(
      `INSERT INTO company_roles (company_id, title, description, experience_level, employment_type,
         work_mode, location, status, created_by)
       VALUES ($1,$2,'Pilot vacancy for GenuAI controlled evaluation.','Mid','Full-time','Hybrid',$3,'PUBLISHED',$4)
       RETURNING id`,
      [companyId, vacancyTitle, companyLocation, ownerUserId]
    );
    const vacancyId = vacancy.rows[0].id;

    // Checklist
    const checklist = await client.query(
      `INSERT INTO vacancy_skill_checklists (vacancy_id, company_id, version, status, approved_at, locked_at)
       VALUES ($1,$2,1,'locked',NOW(),NOW()) RETURNING id`,
      [vacancyId, companyId]
    );
    const checklistId = checklist.rows[0].id;

    // Requirements from env
    const reqIds = [];
    for (let i = 0; i < requirements.length; i++) {
      const importance = i < Math.ceil(requirements.length * 0.7) ? 'MUST_HAVE' : 'GOOD_TO_HAVE';
      const req = await client.query(
        `INSERT INTO requirements (role_id, checklist_id, name, importance, requirement_type, display_order)
         VALUES ($1,$2,$3,$4,'technical',$5) RETURNING id`,
        [vacancyId, checklistId, requirements[i], importance, i + 1]
      );
      reqIds.push(req.rows[0].id);
    }
    console.log(`✅  Vacancy  : ${vacancyTitle} (${vacancyId})`);
    console.log(`    Checklist: ${checklistId} — locked, ${requirements.length} requirements`);
    console.log(`    Skills   : ${requirements.join(', ')}`);

    await client.query('COMMIT');
    console.log('\n🎉  Pilot seed complete!\n');
    console.log('Next step: Invite real candidates through the GenuAI platform.');
    console.log(`Vacancy ID : ${vacancyId}`);
    console.log(`Company ID : ${companyId}\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
