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
// Recruiter saves rubric marks & rationale with tenant & bound checks
// ============================================================
router.post('/company/attempts/:attemptId/evaluate', async (req, res) => {
  const companyId = req.companyMembership.company_id;
  const { attemptId } = req.params;
  const { evaluations } = req.body; // Array of { requirementId, scenarioScore, feedback }

  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return res.status(400).json({ error: 'Evaluations array is required' });
  }

  // Evaluator permission check
  const memberRole = (req.companyMembership.member_role || '').toUpperCase();
  const allowedRoles = ['COMPANY_OWNER', 'HIRING_MANAGER', 'RECRUITER', 'ADMIN'];
  if (!allowedRoles.includes(memberRole)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions to evaluate candidate assessments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tenant boundary check with row locking
    const attemptRes = await client.query(
      `SELECT aa.id, aa.target_id, aa.company_id, aa.objective_score, aa.status
       FROM assessment_attempts aa
       WHERE aa.id = $1 AND aa.company_id = $2
       FOR UPDATE`,
      [attemptId, companyId]
    );

    if (attemptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment attempt not found for this company' });
    }

    const attempt = attemptRes.rows[0];

    // Check for duplicate requirement IDs in request
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

    // Fetch existing requirement scores for bounds verification
    const existingScoresRes = await client.query(
      `SELECT requirement_id, score, max_score, rubric_criteria
       FROM assessment_requirement_scores
       WHERE attempt_id = $1`,
      [attemptId]
    );

    const scoreMap = new Map();
    for (const row of existingScoresRes.rows) {
      scoreMap.set(row.requirement_id, row);
    }

    let totalScenarioEarned = 0;

    for (const ev of evaluations) {
      const existing = scoreMap.get(ev.requirementId);
      if (!existing) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Requirement ${ev.requirementId} is not part of this assessment attempt.` });
      }

      if (ev.scenarioScore === null || ev.scenarioScore === undefined || ev.scenarioScore === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Scenario score for requirement ${ev.requirementId} is required.` });
      }

      const scoreNum = Number(ev.scenarioScore);
      if (isNaN(scoreNum) || !isFinite(scoreNum) || scoreNum < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Scenario score for requirement ${ev.requirementId} must be a valid non-negative number.` });
      }

      // Allowable scenario marks according to rubric definition
      let maxAllowedScenario = 0;
      let rubric = existing.rubric_criteria;
      if (typeof rubric === 'string') {
        try { rubric = JSON.parse(rubric); } catch (e) {}
      }

      if (rubric && typeof rubric === 'object' && rubric.scenarioMax != null) {
        maxAllowedScenario = Number(rubric.scenarioMax);
      } else {
        maxAllowedScenario = Math.max(0, Number(existing.max_score) - Number(existing.score));
      }

      if (scoreNum > maxAllowedScenario) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Score ${scoreNum} exceeds maximum allowable rubric mark of ${maxAllowedScenario} for requirement.`
        });
      }

      totalScenarioEarned += scoreNum;

      const baseScore = Math.max(0, Number(existing.score) || 0);
      const totalReqScore = Math.min(Number(existing.max_score), baseScore + scoreNum);
      const feedbackText = (ev.feedback || '').trim() || 'Recruiter rubric evaluated';

      await client.query(
        `UPDATE assessment_requirement_scores
         SET score = $1, evaluation_status = 'EVALUATED',
             assessment_notes = assessment_notes || ' | [Recruiter Evaluation]: ' || $2
         WHERE attempt_id = $3 AND requirement_id = $4`,
        [totalReqScore, feedbackText, attemptId, ev.requirementId]
      );
    }

    const finalTotalScore = Math.min(100, Math.round((Number(attempt.objective_score) || 0) + totalScenarioEarned));
    const isFullyGraded = seenReqIds.size === scoreMap.size;
    const finalGradingStatus = isFullyGraded ? 'FULLY_GRADED' : 'PARTIALLY_GRADED';

    await client.query(
      `UPDATE assessment_attempts
       SET scenario_score = $1, score = $2, grading_status = $3, evaluator_id = $4, evaluated_at = NOW(), updated_at = NOW()
       WHERE id = $5`,
      [totalScenarioEarned, finalTotalScore, finalGradingStatus, req.user.id, attemptId]
    );

    // Audit log event
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, $3, 'ASSESSMENT_EVALUATION_RECORDED', 'assessment_attempts', $4, $5, 'Recruiter scenario rubric evaluation recorded', $6)`,
      [
        companyId,
        req.user.id,
        memberRole,
        attemptId,
        finalGradingStatus,
        JSON.stringify({
          attemptId,
          scenarioScore: totalScenarioEarned,
          finalScore: finalTotalScore,
          evaluationsCount: evaluations.length,
          gradingStatus: finalGradingStatus,
        }),
      ]
    );

    // Recompute target requirement coverage with explicit threshold policy
    const { recomputeTargetCoverage } = require('./evidenceService');
    await recomputeTargetCoverage(client, attempt.target_id);

    await client.query('COMMIT');

    return res.json({
      success: true,
      finalScore: finalTotalScore,
      scenarioScore: totalScenarioEarned,
      objectiveScore: attempt.objective_score,
      gradingStatus: finalGradingStatus,
      message: `Assessment evaluation saved as ${finalGradingStatus}. Requirement coverage recalculated.`,
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

