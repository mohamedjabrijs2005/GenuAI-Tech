require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const MIGRATION_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'company_admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(255) NOT NULL,
  industry              VARCHAR(100),
  description           TEXT,
  size                  VARCHAR(50),
  website               VARCHAR(255),
  official_email        VARCHAR(255),
  location              VARCHAR(255),
  hiring_contact_name   VARCHAR(150),
  hiring_contact_email  VARCHAR(255),
  hiring_contact_phone  VARCHAR(50),
  verification_status   VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED'
                          CHECK (verification_status IN ('UNVERIFIED','UNDER_REVIEW','VERIFIED','SUSPENDED')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPANY MEMBERS
-- Maps users to companies with roles
-- ============================================================
CREATE TABLE IF NOT EXISTS company_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  description TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- ============================================================
-- COMPANY ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS company_roles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id     UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  title             VARCHAR(255) NOT NULL,
  job_description   TEXT,
  experience_level  VARCHAR(50) NOT NULL
                      CHECK (experience_level IN ('entry','mid','senior','lead','executive')),
  employment_type   VARCHAR(50) NOT NULL
                      CHECK (employment_type IN ('full_time','part_time','contract','internship','freelance')),
  location          VARCHAR(255) NOT NULL,
  vacancy_count     INTEGER NOT NULL DEFAULT 1 CHECK (vacancy_count >= 1),
  status            VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT','ACTIVE','CLOSED','DEACTIVATED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_members_user    ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company     ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_company   ON company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_dept      ON company_roles(department_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    await client.query(MIGRATION_SQL);
    console.log('✅ Migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
