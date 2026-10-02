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

module.exports = router;
