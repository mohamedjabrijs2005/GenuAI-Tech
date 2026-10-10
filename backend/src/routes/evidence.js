const express = require('express');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// Helper: log audit
async function audit(client, { companyId, userId, user, entity, entityId, action, prev, next }) {
  await client.query(
    `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, actor_role, entity_type, entity_id, action, prev_state, new_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [companyId, userId, `${user.first_name} ${user.last_name}`, user.email, user.role,
     entity, entityId, action, prev ? JSON.stringify(prev) : null, next ? JSON.stringify(next) : null]
  );
}

// Helper: recompute evidence_coverage for an application
async function recomputeCoverage(client, appId, companyId, vacancyVersionId) {
  const ev = await client.query(
    `SELECT ev.status FROM evidence ev WHERE ev.application_id = $1`, [appId]
  );
  const rows = ev.rows;
  const total = rows.length;
  const cnt = (s) => rows.filter(r => r.status === s).length;
  const supporting = cnt('Supporting');
  const pending = cnt('Pending');
  const limited = cnt('Limited');
  const gap = cnt('Gap');
  const na = cnt('Not Applicable');
  const pct = total > 0 ? Math.round((supporting / total) * 100 * 100) / 100 : 0;

  await client.query(
    `INSERT INTO evidence_coverage
       (application_id, vacancy_version_id, company_id, total_requirements,
        supporting_count, pending_count, limited_count, gap_count, na_count, coverage_pct, computed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
     ON CONFLICT (application_id) DO UPDATE SET
       vacancy_version_id = EXCLUDED.vacancy_version_id,
       total_requirements = EXCLUDED.total_requirements,
       supporting_count   = EXCLUDED.supporting_count,
       pending_count      = EXCLUDED.pending_count,
       limited_count      = EXCLUDED.limited_count,
       gap_count          = EXCLUDED.gap_count,
       na_count           = EXCLUDED.na_count,
       coverage_pct       = EXCLUDED.coverage_pct,
       computed_at        = NOW()`,
    [appId, vacancyVersionId || null, companyId, total, supporting, pending, limited, gap, na, pct]
  );
}

// ─── VACANCY VERSIONS ─────────────────────────────────────────

// GET /api/evidence/versions/:roleId  — list versions for a vacancy
router.get('/versions/:roleId', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;
    const r = await pool.query(
      `SELECT vv.*, u.first_name, u.last_name,
              COUNT(DISTINCT a.id) AS application_count
       FROM vacancy_versions vv
       LEFT JOIN users u ON u.id = vv.created_by
       LEFT JOIN applications a ON a.vacancy_version_id = vv.id
       WHERE vv.role_id = $1 AND vv.company_id = $2
       GROUP BY vv.id, u.first_name, u.last_name
       ORDER BY vv.version_number DESC`,
      [req.params.roleId, cid]
    );
    return res.json({ versions: r.rows });
  } catch (e) {
    if (e.code === 'ECONNREFUSED') return res.json({ versions: [] });
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/evidence/versions  — create new vacancy version
router.post('/versions', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { roleId, changeSummary } = req.body;
    if (!roleId) return res.status(422).json({ error: 'roleId required' });

    await client.query('BEGIN');
    const maxV = await client.query(
      'SELECT COALESCE(MAX(version_number),0) AS max FROM vacancy_versions WHERE role_id=$1 AND company_id=$2',
      [roleId, cid]
    );
    const nextV = maxV.rows[0].max + 1;

    const r = await client.query(
      `INSERT INTO vacancy_versions (role_id, company_id, version_number, status, change_summary, created_by)
       VALUES ($1,$2,$3,'Draft',$4,$5) RETURNING *`,
      [roleId, cid, nextV, changeSummary || null, req.user.id]
    );
    const version = r.rows[0];
    await audit(client, { companyId: cid, userId: req.user.id, user: req.user,
      entity: 'vacancy_version', entityId: version.id, action: 'created',
      next: { version_number: nextV, role_id: roleId } });
    await client.query('COMMIT');
    return res.status(201).json({ version });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// PATCH /api/evidence/versions/:versionId/status
router.patch('/versions/:versionId/status', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { status } = req.body;
    const valid = ['Draft','Under Review','Verified','Active','Paused','Closed','Superseded'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await client.query('BEGIN');
    const prev = await client.query('SELECT * FROM vacancy_versions WHERE id=$1 AND company_id=$2', [req.params.versionId, cid]);
    if (!prev.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Version not found' }); }

    const publishedAt = status === 'Active' ? 'NOW()' : 'published_at';
    const r = await client.query(
      `UPDATE vacancy_versions SET status=$1, published_at=${publishedAt}, updated_at=NOW()
       WHERE id=$2 AND company_id=$3 RETURNING *`,
      [status, req.params.versionId, cid]
    );
    await audit(client, { companyId: cid, userId: req.user.id, user: req.user,
      entity: 'vacancy_version', entityId: req.params.versionId, action: 'status_changed',
      prev: { status: prev.rows[0].status }, next: { status } });
    await client.query('COMMIT');
    return res.json({ version: r.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// ─── EVIDENCE COVERAGE ────────────────────────────────────────

// GET /api/evidence/coverage/:appId  — full coverage matrix
router.get('/coverage/:appId', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;
    const { appId } = req.params;

    // Verify tenant isolation
    const appCheck = await pool.query('SELECT id, role_id, vacancy_version_id FROM applications WHERE id=$1 AND company_id=$2', [appId, cid]);
    if (!appCheck.rows[0]) return res.status(404).json({ error: 'Application not found' });
    const { role_id, vacancy_version_id } = appCheck.rows[0];

    // Get all requirements for this vacancy
    const reqRes = await pool.query(
      `SELECT r.* FROM requirements r
       WHERE r.role_id = $1 AND r.company_id = $2 AND r.req_status != 'Archived'
       ORDER BY r.priority DESC, r.category`,
      [role_id, cid]
    );

    // Get evidence for this application
    const evRes = await pool.query(
      `SELECT ev.*, eg.name AS eval_group_name
       FROM evidence ev
       LEFT JOIN evaluation_groups eg ON eg.id = ev.evaluation_group_id
       WHERE ev.application_id = $1`,
      [appId]
    );

    // Get coverage snapshot
    const covRes = await pool.query('SELECT * FROM evidence_coverage WHERE application_id=$1', [appId]);

    // Build matrix: every requirement → its evidence record (or Gap if missing)
    const evidenceMap = {};
    for (const e of evRes.rows) evidenceMap[e.requirement_id] = e;

    const matrix = reqRes.rows.map(req => ({
      requirement: req,
      evidence: evidenceMap[req.id] || null,
      coverage_status: evidenceMap[req.id]?.status || 'Evidence Gap',
    }));

    return res.json({
      matrix,
      coverage: covRes.rows[0] || null,
      total: reqRes.rowCount,
      vacancy_version_id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/evidence/coverage/:appId/recompute  — trigger recompute
router.post('/coverage/:appId/recompute', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const appCheck = await pool.query('SELECT id, vacancy_version_id FROM applications WHERE id=$1 AND company_id=$2', [req.params.appId, cid]);
    if (!appCheck.rows[0]) return res.status(404).json({ error: 'Application not found' });
    await recomputeCoverage(client, req.params.appId, cid, appCheck.rows[0].vacancy_version_id);
    const cov = await client.query('SELECT * FROM evidence_coverage WHERE application_id=$1', [req.params.appId]);
    return res.json({ coverage: cov.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// PATCH /api/evidence/:evidenceId  — update a single evidence record
router.patch('/:evidenceId', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { status, source_type, notes } = req.body;
    const validStatus = ['Pending','Supporting','Limited','Gap','Not Applicable'];
    if (status && !validStatus.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await client.query('BEGIN');
    const prev = await client.query('SELECT ev.*, a.company_id FROM evidence ev JOIN applications a ON a.id=ev.application_id WHERE ev.id=$1', [req.params.evidenceId]);
    if (!prev.rows[0] || prev.rows[0].company_id !== cid) {
      await client.query('ROLLBACK'); return res.status(404).json({ error: 'Evidence not found' });
    }

    const r = await client.query(
      `UPDATE evidence SET
         status = COALESCE($1, status),
         source_type = COALESCE($2, source_type),
         notes = COALESCE($3, notes),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, source_type, notes, req.params.evidenceId]
    );
    const ev = r.rows[0];
    // Recompute coverage
    await recomputeCoverage(client, ev.application_id, cid, prev.rows[0].vacancy_version_id);
    await client.query('COMMIT');
    return res.json({ evidence: ev });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// ─── RECRUITER REVIEWS ────────────────────────────────────────

// GET /api/evidence/review/:appId
router.get('/review/:appId', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;
    const r = await pool.query(
      `SELECT rr.*, u.first_name, u.last_name, u.email
       FROM recruiter_reviews rr
       JOIN users u ON u.id = rr.reviewer_id
       WHERE rr.application_id = $1 AND rr.company_id = $2
       ORDER BY rr.updated_at DESC`,
      [req.params.appId, cid]
    );
    return res.json({ reviews: r.rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/evidence/review/:appId  — upsert recruiter review
router.post('/review/:appId', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { summary, evidence_note, gap_note, integrity_note, interview_note, overall_note } = req.body;
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO recruiter_reviews
         (application_id, company_id, reviewer_id, summary, evidence_note, gap_note, integrity_note, interview_note, overall_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (application_id, reviewer_id) DO UPDATE SET
         summary = EXCLUDED.summary, evidence_note = EXCLUDED.evidence_note,
         gap_note = EXCLUDED.gap_note, integrity_note = EXCLUDED.integrity_note,
         interview_note = EXCLUDED.interview_note, overall_note = EXCLUDED.overall_note,
         updated_at = NOW()
       RETURNING *`,
      [req.params.appId, cid, req.user.id, summary, evidence_note, gap_note, integrity_note, interview_note, overall_note]
    );
    await audit(client, { companyId: cid, userId: req.user.id, user: req.user,
      entity: 'recruiter_review', entityId: req.params.appId, action: 'review_saved' });
    await client.query('COMMIT');
    return res.status(201).json({ review: r.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// ─── HUMAN DECISIONS ─────────────────────────────────────────

// POST /api/evidence/decision/:appId
router.post('/decision/:appId', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { decision, rationale, evidence_summary } = req.body;
    const valid = ['Selected','Rejected','On Hold','Deferred'];
    if (!valid.includes(decision)) return res.status(400).json({ error: 'Invalid decision' });

    await client.query('BEGIN');
    // Verify app belongs to company
    const app = await client.query('SELECT id, status FROM applications WHERE id=$1 AND company_id=$2', [req.params.appId, cid]);
    if (!app.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Application not found' }); }

    const r = await client.query(
      `INSERT INTO human_decisions (application_id, company_id, decided_by, decision, rationale, evidence_summary)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.appId, cid, req.user.id, decision, rationale, evidence_summary]
    );
    // Update application status
    await client.query('UPDATE applications SET status=$1, updated_at=NOW() WHERE id=$2', [decision, req.params.appId]);
    await audit(client, { companyId: cid, userId: req.user.id, user: req.user,
      entity: 'human_decision', entityId: req.params.appId, action: 'decision_recorded',
      prev: { status: app.rows[0].status }, next: { decision } });
    await client.query('COMMIT');
    return res.status(201).json({ decision: r.rows[0], message: 'Human decision recorded' });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Decision already recorded for this application' });
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// GET /api/evidence/decision/:appId
router.get('/decision/:appId', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;
    const r = await pool.query(
      `SELECT hd.*, u.first_name, u.last_name, u.email
       FROM human_decisions hd JOIN users u ON u.id = hd.decided_by
       WHERE hd.application_id=$1 AND hd.company_id=$2`,
      [req.params.appId, cid]
    );
    return res.json({ decision: r.rows[0] || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── AUTO-GENERATE EVIDENCE FROM ASSESSMENT RESULT ───────────

// POST /api/evidence/generate/:appId  — generate evidence records from completed assessment
router.post('/generate/:appId', async (req, res) => {
  const client = await pool.connect();
  try {
    const cid = req.companyMembership.company_id;
    const { appId } = req.params;

    await client.query('BEGIN');
    const app = await client.query(
      'SELECT a.*, cr.id AS role_id FROM applications a JOIN company_roles cr ON cr.id=a.role_id WHERE a.id=$1 AND a.company_id=$2',
      [appId, cid]
    );
    if (!app.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Application not found' }); }

    // Get completed assessment result
    const result = await client.query(
      'SELECT * FROM assessment_results WHERE application_id=$1 AND status=$2 ORDER BY completed_at DESC LIMIT 1',
      [appId, 'Completed']
    );

    // Get all requirements for this role
    const reqs = await client.query(
      `SELECT r.id, r.name, r.priority, ag.id AS ag_id, eg.id AS eg_id, eg.mapped_requirement_id
       FROM requirements r
       JOIN assessment_groups ag ON ag.role_id = r.role_id
       JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id AND eg.mapped_requirement_id = r.id
       WHERE r.role_id = $1 AND r.company_id = $2 AND r.req_status = 'Confirmed'`,
      [app.rows[0].role_id, cid]
    );

    // Also get unmapped requirements (they get 'Pending' evidence)
    const allReqs = await client.query(
      `SELECT id FROM requirements WHERE role_id=$1 AND company_id=$2 AND req_status='Confirmed'`,
      [app.rows[0].role_id, cid]
    );

    const assessmentResultId = result.rows[0]?.id || null;
    const assessmentVersionId = result.rows[0]?.assessment_version_id || null;
    const score = result.rows[0]?.overall_score || null;

    // Map of requirement_id -> has evaluation_group
    const mappedReqIds = new Set(reqs.rows.map(r => r.id));

    let generated = 0;
    for (const req of allReqs.rows) {
      const isMapped = mappedReqIds.has(req.id);
      const evStatus = !result.rows[0] ? 'Pending'
        : isMapped ? (score >= 70 ? 'Supporting' : score >= 50 ? 'Limited' : 'Gap')
        : 'Pending';

      await client.query(
        `INSERT INTO evidence (application_id, requirement_id, company_id,
           assessment_result_id, assessment_version_id, vacancy_version_id,
           score, max_score, status, source_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Official Assessment')
         ON CONFLICT (application_id, requirement_id) DO UPDATE SET
           assessment_result_id = EXCLUDED.assessment_result_id,
           score = EXCLUDED.score,
           status = CASE WHEN evidence.status = 'Pending' THEN EXCLUDED.status ELSE evidence.status END,
           updated_at = NOW()`,
        [appId, req.id, cid, assessmentResultId, assessmentVersionId,
         app.rows[0].vacancy_version_id, score, 100, evStatus]
      );
      generated++;
    }

    // Recompute coverage
    await recomputeCoverage(client, appId, cid, app.rows[0].vacancy_version_id);

    await audit(client, { companyId: cid, userId: req.user?.id, user: req.user || { first_name: 'System', last_name: '', email: 'system', role: 'system' },
      entity: 'evidence', entityId: appId, action: 'evidence_generated',
      next: { generated, assessment_result_id: assessmentResultId } });

    await client.query('COMMIT');
    return res.json({ message: `Generated ${generated} evidence records`, generated });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    return res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// ============================================================
// RECRUITER TARGET EVIDENCE REVIEW ENDPOINTS (Phase 2)
// ============================================================

const { recomputeTargetCoverage } = require('./evidenceService');

// GET /api/evidence/targets  — Recruiter lists targets for own company
router.get('/targets', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;

    const result = await pool.query(
      `SELECT t.id AS target_id, t.status AS target_status, t.targeted_at, t.last_activity_at,
              c.id AS candidate_id, c.first_name, c.last_name, c.email, c.location,
              cr.id AS vacancy_id, cr.title AS vacancy_title,
              d.name AS department_name,
              vv.version_number,
              tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct,
              COUNT(DISTINCT e.id) FILTER (WHERE e.review_status = 'SUBMITTED') AS pending_review_count
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       JOIN company_roles cr ON cr.id = t.vacancy_id
       LEFT JOIN departments d ON d.id = cr.department_id
       LEFT JOIN vacancy_versions vv ON vv.id = t.vacancy_version_id
       LEFT JOIN target_coverage tc ON tc.target_id = t.id
       LEFT JOIN evidence e ON e.target_id = t.id
       WHERE t.company_id = $1
       GROUP BY t.id, c.id, cr.id, d.name, vv.version_number, tc.total_requirements, tc.supported_count, tc.limited_count, tc.pending_count, tc.gap_count, tc.coverage_pct
       ORDER BY t.targeted_at DESC`,
      [cid]
    );

    return res.json({ targets: result.rows });
  } catch (err) {
    console.error('List recruiter targets error:', err);
    return res.status(500).json({ error: 'Failed to fetch company targets' });
  }
});

// GET /api/evidence/targets/:targetId — Recruiter views target evidence list & coverage
router.get('/targets/:targetId', async (req, res) => {
  try {
    const cid = req.companyMembership.company_id;
    const { targetId } = req.params;

    const targetRes = await pool.query(
      `SELECT t.id AS target_id, t.status AS target_status, t.targeted_at,
              c.id AS candidate_id, c.first_name, c.last_name, c.email, c.location,
              cr.id AS vacancy_id, cr.title AS vacancy_title,
              vv.id AS vacancy_version_id, vv.version_number
       FROM targets t
       JOIN candidates c ON c.id = t.candidate_id
       JOIN company_roles cr ON cr.id = t.vacancy_id
       LEFT JOIN vacancy_versions vv ON vv.id = t.vacancy_version_id
       WHERE t.id = $1 AND t.company_id = $2`,
      [targetId, cid]
    );

    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target not found or access denied.' });
    }

    const target = targetRes.rows[0];

    const [evidenceRes, coverage] = await Promise.all([
      pool.query(
        `SELECT e.id, e.requirement_id, e.evidence_type, e.title, e.description,
                e.external_url, e.file_url, e.file_hash, e.review_status,
                e.reviewer_note, e.submitted_at, e.reviewed_at,
                r.name AS requirement_name, r.importance, r.requirement_type
         FROM evidence e
         JOIN requirements r ON r.id = e.requirement_id
         WHERE e.target_id = $1
         ORDER BY e.created_at DESC`,
        [targetId]
      ),
      recomputeTargetCoverage(pool, targetId),
    ]);

    return res.json({
      target,
      evidence: evidenceRes.rows,
      coverage,
    });
  } catch (err) {
    console.error('Get target detail for recruiter error:', err);
    return res.status(500).json({ error: 'Failed to fetch target details' });
  }
});

// POST /api/evidence/items/:evidenceId/review — Recruiter reviews submitted evidence
router.post('/items/:evidenceId/review', async (req, res) => {
  const cid = req.companyMembership.company_id;
  const { evidenceId } = req.params;
  const { decision, reviewerNote } = req.body;

  const validDecisions = ['ACCEPTED', 'LIMITED', 'REJECTED', 'MORE_INFORMATION_REQUESTED'];
  if (!decision || !validDecisions.includes(decision.toUpperCase())) {
    return res.status(400).json({
      error: `Decision must be one of [${validDecisions.join(', ')}]`,
    });
  }

  const normalizedDecision = decision.toUpperCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify evidence belongs to recruiter's company
    const evRes = await client.query(
      `SELECT e.id, e.target_id, e.company_id, e.title, e.requirement_id
       FROM evidence e
       WHERE e.id = $1 AND e.company_id = $2`,
      [evidenceId, cid]
    );

    if (evRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evidence record not found or access denied.' });
    }
    const ev = evRes.rows[0];

    // 2. Update review status
    await client.query(
      `UPDATE evidence
       SET review_status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           reviewer_note = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [normalizedDecision, req.user.id, reviewerNote || null, evidenceId]
    );

    // 3. Insert Audit Log
    const auditAction = `EVIDENCE_${normalizedDecision}`;
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
       VALUES ($1, $2, $3, $4, 'Evidence', $5, $6, $7, $8)`,
      [
        cid,
        req.user.id,
        req.companyMembership.member_role || 'RECRUITER',
        auditAction,
        evidenceId,
        normalizedDecision,
        reviewerNote || `Recruiter reviewed evidence item: ${normalizedDecision}`,
        JSON.stringify({ targetId: ev.target_id, requirementId: ev.requirement_id, decision: normalizedDecision }),
      ]
    );

    await client.query('COMMIT');

    // 4. Recompute coverage snapshot
    let coverage = null;
    if (ev.target_id) {
      coverage = await recomputeTargetCoverage(pool, ev.target_id);
    }

    return res.json({
      message: `Evidence decision recorded: ${normalizedDecision}`,
      decision: normalizedDecision,
      coverage,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Evidence review error:', err);
    return res.status(500).json({ error: 'Failed to record evidence review' });
  } finally {
    client.release();
  }
});

module.exports = { router, recomputeCoverage, recomputeTargetCoverage };

