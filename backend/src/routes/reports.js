const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/reports/overview  — Company-wide dashboard metrics
// ============================================================
router.get('/overview', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;

    const [vacancyStats, pipelineStats, evidenceStats, integrityStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) AS total_vacancies,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
          COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft,
          COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
          COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed
        FROM company_roles WHERE company_id = $1`, [companyId]),
      pool.query(`
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(*) FILTER (WHERE status = 'Applied') AS applied,
          COUNT(*) FILTER (WHERE status = 'Assessed') AS assessed,
          COUNT(*) FILTER (WHERE status = 'Interview') AS interview,
          COUNT(*) FILTER (WHERE status = 'Selected') AS selected,
          COUNT(*) FILTER (WHERE status = 'Rejected') AS rejected,
          AVG(ar.overall_score) AS avg_score
        FROM applications a
        LEFT JOIN assessment_results ar ON ar.application_id = a.id AND ar.status = 'Completed'
        WHERE a.company_id = $1`, [companyId]),
      pool.query(`
        SELECT 
          COUNT(*) AS total_evidence,
          COUNT(*) FILTER (WHERE status = 'Supporting') AS supporting,
          COUNT(*) FILTER (WHERE status = 'Limited') AS limited,
          COUNT(*) FILTER (WHERE status = 'Gap') AS gap,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE status = 'Supporting') / NULLIF(COUNT(*), 0), 1
          ) AS coverage_pct
        FROM evidence e
        JOIN applications a ON a.id = e.application_id
        WHERE a.company_id = $1`, [companyId]),
      pool.query(`
        SELECT 
          COUNT(*) AS total_signals,
          COUNT(*) FILTER (WHERE status = 'New') AS new_signals,
          COUNT(*) FILTER (WHERE severity IN ('High','Critical')) AS high_severity
        FROM integrity_signals WHERE company_id = $1`, [companyId]),
    ]);

    return res.json({
      vacancies: vacancyStats.rows[0],
      pipeline: pipelineStats.rows[0],
      evidence: evidenceStats.rows[0],
      integrity: integrityStats.rows[0],
    });
  } catch (err) {
    console.error('Reports overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch report data' });
  }
});

// ============================================================
// GET /api/reports/vacancy/:vacancyId  — Vacancy-specific report
// ============================================================
router.get('/vacancy/:vacancyId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { vacancyId } = req.params;

    const [vacancyRes, pipelineRes, reqCoverageRes, scoreDistRes] = await Promise.all([
      pool.query(`
        SELECT cr.*, d.name AS department_name,
               COUNT(DISTINCT a.id) AS total_applications
        FROM company_roles cr
        JOIN departments d ON d.id = cr.department_id
        LEFT JOIN applications a ON a.role_id = cr.id
        WHERE cr.id = $1 AND cr.company_id = $2
        GROUP BY cr.id, d.name`, [vacancyId, companyId]),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM applications WHERE role_id = $1 AND company_id = $2
        GROUP BY status ORDER BY count DESC`, [vacancyId, companyId]),
      pool.query(`
        SELECT req.name, req.category, req.priority,
               COUNT(ev.id) AS total_evidence,
               COUNT(ev.id) FILTER (WHERE ev.status = 'Supporting') AS supporting,
               COUNT(ev.id) FILTER (WHERE ev.status = 'Gap') AS gaps,
               ROUND(AVG(ev.score), 1) AS avg_score
        FROM requirements req
        LEFT JOIN evidence ev ON ev.requirement_id = req.id
        WHERE req.role_id = $1
        GROUP BY req.id ORDER BY req.priority DESC, req.category`, [vacancyId]),
      pool.query(`
        SELECT 
          CASE 
            WHEN overall_score >= 90 THEN '90-100'
            WHEN overall_score >= 80 THEN '80-89'
            WHEN overall_score >= 70 THEN '70-79'
            WHEN overall_score >= 60 THEN '60-69'
            ELSE 'Below 60'
          END AS score_range,
          COUNT(*) AS count
        FROM assessment_results ar
        JOIN applications a ON a.id = ar.application_id
        WHERE a.role_id = $1 AND a.company_id = $2 AND ar.status = 'Completed'
        GROUP BY score_range ORDER BY score_range DESC`, [vacancyId, companyId]),
    ]);

    if (!vacancyRes.rows[0]) return res.status(404).json({ error: 'Vacancy not found' });

    return res.json({
      vacancy: vacancyRes.rows[0],
      pipeline: pipelineRes.rows,
      requirementCoverage: reqCoverageRes.rows,
      scoreDistribution: scoreDistRes.rows,
    });
  } catch (err) {
    console.error('Vacancy report error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ============================================================
// GET /api/reports/audit  — Audit trail
// ============================================================
router.get('/audit', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { limit = 100, offset = 0, entityType, action } = req.query;

    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email AS user_email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.company_id = $1
    `;
    const params = [companyId];

    if (entityType) { query += ` AND al.entity_type = $${params.length + 1}`; params.push(entityType); }
    if (action) { query += ` AND al.action = $${params.length + 1}`; params.push(action); }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const [result, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT COUNT(*) FROM audit_logs WHERE company_id = $1', [companyId]),
    ]);

    return res.json({ logs: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    console.error('Audit trail error:', err);
    return res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// ============================================================
// GET /api/reports/notifications  — User notifications
// ============================================================
router.get('/notifications', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR company_id = $2)
       ORDER BY created_at DESC LIMIT 50`,
      [userId, companyId]
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/reports/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
