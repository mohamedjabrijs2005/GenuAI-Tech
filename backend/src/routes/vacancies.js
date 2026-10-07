const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/vacancies — List all vacancies for authenticated company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { status } = req.query;

    let query = `
      SELECT cr.id, cr.title, cr.location, cr.work_mode, cr.salary_range,
             cr.vacancy_count, cr.status, cr.version, cr.closing_date,
             cr.experience_level, cr.employment_type, cr.created_at, cr.submitted_at,
             cr.approved_at, cr.published_at, cr.review_note,
             d.id AS department_id, d.name AS department_name,
             COUNT(DISTINCT r.id) AS requirement_count,
             COUNT(DISTINCT a.id) AS applicant_count
      FROM company_roles cr
      LEFT JOIN departments d ON d.id = cr.department_id
      LEFT JOIN requirements r ON r.role_id = cr.id
      LEFT JOIN applications a ON a.role_id = cr.id
      WHERE cr.company_id = $1
    `;
    const params = [companyId];

    if (status && status !== 'ALL') {
      let normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
      if (normalizedStatus === 'PENDING') normalizedStatus = 'PENDING_ADMIN_REVIEW';
      if (normalizedStatus === 'VERIFIED') normalizedStatus = 'APPROVED';
      if (normalizedStatus === 'ACTIVE') normalizedStatus = 'PUBLISHED';
      params.push(normalizedStatus);
      query += ` AND cr.status = $${params.length}`;
    }

    query += ' GROUP BY cr.id, d.id ORDER BY cr.created_at DESC';
    const result = await pool.query(query, params);
    return res.json({ vacancies: result.rows });
  } catch (err) {
    console.error('List vacancies error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

// ============================================================
// GET /api/vacancies/:id — Get single vacancy with tenant check
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    const roleRes = await pool.query(
      `SELECT cr.*, d.name AS department_name FROM company_roles cr
       LEFT JOIN departments d ON d.id = cr.department_id
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [id, companyId]
    );

    if (roleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }

    const [reqRes, agRes, appRes, auditRes] = await Promise.all([
      pool.query('SELECT * FROM requirements WHERE role_id = $1 AND company_id = $2 ORDER BY created_at ASC', [id, companyId]),
      pool.query(`
        SELECT ag.*, json_agg(eg.*) AS evaluation_groups
        FROM assessment_groups ag
        LEFT JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id
        WHERE ag.role_id = $1 AND ag.company_id = $2
        GROUP BY ag.id ORDER BY ag.created_at`, [id, companyId]),
      pool.query(`
        SELECT a.*, c.first_name, c.last_name, c.email
        FROM applications a JOIN candidates c ON c.id = a.candidate_id
        WHERE a.role_id = $1 AND a.company_id = $2 ORDER BY a.applied_at DESC`, [id, companyId]),
      pool.query(`
        SELECT al.*, u.email AS actor_email, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        WHERE al.entity_id = $1 AND al.company_id = $2
        ORDER BY al.created_at DESC`, [id, companyId]),
    ]);

    return res.json({
      vacancy: roleRes.rows[0],
      requirements: reqRes.rows,
      assessmentGroups: agRes.rows,
      applications: appRes.rows,
      auditHistory: auditRes.rows,
    });
  } catch (err) {
    console.error('Get vacancy error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancy' });
  }
});

// ============================================================
// POST /api/vacancies — Create vacancy as DRAFT
// ============================================================
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Vacancy title is required'),
    body('departmentId').notEmpty().isUUID().withMessage('Valid department ID is required'),
    body('experienceLevel').isIn(['entry', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level'),
    body('employmentType').isIn(['full_time', 'part_time', 'contract', 'internship', 'freelance']).withMessage('Invalid employment type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const companyId = req.companyMembership.company_id;
      const {
        title,
        departmentId,
        jobDescription,
        experienceLevel,
        employmentType,
        location,
        workMode,
        salaryRange,
        vacancyCount,
        closingDate,
      } = req.body;

      // Verify department belongs to this company (tenant check)
      const deptCheck = await pool.query(
        'SELECT id, name FROM departments WHERE id = $1 AND company_id = $2 AND is_active = TRUE',
        [departmentId, companyId]
      );
      if (deptCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Department not found in your company' });
      }

      const result = await pool.query(
        `INSERT INTO company_roles
         (company_id, department_id, title, job_description, experience_level,
          employment_type, location, work_mode, salary_range, vacancy_count, closing_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, 'DRAFT') RETURNING *`,
        [
          companyId,
          departmentId,
          title,
          jobDescription || null,
          experienceLevel,
          employmentType,
          location,
          workMode || 'Hybrid',
          salaryRange || null,
          vacancyCount || 1,
          closingDate || null,
        ]
      );

      const vacancy = result.rows[0];

      // Audit log
      await pool.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, metadata, ip_address)
         VALUES ($1, $2, $3, 'VACANCY_CREATED', 'Vacancy', $4, 'DRAFT', $5, $6)`,
        [
          companyId,
          req.user.id,
          req.user.role || 'COMPANY_OWNER',
          vacancy.id,
          JSON.stringify({ title, department: deptCheck.rows[0]?.name }),
          req.ip || null,
        ]
      );

      return res.status(201).json({ vacancy });
    } catch (err) {
      console.error('Create vacancy error:', err);
      return res.status(500).json({ error: 'Failed to create vacancy' });
    }
  }
);

// ============================================================
// PUT / PATCH /api/vacancies/:id — Update vacancy details (only if DRAFT or CHANGES_REQUESTED)
// ============================================================
const handleUpdateVacancy = async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;
    const { title, jobDescription, workMode, salaryRange, vacancyCount, closingDate } = req.body;

    const checkRes = await pool.query(
      'SELECT status FROM company_roles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const currentStatus = checkRes.rows[0].status;
    if (['PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(currentStatus)) {
      return res.status(400).json({
        error: `Cannot directly edit vacancy in ${currentStatus} status. Re-open or versioning required.`,
      });
    }

    const result = await pool.query(
      `UPDATE company_roles SET
         title = COALESCE($1, title),
         job_description = COALESCE($2, job_description),
         work_mode = COALESCE($3, work_mode),
         salary_range = COALESCE($4, salary_range),
         vacancy_count = COALESCE($5, vacancy_count),
         closing_date = COALESCE($6, closing_date),
         updated_at = NOW()
       WHERE id = $7 AND company_id = $8 RETURNING *`,
      [title, jobDescription, workMode, salaryRange, vacancyCount, closingDate, id, companyId]
    );

    await pool.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, 'VACANCY_UPDATED', 'Vacancy', $4, $5, $6)`,
      [companyId, req.user.id, req.user.role, id, JSON.stringify(req.body), req.ip || null]
    );

    return res.json({ vacancy: result.rows[0] });
  } catch (err) {
    console.error('Update vacancy error:', err);
    return res.status(500).json({ error: 'Failed to update vacancy' });
  }
};

router.put('/:id', handleUpdateVacancy);
router.patch('/:id', handleUpdateVacancy);

// ============================================================
// POST /api/vacancies/:id/submit — Submit for admin review
// ============================================================
router.post('/:id/submit', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Lock and verify vacancy ownership and status
    const vacRes = await client.query(
      `SELECT cr.*, c.verification_status AS company_status
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1 AND cr.company_id = $2
       FOR UPDATE OF cr`,
      [id, companyId]
    );

    if (vacRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

    // Status check
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(vacancy.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot submit vacancy in '${vacancy.status}' status. Only DRAFT or CHANGES_REQUESTED vacancies can be submitted.`,
      });
    }

    // 2. Requirement Rule: Every vacancy must have at least 1 requirement before submission
    const reqCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM requirements WHERE role_id = $1 AND company_id = $2',
      [id, companyId]
    );
    const reqCount = reqCountRes.rows[0]?.count || 0;

    if (reqCount < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Vacancy cannot be submitted without requirements. Please add at least 1 requirement (Java, SQL, REST APIs, etc.) before submitting.',
        requirementsCount: 0,
      });
    }

    // 3. Update status to PENDING_ADMIN_REVIEW
    const updateRes = await client.query(
      `UPDATE company_roles SET
         status = 'PENDING_ADMIN_REVIEW',
         submitted_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );

    // 4. Record audit log
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, ip_address)
       VALUES ($1, $2, $3, 'VACANCY_SUBMITTED', 'Vacancy', $4, $5, 'PENDING_ADMIN_REVIEW', 'Submitted for platform admin governance review', $6, $7)`,
      [
        companyId,
        req.user.id,
        req.user.role || 'COMPANY_OWNER',
        id,
        vacancy.status,
        JSON.stringify({ requirementsCount: reqCount, title: vacancy.title }),
        req.ip || null,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      vacancy: updateRes.rows[0],
      message: 'Vacancy successfully submitted for admin review',
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Submit vacancy error:', err);
    return res.status(500).json({ error: 'Failed to submit vacancy' });
  } finally {
    try { client.release(); } catch (_) {}
  }
});

// ============================================================
// POST /api/vacancies/:id/publish — Publish an APPROVED vacancy
// ============================================================
router.post('/:id/publish', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    await client.query('BEGIN');

    const vacRes = await client.query(
      `SELECT cr.*, c.verification_status AS company_status
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1 AND cr.company_id = $2
       FOR UPDATE OF cr`,
      [id, companyId]
    );

    if (vacRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

    // Company approval check
    if (vacancy.company_status !== 'APPROVED') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: `Cannot publish vacancy: Company verification status is '${vacancy.company_status}'. Only APPROVED companies can publish vacancies.`,
      });
    }

    // Vacancy approval check
    if (!['APPROVED', 'PAUSED'].includes(vacancy.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot directly publish vacancy in '${vacancy.status}' status. Vacancy must be APPROVED by admin before publication.`,
      });
    }

    const updateRes = await client.query(
      `UPDATE company_roles SET
         status = 'PUBLISHED',
         published_at = COALESCE(published_at, NOW()),
         updated_at = NOW()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );

    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, metadata, ip_address)
       VALUES ($1, $2, $3, 'VACANCY_PUBLISHED', 'Vacancy', $4, $5, 'PUBLISHED', $6, $7)`,
      [
        companyId,
        req.user.id,
        req.user.role || 'COMPANY_OWNER',
        id,
        vacancy.status,
        JSON.stringify({ title: vacancy.title }),
        req.ip || null,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      vacancy: updateRes.rows[0],
      message: 'Vacancy successfully published',
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Publish vacancy error:', err);
    return res.status(500).json({ error: 'Failed to publish vacancy' });
  } finally {
    try { client.release(); } catch (_) {}
  }
});

// ============================================================
// POST /api/vacancies/:id/pause — Pause a PUBLISHED vacancy
// ============================================================
router.post('/:id/pause', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE company_roles SET status = 'PAUSED', updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND status = 'PUBLISHED' RETURNING *`,
      [id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Vacancy not found or not in PUBLISHED status' });
    }

    await pool.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, ip_address)
       VALUES ($1, $2, $3, 'VACANCY_PAUSED', 'Vacancy', $4, 'PUBLISHED', 'PAUSED', $5)`,
      [companyId, req.user.id, req.user.role, id, req.ip || null]
    );

    return res.json({ vacancy: result.rows[0], message: 'Vacancy paused' });
  } catch (err) {
    console.error('Pause vacancy error:', err);
    return res.status(500).json({ error: 'Failed to pause vacancy' });
  }
});

// ============================================================
// POST /api/vacancies/:id/close — Close a PUBLISHED or PAUSED vacancy
// ============================================================
router.post('/:id/close', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE company_roles SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND status IN ('PUBLISHED', 'PAUSED', 'APPROVED') RETURNING *`,
      [id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Vacancy not found or cannot be closed from current status' });
    }

    await pool.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, ip_address)
       VALUES ($1, $2, $3, 'VACANCY_CLOSED', 'Vacancy', $4, 'ACTIVE', 'CLOSED', $5)`,
      [companyId, req.user.id, req.user.role, id, req.ip || null]
    );

    return res.json({ vacancy: result.rows[0], message: 'Vacancy closed' });
  } catch (err) {
    console.error('Close vacancy error:', err);
    return res.status(500).json({ error: 'Failed to close vacancy' });
  }
});

// ============================================================
// GET /api/vacancies/:id/requirements — List requirements
// ============================================================
router.get('/:id/requirements', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT r.* FROM requirements r
       JOIN company_roles cr ON cr.id = r.role_id
       WHERE r.role_id = $1 AND cr.company_id = $2 ORDER BY r.created_at ASC`,
      [req.params.id, companyId]
    );
    return res.json({ requirements: result.rows });
  } catch (err) {
    console.error('Get requirements error:', err);
    return res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// ============================================================
// POST /api/vacancies/:id/requirements — Add requirement
// ============================================================
router.post(
  '/:id/requirements',
  [
    body('name').trim().notEmpty().withMessage('Requirement name is required'),
    body('category').optional().trim(),
    body('reqType').optional().isIn(['Required', 'Preferred', 'Optional', 'REQUIRED', 'PREFERRED', 'OPTIONAL']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const companyId = req.companyMembership.company_id;
      const roleId = req.params.id;
      const {
        name,
        description,
        category,
        reqType,
        priority,
        proficiency,
        evalMethod,
        evaluationMethods,
        requirementType,
        importance,
        weight,
      } = req.body;

      // Verify vacancy belongs to company
      const vacCheck = await pool.query(
        'SELECT id, status FROM company_roles WHERE id = $1 AND company_id = $2',
        [roleId, companyId]
      );
      if (vacCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Vacancy not found in your company' });
      }

      const normalizedReqType = reqType || (importance ? (importance.toUpperCase() === 'REQUIRED' ? 'Required' : 'Preferred') : 'Required');
      const normalizedImportance = importance || (reqType ? reqType.toUpperCase() : 'REQUIRED');
      const normalizedType = requirementType || (category ? category.toUpperCase() : 'SKILL');
      const normalizedEvalMethods = evaluationMethods || [evalMethod || 'ASSESSMENT'];

      const result = await pool.query(
        `INSERT INTO requirements
         (role_id, company_id, name, description, category, req_type, priority,
          proficiency, eval_method, requirement_type, importance, evaluation_methods, weight)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          roleId,
          companyId,
          name,
          description || null,
          category || 'Technical',
          normalizedReqType,
          priority || 'High',
          proficiency || 'Intermediate',
          evalMethod || 'Official Technical Assessment',
          normalizedType,
          normalizedImportance,
          JSON.stringify(normalizedEvalMethods),
          weight || 1.0,
        ]
      );

      return res.status(201).json({ requirement: result.rows[0] });
    } catch (err) {
      console.error('Create requirement error:', err);
      return res.status(500).json({ error: 'Failed to create requirement' });
    }
  }
);

module.exports = router;
