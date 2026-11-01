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

// ============================================================
// GET /api/company/vacancies/:vacancyId/candidates/:targetId
// Full candidate review profile for company recruiter
// Security: Company B cannot access Company A candidate
// ============================================================
router.get('/:vacancyId/candidates/:targetId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId, targetId } = req.params;

    const isUUID = /^[0-9a-f-]{36}$/i.test(vacancyId) && /^[0-9a-f-]{36}$/i.test(targetId);
    if (!isUUID) return res.status(404).json({ error: 'Candidate profile not found or access denied.' });

    // Validate vacancy belongs to company
    const roleRes = await pool.query(
      `SELECT cr.id, cr.title, cr.experience_level, cr.employment_type, cr.location, cr.work_mode,
              d.name AS department_name
       FROM company_roles cr
       LEFT JOIN departments d ON d.id = cr.department_id
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [vacancyId, companyId]
    );
    if (roleRes.rowCount === 0) return res.status(404).json({ error: 'Vacancy not found or access denied.' });
    const vacancy = roleRes.rows[0];

    // Validate target belongs to vacancy and company
    const targetRes = await pool.query(
      `SELECT t.id AS target_id, t.candidate_id, t.company_id, t.vacancy_id, t.status AS target_status,
              t.targeted_at, t.last_activity_at, t.recruiter_notes, t.recruiter_decision, t.recruiter_decided_at,
              c.first_name, c.last_name, c.email, c.phone, c.location AS candidate_location,
              c.education, c.experience_summary, c.general_skills, c.resume_url, c.github_url, c.portfolio_url, c.linkedin_url,
              tc.coverage_pct, tc.supported_count, tc.limited_count, tc.gap_count, tc.pending_count
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       WHERE t.id = $1 AND t.vacancy_id = $2 AND t.company_id = $3`,
      [targetId, vacancyId, companyId]
    );
    if (targetRes.rowCount === 0) return res.status(404).json({ error: 'Target not found or access denied.' });
    const targetData = targetRes.rows[0];

    // Fetch requirements with coverage
    const reqRes = await pool.query(
      `SELECT r.id, r.name, r.description, r.importance, r.eval_method, r.evaluation_methods, r.weight
       FROM requirements r
       WHERE r.role_id = $1
       ORDER BY r.created_at ASC`,
      [vacancyId]
    );

    // Fetch evidence submitted for this target
    const evRes = await pool.query(
      `SELECT id, requirement_id, title, evidence_type, file_url, external_url,
              description, review_status, reviewer_note, submitted_at, reviewed_at
       FROM evidence
       WHERE target_id = $1 AND candidate_id = $2
       ORDER BY submitted_at DESC`,
      [targetId, targetData.candidate_id]
    );

    // Fetch assessment attempts
    const assessRes = await pool.query(
      `SELECT id, status, grading_status, score, objective_score, scenario_score,
              submitted_at, created_at
       FROM assessment_attempts
       WHERE (target_id = $1 OR (candidate_id = $2 AND role_id = $3))
       ORDER BY created_at DESC LIMIT 5`,
      [targetId, targetData.candidate_id, vacancyId]
    );

    // Fetch practice attempts summary
    const practiceRes = await pool.query(
      `SELECT COUNT(*) AS total_attempts,
              COUNT(DISTINCT requirement_name) AS completed_sets,
              MAX(score) AS best_score,
              MAX(submitted_at) AS last_submitted_at
       FROM practice_attempts
       WHERE (target_id = $1 OR (candidate_id = $2 AND requirement_name IS NOT NULL))`,
      [targetId, targetData.candidate_id]
    );

    // Map requirements with evidence support status
    const evidenceList = evRes.rows;
    const requirementsWithStatus = reqRes.rows.map(reqItem => {
      const matchedEv = evidenceList.filter(e => e.requirement_id === reqItem.id && e.review_status !== 'WITHDRAWN');
      const isApproved = matchedEv.some(e => ['APPROVED', 'ACCEPTED'].includes((e.review_status || '').toUpperCase()));
      const isPending = matchedEv.some(e => ['SUBMITTED', 'PENDING_REVIEW'].includes((e.review_status || '').toUpperCase()));
      return {
        ...reqItem,
        status: isApproved ? 'SUPPORTED' : isPending ? 'PENDING' : 'GAP',
        evidenceCount: matchedEv.length,
      };
    });

    return res.json({
      target: targetData,
      vacancy,
      candidate: {
        id: targetData.candidate_id,
        first_name: targetData.first_name,
        last_name: targetData.last_name,
        email: targetData.email,
        phone: targetData.phone,
        location: targetData.candidate_location,
        education: targetData.education || [],
        experience_summary: targetData.experience_summary,
        general_skills: targetData.general_skills || [],
        resume_url: targetData.resume_url,
        github_url: targetData.github_url,
        portfolio_url: targetData.portfolio_url,
        linkedin_url: targetData.linkedin_url,
      },
      coverage: {
        coverage_pct: targetData.coverage_pct || 0,
        supported_count: targetData.supported_count || 0,
        limited_count: targetData.limited_count || 0,
        gap_count: targetData.gap_count || 0,
        pending_count: targetData.pending_count || 0,
      },
      requirements: requirementsWithStatus,
      evidence: evidenceList,
      assessment: assessRes.rows[0] || null,
      assessmentHistory: assessRes.rows,
      practice: practiceRes.rows[0] || { total_attempts: 0, completed_sets: 0, best_score: null },
      recruiterNotes: targetData.recruiter_notes || '',
      recruiterDecision: targetData.recruiter_decision || 'PENDING_REVIEW',
      recruiterDecidedAt: targetData.recruiter_decided_at || null,
    });
  } catch (err) {
    console.error('Candidate review detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate profile' });
  }
});

// ============================================================
// POST /api/company/vacancies/:vacancyId/candidates/:targetId/decision
// Human recruiter makes decision:
// SHORTLISTED | REQUEST_MORE_EVIDENCE | REJECTED | INTERVIEW_SCHEDULED | INTERVIEWED | OFFERED | HIRED
// Audit log generated for all actions.
// ============================================================
router.post('/:vacancyId/candidates/:targetId/decision', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const userId = req.user?.id;
    const { vacancyId, targetId } = req.params;
    const { decision, notes } = req.body;

    const VALID_DECISIONS = [
      'SHORTLISTED',
      'REQUEST_MORE_EVIDENCE',
      'REJECTED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEWED',
      'OFFERED',
      'HIRED',
      'PENDING_REVIEW'
    ];

    if (!VALID_DECISIONS.includes(decision)) {
      return res.status(400).json({
        error: `Invalid decision. Must be one of: ${VALID_DECISIONS.join(', ')}`
      });
    }

    // Verify target belongs to this company's vacancy
    const tRes = await pool.query(
      `SELECT t.id, t.candidate_id, t.status AS old_status, c.email AS candidate_email
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.id = $1 AND t.vacancy_id = $2 AND t.company_id = $3`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) return res.status(404).json({ error: 'Target not found or access denied' });
    const target = tRes.rows[0];

    // Update target status and recruiter decision
    await pool.query(
      `UPDATE targets
       SET status = $1,
           recruiter_decision = $1,
           recruiter_notes = COALESCE($2, recruiter_notes),
           recruiter_decided_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [decision, notes || null, targetId]
    );

    // Update application table if present
    await pool.query(
      `UPDATE applications
       SET status = $1, recruiter_notes = COALESCE($2, recruiter_notes), updated_at = NOW()
       WHERE candidate_id = $3 AND role_id = $4 AND company_id = $5`,
      [decision, notes || null, target.candidate_id, vacancyId, companyId]
    ).catch(() => {});

    // Create Audit Log
    const actorName = `${req.user.firstName || req.user.first_name || 'Recruiter'} ${req.user.lastName || req.user.last_name || ''}`.trim();
    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, actor_role, action, entity_type, entity_id, old_status, new_status, reason, details)
       VALUES ($1, $2, $3, $4, 'RECRUITER', $5, 'Target', $6, $7, $8, $9, $10)`,
      [
        companyId,
        userId,
        actorName,
        req.user.email,
        `RECRUITER_DECISION_${decision}`,
        targetId,
        target.old_status,
        decision,
        notes || `Recruiter set candidate decision to ${decision}`,
        JSON.stringify({
          candidateId: target.candidate_id,
          candidateEmail: target.candidate_email,
          vacancyId,
          decision,
          timestamp: new Date().toISOString()
        })
      ]
    );

    // Send candidate notification (without private recruiter notes)
    const notificationMessages = {
      SHORTLISTED: 'Congratulations! You have been shortlisted for this role.',
      REQUEST_MORE_EVIDENCE: 'The recruiter has requested additional evidence for your target.',
      INTERVIEW_SCHEDULED: 'An interview has been scheduled for this role.',
      INTERVIEWED: 'Interview status has been updated to completed.',
      OFFERED: 'Congratulations! A job offer has been extended to you.',
      HIRED: 'Welcome aboard! You have been selected and hired.',
      REJECTED: 'Thank you for your interest. The company has decided not to proceed at this time.',
    };

    if (notificationMessages[decision]) {
      await pool.query(
        `INSERT INTO candidate_notifications (candidate_id, title, message, type, link)
         VALUES ($1, $2, $3, 'INFO', $4)`,
        [
          target.candidate_id,
          `Application Update: ${decision.replace(/_/g, ' ')}`,
          notificationMessages[decision],
          `/candidate/targets/${targetId}`
        ]
      ).catch(() => {});

      // If decision is SHORTLISTED, dispatch candidate shortlist email
      if (decision === 'SHORTLISTED') {
        try {
          const candEmailRes = await pool.query(
            `SELECT email, first_name, last_name FROM candidates WHERE id = $1`,
            [target.candidate_id]
          );
          if (candEmailRes.rowCount > 0) {
            const cand = candEmailRes.rows[0];
            const { sendShortlistNotification } = require('../services/email');
            const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
            sendShortlistNotification({
              to: cand.email,
              name: `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate',
              vacancyTitle: target.vacancy_title,
              companyName: target.company_name,
              actionUrl: `${frontendUrl}/candidate/targets/${targetId}`,
            }).catch(err => console.warn('Shortlist email note:', err.message));
          }
        } catch (_) {}
      }
    }

    return res.json({
      success: true,
      targetId,
      decision,
      status: decision,
      decidedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Recruiter decision error:', err);
    return res.status(500).json({ error: 'Failed to record decision' });
  }
});

// ============================================================
// POST /api/company/vacancies/:vacancyId/candidates/:targetId/evidence/:evidenceId/review
// Recruiter reviews candidate evidence (APPROVE or REJECT)
// ============================================================
router.post('/:vacancyId/candidates/:targetId/evidence/:evidenceId/review', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const userId = req.user?.id;
    const { vacancyId, targetId, evidenceId } = req.params;
    const { reviewStatus, note } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED', 'LIMITED'].includes(reviewStatus)) {
      return res.status(400).json({ error: 'Invalid review status. Must be APPROVED, REJECTED, or LIMITED.' });
    }

    const tRes = await pool.query(
      `SELECT t.id, t.candidate_id FROM targets t WHERE t.id = $1 AND t.vacancy_id = $2 AND t.company_id = $3`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) return res.status(404).json({ error: 'Target not found or access denied.' });

    const evUpdate = await pool.query(
      `UPDATE evidence
       SET review_status = $1, reviewer_note = COALESCE($2, reviewer_note), reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND target_id = $5
       RETURNING *`,
      [reviewStatus, note || null, userId, evidenceId, targetId]
    );
    if (evUpdate.rowCount === 0) return res.status(404).json({ error: 'Evidence not found.' });

    // Recompute target coverage
    const { recomputeTargetCoverage } = require('./evidenceService');
    const updatedCoverage = await recomputeTargetCoverage(pool, targetId).catch(() => null);

    return res.json({
      success: true,
      evidence: evUpdate.rows[0],
      coverage: updatedCoverage,
    });
  } catch (err) {
    console.error('Review evidence error:', err);
    return res.status(500).json({ error: 'Failed to review evidence' });
  }
});

module.exports = router;
