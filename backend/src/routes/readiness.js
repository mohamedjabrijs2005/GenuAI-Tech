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
const handleReadinessFunnel = async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;

    // Validate UUID format to prevent 500 query errors
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vacancyId);
    if (!isUUID) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

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

    // Stage 0 — interestedCandidates: candidates who expressed interest in this vacancy
    const interestRes = await pool.query(
      `SELECT COUNT(DISTINCT ci.candidate_id)::int AS count
       FROM candidate_interest ci
       WHERE ci.vacancy_id = $1 AND ci.company_id = $2
         AND ci.interest_status = 'EXPRESSED'`,
      [vacancyId, companyId]
    );

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
         AND (UPPER(tlp.status) IN ('IN_PROGRESS', 'COMPLETED') OR tlp.last_accessed_at IS NOT NULL)`,
      [vacancyId, companyId]
    );

    // Stage 3 — practiceCompleted: candidates who completed at least one practice attempt
    const practiceRes = await pool.query(
      `SELECT COUNT(DISTINCT t.candidate_id)::int AS count
       FROM targets t
       JOIN practice_attempts pa ON (pa.target_id = t.id OR (pa.target_id IS NULL AND pa.candidate_id = t.candidate_id))
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND (UPPER(pa.status) IN ('SUBMITTED', 'COMPLETED') OR pa.submitted_at IS NOT NULL)`,
      [vacancyId, companyId]
    );

    // Stage 4 — assessmentSubmitted: candidates who submitted an official assessment attempt
    const assessRes = await pool.query(
      `SELECT COUNT(DISTINCT candidate_id)::int AS count FROM (
         -- Assessment attempts linked via target or directly via role/company
         SELECT aa.candidate_id
         FROM assessment_attempts aa
         LEFT JOIN targets t ON t.id = aa.target_id
         WHERE (aa.role_id = $1 OR t.vacancy_id = $1)
           AND (aa.company_id = $2 OR t.company_id = $2)
           AND (UPPER(COALESCE(aa.status, '')) IN ('SUBMITTED', 'COMPLETED', 'GRADED', 'GRADING_COMPLETE') OR aa.submitted_at IS NOT NULL)
         UNION
         -- Older schema: assessment_results via applications table
         SELECT a.candidate_id
         FROM applications a
         JOIN assessment_results ar ON ar.application_id = a.id
         WHERE a.role_id = $1 AND a.company_id = $2
           AND UPPER(COALESCE(ar.status, '')) IN ('COMPLETED', 'SUBMITTED', 'GRADED')
       ) sub`,
      [vacancyId, companyId]
    );

    // Stage 5 — evidenceSubmitted: candidates who submitted at least one evidence item
    const evidenceRes = await pool.query(
      `SELECT COUNT(DISTINCT candidate_id)::int AS count FROM (
         -- Target-linked evidence (v5+)
         SELECT t.candidate_id
         FROM targets t
         JOIN evidence e ON (e.target_id = t.id OR (e.candidate_id = t.candidate_id AND e.vacancy_id = t.vacancy_id))
         WHERE t.vacancy_id = $1 AND t.company_id = $2
           AND (
             e.submitted_at IS NOT NULL
             OR UPPER(COALESCE(e.review_status, '')) IN ('SUBMITTED', 'SUPPORTING', 'LIMITED', 'APPROVED', 'VERIFIED')
             OR UPPER(COALESCE(e.status, '')) IN ('SUPPORTING', 'LIMITED', 'SUBMITTED')
           )
         UNION
         -- Application-linked evidence
         SELECT a.candidate_id
         FROM applications a
         JOIN evidence e ON e.application_id = a.id
         WHERE a.role_id = $1 AND a.company_id = $2
           AND (
             e.submitted_at IS NOT NULL
             OR UPPER(COALESCE(e.review_status, '')) IN ('SUBMITTED', 'SUPPORTING', 'LIMITED', 'APPROVED', 'VERIFIED')
             OR UPPER(COALESCE(e.status, '')) IN ('SUPPORTING', 'LIMITED', 'SUBMITTED')
           )
       ) sub`,
      [vacancyId, companyId]
    );

    // Stage 6 — coverageQualified: candidates meeting minimum coverage threshold (>= 60%)
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
         AND LOWER(a.status) IN ('review', 'interview', 'decision', 'selected', 'eligible', 'verified', 'invited', 'assessed', 'shortlisted')`,
      [vacancyId, companyId]
    );

    // Stage 8 — interviewed: candidates who had at least one interview scheduled/completed
    const interviewRes = await pool.query(
      `SELECT COUNT(DISTINCT a.candidate_id)::int AS count
       FROM applications a
       JOIN interviews i ON i.application_id = a.id
       WHERE a.role_id = $1 AND a.company_id = $2
         AND LOWER(i.status) IN ('scheduled', 'completed')`,
      [vacancyId, companyId]
    );

    // Stage 9 — hired: candidates with status Selected
    const hiredRes = await pool.query(
      `SELECT COUNT(DISTINCT a.candidate_id)::int AS count
       FROM applications a
       WHERE a.role_id = $1 AND a.company_id = $2
         AND LOWER(a.status) IN ('selected', 'hired')`,
      [vacancyId, companyId]
    );

    const funnel = {
      interestedCandidates: interestRes.rows[0]?.count    ?? 0,
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
};

router.get('/:vacancyId/readiness-funnel', handleReadinessFunnel);
router.get('/:vacancyId/readiness', handleReadinessFunnel);

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

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vacancyId);
    if (!isUUID) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

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
           WHERE (aa.target_id = t.id OR aa.role_id = t.vacancy_id)
             AND (UPPER(COALESCE(aa.status, '')) IN ('SUBMITTED', 'COMPLETED', 'GRADED', 'GRADING_COMPLETE') OR aa.submitted_at IS NOT NULL)
           UNION
           SELECT 1 FROM applications ap
           JOIN assessment_results ar ON ar.application_id = ap.id
           WHERE ap.candidate_id = t.candidate_id AND ap.role_id = t.vacancy_id
             AND UPPER(COALESCE(ar.status, '')) IN ('COMPLETED', 'SUBMITTED', 'GRADED')
         )
         AND EXISTS (
           SELECT 1 FROM evidence e
           WHERE (e.target_id = t.id OR (a.id IS NOT NULL AND e.application_id = a.id))
             AND (
               e.submitted_at IS NOT NULL
               OR UPPER(COALESCE(e.review_status, '')) IN ('SUBMITTED', 'SUPPORTING', 'LIMITED', 'APPROVED', 'VERIFIED')
               OR UPPER(COALESCE(e.status, '')) IN ('SUPPORTING', 'LIMITED', 'SUBMITTED')
             )
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

// ============================================================
// GET /api/company/vacancies/:vacancyId/interested-candidates
// Returns list of candidates who expressed interest in this vacancy.
// Filtered strictly by company_id and vacancy_id.
// ============================================================
router.get('/:vacancyId/interested-candidates', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vacancyId);
    if (!isUUID) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

    const roleRes = await pool.query(
      `SELECT cr.id, cr.title FROM company_roles cr WHERE cr.id = $1 AND cr.company_id = $2`,
      [vacancyId, companyId]
    );
    if (roleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

    const candidatesRes = await pool.query(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.location,
              ci.id AS interest_id, ci.interest_status, ci.created_at AS interested_at,
              t.id AS target_id, t.status AS target_status
       FROM candidate_interest ci
       JOIN candidates c ON c.id = ci.candidate_id
       LEFT JOIN targets t ON t.vacancy_id = ci.vacancy_id AND t.candidate_id = ci.candidate_id
       WHERE ci.vacancy_id = $1 AND ci.company_id = $2 AND ci.interest_status = 'EXPRESSED'
       ORDER BY ci.created_at DESC`,
      [vacancyId, companyId]
    );

    return res.json({
      vacancyId,
      candidates: candidatesRes.rows,
      count: candidatesRes.rowCount,
    });
  } catch (err) {
    console.error('Interested candidates error:', err);
    return res.status(500).json({ error: 'Failed to fetch interested candidates' });
  }
});

module.exports = router;
