const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'];

// ============================================================
// GET /api/roles
// List all roles for the authenticated company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT r.id, r.title, r.job_description, r.experience_level,
              r.employment_type, r.location, r.vacancy_count, r.status,
              r.created_at, r.updated_at,
              d.id AS department_id, d.name AS department_name
       FROM company_roles r
       JOIN departments d ON d.id = r.department_id
       WHERE r.company_id = $1
       ORDER BY r.created_at DESC`,
      [companyId]
    );

    return res.json({ roles: result.rows });
  } catch (err) {
    console.error('List roles error:', err);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// ============================================================
// POST /api/roles
// Create a role
// ============================================================
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Role title is required')
      .isLength({ max: 255 }).withMessage('Title too long'),
    body('departmentId').notEmpty().isUUID().withMessage('Valid department ID is required'),
    body('jobDescription').optional().trim()
      .isLength({ min: 20 }).withMessage('Job description must be at least 20 characters if provided'),
    body('experienceLevel').isIn(EXPERIENCE_LEVELS).withMessage('Invalid experience level'),
    body('employmentType').isIn(EMPLOYMENT_TYPES).withMessage('Invalid employment type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('vacancyCount').isInt({ min: 1 }).withMessage('Vacancy count must be at least 1'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const {
      title, departmentId, jobDescription,
      experienceLevel, employmentType, location, vacancyCount,
    } = req.body;

    try {
      // Verify department belongs to this company (tenant isolation)
      const deptCheck = await pool.query(
        'SELECT id FROM departments WHERE id = $1 AND company_id = $2 AND is_active = TRUE',
        [departmentId, companyId]
      );

      if (deptCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Department not found or inactive' });
      }

      const result = await pool.query(
        `INSERT INTO company_roles
           (company_id, department_id, title, job_description,
            experience_level, employment_type, location, vacancy_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
         RETURNING id, title, job_description, experience_level,
                   employment_type, location, vacancy_count, status,
                   created_at, updated_at, department_id`,
        [companyId, departmentId, title, jobDescription || null,
         experienceLevel, employmentType, location, vacancyCount]
      );

      const role = result.rows[0];

      // Fetch department name
      const deptResult = await pool.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
      role.department_name = deptResult.rows[0]?.name;

      return res.status(201).json({ role });
    } catch (err) {
      console.error('Create role error:', err);
      return res.status(500).json({ error: 'Failed to create role' });
    }
  }
);

// ============================================================
// GET /api/roles/:id
// Get single role (company-scoped)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT r.id, r.title, r.job_description, r.experience_level,
              r.employment_type, r.location, r.vacancy_count, r.status,
              r.created_at, r.updated_at,
              d.id AS department_id, d.name AS department_name
       FROM company_roles r
       JOIN departments d ON d.id = r.department_id
       WHERE r.id = $1 AND r.company_id = $2`,
      [req.params.id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    return res.json({ role: result.rows[0] });
  } catch (err) {
    console.error('Get role error:', err);
    return res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// ============================================================
// PATCH /api/roles/:id
// Update a role (company-scoped)
// ============================================================
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Role title cannot be empty'),
    body('departmentId').optional().isUUID().withMessage('Valid department ID required'),
    body('jobDescription').optional().trim(),
    body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS).withMessage('Invalid experience level'),
    body('employmentType').optional().isIn(EMPLOYMENT_TYPES).withMessage('Invalid employment type'),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
    body('vacancyCount').optional().isInt({ min: 1 }).withMessage('Vacancy count must be at least 1'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const {
      title, departmentId, jobDescription,
      experienceLevel, employmentType, location, vacancyCount,
    } = req.body;

    try {
      // If departmentId provided, verify it belongs to this company
      if (departmentId) {
        const deptCheck = await pool.query(
          'SELECT id FROM departments WHERE id = $1 AND company_id = $2 AND is_active = TRUE',
          [departmentId, companyId]
        );
        if (deptCheck.rowCount === 0) {
          return res.status(404).json({ error: 'Department not found or inactive' });
        }
      }

      const result = await pool.query(
        `UPDATE company_roles SET
           title             = COALESCE($1, title),
           department_id     = COALESCE($2, department_id),
           job_description   = COALESCE($3, job_description),
           experience_level  = COALESCE($4, experience_level),
           employment_type   = COALESCE($5, employment_type),
           location          = COALESCE($6, location),
           vacancy_count     = COALESCE($7, vacancy_count),
           updated_at        = NOW()
         WHERE id = $8 AND company_id = $9
         RETURNING id, title, job_description, experience_level,
                   employment_type, location, vacancy_count, status,
                   created_at, updated_at, department_id`,
        [title, departmentId, jobDescription, experienceLevel,
         employmentType, location, vacancyCount,
         req.params.id, companyId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const role = result.rows[0];
      const deptResult = await pool.query('SELECT name FROM departments WHERE id = $1', [role.department_id]);
      role.department_name = deptResult.rows[0]?.name;

      return res.json({ role });
    } catch (err) {
      console.error('Update role error:', err);
      return res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

// ============================================================
// PATCH /api/roles/:id/deactivate
// Deactivate a role
// ============================================================
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `UPDATE company_roles SET status = 'DEACTIVATED', updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id, title, status`,
      [req.params.id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    return res.json({ role: result.rows[0] });
  } catch (err) {
    console.error('Deactivate role error:', err);
    return res.status(500).json({ error: 'Failed to deactivate role' });
  }
});

module.exports = router;
