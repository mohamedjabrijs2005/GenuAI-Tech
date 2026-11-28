const pool = require('../database/pool');
const { computeTargetSkillProof, computeOverallFit } = require('./skillProofService');
const { recomputeTargetCoverage } = require('./evidenceService');
const { logAudit } = require('./auditService');
const { trackEvent } = require('./analyticsService');
const { createCandidateNotification } = require('./notificationService');

const FIT_ORDER = { strong: 0, promising: 1, partial: 2, not_ready: 3 };

const OUTCOME_TO_APP_STATUS = {
  rejected: 'Rejected',
  offered: 'Selected',
  joined: 'Selected',
  on_hold: 'Decision',
};

const OUTCOME_TO_TARGET_DECISION = {
  rejected: 'REJECTED',
  offered: 'OFFERED',
  joined: 'HIRED',
  on_hold: 'PENDING_REVIEW',
};

async function getExplainableShortlist(vacancyId, companyId, filters = {}) {
  const vacRes = await pool.query(
    `SELECT cr.id, cr.title, cr.company_id, cr.status
     FROM company_roles cr
     WHERE cr.id = $1 AND cr.company_id = $2`,
    [vacancyId, companyId]
  );
  if (vacRes.rowCount === 0) {
    return null;
  }
  const vacancy = vacRes.rows[0];

  const [clRes, reqsRes, targetsRes, overridesRes, outcomesRes] = await Promise.all([
    pool.query(
      `SELECT id, status, version, approved_at FROM vacancy_skill_checklists
       WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1`,
      [vacancyId]
    ),
    pool.query(
      `SELECT id, name, importance, requirement_type
       FROM requirements WHERE role_id = $1 ORDER BY display_order ASC, created_at ASC`,
      [vacancyId]
    ),
    pool.query(
      `SELECT t.id, t.candidate_id, t.status, t.recruiter_decision,
              t.interview_stage, t.interview_stage_updated_at, t.assessment_invited_at,
              c.first_name, c.last_name, c.email AS candidate_email
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       WHERE t.vacancy_id = $1 AND t.company_id = $2
         AND t.status NOT IN ('WITHDRAWN', 'CLOSED')
       ORDER BY t.created_at DESC`,
      [vacancyId, companyId]
    ),
    pool.query(
      `SELECT target_id, override_rank, override_fit, reason, overridden_by, updated_at
       FROM shortlist_overrides
       WHERE vacancy_id = $1 AND company_id = $2`,
      [vacancyId, companyId]
    ),
    pool.query(
      `SELECT DISTINCT ON (target_id) target_id, decision, reason_code, notes, decided_at
       FROM hiring_outcomes
       WHERE vacancy_id = $1 AND company_id = $2
       ORDER BY target_id, decided_at DESC`,
      [vacancyId, companyId]
    ),
  ]);

  const checklist = reqsRes.rows.map((r) => ({
    requirementId: r.id,
    skill: r.name,
    type: (String(r.importance).toUpperCase().includes('PREFERRED') || String(r.importance).toUpperCase().includes('GOOD'))
      ? 'good_to_have'
      : 'must_have',
  }));

  const overrideMap = new Map(overridesRes.rows.map((o) => [o.target_id, o]));
  const outcomeMap = new Map(outcomesRes.rows.map((o) => [o.target_id, o]));

  const candidates = [];
  for (const t of targetsRes.rows) {
    let proof;
    try {
      proof = await computeTargetSkillProof(pool, t.id);
    } catch (err) {
      console.error(`Proof computation failed for target ${t.id}:`, err.message);
      continue;
    }
    try {
      await recomputeTargetCoverage(pool, t.id);
    } catch (_) { }

    const skills = proof.skills.map((s) => {
      const checklistItem = checklist.find((c) => c.requirementId === s.requirementId);
      return {
        requirementId: s.requirementId,
        skill: s.skillName,
        proofLevel: s.proofLevel,
        status: s.status,
        score: s.score,
        trainable: s.trainable,
        reason: s.reason,
        recommendedAction:
          s.status === 'partial' && s.proofLevel === 'claimed'
            ? `Send a short assessment for "${s.skillName}"`
            : s.status === 'trainable'
              ? `Discuss "${s.skillName}" as a trainable gap in the interview`
              : null,
        interviewFocus:
          s.status === 'partial' || s.status === 'trainable'
            ? `Validate "${s.skillName}" through a practical task in the interview`
            : null,
        type: checklistItem ? checklistItem.type : 'must_have',
      };
    });

    const systemFit = computeOverallFit(proof.skills);
    const override = overrideMap.get(t.id) || null;
    const outcome = outcomeMap.get(t.id) || null;

    candidates.push({
      targetId: t.id,
      candidateId: t.candidate_id,
      displayName: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Candidate',
      candidateEmail: t.candidate_email || null,
      targetStatus: t.status,
      recruiterDecision: t.recruiter_decision || null,
      interviewStage: t.interview_stage || 'not_started',
      interviewStageUpdatedAt: t.interview_stage_updated_at || null,
      assessmentInvitedAt: t.assessment_invited_at || null,
      overallFit: override?.override_fit || systemFit,
      systemFit,
      override: override
        ? {
          overrideRank: override.override_rank,
          overrideFit: override.override_fit,
          reason: override.reason,
          updatedAt: override.updated_at,
        }
        : null,
      hiringOutcome: outcome || null,
      skills,
      missingSkills: skills.filter((s) => s.status === 'missing').map((s) => s.skill),
      trainableGaps: skills.filter((s) => s.status === 'trainable').map((s) => s.skill),
      interviewFocus: skills.filter((s) => s.interviewFocus).map((s) => s.interviewFocus),
    });
  }

  // Overridden explicit ranks appear first in ascending order, then fit ordering
  candidates.sort((a, b) => {
    const aRank = a.override?.overrideRank ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.override?.overrideRank ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return (FIT_ORDER[a.overallFit] ?? 99) - (FIT_ORDER[b.overallFit] ?? 99);
  });

  const totalCount = candidates.length;
  const filtered = candidates.filter((c) => {
    if (filters.proofLevel && !c.skills.some((s) => s.proofLevel === filters.proofLevel)) return false;
    if (filters.assessmentStatus === 'invited' && !c.assessmentInvitedAt) return false;
    if (filters.assessmentStatus === 'not_invited' && c.assessmentInvitedAt) return false;
    if (filters.assessmentStatus === 'assessed' && !c.skills.some((s) => s.proofLevel === 'assessed' || s.proofLevel === 'verified')) return false;
    if (filters.missingSkill) {
      const q = String(filters.missingSkill).toLowerCase();
      if (!c.missingSkills.some((m) => m.toLowerCase().includes(q))) return false;
    }
    if (filters.trainableOnly && c.trainableGaps.length === 0) return false;
    return true;
  });

  await trackEvent('shortlist_viewed', {
    companyId,
    vacancyId,
    properties: { candidateCount: filtered.length, totalCount },
  });

  return {
    vacancyId,
    vacancyTitle: vacancy.title,
    vacancyStatus: vacancy.status,
    checklistStatus: clRes.rows[0]?.status || 'draft',
    checklist,
    candidates: filtered,
    count: filtered.length,
    totalCount,
    note: 'Fit is measured only against this specific vacancy. No universal job-readiness score is used.',
  };
}

async function overrideShortlistRank(vacancyId, targetId, companyId, user, { overrideRank = null, overrideFit = null, reason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tRes = await client.query(
      `SELECT id, candidate_id FROM targets
       WHERE id = $1 AND vacancy_id = $2 AND company_id = $3 FOR UPDATE`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Target not found for this vacancy/company');
      err.statusCode = 404;
      throw err;
    }

    const candidateId = tRes.rows[0].candidate_id;
    const upRes = await client.query(
      `INSERT INTO shortlist_overrides
         (vacancy_id, target_id, company_id, candidate_id, override_rank, override_fit, reason, overridden_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (vacancy_id, target_id) DO UPDATE SET
         override_rank = EXCLUDED.override_rank,
         override_fit = EXCLUDED.override_fit,
         reason = EXCLUDED.reason,
         overridden_by = EXCLUDED.overridden_by,
         updated_at = NOW()
       RETURNING *`,
      [vacancyId, targetId, companyId, candidateId, overrideRank, overrideFit, reason, user.id]
    );

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'RECRUITER',
      action: 'SHORTLIST_RANK_OVERRIDDEN',
      entityType: 'Target',
      entityId: targetId,
      reason,
      details: { vacancyId, candidateId, overrideRank, overrideFit },
    });

    await createCandidateNotification(client, {
      candidateId,
      title: 'Application Review Updated',
      message: `A recruiter updated your shortlist review status.${overrideFit ? ` Fit assessment: ${overrideFit}.` : ''}`,
      type: 'SHORTLIST_OVERRIDE',
      link: `/candidate/targets/${targetId}`,
    });

    await client.query('COMMIT');
    await trackEvent('hr_override_used', {
      userId: user?.id || null,
      companyId,
      vacancyId,
      targetId,
      properties: { overrideRank, overrideFit },
    });
    return upRes.rows[0];
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { }
    throw err;
  } finally {
    client.release();
  }
}

async function recordHiringOutcome(vacancyId, targetId, companyId, user, { decision, reasonCode = null, notes = null }) {
  const normalized = String(decision).toLowerCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tRes = await client.query(
      `SELECT t.id, t.candidate_id, t.company_id, t.status AS old_status
       FROM targets t
       WHERE t.id = $1 AND t.vacancy_id = $2 AND t.company_id = $3 FOR UPDATE`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Target not found for this vacancy/company');
      err.statusCode = 404;
      throw err;
    }
    const target = tRes.rows[0];

    const appRes = await client.query(
      `SELECT id FROM applications
       WHERE candidate_id = $1 AND role_id = $2 AND company_id = $3
       ORDER BY applied_at DESC LIMIT 1`,
      [target.candidate_id, vacancyId, companyId]
    );
    const applicationId = appRes.rows[0]?.id || null;

    const insRes = await client.query(
      `INSERT INTO hiring_outcomes
         (application_id, target_id, vacancy_id, company_id, candidate_id, decision, reason_code, notes, decided_by, decided_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [applicationId, targetId, vacancyId, companyId, target.candidate_id, normalized, reasonCode, notes, user.id]
    );

    const mappedRecruiterDecision = OUTCOME_TO_TARGET_DECISION[normalized];
    await client.query(
      `UPDATE targets
       SET recruiter_decision = $1,
           recruiter_notes = COALESCE($2, recruiter_notes),
           recruiter_decided_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [mappedRecruiterDecision, notes, targetId]
    );

    if (applicationId) {
      await client.query(
        `UPDATE applications
         SET status = $1, recruiter_notes = COALESCE($2, recruiter_notes), updated_at = NOW()
         WHERE id = $3`,
        [OUTCOME_TO_APP_STATUS[normalized], notes, applicationId]
      );
    }

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'RECRUITER',
      action: 'RECRUITER_HIRING_OUTCOME',
      entityType: 'Target',
      entityId: targetId,
      oldStatus: target.old_status,
      newStatus: normalized,
      reason: notes || reasonCode || `Recorded hiring outcome: ${normalized}`,
      details: { vacancyId, applicationId, decision: normalized, reasonCode },
    });

    await createCandidateNotification(client, {
      candidateId: target.candidate_id,
      title: `Hiring Outcome: ${normalized.replace(/_/g, ' ').toUpperCase()}`,
      message: notes || `A hiring decision (${normalized.replace(/_/g, ' ')}) was recorded for your application.`,
      type: 'HIRING_OUTCOME',
      link: `/candidate/targets/${targetId}`,
    });

    await client.query('COMMIT');
    await trackEvent('hiring_outcome_recorded', {
      userId: user?.id || null,
      companyId,
      vacancyId,
      targetId,
      properties: { decision: normalized, reasonCode },
    });
    return insRes.rows[0];
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { }
    throw err;
  } finally {
    client.release();
  }
}

async function updateInterviewStage(vacancyId, targetId, companyId, user, { stage, notes = null }) {
  const normalized = String(stage).toLowerCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tRes = await client.query(
      `SELECT id, candidate_id, interview_stage
       FROM targets
       WHERE id = $1 AND vacancy_id = $2 AND company_id = $3 FOR UPDATE`,
      [targetId, vacancyId, companyId]
    );
    if (tRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Target not found for this vacancy/company');
      err.statusCode = 404;
      throw err;
    }
    const prevStage = tRes.rows[0].interview_stage || 'not_started';

    const upRes = await client.query(
      `UPDATE targets
       SET interview_stage = $1,
           interview_stage_updated_at = NOW(),
           recruiter_notes = COALESCE($2, recruiter_notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, candidate_id, interview_stage, interview_stage_updated_at`,
      [normalized, notes, targetId]
    );

    await logAudit(client, {
      companyId,
      user,
      actorRole: user?.role || 'RECRUITER',
      action: 'INTERVIEW_STAGE_UPDATED',
      entityType: 'Target',
      entityId: targetId,
      oldStatus: prevStage,
      newStatus: normalized,
      reason: notes || `Interview stage updated to ${normalized}`,
      details: { vacancyId, candidateId: tRes.rows[0].candidate_id, stage: normalized },
    });

    await createCandidateNotification(client, {
      candidateId: tRes.rows[0].candidate_id,
      title: 'Interview Stage Updated',
      message: `Your interview stage moved to ${normalized.replace(/_/g, ' ')}.`,
      type: 'INTERVIEW_STAGE',
      link: `/candidate/targets/${targetId}`,
    });

    await client.query('COMMIT');
    await trackEvent('interview_stage_updated', {
      userId: user?.id || null,
      companyId,
      vacancyId,
      targetId,
      properties: { prevStage, stage: normalized },
    });
    return upRes.rows[0];
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getExplainableShortlist,
  overrideShortlistRank,
  recordHiringOutcome,
  updateInterviewStage,
};
