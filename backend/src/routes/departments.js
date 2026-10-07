const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/departments — List all departments for company
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at,
              COUNT(cr.id) FILTER (WHERE cr.status NOT IN ('ARCHIVED', 'CLOSED'))::int AS active_vacancies_count
       FROM departments d
       LEFT JOIN company_roles cr ON cr.department_id = d.id
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [companyId]
    );

    return res.json({ departments: result.rows });
  } catch (err) {
    console.error('List departments error:', err);
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ============================================================
// POST /api/departments — Create a department
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

      const dept = result.rows[0];

      // Audit log
      await pool.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, 'DEPARTMENT_CREATED', 'Department', $4, $5, $6)`,
        [companyId, req.user.id, req.user.role || 'COMPANY_OWNER', dept.id, JSON.stringify({ name }), req.ip || null]
      );

      return res.status(201).json({ department: dept });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A department with this name already exists in your company' });
      }
      console.error('Create department error:', err);
      return res.status(500).json({ error: 'Failed to create department' });
    }
  }
);

// ============================================================
// GET /api/departments/:id — Get single department
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
// PATCH /api/departments/:id — Edit department
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
    const { name, description, isActive } = req.body;

    try {
      const result = await pool.query(
        `UPDATE departments SET
           name        = COALESCE($1, name),
           description = COALESCE($2, description),
           is_active   = COALESCE($3, is_active),
           updated_at  = NOW()
         WHERE id = $4 AND company_id = $5
         RETURNING id, name, description, is_active, created_at, updated_at`,
        [name, description, isActive !== undefined ? isActive : null, req.params.id, companyId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }

      await pool.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, 'DEPARTMENT_UPDATED', 'Department', $4, $5, $6)`,
        [companyId, req.user.id, req.user.role, req.params.id, JSON.stringify(req.body), req.ip || null]
      );

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
// DELETE /api/departments/:id — Soft delete / archive department
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const { id } = req.params;

    // Check if there are active vacancies under this department
    const vacCheck = await pool.query(
      "SELECT COUNT(*)::int AS count FROM company_roles WHERE department_id = $1 AND company_id = $2 AND status NOT IN ('ARCHIVED', 'CLOSED')",
      [id, companyId]
    );

    if ((vacCheck.rows[0]?.count || 0) > 0) {
      return res.status(400).json({
        error: 'Cannot delete department with active vacancies. Please close or reassign vacancies first.',
      });
    }

    const result = await pool.query(
      'UPDATE departments SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND company_id = $2 RETURNING id, name, is_active',
      [id, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await pool.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, 'DEPARTMENT_ARCHIVED', 'Department', $4, $5, $6)`,
      [companyId, req.user.id, req.user.role, id, JSON.stringify({ name: result.rows[0].name }), req.ip || null]
    );

    return res.json({ message: 'Department archived', department: result.rows[0] });
  } catch (err) {
    console.error('Delete department error:', err);
    return res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
