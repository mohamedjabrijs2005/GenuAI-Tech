const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/vacancies  — List all vacancies for company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { status } = req.query;

    let query = `
      SELECT cr.id, cr.title, cr.location, cr.work_mode, cr.salary_range,
             cr.vacancy_count, cr.status, cr.version, cr.closing_date,
             cr.experience_level, cr.employment_type, cr.created_at,
             d.id AS department_id, d.name AS department_name,
             COUNT(DISTINCT a.id) AS applicant_count
      FROM company_roles cr
      JOIN departments d ON d.id = cr.department_id
      LEFT JOIN applications a ON a.role_id = cr.id
      WHERE cr.company_id = $1
    `;
    const params = [companyId];

    if (status) {
      query += ` AND cr.status = $${params.length + 1}`;
      params.push(status.toUpperCase());
    }

    query += ' GROUP BY cr.id, d.id ORDER BY cr.created_at DESC';
    const result = await pool.query(query, params);
    return res.json({ vacancies: result.rows });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
      return res.json({ vacancies: [] });
    }
    console.error('List vacancies error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

// ============================================================
// GET /api/vacancies/:id  — Get single vacancy with details
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    const roleRes = await pool.query(
      `SELECT cr.*, d.name AS department_name FROM company_roles cr
       JOIN departments d ON d.id = cr.department_id
       WHERE cr.id = $1 AND cr.company_id = $2`,
      [id, companyId]
    );

    if (!roleRes.rows[0]) return res.status(404).json({ error: 'Vacancy not found' });

    const [reqRes, agRes, appRes] = await Promise.all([
      pool.query('SELECT * FROM requirements WHERE role_id = $1 ORDER BY created_at', [id]),
      pool.query(`
        SELECT ag.*, json_agg(eg.*) AS evaluation_groups
        FROM assessment_groups ag
        LEFT JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id
        WHERE ag.role_id = $1
        GROUP BY ag.id ORDER BY ag.created_at`, [id]),
      pool.query(`
        SELECT a.*, c.first_name, c.last_name, c.email
        FROM applications a JOIN candidates c ON c.id = a.candidate_id
        WHERE a.role_id = $1 ORDER BY a.applied_at DESC`, [id]),
    ]);

    return res.json({
      vacancy: roleRes.rows[0],
      requirements: reqRes.rows,
      assessmentGroups: agRes.rows,
      applications: appRes.rows,
    });
  } catch (err) {
    console.error('Get vacancy error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancy' });
  }
});

// ============================================================
// POST /api/vacancies  — Create vacancy
// ============================================================
router.post('/',
  [
    body('title').trim().notEmpty(),
    body('departmentId').notEmpty().isUUID(),
    body('experienceLevel').isIn(['entry','mid','senior','lead','executive']),
    body('employmentType').isIn(['full_time','part_time','contract','internship','freelance']),
    body('location').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const companyId = req.companyMembership.company_id;
      const { title, departmentId, jobDescription, experienceLevel, employmentType,
              location, workMode, salaryRange, vacancyCount, closingDate } = req.body;

      const result = await pool.query(
        `INSERT INTO company_roles
         (company_id, department_id, title, job_description, experience_level,
          employment_type, location, work_mode, salary_range, vacancy_count, closing_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [companyId, departmentId, title, jobDescription, experienceLevel,
         employmentType, location, workMode || 'Hybrid', salaryRange, vacancyCount || 1, closingDate || null]
      );

      // Audit log
      await pool.query(
        `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, entity_type, entity_id, action, details)
         VALUES ($1,$2,$3,$4,'vacancy',$5,'created',$6)`,
        [companyId, req.user.id, `${req.user.firstName} ${req.user.lastName}`,
         req.user.email, result.rows[0].id, JSON.stringify({ title })]
      );

      return res.status(201).json({ vacancy: result.rows[0] });
    } catch (err) {
      console.error('Create vacancy error:', err);
      return res.status(500).json({ error: 'Failed to create vacancy' });
    }
  }
);

// ============================================================
// PUT /api/vacancies/:id  — Update vacancy
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;
    const { title, jobDescription, status, workMode, salaryRange, vacancyCount, closingDate } = req.body;

    const result = await pool.query(
      `UPDATE company_roles SET
         title = COALESCE($1, title),
         job_description = COALESCE($2, job_description),
         status = COALESCE($3, status),
         work_mode = COALESCE($4, work_mode),
         salary_range = COALESCE($5, salary_range),
         vacancy_count = COALESCE($6, vacancy_count),
         closing_date = COALESCE($7, closing_date),
         updated_at = NOW()
       WHERE id = $8 AND company_id = $9 RETURNING *`,
      [title, jobDescription, status, workMode, salaryRange, vacancyCount, closingDate, id, companyId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Vacancy not found' });

    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, actor_name, actor_email, entity_type, entity_id, action, details)
       VALUES ($1,$2,$3,$4,'vacancy',$5,'updated',$6)`,
      [companyId, req.user.id, `${req.user.firstName} ${req.user.lastName}`,
       req.user.email, id, JSON.stringify(req.body)]
    );

    return res.json({ vacancy: result.rows[0] });
  } catch (err) {
    console.error('Update vacancy error:', err);
    return res.status(500).json({ error: 'Failed to update vacancy' });
  }
});

// ============================================================
// POST /api/vacancies/:id/submit  — Submit for verification
// ============================================================
router.post('/:id/submit', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE company_roles SET status = 'UNDER_REVIEW', updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND status = 'DRAFT' RETURNING *`,
      [id, companyId]
    );

    if (!result.rows[0]) return res.status(400).json({ error: 'Vacancy not in DRAFT status or not found' });

    return res.json({ vacancy: result.rows[0], message: 'Submitted for verification' });
  } catch (err) {
    console.error('Submit vacancy error:', err);
    return res.status(500).json({ error: 'Failed to submit vacancy' });
  }
});

// ============================================================
// GET /api/vacancies/:id/requirements
// ============================================================
router.get('/:id/requirements', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT r.* FROM requirements r
       JOIN company_roles cr ON cr.id = r.role_id
       WHERE r.role_id = $1 AND cr.company_id = $2 ORDER BY r.created_at`,
      [req.params.id, companyId]
    );
    return res.json({ requirements: result.rows });
  } catch (err) {
    console.error('Get requirements error:', err);
    return res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// ============================================================
// POST /api/vacancies/:id/requirements
// ============================================================
router.post('/:id/requirements',
  [
    body('name').trim().notEmpty(),
    body('category').notEmpty(),
    body('reqType').isIn(['Required','Preferred']),
    body('priority').isIn(['High','Medium','Low']),
    body('proficiency').isIn(['Basic','Intermediate','Advanced','Expert']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const companyId = req.companyMembership.company_id;
      const roleId = req.params.id;
      const { name, description, category, reqType, priority, proficiency, evalMethod, reqGroup } = req.body;

      const result = await pool.query(
        `INSERT INTO requirements (role_id, company_id, name, description, category, req_type, priority, proficiency, eval_method, req_group)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [roleId, companyId, name, description, category, reqType, priority, proficiency,
         evalMethod || 'Official Technical Assessment', reqGroup || 'TECHNICAL']
      );
      return res.status(201).json({ requirement: result.rows[0] });
    } catch (err) {
      console.error('Create requirement error:', err);
      return res.status(500).json({ error: 'Failed to create requirement' });
    }
  }
);

// ============================================================
// GET /api/vacancies/:id/applications  — Candidate pipeline
// ============================================================
router.get('/:id/applications', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { status } = req.query;

    let query = `
      SELECT a.*, c.first_name, c.last_name, c.email, c.phone, c.location,
             ar.overall_score,
             COUNT(DISTINCT ev.id) FILTER (WHERE ev.status = 'Supporting') AS supporting_evidence,
             COUNT(DISTINCT req.id) AS total_requirements,
             COUNT(DISTINCT is2.id) FILTER (WHERE is2.status = 'New') AS integrity_flags
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      LEFT JOIN assessment_results ar ON ar.application_id = a.id AND ar.status = 'Completed'
      LEFT JOIN evidence ev ON ev.application_id = a.id
      LEFT JOIN requirements req ON req.role_id = a.role_id
      LEFT JOIN integrity_signals is2 ON is2.application_id = a.id
      WHERE a.role_id = $1 AND a.company_id = $2
    `;
    const params = [req.params.id, companyId];

    if (status) {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' GROUP BY a.id, c.id, ar.overall_score ORDER BY a.applied_at DESC';
    const result = await pool.query(query, params);
    return res.json({ applications: result.rows });
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;
