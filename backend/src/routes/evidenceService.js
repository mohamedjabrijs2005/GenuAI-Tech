const pool = require('../database/pool');

/**
 * Recomputes requirement coverage for a specific candidate Target.
 * Coverage statuses:
 * - SUPPORTED: Relevant accepted evidence exists
 * - LIMITED: Evidence exists but is partial or limited
 * - PENDING: Candidate submitted evidence, review pending
 * - EVIDENCE_GAP: No sufficient supporting evidence is currently available
 */
async function recomputeTargetCoverage(clientOrPool, targetId) {
  const db = clientOrPool || pool;

  // 1. Fetch target details
  const targetRes = await db.query(
    `SELECT t.id, t.candidate_id, t.company_id, t.vacancy_id, t.vacancy_version_id
     FROM targets t
     WHERE t.id = $1`,
    [targetId]
  );

  if (targetRes.rowCount === 0) {
    throw new Error(`Target ${targetId} not found`);
  }

  const target = targetRes.rows[0];

  // 2. Fetch all requirements mapped to target's vacancy
  const reqsRes = await db.query(
    `SELECT id, name, importance, requirement_type, weight
     FROM requirements
     WHERE role_id = $1
     ORDER BY created_at ASC`,
    [target.vacancy_id]
  );

  const requirements = reqsRes.rows;
  const totalRequirements = requirements.length;

  // 3. Fetch all active evidence for this target
  const evidenceRes = await db.query(
    `SELECT id, requirement_id, review_status, evidence_type, title, file_hash, external_url
     FROM evidence
     WHERE target_id = $1 AND review_status != 'WITHDRAWN'`,
    [targetId]
  );

  const evidenceList = evidenceRes.rows;

  // 3b. Fetch latest completed assessment scores for this target with grading status
  const assessmentScoresRes = await db.query(
    `SELECT ars.requirement_id, ars.score, ars.max_score, ars.evaluation_status, aa.grading_status
     FROM assessment_requirement_scores ars
     JOIN assessment_attempts aa ON aa.id = ars.attempt_id
     WHERE aa.target_id = $1 AND aa.status IN ('SUBMITTED', 'GRADED')
     ORDER BY aa.submitted_at DESC`,
    [targetId]
  );
  const assessmentScores = assessmentScoresRes.rows;

  let supportedCount = 0;
  let limitedCount = 0;
  let pendingCount = 0;
  let gapCount = 0;

  const requirementBreakdown = requirements.map((req) => {
    const reqEvidence = evidenceList.filter((e) => e.requirement_id === req.id);
    const reqAssessments = assessmentScores.filter((a) => a.requirement_id === req.id);

    const hasFullyGradedPassingAssessment = reqAssessments.some(
      (a) => a.grading_status === 'FULLY_GRADED' && (Number(a.score) / (Number(a.max_score) || 100)) >= 0.70
    );
    const hasProvisionalAssessment = reqAssessments.some(
      (a) => (Number(a.score) / (Number(a.max_score) || 100)) >= 0.40
    );

    const bestScoreRatio = reqAssessments.length > 0
      ? Math.max(...reqAssessments.map(a => Number(a.score) / (Number(a.max_score) || 100)))
      : null;

    let status = 'EVIDENCE_GAP';
    if (reqEvidence.some((e) => e.review_status === 'ACCEPTED') || hasFullyGradedPassingAssessment) {
      status = 'SUPPORTED';
      supportedCount++;
    } else if (reqEvidence.some((e) => e.review_status === 'LIMITED') || hasProvisionalAssessment) {
      status = 'LIMITED';
      limitedCount++;
    } else if (reqEvidence.some((e) => ['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUESTED'].includes(e.review_status)) || reqAssessments.some(a => a.grading_status === 'PENDING_REVIEW')) {
      status = 'PENDING';
      pendingCount++;
    } else {
      status = 'EVIDENCE_GAP';
      gapCount++;
    }

    return {
      requirementId: req.id,
      requirementName: req.name,
      importance: req.importance || req.requirement_type || 'REQUIRED',
      status,
      evidenceItems: reqEvidence,
      assessmentDetails: reqAssessments.length > 0 ? {
        scoreRatio: bestScoreRatio,
        thresholdMet: bestScoreRatio !== null && bestScoreRatio >= 0.70,
        gradingStatus: reqAssessments[0].grading_status,
        evaluationStatus: reqAssessments[0].evaluation_status,
        source: 'OFFICIAL_ASSESSMENT_V1',
        recruiterEvaluationPending: reqAssessments.some(a => a.grading_status === 'PENDING_REVIEW'),
      } : null,
    };
  });

  const coveragePct = totalRequirements > 0
    ? Math.round(((supportedCount * 1.0 + limitedCount * 0.5) / totalRequirements) * 10000) / 100
    : 0;

  // 4. Upsert snapshot into target_coverage
  await db.query(
    `INSERT INTO target_coverage
       (target_id, company_id, candidate_id, vacancy_id, vacancy_version_id,
        total_requirements, supported_count, limited_count, pending_count, gap_count,
        coverage_pct, computed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (target_id) DO UPDATE SET
       total_requirements = EXCLUDED.total_requirements,
       supported_count = EXCLUDED.supported_count,
       limited_count = EXCLUDED.limited_count,
       pending_count = EXCLUDED.pending_count,
       gap_count = EXCLUDED.gap_count,
       coverage_pct = EXCLUDED.coverage_pct,
       computed_at = NOW()`,
    [
      targetId,
      target.company_id,
      target.candidate_id,
      target.vacancy_id,
      target.vacancy_version_id,
      totalRequirements,
      supportedCount,
      limitedCount,
      pendingCount,
      gapCount,
      coveragePct,
    ]
  );

  return {
    targetId,
    totalRequirements,
    supportedCount,
    limitedCount,
    pendingCount,
    gapCount,
    coveragePct,
    requirements: requirementBreakdown,
  };
}

module.exports = {
  recomputeTargetCoverage,
};
