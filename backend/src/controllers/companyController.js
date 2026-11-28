const pool = require('../database/pool');
const { logAudit } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

async function getCompanyProfile(req, res) {
  try {
    const companyId = req.companyMembership?.company_id;
    if (!companyId) {
      return sendError(res, { statusCode: 404, error: 'No company associated with user', code: 'NOT_FOUND' });
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
      return sendError(res, { statusCode: 404, error: 'Company not found', code: 'NOT_FOUND' });
    }

    return sendSuccess(res, { company: result.rows[0] });
  } catch (err) {
    console.error('Get company error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to fetch company' });
  }
}

async function updateCompanyProfile(req, res) {
  const companyId = req.companyMembership?.company_id;
  if (!companyId) {
    return sendError(res, { statusCode: 404, error: 'No company associated with user', code: 'NOT_FOUND' });
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
  // Companies can re-request review (PENDING_VERIFICATION) but never self-approve
  const rawVerif = String(req.body.verificationStatus || req.body.verification_status || '').toUpperCase();
  const verificationStatus = rawVerif === 'PENDING_VERIFICATION' ? 'PENDING_VERIFICATION' : null;

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

    try {
      await logAudit(pool, {
        companyId,
        user: req.user,
        actorRole: req.user.role || 'COMPANY_OWNER',
        action: 'COMPANY_PROFILE_UPDATED',
        entityType: 'Company',
        entityId: companyId,
        details: req.body,
        ipAddress: req.ip || null,
      });
    } catch (_) {}

    return res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Update company error:', err);
    return res.status(500).json({ error: 'Failed to update company' });
  }
}

async function getCompanyOverview(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const [companyResult, deptResult, vacResult] = await Promise.all([
      pool.query('SELECT verification_status, name FROM companies WHERE id = $1', [companyId]),
      pool.query('SELECT COUNT(*)::int AS count FROM departments WHERE company_id = $1 AND is_active = TRUE', [companyId]),
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
}

async function getCompanyActivity(req, res) {
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
}

async function submitOnboarding(req, res) {
  try {
    const companyId = req.companyMembership?.company_id;
    if (!companyId) {
      return res.status(404).json({ error: 'No company associated with user' });
    }
    await pool.query(
      `UPDATE companies SET onboarding_submitted = TRUE, updated_at = NOW() WHERE id = $1`,
      [companyId]
    );
    await logAudit(pool, {
      companyId,
      user: req.user,
      actorRole: req.user.role || 'COMPANY_OWNER',
      action: 'COMPANY_ONBOARDING_SUBMITTED',
      entityType: 'Company',
      entityId: companyId,
    }).catch(() => {});
    return res.json({ success: true, onboardingSubmitted: true });
  } catch (err) {
    console.error('Submit onboarding error:', err);
    return res.status(500).json({ error: 'Failed to submit onboarding' });
  }
}

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyOverview,
  getCompanyActivity,
  submitOnboarding,
};
