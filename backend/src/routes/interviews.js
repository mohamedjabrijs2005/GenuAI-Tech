const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// GET /api/interviews  — All interviews for company
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { status } = req.query;

    let query = `
      SELECT i.*,
             c.first_name AS candidate_first, c.last_name AS candidate_last, c.email AS candidate_email,
             cr.title AS vacancy_title,
             u.first_name AS interviewer_first, u.last_name AS interviewer_last
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN candidates c ON c.id = a.candidate_id
      JOIN company_roles cr ON cr.id = a.role_id
      LEFT JOIN users u ON u.id = i.interviewer_id
      WHERE i.company_id = $1
    `;
    const params = [companyId];

    if (status) { query += ` AND i.status = $${params.length + 1}`; params.push(status); }
    query += ' ORDER BY i.scheduled_at DESC LIMIT 200';

    const result = await pool.query(query, params);
    return res.json({ interviews: result.rows });
  } catch (err) {
    console.error('List interviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// PATCH /api/interviews/:id/feedback  — Submit interview feedback
router.patch('/:id/feedback', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;
    const { feedback, commScore, problemScore, overallScore, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE interviews
       SET feedback = COALESCE($1, feedback),
           comm_score = COALESCE($2, comm_score),
           problem_score = COALESCE($3, problem_score),
           overall_score = COALESCE($4, overall_score),
           status = COALESCE($5, status),
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7 AND company_id = $8 RETURNING *`,
      [feedback, commScore, problemScore, overallScore, status, notes, id, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Interview not found' });

    // Update application status if completed
    if (status === 'Completed') {
      await pool.query(
        `UPDATE applications SET status = 'Decision', updated_at = NOW() WHERE id = $1`,
        [result.rows[0].application_id]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, entity_type, entity_id, action, details)
       VALUES ($1,$2,$3,$4,'interview',$5,'feedback_submitted',$6)`,
      [companyId, req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.email,
       id, JSON.stringify({ status, overallScore })]
    );

    return res.json({ interview: result.rows[0] });
  } catch (err) {
    console.error('Submit feedback error:', err);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// PATCH /api/interviews/:id/cancel  — Cancel interview
router.patch('/:id/cancel', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `UPDATE interviews SET status = 'Cancelled', updated_at = NOW()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [req.params.id, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Interview not found' });
    return res.json({ interview: result.rows[0] });
  } catch (err) {
    console.error('Cancel interview error:', err);
    return res.status(500).json({ error: 'Failed to cancel interview' });
  }
});

module.exports = router;
