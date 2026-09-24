const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();

// All company routes require authentication + company membership
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/company
// Get authenticated company profile
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT id, name, industry, description, size, website,
              official_email, location,
              hiring_contact_name, hiring_contact_email, hiring_contact_phone,
              verification_status, created_at, updated_at
       FROM companies
       WHERE id = $1`,
      [companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Get company error:', err);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// ============================================================
// PATCH /api/company
// Update company profile (company cannot change verification_status)
// ============================================================
router.patch(
  '/',
  [
    body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('industry').optional().trim(),
    body('description').optional().trim(),
    body('size').optional().isIn(['1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+']).withMessage('Invalid company size'),
    body('website').optional().trim().custom((v) => {
      if (!v) return true;
      try { new URL(v); return true; } catch { throw new Error('Invalid website URL'); }
    }),
    body('officialEmail').optional().isEmail().withMessage('Invalid email'),
    body('location').optional().trim(),
    body('hiringContactName').optional().trim(),
    body('hiringContactEmail').optional().isEmail().withMessage('Invalid hiring contact email'),
    body('hiringContactPhone').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const {
      name, industry, description, size, website,
      officialEmail, location,
      hiringContactName, hiringContactEmail, hiringContactPhone,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE companies SET
          name                 = COALESCE($1, name),
          industry             = COALESCE($2, industry),
          description          = COALESCE($3, description),
          size                 = COALESCE($4, size),
          website              = COALESCE($5, website),
          official_email       = COALESCE($6, official_email),
          location             = COALESCE($7, location),
          hiring_contact_name  = COALESCE($8, hiring_contact_name),
          hiring_contact_email = COALESCE($9, hiring_contact_email),
          hiring_contact_phone = COALESCE($10, hiring_contact_phone),
          updated_at           = NOW()
        WHERE id = $11
        RETURNING id, name, industry, description, size, website,
                  official_email, location,
                  hiring_contact_name, hiring_contact_email, hiring_contact_phone,
                  verification_status, created_at, updated_at`,
        [name, industry, description, size, website,
         officialEmail, location,
         hiringContactName, hiringContactEmail, hiringContactPhone,
         companyId]
      );

      return res.json({ company: result.rows[0] });
    } catch (err) {
      console.error('Update company error:', err);
      return res.status(500).json({ error: 'Failed to update company' });
    }
  }
);

// ============================================================
// GET /api/company/overview
// Returns summary counts for dashboard overview
// ============================================================
router.get('/overview', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;

    const [companyResult, deptResult, roleResult] = await Promise.all([
      pool.query(
        'SELECT verification_status FROM companies WHERE id = $1',
        [companyId]
      ),
      pool.query(
        'SELECT COUNT(*) FROM departments WHERE company_id = $1 AND is_active = TRUE',
        [companyId]
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft
         FROM company_roles
         WHERE company_id = $1 AND status != 'DEACTIVATED'`,
        [companyId]
      ),
    ]);

    return res.json({
      verificationStatus: companyResult.rows[0]?.verification_status ?? 'UNVERIFIED',
      departmentCount: parseInt(deptResult.rows[0].count, 10),
      roleCount: parseInt(roleResult.rows[0].total, 10),
      draftRoleCount: parseInt(roleResult.rows[0].draft, 10),
    });
  } catch (err) {
    console.error('Overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

module.exports = router;
