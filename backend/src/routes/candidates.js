const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// GET /api/candidates  — All candidates for company with pipeline data
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { stage, vacancy } = req.query;

    let query = `
      SELECT a.id AS application_id, a.status, a.verification_status, a.applied_at,
             c.id AS candidate_id, c.first_name, c.last_name, c.email, c.phone, c.location,
             cr.title AS vacancy_title, cr.id AS vacancy_id,
             d.name AS department_name,
             ar.overall_score,
             COUNT(DISTINCT ev.id) FILTER (WHERE ev.status = 'Supporting') AS supporting_evidence,
             COUNT(DISTINCT req.id) AS total_requirements,
             COUNT(DISTINCT is2.id) FILTER (WHERE is2.status = 'New') AS integrity_flags
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      JOIN company_roles cr ON cr.id = a.role_id
      JOIN departments d ON d.id = cr.department_id
      LEFT JOIN assessment_results ar ON ar.application_id = a.id AND ar.status = 'Completed'
      LEFT JOIN evidence ev ON ev.application_id = a.id
      LEFT JOIN requirements req ON req.role_id = a.role_id
      LEFT JOIN integrity_signals is2 ON is2.application_id = a.id
      WHERE a.company_id = $1
    `;
    const params = [companyId];

    if (stage) {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(stage);
    }
    if (vacancy) {
      query += ` AND a.role_id = $${params.length + 1}`;
      params.push(vacancy);
    }

    query += ' GROUP BY a.id, c.id, cr.id, d.id, ar.overall_score ORDER BY a.applied_at DESC';
    const result = await pool.query(query, params);
    return res.json({ candidates: result.rows });
  } catch (err) {
    console.error('List candidates error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET /api/candidates/:appId  — Full candidate application detail
router.get('/:appId', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;

    const [appRes, resultsRes, evidenceRes, interviewsRes, signalsRes] = await Promise.all([
      pool.query(`
        SELECT a.*, c.first_name, c.last_name, c.email, c.phone, c.location, c.profile_data,
               cr.title AS vacancy_title, cr.id AS vacancy_id, d.name AS department_name
        FROM applications a
        JOIN candidates c ON c.id = a.candidate_id
        JOIN company_roles cr ON cr.id = a.role_id
        JOIN departments d ON d.id = cr.department_id
        WHERE a.id = $1 AND a.company_id = $2`, [appId, companyId]),
      pool.query('SELECT * FROM assessment_results WHERE application_id = $1 ORDER BY created_at DESC', [appId]),
      pool.query(`
        SELECT ev.*, req.name AS requirement_name, req.category, req.req_type, req.priority, req.proficiency
        FROM evidence ev
        JOIN requirements req ON req.id = ev.requirement_id
        WHERE ev.application_id = $1 ORDER BY req.priority DESC`, [appId]),
      pool.query(`
        SELECT i.*, u.first_name AS interviewer_first, u.last_name AS interviewer_last
        FROM interviews i
        LEFT JOIN users u ON u.id = i.interviewer_id
        WHERE i.application_id = $1 ORDER BY i.scheduled_at DESC`, [appId]),
      pool.query('SELECT * FROM integrity_signals WHERE application_id = $1 ORDER BY signal_time DESC', [appId]),
    ]);

    if (!appRes.rows[0]) return res.status(404).json({ error: 'Application not found' });

    return res.json({
      application: appRes.rows[0],
      assessmentResults: resultsRes.rows,
      evidence: evidenceRes.rows,
      interviews: interviewsRes.rows,
      integritySignals: signalsRes.rows,
    });
  } catch (err) {
    console.error('Get candidate detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate details' });
  }
});

// PATCH /api/candidates/:appId/status  — Update application stage
router.patch('/:appId/status', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Applied','Eligible','Verified','Invited','Assessed','Review','Interview','Decision','Selected','Rejected','Withdrawn'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      `UPDATE applications SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [status, notes, appId, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });

    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, entity_type, entity_id, action, details)
       VALUES ($1,$2,$3,$4,'application',$5,'status_changed',$6)`,
      [companyId, req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.email,
       appId, JSON.stringify({ status, notes })]
    );

    return res.json({ application: result.rows[0] });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/candidates/:appId/decision  — Final hire/reject decision
router.post('/:appId/decision', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { decision, notes } = req.body; // 'Selected' | 'Rejected' | 'On Hold'

    const result = await pool.query(
      `UPDATE applications SET status = $1, recruiter_notes = COALESCE($2, recruiter_notes), updated_at = NOW()
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [decision, notes, appId, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });

    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, entity_type, entity_id, action, details)
       VALUES ($1,$2,$3,$4,'application',$5,'decision_made',$6)`,
      [companyId, req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.email,
       appId, JSON.stringify({ decision, notes })]
    );

    return res.json({ application: result.rows[0], message: 'Decision recorded' });
  } catch (err) {
    console.error('Decision error:', err);
    return res.status(500).json({ error: 'Failed to record decision' });
  }
});

// GET /api/candidates/:appId/evidence  — Evidence coverage matrix
router.get('/:appId/evidence', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;

    const result = await pool.query(`
      SELECT ev.*, req.name, req.category, req.req_type, req.priority, req.proficiency, req.eval_method
      FROM evidence ev
      JOIN requirements req ON req.id = ev.requirement_id
      JOIN applications a ON a.id = ev.application_id
      WHERE ev.application_id = $1 AND a.company_id = $2
      ORDER BY req.priority DESC, req.category`, [appId, companyId]);

    return res.json({ evidence: result.rows });
  } catch (err) {
    console.error('Get evidence error:', err);
    return res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// POST /api/candidates/:appId/interviews  — Schedule interview
router.post('/:appId/interviews', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { interviewerId, scheduledAt, durationMins, location, videoLink, interviewType } = req.body;

    const result = await pool.query(
      `INSERT INTO interviews (application_id, company_id, interviewer_id, scheduled_at, duration_mins, location, video_link, interview_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [appId, companyId, interviewerId || null, scheduledAt, durationMins || 60, location, videoLink, interviewType || 'Structured']
    );

    // Update application status
    await pool.query(
      `UPDATE applications SET status = 'Interview', updated_at = NOW() WHERE id = $1 AND company_id = $2`,
      [appId, companyId]
    );

    return res.status(201).json({ interview: result.rows[0] });
  } catch (err) {
    console.error('Schedule interview error:', err);
    return res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

module.exports = router;
