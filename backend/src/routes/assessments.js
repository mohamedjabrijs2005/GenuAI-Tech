const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/assessments  — List all assessment groups for company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(`
      SELECT ag.*, cr.title AS vacancy_title,
             COUNT(DISTINCT eg.id) AS eval_group_count,
             COUNT(DISTINCT q.id) AS question_count
      FROM assessment_groups ag
      JOIN company_roles cr ON cr.id = ag.role_id
      LEFT JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id
      LEFT JOIN questions q ON q.evaluation_group_id = eg.id
      WHERE ag.company_id = $1
      GROUP BY ag.id, cr.title ORDER BY ag.created_at DESC`, [companyId]);

    return res.json({ assessmentGroups: result.rows });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
      return res.json({ assessmentGroups: [] });
    }
    console.error('List assessments error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// ============================================================
// GET /api/assessments/role/:roleId  — Assessment groups for a vacancy
// ============================================================
router.get('/role/:roleId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(`
      SELECT ag.*,
             json_agg(
               json_build_object(
                 'id', eg.id,
                 'name', eg.name,
                 'description', eg.description,
                 'mapped_requirement_id', eg.mapped_requirement_id,
                 'question_count', eg.question_count
               ) ORDER BY eg.created_at
             ) FILTER (WHERE eg.id IS NOT NULL) AS evaluation_groups
      FROM assessment_groups ag
      LEFT JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id
      WHERE ag.role_id = $1 AND ag.company_id = $2
      GROUP BY ag.id ORDER BY ag.created_at`, [req.params.roleId, companyId]);

    return res.json({ assessmentGroups: result.rows });
  } catch (err) {
    console.error('Get role assessments error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// ============================================================
// POST /api/assessments  — Create assessment group
// ============================================================
router.post('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { roleId, name, type, duration, description } = req.body;

    if (!roleId || !name) return res.status(422).json({ error: 'roleId and name required' });

    const result = await pool.query(
      `INSERT INTO assessment_groups (role_id, company_id, name, type, duration, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [roleId, companyId, name, type || 'Official Technical Assessment', duration || 60, description]
    );
    return res.status(201).json({ assessmentGroup: result.rows[0] });
  } catch (err) {
    console.error('Create assessment group error:', err);
    return res.status(500).json({ error: 'Failed to create assessment group' });
  }
});

// ============================================================
// POST /api/assessments/:agId/evaluation-groups  — Add eval group
// ============================================================
router.post('/:agId/evaluation-groups', async (req, res) => {
  try {
    const { agId } = req.params;
    const { name, description, mappedRequirementId } = req.body;
    if (!name) return res.status(422).json({ error: 'name required' });

    const result = await pool.query(
      `INSERT INTO evaluation_groups (assessment_group_id, name, description, mapped_requirement_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [agId, name, description, mappedRequirementId || null]
    );
    return res.status(201).json({ evaluationGroup: result.rows[0] });
  } catch (err) {
    console.error('Create eval group error:', err);
    return res.status(500).json({ error: 'Failed to create evaluation group' });
  }
});

// ============================================================
// GET /api/assessments/:agId/evaluation-groups/:egId/questions
// ============================================================
router.get('/:agId/evaluation-groups/:egId/questions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions WHERE evaluation_group_id = $1 ORDER BY created_at',
      [req.params.egId]
    );
    return res.json({ questions: result.rows });
  } catch (err) {
    console.error('Get questions error:', err);
    return res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// ============================================================
// POST /api/assessments/:agId/evaluation-groups/:egId/questions
// ============================================================
router.post('/:agId/evaluation-groups/:egId/questions', async (req, res) => {
  try {
    const { egId } = req.params;
    const { content, questionType, points, options, correctAnswer } = req.body;
    if (!content) return res.status(422).json({ error: 'content required' });

    const result = await pool.query(
      `INSERT INTO questions (evaluation_group_id, content, question_type, points, options, correct_answer)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [egId, content, questionType || 'MCQ', points || 1.0, options ? JSON.stringify(options) : null, correctAnswer]
    );

    // Update question count
    await pool.query(
      `UPDATE evaluation_groups SET question_count = (SELECT COUNT(*) FROM questions WHERE evaluation_group_id = $1) WHERE id = $1`,
      [egId]
    );

    return res.status(201).json({ question: result.rows[0] });
  } catch (err) {
    console.error('Create question error:', err);
    return res.status(500).json({ error: 'Failed to create question' });
  }
});

// ============================================================
// DELETE /api/assessments/questions/:qid  — Delete question
// ============================================================
router.delete('/questions/:qid', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING evaluation_group_id', [req.params.qid]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Question not found' });

    await pool.query(
      `UPDATE evaluation_groups SET question_count = (SELECT COUNT(*) FROM questions WHERE evaluation_group_id = $1) WHERE id = $1`,
      [result.rows[0].evaluation_group_id]
    );
    return res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Delete question error:', err);
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ============================================================
// GET /api/assessments/company/pending-attempts
// List candidate assessment attempts for recruiter review
// ============================================================
router.get('/company/pending-attempts', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;

    const result = await pool.query(
      `SELECT aa.id, aa.target_id, aa.candidate_id, aa.submitted_at, aa.score,
              aa.objective_score, aa.scenario_score, aa.grading_status, aa.status,
              c.first_name, c.last_name, c.email as candidate_email,
              cr.title as vacancy_title, cr.id as vacancy_id
       FROM assessment_attempts aa
       JOIN targets t ON t.id = aa.target_id
       JOIN candidates c ON c.id = aa.candidate_id
       JOIN company_roles cr ON cr.id = t.vacancy_id
       WHERE aa.company_id = $1 AND aa.status IN ('SUBMITTED', 'GRADED')
       ORDER BY CASE WHEN aa.grading_status = 'PENDING_REVIEW' THEN 0 ELSE 1 END, aa.submitted_at DESC`,
      [companyId]
    );

    return res.json({ attempts: result.rows });
  } catch (err) {
    console.error('List company assessment attempts error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate assessment attempts' });
  }
});

// ============================================================
// GET /api/assessments/company/attempts/:attemptId
// Get full attempt details with separated scenario answers and rubrics
// ============================================================
router.get('/company/attempts/:attemptId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { attemptId } = req.params;

    const attemptRes = await pool.query(
      `SELECT aa.id, aa.target_id, aa.candidate_id, aa.company_id, aa.submitted_at,
              aa.score, aa.objective_score, aa.scenario_score, aa.grading_status,
              aa.answers, aa.version_snapshot, aa.evaluator_id, aa.evaluated_at,
              c.first_name, c.last_name, c.email as candidate_email,
              cr.title as vacancy_title, cr.id as vacancy_id,
              u.first_name as evaluator_first_name, u.last_name as evaluator_last_name
       FROM assessment_attempts aa
       JOIN targets t ON t.id = aa.target_id
       JOIN candidates c ON c.id = aa.candidate_id
       JOIN company_roles cr ON cr.id = t.vacancy_id
       LEFT JOIN users u ON u.id = aa.evaluator_id
       WHERE aa.id = $1 AND aa.company_id = $2`,
      [attemptId, companyId]
    );

    if (attemptRes.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment attempt not found or unauthorized' });
    }

    const attempt = attemptRes.rows[0];

    const scoresRes = await pool.query(
      `SELECT ars.id, ars.requirement_id, ars.score, ars.max_score, ars.assessment_notes,
              ars.scoring_source, ars.rubric_criteria, ars.candidate_answers, ars.evaluation_status,
              r.name as requirement_name, r.importance, r.weight
       FROM assessment_requirement_scores ars
       JOIN requirements r ON r.id = ars.requirement_id
       WHERE ars.attempt_id = $1
       ORDER BY r.created_at ASC`,
      [attemptId]
    );

    return res.json({
      attempt,
      requirementScores: scoresRes.rows,
    });
  } catch (err) {
    console.error('Get company attempt detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch attempt details' });
  }
});

// ============================================================
// POST /api/assessments/company/attempts/:attemptId/evaluate
// Recruiter saves rubric marks — stores objective/scenario separately
// Fixes: score inflation on regrade, mandatory scenarioMax, explicit FULLY_GRADED
// ============================================================
router.post('/company/attempts/:attemptId/evaluate', async (req, res) => {
  const companyId = req.companyMembership.company_id;
  const { attemptId } = req.params;
  const { evaluations } = req.body; // [{ requirementId, scenarioScore, feedback }]

  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return res.status(400).json({ error: 'evaluations array is required' });
  }

  const memberRole = (req.companyMembership.member_role || '').toUpperCase();
  if (!['COMPANY_OWNER', 'HIRING_MANAGER', 'RECRUITER', 'ADMIN'].includes(memberRole)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions to evaluate assessments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tenant boundary + row lock
    const attemptRes = await client.query(
      `SELECT aa.id, aa.target_id, aa.company_id, aa.objective_score, aa.score, aa.status
       FROM assessment_attempts aa
       WHERE aa.id = $1 AND aa.company_id = $2 FOR UPDATE`,
      [attemptId, companyId]
    );
    if (attemptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment attempt not found for this company' });
    }
    const attempt = attemptRes.rows[0];

    // Duplicate requirementId check
    const seenReqIds = new Set();
    for (const ev of evaluations) {
      if (!ev.requirementId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each evaluation must include requirementId' });
      }
      if (seenReqIds.has(ev.requirementId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Duplicate evaluation for requirement ${ev.requirementId}` });
      }
      seenReqIds.add(ev.requirementId);
    }

    // Fetch ALL requirement score rows for this attempt
    const existingScoresRes = await client.query(
      `SELECT requirement_id, objective_score, objective_max_score,
              scenario_score, scenario_max_score, score, max_score,
              rubric_criteria, required_scenario_evaluation
       FROM assessment_requirement_scores
       WHERE attempt_id = $1`,
      [attemptId]
    );
    const scoreMap = new Map();
    for (const row of existingScoresRes.rows) {
      scoreMap.set(row.requirement_id, row);
    }

    // Compute explicit required_scenario_requirement_ids
    const requiredScenarioReqIds = new Set(
      existingScoresRes.rows
        .filter(r => r.required_scenario_evaluation !== false)
        .map(r => r.requirement_id)
    );

    // Validate + apply each evaluation
    const auditDetails = [];
    for (const ev of evaluations) {
      const existing = scoreMap.get(ev.requirementId);
      if (!existing) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Requirement ${ev.requirementId} is not part of this attempt.` });
      }

      const scoreNum = Number(ev.scenarioScore);
      if (ev.scenarioScore === null || ev.scenarioScore === undefined || ev.scenarioScore === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `scenarioScore for requirement ${ev.requirementId} is required.` });
      }
      if (isNaN(scoreNum) || !isFinite(scoreNum) || scoreNum < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `scenarioScore for ${ev.requirementId} must be a valid non-negative number.` });
      }

      // Parse rubric to get scenarioMax — MANDATORY for graded requirements
      let rubric = existing.rubric_criteria;
      if (typeof rubric === 'string') { try { rubric = JSON.parse(rubric); } catch (_) {} }

      let scenarioMax = null;
      if (rubric && typeof rubric === 'object' && rubric.scenarioMax != null) {
        scenarioMax = Number(rubric.scenarioMax);
      }
      // Also check new column
      if (scenarioMax === null && existing.scenario_max_score != null) {
        scenarioMax = Number(existing.scenario_max_score);
      }

      // REJECT grading if scenarioMax is not defined in rubric (mandatory for pilot)
      if (scenarioMax === null || isNaN(scenarioMax)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `scenarioMax is missing from rubric for requirement ${ev.requirementId}. ` +
                 `Define scenario_max_score in the assessment rubric before grading.`
        });
      }

      if (scoreNum > scenarioMax) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Score ${scoreNum} exceeds rubric scenarioMax of ${scenarioMax} for requirement ${ev.requirementId}.`
        });
      }

      const oldScenarioScore = Number(existing.scenario_score) || 0;
      const objectiveScore   = Number(existing.objective_score) || 0;
      const objectiveMax     = Number(existing.objective_max_score) || 0;
      const feedbackText     = (ev.feedback || '').trim() || 'Recruiter rubric evaluated';

      // Total per-requirement = objective (immutable) + new scenario score
      const newTotalReqScore = Math.min(
        Number(existing.max_score),
        objectiveScore + scoreNum
      );

      auditDetails.push({
        requirementId: ev.requirementId,
        oldScenarioScore,
        newScenarioScore: scoreNum,
        objectiveScore,
        newTotalReqScore,
      });

      await client.query(
        `UPDATE assessment_requirement_scores
         SET scenario_score      = $1,
             scenario_max_score  = $2,
             score               = $3,
             evaluation_status   = 'EVALUATED',
             grading_revision_count = COALESCE(grading_revision_count, 0) + 1,
             last_graded_at      = NOW(),
             assessment_notes    = assessment_notes || ' | [Recruiter ' || NOW()::text || ']: ' || $4
         WHERE attempt_id = $5 AND requirement_id = $6`,
        [scoreNum, scenarioMax, newTotalReqScore, feedbackText, attemptId, ev.requirementId]
      );
    }

    // FULLY_GRADED only when ALL required-scenario requirements have been evaluated
    const evaluatedReqIds = new Set(evaluations.map(e => e.requirementId));
    // Check if every required requirement now has evaluation_status = EVALUATED
    const postEvalRes = await client.query(
      `SELECT requirement_id, evaluation_status
       FROM assessment_requirement_scores
       WHERE attempt_id = $1 AND required_scenario_evaluation = TRUE`,
      [attemptId]
    );
    const allRequired = postEvalRes.rows;
    const isFullyGraded = allRequired.length > 0 &&
      allRequired.every(r => r.evaluation_status === 'EVALUATED');
    const finalGradingStatus = isFullyGraded ? 'FULLY_GRADED' : 'PARTIALLY_GRADED';

    // Recalculate total attempt score from component columns (never from combined field)
    const totalScoreRes = await client.query(
      `SELECT COALESCE(SUM(objective_score), 0) AS total_obj,
              COALESCE(SUM(scenario_score), 0)  AS total_scen,
              COALESCE(MAX(aa.objective_score), 0) AS attempt_obj
       FROM assessment_requirement_scores ars
       JOIN assessment_attempts aa ON aa.id = ars.attempt_id
       WHERE ars.attempt_id = $1`,
      [attemptId]
    );
    const totalScen = Number(totalScoreRes.rows[0]?.total_scen) || 0;
    const attemptObj = Number(totalScoreRes.rows[0]?.attempt_obj) || 0;
    const finalTotalScore = Math.min(100, Math.round(attemptObj + totalScen));

    await client.query(
      `UPDATE assessment_attempts
       SET scenario_score  = $1,
           score           = $2,
           grading_status  = $3,
           evaluator_id    = $4,
           evaluated_at    = NOW(),
           updated_at      = NOW()
       WHERE id = $5`,
      [totalScen, finalTotalScore, finalGradingStatus, req.user.id, attemptId]
    );

    // Audit log with old/new marks
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, old_value, new_value)
       VALUES ($1, $2, $3, 'ASSESSMENT_EVALUATION_RECORDED', 'assessment_attempts', $4, $5, $6,
               'Recruiter scenario rubric evaluation recorded', $7, $8, $9)`,
      [
        companyId, req.user.id, memberRole, attemptId, attempt.grading_status, finalGradingStatus,
        JSON.stringify({ attemptId, scenarioScore: totalScen, finalScore: finalTotalScore,
          gradingStatus: finalGradingStatus, evaluationsCount: evaluations.length, details: auditDetails }),
        JSON.stringify({ grading_status: attempt.grading_status, total_score: attempt.total_score }),
        JSON.stringify({ grading_status: finalGradingStatus, total_score: finalTotalScore, scenario_score: totalScen }),
      ]
    );

    // Recompute target requirement coverage with final committed grading state
    const { recomputeTargetCoverage } = require('./evidenceService');
    await recomputeTargetCoverage(client, attempt.target_id);

    await client.query('COMMIT');

    return res.json({
      success: true,
      finalScore: finalTotalScore,
      scenarioScore: totalScen,
      objectiveScore: attemptObj,
      gradingStatus: finalGradingStatus,
      fullyGradedRequirements: allRequired.filter(r => r.evaluation_status === 'EVALUATED').length,
      totalRequiredEvaluations: allRequired.length,
      message: `Evaluation saved as ${finalGradingStatus}. Coverage recalculated.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Recruiter evaluate assessment error:', err);
    return res.status(500).json({ error: 'Failed to save evaluation' });
  } finally {
    client.release();
  }
});


module.exports = router;
