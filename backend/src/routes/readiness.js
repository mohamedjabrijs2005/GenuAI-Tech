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
// Returns ALL candidates with a Target for this vacancy,
// with their assessment/evidence/decision status.
// Filters via ?filter= query param.
// Security: company can only see candidates for own vacancy.
// ============================================================
router.get('/:vacancyId/ready-candidates', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;
    const { filter } = req.query;

    const isUUID = /^[0-9a-f-]{36}$/i.test(vacancyId);
    if (!isUUID) return res.status(404).json({ error: 'Vacancy not found or access denied' });

    const roleCheck = await pool.query(
      'SELECT id, title FROM company_roles WHERE id = $1 AND company_id = $2',
      [vacancyId, companyId]
    );
    if (roleCheck.rowCount === 0) return res.status(404).json({ error: 'Vacancy not found or access denied' });

    const result = await pool.query(
      `SELECT
         c.id AS candidate_id,
         c.first_name,
         c.last_name,
         c.email,
         t.id AS target_id,
         t.status AS target_status,
         t.targeted_at,
         t.last_activity_at,
         COALESCE(tc.coverage_pct, 0)::float AS coverage_pct,
         aa_latest.status AS assessment_status,
         aa_latest.grading_status,
         aa_latest.score AS assessment_score,
         aa_latest.submitted_at AS assessment_submitted_at,
         COALESCE(ev_counts.evidence_count, 0)::int AS evidence_count,
         COALESCE(ev_counts.approved_count, 0)::int AS evidence_approved_count,
         hd.decision AS recruiter_decision,
         hd.decided_at AS recruiter_decided_at,
         hd.rationale AS recruiter_notes
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       LEFT JOIN LATERAL (
         SELECT status, grading_status, score, submitted_at
         FROM assessment_attempts
         WHERE (target_id = t.id OR (candidate_id = t.candidate_id AND role_id = t.vacancy_id))
         ORDER BY created_at DESC LIMIT 1
       ) aa_latest ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS evidence_count,
                COUNT(*) FILTER (WHERE UPPER(COALESCE(review_status,'')) IN ('APPROVED','ACCEPTED')) AS approved_count
         FROM evidence
         WHERE target_id = t.id AND candidate_id = t.candidate_id
       ) ev_counts ON TRUE
       LEFT JOIN LATERAL (
         SELECT hd2.decision, hd2.decided_at, hd2.rationale
         FROM human_decisions hd2
         JOIN applications a2 ON a2.id = hd2.application_id
         WHERE a2.candidate_id = t.candidate_id AND a2.role_id = t.vacancy_id
           AND hd2.company_id = $2
         ORDER BY hd2.decided_at DESC LIMIT 1
       ) hd ON TRUE
       WHERE t.vacancy_id = $1 AND t.company_id = $2
       ORDER BY COALESCE(tc.coverage_pct, 0) DESC, t.last_activity_at DESC`,
      [vacancyId, companyId]
    );

    let candidates = result.rows;
    if (filter === 'coverage_qualified') candidates = candidates.filter(c => c.coverage_pct >= 60);
    else if (filter === 'assessment_submitted') candidates = candidates.filter(c => ['SUBMITTED','GRADED','FULLY_GRADED','COMPLETED'].includes((c.assessment_status || '').toUpperCase()));
    else if (filter === 'evidence_submitted') candidates = candidates.filter(c => c.evidence_count > 0);
    else if (filter === 'pending_review') candidates = candidates.filter(c => !c.recruiter_decision || c.recruiter_decision === 'PENDING_REVIEW');
    else if (filter === 'shortlisted') candidates = candidates.filter(c => c.recruiter_decision === 'SHORTLISTED');

    return res.json({ vacancyId, roleTitle: roleCheck.rows[0].title, candidates, count: candidates.length });
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
