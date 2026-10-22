const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');

const router = express.Router();

// All company routes require authentication + company membership
router.use(authenticate, requireCompany);

// Shared handler to fetch company profile
const getCompanyHandler = async (req, res) => {
  try {
    const companyId = req.companyMembership?.company_id;
    if (!companyId) {
      return res.status(404).json({ error: 'No company associated with user' });
    }
    const result = await pool.query(
      `SELECT id, name, legal_name, industry, description, size, website,
              official_email, location, address,
              hiring_contact_name, hiring_contact_email, hiring_contact_phone, hiring_contact_role,
              registration_number, verification_document_url,
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
};

// Shared handler to update company profile
const updateCompanyHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership?.company_id;
  if (!companyId) {
    return res.status(404).json({ error: 'No company associated with user' });
  }

  const name = req.body.name || req.body.companyName;
  const legalName = req.body.legalName || req.body.legal_name;
  const industry = req.body.industry;
  const description = req.body.description;
  const size = req.body.size;
  const website = req.body.website;
  const officialEmail = req.body.officialEmail || req.body.official_email;
  const location = req.body.location;
  const address = req.body.address;
  const hiringContactName = req.body.hiringContactName || req.body.hiring_contact_name;
  const hiringContactEmail = req.body.hiringContactEmail || req.body.hiring_contact_email;
  const hiringContactPhone = req.body.hiringContactPhone || req.body.hiring_contact_phone || req.body.phone;
  const hiringContactRole = req.body.hiringContactRole || req.body.hiring_contact_role;
  const registrationNumber = req.body.registrationNumber || req.body.registration_number;
  const verificationDocumentUrl = req.body.verificationDocumentUrl || req.body.verification_document_url;
  const verificationStatus = req.body.verificationStatus || req.body.verification_status;

  try {
    const result = await pool.query(
      `UPDATE companies SET
        name                        = COALESCE($1, name),
        legal_name                  = COALESCE($2, legal_name),
        industry                    = COALESCE($3, industry),
        description                 = COALESCE($4, description),
        size                        = COALESCE($5, size),
        website                     = COALESCE($6, website),
        official_email              = COALESCE($7, official_email),
        location                    = COALESCE($8, location),
        address                     = COALESCE($9, address),
        hiring_contact_name         = COALESCE($10, hiring_contact_name),
        hiring_contact_email        = COALESCE($11, hiring_contact_email),
        hiring_contact_phone        = COALESCE($12, hiring_contact_phone),
        hiring_contact_role         = COALESCE($13, hiring_contact_role),
        registration_number         = COALESCE($14, registration_number),
        verification_document_url   = COALESCE($15, verification_document_url),
        verification_status         = COALESCE($16, verification_status),
        updated_at                  = NOW()
      WHERE id = $17
      RETURNING *`,
      [
        name || null,
        legalName || null,
        industry || null,
        description || null,
        size || null,
        website || null,
        officialEmail || null,
        location || null,
        address || null,
        hiringContactName || null,
        hiringContactEmail || null,
        hiringContactPhone || null,
        hiringContactRole || null,
        registrationNumber || null,
        verificationDocumentUrl || null,
        verificationStatus || null,
        companyId,
      ]
    );

    // Audit log profile update
    try {
      await pool.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, 'COMPANY_PROFILE_UPDATED', 'Company', $4, $5, $6)`,
        [companyId, req.user.id, req.user.role || 'COMPANY_OWNER', companyId, JSON.stringify(req.body), req.ip || null]
      );
    } catch (_) {}

    return res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Update company error:', err);
    return res.status(500).json({ error: 'Failed to update company' });
  }
};

const companyValidators = [
  body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('industry').optional().trim(),
  body('description').optional().trim(),
  body('website').optional().trim(),
  body('officialEmail').optional().isEmail().withMessage('Invalid email'),
  body('location').optional().trim(),
  body('hiringContactName').optional().trim(),
  body('hiringContactEmail').optional().isEmail().withMessage('Invalid hiring contact email'),
  body('hiringContactPhone').optional().trim(),
];

// Mount both root and /profile aliases for GET, PATCH, and PUT
router.get('/', getCompanyHandler);
router.get('/profile', getCompanyHandler);
router.patch('/', companyValidators, updateCompanyHandler);
router.patch('/profile', companyValidators, updateCompanyHandler);
router.put('/', companyValidators, updateCompanyHandler);
router.put('/profile', companyValidators, updateCompanyHandler);

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

