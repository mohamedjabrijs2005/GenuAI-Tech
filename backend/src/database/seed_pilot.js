require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');
const bcrypt = require('bcrypt');

/**
 * GenuAI Pilot Seed Script
 * Creates one pilot company with owner + recruiter, one approved vacancy,
 * five candidates with skill claims, and a shortlist ready for HR review.
 *
 * Usage: node src/database/seed_pilot.js
 * Safe to re-run (skips existing pilot company by email).
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('\n🌱  GenuAI Pilot Seed — starting...\n');
    await client.query('BEGIN');

    // ── 1. Create / fetch pilot company ────────────────────────────
    const ownerEmail = 'pilot-owner@genuai.test';
    const existingOwner = await client.query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
    if (existingOwner.rowCount > 0) {
      console.log('⏭  Pilot data already exists (pilot-owner@genuai.test). Skipping seed.');
      await client.query('ROLLBACK');
      return;
    }

    const hash = await bcrypt.hash('PilotPass2026!', 10);

    // Owner user
    const ownerUser = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1,$2,'Pilot','Owner','COMPANY_OWNER',TRUE,TRUE) RETURNING id`,
      [ownerEmail, hash]
    );
    const ownerUserId = ownerUser.rows[0].id;

    // Company
    const company = await client.query(
      `INSERT INTO companies (name, legal_name, industry, description, size, website, official_email,
         location, verification_status, created_by)
       VALUES ('GenuAI Pilot Co', 'GenuAI Pilot Company Ltd', 'Software', 'Pilot partner company for controlled GenuAI evaluation.',
               '11-50', 'https://pilot.genuai.test', 'hiring@pilot.genuai.test',
               'Chennai, India', 'APPROVED', $1) RETURNING id`,
      [ownerUserId]
    );
    const companyId = company.rows[0].id;

    // Company member (owner)
    const ownerMember = await client.query(
      `INSERT INTO company_members (company_id, user_id, member_role, is_active)
       VALUES ($1,$2,'COMPANY_OWNER',TRUE) RETURNING id`,
      [companyId, ownerUserId]
    );

    // Recruiter sub-user
    const recruiterUser = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ('pilot-recruiter@genuai.test',$1,'Pilot','Recruiter','COMPANY_RECRUITER',TRUE,TRUE) RETURNING id`,
      [hash]
    );
    await client.query(
      `INSERT INTO company_members (company_id, user_id, member_role, is_active, invited_by)
       VALUES ($1,$2,'COMPANY_RECRUITER',TRUE,$3)`,
      [companyId, recruiterUser.rows[0].id, ownerUserId]
    );

    console.log(`✅  Company: ${companyId}`);
    console.log(`    Owner   : ${ownerEmail}  / PilotPass2026!`);
    console.log(`    Recruiter: pilot-recruiter@genuai.test  / PilotPass2026!`);

    // ── 2. Create vacancy ───────────────────────────────────────────
    const vacancy = await client.query(
      `INSERT INTO company_roles (company_id, title, description, experience_level, employment_type, work_mode, location, status, created_by)
       VALUES ($1,'Full-Stack Engineer (Pilot)','Pilot vacancy for GenuAI controlled evaluation.','Mid','Full-time','Hybrid','Chennai, India','PUBLISHED',$2)
       RETURNING id`,
      [companyId, ownerUserId]
    );
    const vacancyId = vacancy.rows[0].id;
    console.log(`✅  Vacancy : ${vacancyId}`);

    // Checklist
    const checklist = await client.query(
      `INSERT INTO vacancy_skill_checklists (vacancy_id, company_id, version, status, approved_at, locked_at)
       VALUES ($1,$2,1,'locked',NOW(),NOW()) RETURNING id`,
      [vacancyId, companyId]
    );
    const checklistId = checklist.rows[0].id;

    // Requirements
    const requirements = [
      { name: 'React (18+)', importance: 'MUST_HAVE' },
      { name: 'Node.js & Express', importance: 'MUST_HAVE' },
      { name: 'PostgreSQL', importance: 'MUST_HAVE' },
      { name: 'REST API Design', importance: 'MUST_HAVE' },
      { name: 'TypeScript', importance: 'GOOD_TO_HAVE' },
    ];
    const reqIds = [];
    for (let i = 0; i < requirements.length; i++) {
      const r = requirements[i];
      const req = await client.query(
        `INSERT INTO requirements (role_id, checklist_id, name, importance, requirement_type, display_order)
         VALUES ($1,$2,$3,$4,'technical',$5) RETURNING id`,
        [vacancyId, checklistId, r.name, r.importance, i + 1]
      );
      reqIds.push(req.rows[0].id);
    }
    console.log(`✅  Checklist: ${checklistId} (locked, ${requirements.length} requirements)`);

    // ── 3. Create 5 candidates ──────────────────────────────────────
    const candidateData = [
      { first: 'Alice', last: 'Chen', email: 'alice@genuai.test', skills: [0, 1, 2, 3] },
      { first: 'Bob', last: 'Sharma', email: 'bob@genuai.test', skills: [0, 1, 3, 4] },
      { first: 'Clara', last: 'Osei', email: 'clara@genuai.test', skills: [0, 2, 4] },
      { first: 'David', last: 'Park', email: 'david@genuai.test', skills: [1, 2, 3] },
      { first: 'Eva', last: 'Santos', email: 'eva@genuai.test', skills: [0, 1, 2, 3, 4] },
    ];

    for (const cd of candidateData) {
      const cu = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1,$2,$3,$4,'CANDIDATE',TRUE,TRUE) RETURNING id`,
        [cd.email, hash, cd.first, cd.last]
      );
      const cand = await client.query(
        `INSERT INTO candidates (user_id, first_name, last_name, email, profile_data)
         VALUES ($1,$2,$3,$4,'{}') RETURNING id`,
        [cu.rows[0].id, cd.first, cd.last, cd.email]
      );
      const candidateId = cand.rows[0].id;

      // Target
      const target = await client.query(
        `INSERT INTO targets (candidate_id, vacancy_id, company_id, status)
         VALUES ($1,$2,$3,'ACTIVE') RETURNING id`,
        [candidateId, vacancyId, companyId]
      );
      const targetId = target.rows[0].id;

      // Skill claims (confirmed)
      for (const reqIdx of cd.skills) {
        const req2 = requirements[reqIdx];
        const claim = await client.query(
          `INSERT INTO skill_claims (candidate_id, skill_name, claim_status, confirmed_at)
           VALUES ($1,$2,'confirmed',NOW()) RETURNING id`,
          [candidateId, req2.name]
        );
        await client.query(
          `INSERT INTO target_requirements (target_id, requirement_id, skill_claim_id, claim_status, candidate_confirmed_at)
           VALUES ($1,$2,$3,'confirmed',NOW())
           ON CONFLICT (target_id, requirement_id) DO UPDATE
             SET skill_claim_id=$3, claim_status='confirmed', candidate_confirmed_at=NOW()`,
          [targetId, reqIds[reqIdx], claim.rows[0].id]
        );
      }

      console.log(`✅  Candidate: ${cd.first} ${cd.last} <${cd.email}>`);
    }

    await client.query('COMMIT');

    console.log('\n🎉  Pilot seed complete!\n');
    console.log('Pilot Login Credentials (password: PilotPass2026!):');
    console.log('  HR Owner   : pilot-owner@genuai.test');
    console.log('  HR Recruiter: pilot-recruiter@genuai.test');
    console.log('  Candidates : alice|bob|clara|david|eva @genuai.test');
    console.log(`\nVacancy ID : ${vacancyId}`);
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
