const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/company/vacancies/:vacancyId/readiness-funnel
// Returns a funnel showing how many candidates progressed
// through each stage for a specific company vacancy.
// Only the authenticated company can access its own vacancy.
// ============================================================
router.get('/:vacancyId/readiness-funnel', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;

    // ── 1. Tenant-check: vacancy must belong to this company ──────────
    const roleRes = await pool.query(
      `SELECT cr.id, cr.title, cr.status
       FROM company_roles cr
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [vacancyId, companyId]
    );
    if (roleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }
    const role = roleRes.rows[0];

    // ── 2. Stage queries (all scoped to vacancyId + companyId) ─────────

    // Stage 1 — targetsCreated: candidates who created a Target for this vacancy
    const targetsRes = await pool.query(
      `SELECT COUNT(DISTINCT t.candidate_id)::int AS count
       FROM targets t
       WHERE t.vacancy_id = $1 AND t.company_id = $2`,
      [vacancyId, companyId]
    );

    // Stage 2 — preparationStarted: candidates who started at least one learning resource
    const prepRes = await pool.query(
      `SELECT COUNT(DISTINCT t.candidate_id)::int AS count
       FROM targets t
       JOIN target_learning_progress tlp ON tlp.target_id = t.id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND tlp.status IN ('IN_PROGRESS', 'COMPLETED')`,
      [vacancyId, companyId]
    );

    // Stage 3 — practiceCompleted: candidates who completed at least one practice attempt
    const practiceRes = await pool.query(
      `SELECT COUNT(DISTINCT t.candidate_id)::int AS count
       FROM targets t
       JOIN practice_attempts pa ON pa.target_id = t.id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND pa.status IN ('SUBMITTED', 'COMPLETED')`,
      [vacancyId, companyId]
    );

    // Stage 4 — assessmentSubmitted: candidates who submitted an official assessment attempt
    //   Check both assessment_attempts (newer) and assessment_results (older schema)
    const assessRes = await pool.query(
      `SELECT COUNT(DISTINCT candidate_id)::int AS count FROM (
         -- Newer schema: assessment_attempts table (target-linked)
         SELECT t.candidate_id
         FROM targets t
         JOIN assessment_attempts aa ON aa.target_id = t.id
         WHERE t.vacancy_id = $1 AND t.company_id = $2
           AND aa.status IN ('SUBMITTED', 'COMPLETED', 'GRADED', 'GRADING_COMPLETE')
         UNION
         -- Older schema: assessment_results via applications table
         SELECT a.candidate_id
         FROM applications a
         JOIN assessment_results ar ON ar.application_id = a.id
         WHERE a.role_id = $1 AND a.company_id = $2
           AND ar.status IN ('Completed')
       ) sub`,
      [vacancyId, companyId]
    );

    // Stage 5 — evidenceSubmitted: candidates who submitted at least one evidence item
    const evidenceRes = await pool.query(
      `SELECT COUNT(DISTINCT candidate_id)::int AS count FROM (
         -- evidence linked via target (newer approach)
         SELECT t.candidate_id
         FROM targets t
         JOIN evidence e ON e.target_id = t.id
         WHERE t.vacancy_id = $1 AND t.company_id = $2
           AND e.status IN ('Supporting', 'Limited')
         UNION
         -- evidence linked via application (older approach)
         SELECT a.candidate_id
         FROM applications a
         JOIN evidence e ON e.application_id = a.id
         WHERE a.role_id = $1 AND a.company_id = $2
           AND e.status IN ('Supporting', 'Limited')
       ) sub`,
      [vacancyId, companyId]
    );

    // Stage 6 — coverageQualified: candidates meeting minimum coverage threshold (>= 60%)
    //   Checks target_coverage table for coverage_pct
    const coverageRes = await pool.query(
      `SELECT COUNT(DISTINCT tc.candidate_id)::int AS count
       FROM target_coverage tc
       JOIN targets t ON t.id = tc.target_id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND COALESCE(tc.coverage_pct, 0) >= 60`,
      [vacancyId, companyId]
    );

    // Stage 7 — shortlisted: applications in Review or later stage
    const shortlistRes = await pool.query(
      `SELECT COUNT(DISTINCT a.candidate_id)::int AS count
       FROM applications a
       WHERE a.role_id = $1 AND a.company_id = $2
         AND a.status IN ('Review', 'Interview', 'Decision', 'Selected', 'Eligible', 'Verified', 'Invited', 'Assessed')`,
      [vacancyId, companyId]
    );

    // Stage 8 — interviewed: candidates who had at least one interview scheduled/completed
    const interviewRes = await pool.query(
      `SELECT COUNT(DISTINCT a.candidate_id)::int AS count
       FROM applications a
       JOIN interviews i ON i.application_id = a.id
       WHERE a.role_id = $1 AND a.company_id = $2
         AND i.status IN ('Scheduled', 'Completed')`,
      [vacancyId, companyId]
    );

    // Stage 9 — hired: candidates with status Selected
    const hiredRes = await pool.query(
      `SELECT COUNT(DISTINCT a.candidate_id)::int AS count
       FROM applications a
       WHERE a.role_id = $1 AND a.company_id = $2
         AND a.status = 'Selected'`,
      [vacancyId, companyId]
    );

    const funnel = {
      targetsCreated:       targetsRes.rows[0]?.count     ?? 0,
      preparationStarted:   prepRes.rows[0]?.count        ?? 0,
      practiceCompleted:    practiceRes.rows[0]?.count    ?? 0,
      assessmentSubmitted:  assessRes.rows[0]?.count      ?? 0,
      evidenceSubmitted:    evidenceRes.rows[0]?.count    ?? 0,
      coverageQualified:    coverageRes.rows[0]?.count    ?? 0,
      shortlisted:          shortlistRes.rows[0]?.count   ?? 0,
      interviewed:          interviewRes.rows[0]?.count   ?? 0,
      hired:                hiredRes.rows[0]?.count       ?? 0,
    };

    return res.json({
      vacancyId,
      roleTitle:   role.title,
      roleStatus:  role.status,
      companyId,
      funnel,
    });
  } catch (err) {
    console.error('Readiness funnel error:', err);
    return res.status(500).json({ error: 'Failed to fetch readiness funnel' });
  }
});

// ============================================================
// GET /api/company/vacancies/:vacancyId/ready-candidates
// Returns candidates who are "ready" for recruiter review:
//   - Created a Target
//   - Submitted an assessment
//   - Submitted evidence
//   - Meet minimum coverage (>= 60%)
// ============================================================
router.get('/:vacancyId/ready-candidates', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;

    // Tenant-check
    const roleCheck = await pool.query(
      'SELECT id, title FROM company_roles WHERE id = $1 AND company_id = $2',
      [vacancyId, companyId]
    );
    if (roleCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

    // Ready candidates: must satisfy all 4 criteria
    const result = await pool.query(
      `SELECT
         c.id,
         c.first_name,
         c.last_name,
         c.email,
         t.id AS target_id,
         t.status AS target_status,
         t.targeted_at,
         t.last_activity_at,
         COALESCE(tc.coverage_pct, 0)::float AS coverage_pct,
         a.status AS application_status,
         a.id AS application_id
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       LEFT JOIN applications a ON a.candidate_id = t.candidate_id
         AND a.role_id = t.vacancy_id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND COALESCE(tc.coverage_pct, 0) >= 60
         AND EXISTS (
           SELECT 1 FROM assessment_attempts aa
           WHERE aa.target_id = t.id
             AND aa.status IN ('SUBMITTED', 'COMPLETED', 'GRADED', 'GRADING_COMPLETE')
           UNION
           SELECT 1 FROM applications ap
           JOIN assessment_results ar ON ar.application_id = ap.id
           WHERE ap.candidate_id = t.candidate_id AND ap.role_id = t.vacancy_id
             AND ar.status IN ('Completed')
         )
         AND EXISTS (
           SELECT 1 FROM evidence e
           WHERE (e.target_id = t.id OR (a.id IS NOT NULL AND e.application_id = a.id))
             AND e.status IN ('Supporting', 'Limited')
         )
       ORDER BY COALESCE(tc.coverage_pct, 0) DESC, t.last_activity_at DESC`,
      [vacancyId, companyId]
    );

    return res.json({
      vacancyId,
      roleTitle:  roleCheck.rows[0].title,
      candidates: result.rows,
      count:      result.rowCount,
    });
  } catch (err) {
    console.error('Ready candidates error:', err);
    return res.status(500).json({ error: 'Failed to fetch ready candidates' });
  }
});

module.exports = router;
