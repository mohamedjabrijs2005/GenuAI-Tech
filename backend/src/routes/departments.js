const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/departments
// List all departments for the authenticated company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at,
              COUNT(r.id) FILTER (WHERE r.status != 'DEACTIVATED') AS role_count
       FROM departments d
       LEFT JOIN company_roles r ON r.department_id = d.id
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [companyId]
    );

    return res.json({ departments: result.rows });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
      return res.json({ departments: [] });
    }
    console.error('List departments error:', err);
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ============================================================
// POST /api/departments
// Create a department
// ============================================================
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Department name is required')
      .isLength({ max: 255 }).withMessage('Name too long'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const { name, description } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO departments (company_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, is_active, created_at, updated_at`,
        [companyId, name, description || null]
      );
      return res.status(201).json({ department: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A department with this name already exists' });
      }
      console.error('Create department error:', err);
      return res.status(500).json({ error: 'Failed to create department' });
    }
  }
);

// ============================================================
// GET /api/departments/:id
// Get single department (company-scoped)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT id, name, description, is_active, created_at, updated_at
       FROM departments
       WHERE id = $1 AND company_id = $2`,
      [req.params.id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    return res.json({ department: result.rows[0] });
  } catch (err) {
    console.error('Get department error:', err);
    return res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// ============================================================
// PATCH /api/departments/:id
// Edit a department (company-scoped)
// ============================================================
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const { name, description } = req.body;

    try {
      const result = await pool.query(
        `UPDATE departments SET
           name        = COALESCE($1, name),
           description = COALESCE($2, description),
           updated_at  = NOW()
         WHERE id = $3 AND company_id = $4
         RETURNING id, name, description, is_active, created_at, updated_at`,
        [name, description, req.params.id, companyId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
      return res.json({ department: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A department with this name already exists' });
      }
      console.error('Update department error:', err);
      return res.status(500).json({ error: 'Failed to update department' });
    }
  }
);

// ============================================================
// PATCH /api/departments/:id/deactivate
// Deactivate a department (soft delete)
// ============================================================
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `UPDATE departments SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id, name, is_active`,
      [req.params.id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    return res.json({ department: result.rows[0] });
  } catch (err) {
    console.error('Deactivate department error:', err);
    return res.status(500).json({ error: 'Failed to deactivate department' });
  }
});

// ============================================================
// PATCH /api/departments/:id/activate
// Re-activate a department
// ============================================================
router.patch('/:id/activate', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `UPDATE departments SET is_active = TRUE, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id, name, is_active`,
      [req.params.id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    return res.json({ department: result.rows[0] });
  } catch (err) {
    console.error('Activate department error:', err);
    return res.status(500).json({ error: 'Failed to activate department' });
  }
});

module.exports = router;
