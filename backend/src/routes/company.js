const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();

// All company routes require authentication + company membership
router.use(authenticate, requireCompany);

// ============================================================
// GET /api/company — Get authenticated company profile
// ============================================================
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT id, name, industry, description, size, website,
              official_email, location, address,
              hiring_contact_name, hiring_contact_email, hiring_contact_phone,
              verification_status, verification_reviewed_at, verification_review_note,
              suspended_at, suspension_reason, created_at, updated_at
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
// PATCH /api/company — Update company profile with audit logging
// ============================================================
router.patch(
  '/',
  [
    body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('industry').optional().trim(),
    body('description').optional().trim(),
    body('website').optional().trim(),
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
      officialEmail, location, address,
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
          address              = COALESCE($8, address),
          hiring_contact_name  = COALESCE($9, hiring_contact_name),
          hiring_contact_email = COALESCE($10, hiring_contact_email),
          hiring_contact_phone = COALESCE($11, hiring_contact_phone),
          updated_at           = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          name, industry, description, size, website,
          officialEmail, location, address,
          hiringContactName, hiringContactEmail, hiringContactPhone,
          companyId,
        ]
      );

      // Audit log profile update
      await pool.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, 'COMPANY_PROFILE_UPDATED', 'Company', $4, $5, $6)`,
        [companyId, req.user.id, req.user.role || 'COMPANY_OWNER', companyId, JSON.stringify(req.body), req.ip || null]
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
// ============================================================
router.get('/overview', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;

    const [companyResult, deptResult, vacResult] = await Promise.all([
      pool.query(
        'SELECT verification_status, name FROM companies WHERE id = $1',
        [companyId]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS count FROM departments WHERE company_id = $1 AND is_active = TRUE',
        [companyId]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft,
           COUNT(*) FILTER (WHERE status = 'PENDING_ADMIN_REVIEW')::int AS pending_review,
           COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
           COUNT(*) FILTER (WHERE status = 'PUBLISHED')::int AS published,
           COUNT(*) FILTER (WHERE status = 'CHANGES_REQUESTED')::int AS changes_requested
         FROM company_roles
         WHERE company_id = $1`,
        [companyId]
      ),
    ]);

    const comp = companyResult.rows[0] || {};
    const vacStats = vacResult.rows[0] || {};

    return res.json({
      verificationStatus: comp.verification_status || 'PENDING_VERIFICATION',
      companyName: comp.name || '',
      departmentCount: deptResult.rows[0]?.count || 0,
      vacancyStats: vacStats,
      roleCount: vacStats.total || 0,
      draftRoleCount: vacStats.draft || 0,
    });
  } catch (err) {
    console.error('Overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// ============================================================
// GET /api/company/activity — Real company audit and activity history
// ============================================================
router.get('/activity', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.actor_role,
              al.old_status, al.new_status, al.reason, al.created_at,
              COALESCE(u.first_name || ' ' || u.last_name, 'System') AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       WHERE al.company_id = $1
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [companyId]
    );
    return res.json({ activities: result.rows });
  } catch (err) {
    console.error('Company activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity history' });
  }
});

module.exports = router;

