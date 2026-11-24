const pool = require('../database/pool');

/**
 * skillProofService — deterministic proof-level engine (new GenuAI core).
 *
 * Proof levels per target × requirement:
 *   verified     — trusted evidence ACCEPTED (reviewer-verified credential/referee/employer)
 *   assessed     — passing official assessment (>= 70% fully graded) or accepted evidence
 *   claimed      — candidate-confirmed skill claim exists, no proof yet
 *   not_assessed — nothing at all
 *
 * Status per checklist item:
 *   meets / partial / missing / trainable
 *
 * Rules are deterministic on purpose (Phase 1). No external AI dependency.
 * AI-generated explanations can later fill match_explanations with generated_by='ai'.
 */

const ASSESSMENT_PASS_RATIO = 0.70;
const PROVISIONAL_RATIO = 0.40;

// Skills considered "adjacent" for trainable-gap classification (Phase 1 heuristic).
// Trainable = candidate shows strong adjacent evidence on other must-have skills.
const TRAINABLE_ADJACENCY = {
  'docker': ['git', 'linux', 'devops', 'node.js', 'python', 'backend'],
  'kubernetes': ['docker', 'devops', 'linux'],
  'sql': ['python', 'excel', 'data'],
  'react': ['javascript', 'html', 'css'],
  'typescript': ['javascript'],
  'aws': ['linux', 'docker', 'devops'],
};

function normalize(name) {
  return String(name || '').trim().toLowerCase();
}

/**
 * Compute the proof level for one requirement given target-scoped data.
 */
function computeProofForRequirement(requirement, {
  evidence = [],
  assessments = [],
  confirmedClaims = [],
  hasStrongAdjacentEvidence = false,
  claimStrength = null, // TODO(ai): parsed resume confidence once LLM parsing exists
}) {
  const reqEvidence = evidence.filter((e) => e.requirement_id === requirement.id);
  const reqAssessments = assessments.filter((a) => a.requirement_id === requirement.id);

  const verifiedEvidence = reqEvidence.find((e) => e.review_status === 'ACCEPTED' && e.evidence_type !== 'SELF_CLAIM');
  const bestRatio = reqAssessments.length > 0
    ? Math.max(...reqAssessments.map((a) => Number(a.score) / (Number(a.max_score) || 100)))
    : null;

  let proofLevel = 'not_assessed';
  let status = 'missing';
  let reason = '';
  let score = null;
  let maxScore = null;
  let evidenceId = null;
  let assessmentResultId = null;

  if (verifiedEvidence) {
    proofLevel = 'verified';
    status = 'meets';
    reason = `Verified evidence accepted: "${verifiedEvidence.title || verifiedEvidence.evidence_type}" (reviewer-accepted).`;
    evidenceId = verifiedEvidence.id;
  } else if (bestRatio !== null && bestRatio >= ASSESSMENT_PASS_RATIO) {
    proofLevel = 'assessed';
    status = 'meets';
    score = bestRatio * 100;
    maxScore = 100;
    assessmentResultId = reqAssessments[0].attempt_id;
    reason = `Official assessment passed with ${Math.round(bestRatio * 100)}% (threshold ${ASSESSMENT_PASS_RATIO * 100}%).`;
  } else if (bestRatio !== null && bestRatio >= PROVISIONAL_RATIO) {
    proofLevel = 'assessed';
    status = 'partial';
    score = bestRatio * 100;
    maxScore = 100;
    assessmentResultId = reqAssessments[0].attempt_id;
    reason = `Official assessment scored ${Math.round(bestRatio * 100)}% — below the 70% pass threshold; partial proof only.`;
  } else {
    const claim = confirmedClaims.find(
      (c) => normalize(c.skill_name) === normalize(requirement.name)
    );
    if (claim) {
      proofLevel = 'claimed';
      status = 'partial';
      reason = `Candidate-confirmed ${claim.source === 'resume' ? 'resume' : 'profile'} claim "${claim.skill_name}"; not yet assessed.`;
      evidenceId = claim.id;
    } else {
      proofLevel = 'not_assessed';
      // Trainable gap: no proof, but adjacent must-have skills show strong proof
      const reqKey = normalize(requirement.name);
      const adjacency = TRAINABLE_ADJACENCY[reqKey] || [];
      const adjacentKey = adjacency[0];
      const isTrainableByType = String(requirement.importance || '').toUpperCase() === 'PREFERRED'
        || String(requirement.requirement_type || '').toUpperCase() === 'PREFERRED';
      if (hasStrongAdjacentEvidence || isTrainableByType || adjacentKey) {
        status = 'trainable';
        reason = adjacentKey
          ? `No proof for "${requirement.name}", but adjacent skill "${adjacentKey}" shows proof — trainable gap.`
          : 'No proof yet, but the requirement is marked preferred/trainable in the approved checklist.';
      } else {
        status = 'missing';
        reason = `No claim, evidence, or assessment result for "${requirement.name}".`;
      }
    }
  }

  return {
    requirementId: requirement.id,
    skillName: requirement.name,
    importance: requirement.importance || requirement.requirement_type || 'REQUIRED',
    proofLevel,
    status,
    score,
    maxScore,
    evidenceId,
    assessmentResultId,
    trainable: status === 'trainable',
    reason,
  };
}

/**
 * Compute and persist proof levels for every checklist item on a target.
 * Called after evidence review, assessment grading, or claim confirmation.
 */
async function computeTargetSkillProof(dbOrPool, targetId) {
  const db = dbOrPool || pool;

  const targetRes = await db.query(
    `SELECT id, candidate_id, company_id, vacancy_id FROM targets WHERE id = $1`,
    [targetId]
  );
  if (targetRes.rowCount === 0) throw new Error(`Target ${targetId} not found`);
  const target = targetRes.rows[0];

  const reqsRes = await db.query(
    `SELECT id, name, importance, requirement_type FROM requirements
     WHERE role_id = $1 ORDER BY created_at ASC`,
    [target.vacancy_id]
  );
  const requirements = reqsRes.rows;

  const evidenceRes = await db.query(
    `SELECT id, requirement_id, review_status, evidence_type, title
     FROM evidence WHERE target_id = $1 AND review_status != 'WITHDRAWN'`,
    [targetId]
  );
  const assessmentsRes = await db.query(
    `SELECT ars.requirement_id, ars.score, ars.max_score, aa.id AS attempt_id, aa.grading_status
     FROM assessment_requirement_scores ars
     JOIN assessment_attempts aa ON aa.id = ars.attempt_id
     WHERE aa.target_id = $1 AND aa.status IN ('SUBMITTED', 'GRADED')`,
    [targetId]
  );
  const claimsRes = await db.query(
    `SELECT id, skill_name, source FROM skill_claims
     WHERE candidate_id = $1 AND confirmed_by_candidate = TRUE AND withdrawn_at IS NULL`,
    [target.candidate_id]
  );

  const evidence = evidenceRes.rows;
  const assessments = assessmentsRes.rows;
  const confirmedClaims = claimsRes.rows;

  // Adjacency check: does the candidate have strong (assessed/verified) proof on any skill?
  const strongSkills = new Set(
    requirements.filter((r) => {
      const p = computeProofForRequirement(r, { evidence, assessments, confirmedClaims });
      return p.proofLevel === 'verified' || (p.proofLevel === 'assessed' && p.status === 'meets');
    }).map((r) => normalize(r.name))
  );
  const hasStrongAdjacentEvidence = (reqName) => {
    const adjacency = TRAINABLE_ADJACENCY[normalize(reqName)] || [];
    return adjacency.some((a) => strongSkills.has(a));
  };

  const results = requirements.map((req) =>
    computeProofForRequirement(req, {
      evidence,
      assessments,
      confirmedClaims,
      hasStrongAdjacentEvidence: hasStrongAdjacentEvidence(req.name),
    })
  );

  // Persist upserts + match explanations
  for (const r of results) {
    await db.query(
      `INSERT INTO target_skill_proof
         (target_id, vacancy_id, requirement_id, skill_name, proof_level, status,
          score, max_score, evidence_id, assessment_result_id, trainable, reason, computed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (target_id, requirement_id) DO UPDATE SET
         skill_name = EXCLUDED.skill_name,
         proof_level = EXCLUDED.proof_level,
         status = EXCLUDED.status,
         score = EXCLUDED.score,
         max_score = EXCLUDED.max_score,
         evidence_id = EXCLUDED.evidence_id,
         assessment_result_id = EXCLUDED.assessment_result_id,
         trainable = EXCLUDED.trainable,
         reason = EXCLUDED.reason,
         computed_at = NOW()`,
      [targetId, target.vacancy_id, r.requirementId, r.skillName, r.proofLevel, r.status,
        r.score, r.maxScore, r.evidenceId, r.assessmentResultId, r.trainable, r.reason]
    );

    await db.query(
      `INSERT INTO match_explanations
         (target_id, vacancy_id, requirement_id, proof_level, reason, evidence_reference, interview_focus, generated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'rules')`,
      [targetId, target.vacancy_id, r.requirementId, r.proofLevel, r.reason,
        r.evidenceId ? `evidence:${r.evidenceId}` : (r.assessmentResultId ? `assessment:${r.assessmentResultId}` : null),
        r.status === 'partial' || r.status === 'trainable'
          ? `Validate "${r.skillName}" through a practical task in the interview`
          : null]
    );
  }

  return { targetId, vacancyId: target.vacancy_id, skills: results };
}

/**
 * Overall fit category for a candidate against ONE vacancy (never a universal score).
 */
function computeOverallFit(skills) {
  const must = skills.filter((s) => String(s.importance).toUpperCase().includes('REQUIRED') || String(s.importance).toUpperCase().includes('MUST'));
  const check = must.length > 0 ? must : skills;
  const meets = check.filter((s) => s.status === 'meets').length;
  const partial = check.filter((s) => s.status === 'partial').length;
  const missing = check.filter((s) => s.status === 'missing').length;

  if (meets === check.length) return 'strong';
  if (meets + partial === check.length) return 'promising';
  if (missing < check.length / 2) return 'partial';
  return 'not_ready';
}

module.exports = {
  computeTargetSkillProof,
  computeProofForRequirement,
  computeOverallFit,
  ASSESSMENT_PASS_RATIO,
  PROVISIONAL_RATIO,
};
