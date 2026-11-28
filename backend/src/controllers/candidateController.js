const pool = require('../database/pool');
const { logAudit } = require('../services/auditService');
const { computeTargetSkillProof } = require('../services/skillProofService');

async function listCandidates(req, res) {
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
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
      return res.json({ candidates: [] });
    }
    console.error('List candidates error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  }
}

async function getCandidateDetail(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;

    const [appRes, resultsRes, evidenceRes, interviewsRes, signalsRes] = await Promise.all([
      pool.query(
        `SELECT a.*, c.first_name, c.last_name, c.email, c.phone, c.location, c.profile_data,
                cr.title AS vacancy_title, cr.id AS vacancy_id, d.name AS department_name
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN company_roles cr ON cr.id = a.role_id
         JOIN departments d ON d.id = cr.department_id
         WHERE a.id = $1 AND a.company_id = $2`,
        [appId, companyId]
      ),
      pool.query('SELECT * FROM assessment_results WHERE application_id = $1 ORDER BY created_at DESC', [appId]),
      pool.query(
        `SELECT ev.*, req.name AS requirement_name, req.category, req.req_type, req.priority, req.proficiency
         FROM evidence ev
         JOIN requirements req ON req.id = ev.requirement_id
         WHERE ev.application_id = $1 ORDER BY req.priority DESC`,
        [appId]
      ),
      pool.query(
        `SELECT i.*, u.first_name AS interviewer_first, u.last_name AS interviewer_last
         FROM interviews i
         LEFT JOIN users u ON u.id = i.interviewer_id
         WHERE i.application_id = $1 ORDER BY i.scheduled_at DESC`,
        [appId]
      ),
      pool.query('SELECT * FROM integrity_signals WHERE application_id = $1 ORDER BY signal_time DESC', [appId]),
    ]);

    if (!appRes.rows[0]) return res.status(404).json({ error: 'Application not found' });

    const app = appRes.rows[0];
    let skillProof = [];
    try {
      const targetRes = await pool.query(
        `SELECT id FROM targets WHERE candidate_id = $1 AND (vacancy_id = $2 OR role_id = $2) ORDER BY created_at DESC LIMIT 1`,
        [app.candidate_id, app.role_id]
      );
      if (targetRes.rows[0]) {
        const proof = await computeTargetSkillProof(pool, targetRes.rows[0].id);
        skillProof = proof?.skills || [];
      }
    } catch (_) {
      skillProof = [];
    }

    return res.json({
      application: app,
      assessmentResults: resultsRes.rows,
      evidence: evidenceRes.rows,
      interviews: interviewsRes.rows,
      integritySignals: signalsRes.rows,
      skillProof,
    });
  } catch (err) {
    console.error('Get candidate detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch candidate details' });
  }
}

async function updateCandidateStage(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { status, notes } = req.body;

    const result = await pool.query(
      `UPDATE applications SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [status, notes || null, appId, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });

    await logAudit(pool, {
      companyId,
      user: req.user,
      actorRole: 'RECRUITER',
      action: 'status_changed',
      entityType: 'application',
      entityId: appId,
      newStatus: status,
      details: { status, notes },
    });

    return res.json({ application: result.rows[0] });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
}

async function recordCandidateDecision(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { decision, notes } = req.body;

    const result = await pool.query(
      `UPDATE applications SET status = $1, recruiter_notes = COALESCE($2, recruiter_notes), updated_at = NOW()
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [decision, notes || null, appId, companyId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });

    await logAudit(pool, {
      companyId,
      user: req.user,
      actorRole: 'RECRUITER',
      action: 'decision_made',
      entityType: 'application',
      entityId: appId,
      newStatus: decision,
      details: { decision, notes },
    });

    return res.json({ application: result.rows[0], message: 'Decision recorded' });
  } catch (err) {
    console.error('Decision error:', err);
    return res.status(500).json({ error: 'Failed to record decision' });
  }
}

async function getCandidateEvidence(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;

    const result = await pool.query(
      `SELECT ev.*, req.name, req.category, req.req_type, req.priority, req.proficiency, req.eval_method
       FROM evidence ev
       JOIN requirements req ON req.id = ev.requirement_id
       JOIN applications a ON a.id = ev.application_id
       WHERE ev.application_id = $1 AND a.company_id = $2
       ORDER BY req.priority DESC, req.category`,
      [appId, companyId]
    );

    return res.json({ evidence: result.rows });
  } catch (err) {
    console.error('Get evidence error:', err);
    return res.status(500).json({ error: 'Failed to fetch evidence' });
  }
}

async function scheduleInterview(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const { appId } = req.params;
    const { interviewerId, scheduledAt, durationMins, location, videoLink, interviewType } = req.body;

    const appCheck = await pool.query(
      'SELECT id FROM applications WHERE id = $1 AND company_id = $2',
      [appId, companyId]
    );
    if (appCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const result = await pool.query(
      `INSERT INTO interviews (application_id, company_id, interviewer_id, scheduled_at, duration_mins, location, video_link, interview_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [appId, companyId, interviewerId || null, scheduledAt, durationMins || 60, location, videoLink, interviewType || 'Structured']
    );

    await pool.query(
      `UPDATE applications SET status = 'Interview', updated_at = NOW() WHERE id = $1 AND company_id = $2`,
      [appId, companyId]
    );

    await logAudit(pool, {
      companyId,
      user: req.user,
      actorRole: 'RECRUITER',
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'application',
      entityId: appId,
      newStatus: 'Interview',
      details: { scheduledAt, interviewType: interviewType || 'Structured' },
    }).catch(() => {});

    try {
      const appCandRes = await pool.query(
        `SELECT c.email, c.first_name, c.last_name, cr.title AS vacancy_title, comp.name AS company_name
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN company_roles cr ON cr.id = a.role_id
         JOIN companies comp ON comp.id = a.company_id
         WHERE a.id = $1`,
        [appId]
      );
      if (appCandRes.rowCount > 0) {
        const cand = appCandRes.rows[0];
        const { sendInterviewScheduledNotification } = require('../services/email');
        sendInterviewScheduledNotification({
          to: cand.email,
          name: `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate',
          vacancyTitle: cand.vacancy_title,
          companyName: cand.company_name,
          scheduledTime: scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Check portal',
          meetingLink: videoLink || location || null,
        }).catch((err) => console.warn('Interview scheduled email note:', err.message));
      }
    } catch (_) {}

    return res.status(201).json({ interview: result.rows[0] });
  } catch (err) {
    console.error('Schedule interview error:', err);
    return res.status(500).json({ error: 'Failed to schedule interview' });
  }
}

module.exports = {
  listCandidates,
  getCandidateDetail,
  updateCandidateStage,
  recordCandidateDecision,
  getCandidateEvidence,
  scheduleInterview,
};
