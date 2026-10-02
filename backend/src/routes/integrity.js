const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// GET /api/integrity  — All integrity signals for company
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { status, severity } = req.query;

    let query = `
      SELECT is2.*, 
             c.first_name, c.last_name, c.email,
             cr.title AS vacancy_title,
             a.status AS application_status,
             u.first_name AS reviewer_first, u.last_name AS reviewer_last
      FROM integrity_signals is2
      JOIN applications a ON a.id = is2.application_id
      JOIN candidates c ON c.id = a.candidate_id
      JOIN company_roles cr ON cr.id = a.role_id
      LEFT JOIN users u ON u.id = is2.reviewed_by
      WHERE is2.company_id = $1
    `;
    const params = [companyId];

    if (status) { query += ` AND is2.status = $${params.length + 1}`; params.push(status); }
    if (severity) { query += ` AND is2.severity = $${params.length + 1}`; params.push(severity); }

    query += ' ORDER BY is2.signal_time DESC LIMIT 200';
    const result = await pool.query(query, params);
    return res.json({ signals: result.rows });
  } catch (err) {
    console.error('List integrity signals error:', err);
    return res.status(500).json({ error: 'Failed to fetch integrity signals' });
  }
});

// GET /api/integrity/stats  — Summary counts
router.get('/stats', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'New') AS new_count,
        COUNT(*) FILTER (WHERE status = 'Under Review') AS under_review,
        COUNT(*) FILTER (WHERE status IN ('Acknowledged','Dismissed')) AS resolved,
        COUNT(*) FILTER (WHERE severity = 'High' OR severity = 'Critical') AS high_severity
      FROM integrity_signals WHERE company_id = $1`, [companyId]);
    return res.json({ stats: result.rows[0] });
  } catch (err) {
    console.error('Integrity stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// PATCH /api/integrity/:signalId  — Review/acknowledge a signal
router.patch('/:signalId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { signalId } = req.params;
    const { status, reviewNote } = req.body;

    const validStatuses = ['New','Under Review','Acknowledged','Dismissed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      `UPDATE integrity_signals
       SET status = $1, review_note = COALESCE($2, review_note),
           reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND company_id = $5 RETURNING *`,
      [status, reviewNote, req.user.id, signalId, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Signal not found' });

    return res.json({ signal: result.rows[0] });
  } catch (err) {
    console.error('Review signal error:', err);
    return res.status(500).json({ error: 'Failed to update signal' });
  }
});

module.exports = router;
