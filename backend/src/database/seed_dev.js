require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seedDev() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting Development Database Seeding...');
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash('Admin12345!', 10);
    const companyAHash = await bcrypt.hash('CompanyA123!', 10);
    const companyBHash = await bcrypt.hash('CompanyB123!', 10);
    const pendingHash = await bcrypt.hash('Pending123!', 10);

    // 1. Super Admin
    let adminUser = (await client.query('SELECT id FROM users WHERE email = $1', ['admin@genuai.test'])).rows[0];
    if (!adminUser) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Platform', 'Administrator', 'SUPER_ADMIN') RETURNING id`,
        ['admin@genuai.test', adminHash]
      );
      adminUser = res.rows[0];
    } else {
      await client.query("UPDATE users SET password_hash = $1, role = 'SUPER_ADMIN' WHERE id = $2", [adminHash, adminUser.id]);
    }

    // 2. Company A (APPROVED)
    let companyA = (await client.query('SELECT id FROM companies WHERE official_email = $1', ['companya@genuai.test'])).rows[0];
    if (!companyA) {
      const res = await client.query(
        `INSERT INTO companies (name, official_email, website, industry, description, location, verification_status)
         VALUES ('Alpha Technologies', 'companya@genuai.test', 'https://alphatech.io', 'Enterprise Cloud & AI', 'High-performance cloud software', 'San Francisco, CA', 'APPROVED')
         RETURNING id`,
        []
      );
      companyA = res.rows[0];
    } else {
      await client.query("UPDATE companies SET verification_status = 'APPROVED' WHERE id = $1", [companyA.id]);
    }

    let userA = (await client.query('SELECT id FROM users WHERE email = $1', ['companya@genuai.test'])).rows[0];
    if (!userA) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Alice', 'Owner', 'COMPANY_OWNER') RETURNING id`,
        ['companya@genuai.test', companyAHash]
      );
      userA = res.rows[0];
      await client.query(
        `INSERT INTO company_members (company_id, user_id, member_role)
         VALUES ($1, $2, 'COMPANY_OWNER') ON CONFLICT DO NOTHING`,
        [companyA.id, userA.id]
      );
    } else {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [companyAHash, userA.id]);
    }

    // Department for Company A
    let deptA = (await client.query('SELECT id FROM departments WHERE company_id = $1 AND name = $2', [companyA.id, 'Engineering'])).rows[0];
    if (!deptA) {
      const res = await client.query(
        `INSERT INTO departments (company_id, name, description)
         VALUES ($1, 'Engineering', 'Core software and platform engineering') RETURNING id`,
        [companyA.id]
      );
      deptA = res.rows[0];
    }

    // Vacancy for Company A: Backend Developer
    let vacA = (await client.query('SELECT id FROM company_roles WHERE company_id = $1 AND title = $2', [companyA.id, 'Backend Developer'])).rows[0];
    if (!vacA) {
      const res = await client.query(
        `INSERT INTO company_roles
         (company_id, department_id, title, job_description, experience_level, employment_type, location, work_mode, salary_range, vacancy_count, status, published_at)
         VALUES ($1, $2, 'Backend Developer', 'Building robust microservices in Java and PostgreSQL.', 'senior', 'full_time', 'Remote', 'Remote', '$130k - $160k', 2, 'PUBLISHED', NOW())
         RETURNING id`,
        [companyA.id, deptA.id]
      );
      vacA = res.rows[0];

      // Add Requirements for Backend Developer
      await client.query(
        `INSERT INTO requirements (role_id, company_id, name, description, requirement_type, importance, eval_method, evaluation_methods)
         VALUES
         ($1, $2, 'Java', 'Core Java, Spring Boot, multithreading and memory management', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["ASSESSMENT", "PROJECT"]'),
         ($1, $2, 'SQL', 'PostgreSQL database modeling, query optimization, indexing and transactions', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["ASSESSMENT"]'),
         ($1, $2, 'REST APIs', 'Designing secure, idempotent RESTful APIs with OpenAPI specs', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["ASSESSMENT", "PROJECT"]'),
         ($1, $2, 'Backend Project Experience', 'Demonstrated experience delivering production backend systems', 'EXPERIENCE', 'PREFERRED', 'PROJECT', '["PROJECT", "RESUME", "INTERVIEW"]')`,
        [vacA.id, companyA.id]
      );
    }

    // 3. Company B (APPROVED)
    let companyB = (await client.query('SELECT id FROM companies WHERE official_email = $1', ['companyb@genuai.test'])).rows[0];
    if (!companyB) {
      const res = await client.query(
        `INSERT INTO companies (name, official_email, website, industry, description, location, verification_status)
         VALUES ('Beta Innovations', 'companyb@genuai.test', 'https://betainnovations.io', 'Fintech & Analytics', 'Algorithmic intelligence systems', 'New York, NY', 'APPROVED')
         RETURNING id`,
        []
      );
      companyB = res.rows[0];
    } else {
      await client.query("UPDATE companies SET verification_status = 'APPROVED' WHERE id = $1", [companyB.id]);
    }

    let userB = (await client.query('SELECT id FROM users WHERE email = $1', ['companyb@genuai.test'])).rows[0];
    if (!userB) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Bob', 'BetaOwner', 'COMPANY_OWNER') RETURNING id`,
        ['companyb@genuai.test', companyBHash]
      );
      userB = res.rows[0];
      await client.query(
        `INSERT INTO company_members (company_id, user_id, member_role)
         VALUES ($1, $2, 'COMPANY_OWNER') ON CONFLICT DO NOTHING`,
        [companyB.id, userB.id]
      );
    } else {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [companyBHash, userB.id]);
    }

    // Department for Company B
    let deptB = (await client.query('SELECT id FROM departments WHERE company_id = $1 AND name = $2', [companyB.id, 'Data Analytics'])).rows[0];
    if (!deptB) {
      const res = await client.query(
        `INSERT INTO departments (company_id, name, description)
         VALUES ($1, 'Data Analytics', 'Data science and quantitative modeling') RETURNING id`,
        [companyB.id]
      );
      deptB = res.rows[0];
    }

    // Pending Vacancy for Company B: Data Analyst
    let vacB = (await client.query('SELECT id FROM company_roles WHERE company_id = $1 AND title = $2', [companyB.id, 'Data Analyst'])).rows[0];
    if (!vacB) {
      const res = await client.query(
        `INSERT INTO company_roles
         (company_id, department_id, title, job_description, experience_level, employment_type, location, work_mode, salary_range, vacancy_count, status, submitted_at)
         VALUES ($1, $2, 'Data Analyst', 'Statistical analysis, ETL pipelines, and stakeholder dashboards.', 'mid', 'full_time', 'Hybrid', 'Hybrid', '$95k - $120k', 1, 'PENDING_ADMIN_REVIEW', NOW())
         RETURNING id`,
        [companyB.id, deptB.id]
      );
      vacB = res.rows[0];

      await client.query(
        `INSERT INTO requirements (role_id, company_id, name, description, requirement_type, importance, eval_method, evaluation_methods)
         VALUES
         ($1, $2, 'Python', 'Pandas, NumPy, and statistical computing', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["ASSESSMENT"]'),
         ($1, $2, 'SQL', 'Complex aggregations and window functions', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["ASSESSMENT"]'),
         ($1, $2, 'Data Modeling', 'Dimensional modeling and warehouse schema design', 'SKILL', 'REQUIRED', 'ASSESSMENT', '["PROJECT", "ASSESSMENT"]')`,
        [vacB.id, companyB.id]
      );
    }

    // 4. Pending Company (PENDING_VERIFICATION)
    let pendingCompany = (await client.query('SELECT id FROM companies WHERE official_email = $1', ['pending@genuai.test'])).rows[0];
    if (!pendingCompany) {
      const res = await client.query(
        `INSERT INTO companies (name, official_email, website, industry, description, location, verification_status)
         VALUES ('Pending Global Systems', 'pending@genuai.test', 'https://pendingglobal.com', 'Robotics & Hardware', 'Autonomous systems hardware platform', 'Austin, TX', 'PENDING_VERIFICATION')
         RETURNING id`,
        []
      );
      pendingCompany = res.rows[0];
    } else {
      await client.query("UPDATE companies SET verification_status = 'PENDING_VERIFICATION' WHERE id = $1", [pendingCompany.id]);
    }

    let pendingUser = (await client.query('SELECT id FROM users WHERE email = $1', ['pending@genuai.test'])).rows[0];
    if (!pendingUser) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Patrick', 'Pending', 'COMPANY_OWNER') RETURNING id`,
        ['pending@genuai.test', pendingHash]
      );
      pendingUser = res.rows[0];
      await client.query(
        `INSERT INTO company_members (company_id, user_id, member_role)
         VALUES ($1, $2, 'COMPANY_OWNER') ON CONFLICT DO NOTHING`,
        [pendingCompany.id, pendingUser.id]
      );
    } else {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [pendingHash, pendingUser.id]);
    }

    // Record initial seed audit log
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, 'SUPER_ADMIN', 'SYSTEM_SEEDED', 'System', 'seed_dev', 'APPROVED', 'Initial seed dataset created for test automation', '{}')`,
      [companyA.id, adminUser.id]
    );

    await client.query('COMMIT');
    console.log('✅ Development Database Seeding Completed Successfully.');
    console.log('\nSeed Credentials:');
    console.log('  Admin:       admin@genuai.test    / Admin12345!    (SUPER_ADMIN)');
    console.log('  Company A:   companya@genuai.test / CompanyA123!   (APPROVED)');
    console.log('  Company B:   companyb@genuai.test / CompanyB123!   (APPROVED)');
    console.log('  Pending Co:  pending@genuai.test  / Pending123!    (PENDING_VERIFICATION)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDev().catch(() => process.exit(1));
