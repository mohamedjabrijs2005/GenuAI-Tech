require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

/**
 * Migration V27 — Proof-Level Core (new GenuAI core layer):
 * 1. skill_claims        — candidate-confirmed skill claims (resume/profile/manual source).
 * 2. target_skill_proof  — per target×requirement computed proof level
 *                          (NOT_ASSESSED | CLAIMED | ASSESSED | VERIFIED) with
 *                          status (MEETS | PARTIAL | MISSING | TRAINABLE) and reason.
 * 3. match_explanations  — explainable-shortlist reasons per target×requirement,
 *                          including interview focus and generator source.
 * 4. hiring_outcomes     — structured HR hiring outcome per application/target.
 *
 * Deterministic rules only at this stage; no external AI dependency.
 */
async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V27 (Proof-Level Core: skill_claims, target_skill_proof, match_explanations, hiring_outcomes)...');
    await client.query('BEGIN');

    // 1. skill_claims — a candidate's claimed skill, confirmed by the candidate
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        skill_name VARCHAR(255) NOT NULL,
        skill_id UUID,
        claim_text TEXT,
        source VARCHAR(20) NOT NULL DEFAULT 'manual'
          CHECK (source IN ('resume', 'profile', 'manual')),
        confidence NUMERIC(4,3),
        confirmed_by_candidate BOOLEAN NOT NULL DEFAULT FALSE,
        confirmed_at TIMESTAMPTZ,
        withdrawn_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_skill_claims_candidate ON skill_claims(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_skill_claims_name ON skill_claims(LOWER(skill_name));
    `);
    console.log('skill_claims table ensured.');

    // 2. target_skill_proof — computed proof level for every checklist item on a target
    await client.query(`
      CREATE TABLE IF NOT EXISTS target_skill_proof (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
        vacancy_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
        skill_name VARCHAR(255),
        proof_level VARCHAR(20) NOT NULL DEFAULT 'not_assessed'
          CHECK (proof_level IN ('not_assessed', 'claimed', 'assessed', 'verified')),
        status VARCHAR(20) NOT NULL DEFAULT 'missing'
          CHECK (status IN ('meets', 'partial', 'missing', 'trainable')),
        score NUMERIC(5,2),
        max_score NUMERIC(5,2) DEFAULT 100,
        evidence_id UUID,
        assessment_result_id UUID,
        trainable BOOLEAN NOT NULL DEFAULT FALSE,
        reason TEXT,
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (target_id, requirement_id)
      );
      CREATE INDEX IF NOT EXISTS idx_tsp_target ON target_skill_proof(target_id);
      CREATE INDEX IF NOT EXISTS idx_tsp_vacancy ON target_skill_proof(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_tsp_level ON target_skill_proof(proof_level);
    `);
    console.log('target_skill_proof table ensured.');

    // 3. match_explanations — shortlist explanation records (rules first, AI later)
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_explanations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
        vacancy_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        requirement_id UUID,
        proof_level VARCHAR(20),
        reason TEXT,
        evidence_reference TEXT,
        interview_focus TEXT,
        generated_by VARCHAR(10) NOT NULL DEFAULT 'rules'
          CHECK (generated_by IN ('rules', 'ai')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_match_expl_target ON match_explanations(target_id);
      CREATE INDEX IF NOT EXISTS idx_match_expl_vacancy ON match_explanations(vacancy_id);
    `);
    console.log('match_explanations table ensured.');

    // 4. hiring_outcomes — structured final HR outcome (extends human_decisions,
    //    kept separate so the existing human decision trail stays untouched)
    await client.query(`
      CREATE TABLE IF NOT EXISTS hiring_outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID,
        target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
        vacancy_id UUID REFERENCES company_roles(id) ON DELETE CASCADE,
        company_id UUID,
        candidate_id UUID,
        decision VARCHAR(20) NOT NULL
          CHECK (decision IN ('rejected', 'offered', 'joined', 'on_hold')),
        reason_code VARCHAR(100),
        notes TEXT,
        decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
        decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hiring_outcomes_vacancy ON hiring_outcomes(vacancy_id);
      CREATE INDEX IF NOT EXISTS idx_hiring_outcomes_target ON hiring_outcomes(target_id);
    `);
    console.log('hiring_outcomes table ensured.');

    await client.query('COMMIT');
    console.log('Migration V27 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V27 failed:', err);
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
