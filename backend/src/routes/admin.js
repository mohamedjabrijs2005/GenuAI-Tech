const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate, requireGenuAIAdmin } = require('../middleware/auth');

// Protect all admin endpoints
router.use(authenticate, requireGenuAIAdmin);

// ============================================================
// 1. GET /api/admin/overview
// Real PostgreSQL platform statistics & activity queue
// ============================================================
router.get('/overview', async (req, res) => {
  try {
    const [
      companyCountsRes,
      vacancyCountsRes,
      userCountRes,
      pendingCompaniesRes,
      pendingVacanciesRes,
      recentAuditRes,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_companies,
          COUNT(*) FILTER (WHERE verification_status IN ('PENDING_VERIFICATION', 'UNDER_REVIEW'))::int AS pending_verifications,
          COUNT(*) FILTER (WHERE verification_status = 'APPROVED')::int AS approved_companies,
          COUNT(*) FILTER (WHERE verification_status = 'REJECTED')::int AS rejected_companies,
          COUNT(*) FILTER (WHERE verification_status = 'SUSPENDED')::int AS suspended_companies
        FROM companies
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_vacancies,
          COUNT(*) FILTER (WHERE status = 'PENDING_ADMIN_REVIEW')::int AS pending_reviews,
          COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_vacancies,
          COUNT(*) FILTER (WHERE status = 'PUBLISHED')::int AS published_vacancies,
          COUNT(*) FILTER (WHERE status = 'CHANGES_REQUESTED')::int AS changes_requested_vacancies,
          COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected_vacancies
        FROM company_roles
      `),
      pool.query('SELECT COUNT(*)::int AS total_users FROM users'),
      pool.query(`
        SELECT id, name, official_email, website, industry, location, verification_status, created_at
        FROM companies
        WHERE verification_status IN ('PENDING_VERIFICATION', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED')
        ORDER BY created_at ASC
        LIMIT 10
      `),
      pool.query(`
        SELECT cr.id, cr.title, cr.status, cr.created_at, cr.submitted_at,
               c.id AS company_id, c.name AS company_name,
               d.name AS department_name,
               COUNT(DISTINCT r.id) AS requirement_count
        FROM company_roles cr
        JOIN companies c ON c.id = cr.company_id
        LEFT JOIN departments d ON d.id = cr.department_id
        LEFT JOIN requirements r ON r.role_id = cr.id
        WHERE cr.status = 'PENDING_ADMIN_REVIEW'
        GROUP BY cr.id, c.id, d.id
        ORDER BY COALESCE(cr.submitted_at, cr.created_at) ASC
        LIMIT 10
      `),
      pool.query(`
        SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_status, al.new_status,
               al.reason, al.metadata, al.created_at, al.actor_role,
               u.email AS actor_email,
               COALESCE(al.actor_name, CONCAT(u.first_name, ' ', u.last_name), 'System') AS actor_name,
               c.name AS company_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id OR u.id = al.user_id
        LEFT JOIN companies c ON c.id = al.company_id
        ORDER BY al.created_at DESC
        LIMIT 15
      `),
    ]);

    const compStats = companyCountsRes.rows[0] || {};
    const vacStats = vacancyCountsRes.rows[0] || {};
    const totalUsers = userCountRes.rows[0]?.total_users || 0;

    return res.json({
      metrics: {
        totalCompanies: compStats.total_companies || 0,
        pendingCompanyVerifications: compStats.pending_verifications || 0,
        approvedCompanies: compStats.approved_companies || 0,
        rejectedCompanies: compStats.rejected_companies || 0,
        suspendedCompanies: compStats.suspended_companies || 0,
        activeVacancies: vacStats.published_vacancies || 0,
        vacanciesPendingReview: vacStats.pending_reviews || 0,
        approvedVacancies: vacStats.approved_vacancies || 0,
        publishedVacancies: vacStats.published_vacancies || 0,
        vacanciesChangesRequested: vacStats.changes_requested_vacancies || 0,
        rejectedVacancies: vacStats.rejected_vacancies || 0,
        platformUsers: totalUsers,
      },
      actionQueue: {
        pendingCompanies: pendingCompaniesRes.rows.map((c) => ({
          id: c.id,
          name: c.name,
          workEmail: c.official_email,
          website: c.website,
          industry: c.industry,
          country: c.location,
          verificationStatus: c.verification_status,
          submittedDate: c.created_at ? c.created_at.toISOString().split('T')[0] : '',
        })),
        pendingVacancies: pendingVacanciesRes.rows.map((v) => ({
          id: v.id,
          companyId: v.company_id,
          companyName: v.company_name,
          roleTitle: v.title,
          department: v.department_name,
          requirementCount: Number(v.requirement_count) || 0,
          status: v.status,
          submittedDate: (v.submitted_at || v.created_at)?.toISOString().split('T')[0] || '',
        })),
      },
      recentActivity: recentAuditRes.rows.map((a) => ({
        id: a.id,
        actor: a.actor_name,
        role: a.actor_role || 'Admin',
        action: a.action,
        entity: a.entity_type,
        entityId: a.entity_id,
        companyName: a.company_name,
        timestamp: a.created_at ? a.created_at.toISOString().replace('T', ' ').substring(0, 19) : '',
        previousState: a.old_status,
        newState: a.new_status,
        reason: a.reason,
        metadata: a.metadata,
      })),
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Failed to load admin overview metrics' });
  }
});

// ============================================================
// 2. GET /api/admin/companies
// List all companies from PostgreSQL with stats & filters
// ============================================================
router.get('/companies', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT c.*,
             COUNT(DISTINCT cr.id) AS active_vacancies_count,
             COUNT(DISTINCT cm.user_id) AS member_count,
             u.email AS reviewer_email,
             CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
      FROM companies c
      LEFT JOIN company_roles cr ON cr.company_id = c.id AND cr.status = 'PUBLISHED'
      LEFT JOIN company_members cm ON cm.company_id = c.id
      LEFT JOIN users u ON u.id = c.verification_reviewed_by
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status.toUpperCase());
      query += ` AND c.verification_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.official_email ILIKE $${params.length} OR c.industry ILIKE $${params.length})`;
    }

    query += ` GROUP BY c.id, u.id ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);

    const companies = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.website ? r.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'company.io',
      workEmail: r.official_email || 'contact@company.io',
      industry: r.industry || 'Technology',
      employeeCount: r.size || '50-250',
      registrationNumber: 'REG-' + r.id.substring(0, 8).toUpperCase(),
      country: r.location || 'Global',
      website: r.website || '',
      description: r.description || '',
      verificationStatus: r.verification_status,
      submittedDate: r.created_at ? r.created_at.toISOString().split('T')[0] : '',
      reviewState: r.verification_status === 'APPROVED' ? 'Completed' : r.verification_status === 'UNDER_REVIEW' ? 'Under Review' : 'In Queue',
      assignedAdmin: r.reviewer_name || 'Unassigned',
      reviewNote: r.verification_review_note || '',
      activeVacanciesCount: Number(r.active_vacancies_count) || 0,
      totalAssessmentsCount: 0,
      documents: [],
      history: [],
    }));

    return res.json({ companies });
  } catch (err) {
    console.error('Admin list companies error:', err);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// ============================================================
// 3. GET /api/admin/companies/:id
// Get single company full details, members, departments, vacancies, audit history
// ============================================================
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const compRes = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (compRes.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const company = compRes.rows[0];

    const [membersRes, deptsRes, vacsRes, auditRes] = await Promise.all([
      pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.role, cm.member_role, cm.created_at
        FROM company_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.company_id = $1
      `, [id]),
      pool.query('SELECT * FROM departments WHERE company_id = $1 ORDER BY name ASC', [id]),
      pool.query('SELECT * FROM company_roles WHERE company_id = $1 ORDER BY created_at DESC', [id]),
      pool.query(`
        SELECT al.*, u.email AS actor_email, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        WHERE al.company_id = $1 OR (al.entity_type = 'Company' AND al.entity_id = $2)
        ORDER BY al.created_at DESC
        LIMIT 50
      `, [id, id]),
    ]);

    return res.json({
      company,
      members: membersRes.rows,
      departments: deptsRes.rows,
      vacancies: vacsRes.rows,
      auditHistory: auditRes.rows,
    });
  } catch (err) {
    console.error('Admin get company error:', err);
    return res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// ============================================================
// 4. PUT / PATCH /api/admin/companies/:id/status
// Transactional company verification decision with audit logging
// ============================================================
const handleCompanyStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note, reason } = req.body;

  const validStatuses = [
    'PENDING_VERIFICATION',
    'UNDER_REVIEW',
    'ADDITIONAL_INFORMATION_REQUIRED',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'ARCHIVED',
  ];

  // Map legacy frontend status terms
  let normalizedStatus = (status || '').toUpperCase().replace(/\s+/g, '_');
  if (normalizedStatus === 'VERIFIED') normalizedStatus = 'APPROVED';
  if (normalizedStatus === 'NEEDS_CORRECTION') normalizedStatus = 'ADDITIONAL_INFORMATION_REQUIRED';
  if (normalizedStatus === 'PENDING') normalizedStatus = 'PENDING_VERIFICATION';

  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      error: `Invalid company verification status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  try {
    await client.query('BEGIN');

    // Lock and get current status
    const existingRes = await client.query('SELECT * FROM companies WHERE id = $1 FOR UPDATE', [id]);
    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = existingRes.rows[0];
    const prevStatus = company.verification_status;
    const finalNote = note || reason || `Status changed to ${normalizedStatus}`;

    const isSuspended = normalizedStatus === 'SUSPENDED';

    // Update company in PostgreSQL
    const updateRes = await client.query(
      `UPDATE companies SET
         verification_status = $1,
         verification_reviewed_by = $2,
         verification_reviewed_at = NOW(),
         verification_review_note = $3,
         suspended_at = CASE WHEN $4::boolean THEN NOW() ELSE (CASE WHEN $5 = 'SUSPENDED' THEN NULL ELSE suspended_at END) END,
         suspension_reason = CASE WHEN $4::boolean THEN $3 ELSE (CASE WHEN $5 = 'SUSPENDED' THEN NULL ELSE suspension_reason END) END,
         updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [normalizedStatus, req.user.id, finalNote, isSuspended, prevStatus, id]
    );

    const updatedCompany = updateRes.rows[0];

    // Insert immutable audit log in PostgreSQL
    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, ip_address)
       VALUES ($1, $2, $3, $4, 'Company', $5, $6, $7, $8, $9, $10)`,
      [
        id,
        req.user.id,
        req.user.role || 'SUPER_ADMIN',
        `COMPANY_${normalizedStatus}`,
        id,
        prevStatus,
        normalizedStatus,
        finalNote,
        JSON.stringify({ companyName: updatedCompany.name, officialEmail: updatedCompany.official_email }),
        req.ip || null,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        verificationStatus: updatedCompany.verification_status,
        reviewNote: updatedCompany.verification_review_note,
        updatedAt: updatedCompany.updated_at,
      },
      message: `Company status successfully updated to ${normalizedStatus}`,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Update company status error:', err);
    return res.status(500).json({ error: 'Failed to update company verification status' });
  } finally {
    try { client.release(); } catch (_) {}
  }
};
router.put('/companies/:id/status', handleCompanyStatus);
router.patch('/companies/:id/status', handleCompanyStatus);

// ============================================================
// 5. GET /api/admin/vacancies
// List vacancies for moderation queue from PostgreSQL
// ============================================================
router.get('/vacancies', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT cr.*,
             c.name AS company_name, c.official_email AS company_email, c.verification_status AS company_verification_status,
             d.name AS department_name,
             COUNT(DISTINCT r.id) AS requirements_count,
             COUNT(DISTINCT a.id) AS applicant_count,
             u.email AS reviewer_email,
             CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
      FROM company_roles cr
      JOIN companies c ON c.id = cr.company_id
      LEFT JOIN departments d ON d.id = cr.department_id
      LEFT JOIN requirements r ON r.role_id = cr.id
      LEFT JOIN applications a ON a.role_id = cr.id
      LEFT JOIN users u ON u.id = cr.reviewed_by
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      let normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
      if (normalizedStatus === 'PENDING' || normalizedStatus === 'PENDING_REVIEW') normalizedStatus = 'PENDING_ADMIN_REVIEW';
      if (normalizedStatus === 'VERIFIED') normalizedStatus = 'APPROVED';
      if (normalizedStatus === 'ACTIVE') normalizedStatus = 'PUBLISHED';
      params.push(normalizedStatus);
      query += ` AND cr.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (cr.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    query += ` GROUP BY cr.id, c.id, d.id, u.id ORDER BY COALESCE(cr.submitted_at, cr.created_at) DESC`;

    const result = await pool.query(query, params);

    const vacancies = result.rows.map((v) => ({
      id: v.id,
      companyId: v.company_id,
      companyName: v.company_name,
      companyVerificationStatus: v.company_verification_status,
      roleTitle: v.title,
      version: `v${v.version || 1}.0`,
      department: v.department_name || 'General',
      experienceLevel: v.experience_level,
      employmentType: v.employment_type,
      location: v.location,
      workMode: v.work_mode,
      status: v.status,
      submittedDate: (v.submitted_at || v.created_at)?.toISOString().split('T')[0] || '',
      assignedAdmin: v.reviewer_name || 'Unassigned',
      reviewNote: v.review_note || '',
      requirementsCount: Number(v.requirements_count) || 0,
      applicantCount: Number(v.applicant_count) || 0,
      requirements: [],
      assessmentMapping: [],
      evaluationStructure: [],
    }));

    return res.json({ vacancies });
  } catch (err) {
    console.error('Admin list vacancies error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

// ============================================================
// 6. GET /api/admin/vacancies/:id
// Get single vacancy with full requirements, company details, audit logs
// ============================================================
router.get('/vacancies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vacRes = await pool.query(`
      SELECT cr.*,
             c.name AS company_name, c.official_email AS company_email, c.verification_status AS company_verification_status, c.website AS company_website,
             d.name AS department_name,
             u.email AS reviewer_email, CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
      FROM company_roles cr
      JOIN companies c ON c.id = cr.company_id
      LEFT JOIN departments d ON d.id = cr.department_id
      LEFT JOIN users u ON u.id = cr.reviewed_by
      WHERE cr.id = $1
    `, [id]);

    if (vacRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

    const [reqsRes, versionsRes, auditRes] = await Promise.all([
      pool.query('SELECT * FROM requirements WHERE role_id = $1 ORDER BY created_at ASC', [id]),
      pool.query('SELECT * FROM vacancy_versions WHERE role_id = $1 ORDER BY version_number DESC', [id]),
      pool.query(`
        SELECT al.*, u.email AS actor_email, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        WHERE al.entity_id = $1 AND al.entity_type IN ('Vacancy', 'vacancy')
        ORDER BY al.created_at DESC
      `, [id]),
    ]);

    return res.json({
      vacancy: {
        id: vacancy.id,
        companyId: vacancy.company_id,
        companyName: vacancy.company_name,
        companyEmail: vacancy.company_email,
        companyVerificationStatus: vacancy.company_verification_status,
        roleTitle: vacancy.title,
        jobDescription: vacancy.job_description,
        department: vacancy.department_name,
        experienceLevel: vacancy.experience_level,
        employmentType: vacancy.employment_type,
        location: vacancy.location,
        workMode: vacancy.work_mode,
        salaryRange: vacancy.salary_range,
        vacancyCount: vacancy.vacancy_count,
        status: vacancy.status,
        version: vacancy.version,
        submittedAt: vacancy.submitted_at,
        reviewedAt: vacancy.reviewed_at,
        reviewNote: vacancy.review_note,
        approvedAt: vacancy.approved_at,
        publishedAt: vacancy.published_at,
        assignedAdmin: vacancy.reviewer_name,
      },
      requirements: reqsRes.rows,
      versions: versionsRes.rows,
      auditHistory: auditRes.rows,
    });
  } catch (err) {
    console.error('Admin get vacancy details error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancy details' });
  }
});

// ============================================================
// 7. PUT / PATCH /api/admin/vacancies/:id/status
// Transactional vacancy moderation decision (Approve, Reject, Request Changes, Pause)
// ============================================================
const handleVacancyStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note, reason } = req.body;

  const validStatuses = [
    'DRAFT',
    'PENDING_ADMIN_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'PUBLISHED',
    'PAUSED',
    'CLOSED',
    'ARCHIVED',
    'REJECTED',
  ];

  let normalizedStatus = (status || '').toUpperCase().replace(/\s+/g, '_');
  if (normalizedStatus === 'VERIFIED') normalizedStatus = 'APPROVED';
  if (normalizedStatus === 'NEEDS_CORRECTION') normalizedStatus = 'CHANGES_REQUESTED';
  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PENDING_REVIEW') normalizedStatus = 'PENDING_ADMIN_REVIEW';

  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      error: `Invalid vacancy status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  try {
    await client.query('BEGIN');

    // Lock and get vacancy joined with company
    const vacRes = await client.query(`
      SELECT cr.*, c.verification_status AS company_verification_status, c.name AS company_name
      FROM company_roles cr
      JOIN companies c ON c.id = cr.company_id
      WHERE cr.id = $1
      FOR UPDATE OF cr
    `, [id]);

    if (vacRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

    // Rule: Cannot approve or publish a vacancy belonging to an unverified or suspended company
    if (['APPROVED', 'PUBLISHED'].includes(normalizedStatus)) {
      if (vacancy.company_verification_status !== 'APPROVED') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Cannot approve or publish vacancy for company in '${vacancy.company_verification_status}' status. Company must be APPROVED first.`,
        });
      }
    }

    const prevStatus = vacancy.status;
    const finalNote = note || reason || `Vacancy status changed to ${normalizedStatus}`;

    // Update vacancy row
    const updateRes = await client.query(`
      UPDATE company_roles SET
        status = $1::varchar,
        reviewed_by = $2::uuid,
        reviewed_at = NOW(),
        review_note = $3::text,
        approved_at = CASE WHEN $1::varchar = 'APPROVED' THEN NOW() ELSE approved_at END,
        published_at = CASE WHEN $1::varchar = 'PUBLISHED' THEN COALESCE(published_at, NOW()) ELSE published_at END,
        closed_at = CASE WHEN $1::varchar = 'CLOSED' THEN NOW() ELSE closed_at END,
        updated_at = NOW()
      WHERE id = $4::uuid
      RETURNING *
    `, [normalizedStatus, req.user.id, finalNote, id]);

    const updatedVacancy = updateRes.rows[0];

    // Insert immutable audit log row
    await client.query(`
      INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, ip_address)
      VALUES ($1, $2, $3, $4, 'Vacancy', $5, $6, $7, $8, $9, $10)
    `, [
      vacancy.company_id,
      req.user.id,
      req.user.role || 'SUPER_ADMIN',
      `VACANCY_${normalizedStatus}`,
      id,
      prevStatus,
      normalizedStatus,
      finalNote,
      JSON.stringify({ roleTitle: updatedVacancy.title, companyName: vacancy.company_name }),
      req.ip || null,
    ]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      vacancy: {
        id: updatedVacancy.id,
        title: updatedVacancy.title,
        status: updatedVacancy.status,
        reviewedAt: updatedVacancy.reviewed_at,
        reviewNote: updatedVacancy.review_note,
        approvedAt: updatedVacancy.approved_at,
        publishedAt: updatedVacancy.published_at,
      },
      message: `Vacancy status successfully updated to ${normalizedStatus}`,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Update vacancy status error:', err);
    return res.status(500).json({ error: 'Failed to update vacancy status' });
  } finally {
    try { client.release(); } catch (_) {}
  }
};
router.put('/vacancies/:id/status', handleVacancyStatus);
router.patch('/vacancies/:id/status', handleVacancyStatus);

// ============================================================
// 8. GET /api/admin/audit
// Query real PostgreSQL audit logs with filtering & pagination
// ============================================================
router.get('/audit', async (req, res) => {
  try {
    const { companyId, entityType, limit = 100 } = req.query;
    let query = `
      SELECT al.*,
             u.email AS actor_email,
             COALESCE(al.actor_name, CONCAT(u.first_name, ' ', u.last_name), 'System') AS actor_name,
             c.name AS company_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id OR u.id = al.user_id
      LEFT JOIN companies c ON c.id = al.company_id
      WHERE 1=1
    `;
    const params = [];

    if (companyId) {
      params.push(companyId);
      query += ` AND al.company_id = $${params.length}`;
    }

    if (entityType) {
      params.push(entityType);
      query += ` AND al.entity_type ILIKE $${params.length}`;
    }

    params.push(Number(limit) || 100);
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    const logs = result.rows.map((r) => ({
      id: r.id,
      actor: r.actor_name,
      actorEmail: r.actor_email,
      role: r.actor_role || 'Super Admin',
      action: r.action,
      entity: r.entity_type,
      entityId: r.entity_id,
      companyId: r.company_id,
      companyName: r.company_name,
      timestamp: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 19) : '',
      previousState: r.old_status,
      newState: r.new_status,
      reason: r.reason,
      metadata: r.metadata,
      ipAddress: r.ip_address,
    }));

    return res.json({ logs });
  } catch (err) {
    console.error('Admin get audit logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================================
// 9. GET /api/admin/users
// Query real users & company memberships
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
             cm.member_role,
             c.id AS company_id, c.name AS company_name, c.verification_status
      FROM users u
      LEFT JOIN company_members cm ON cm.user_id = u.id
      LEFT JOIN companies c ON c.id = cm.company_id
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map((u) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      email: u.email,
      role: u.role,
      userType: u.role === 'genuai_admin' || u.role === 'SUPER_ADMIN' || u.role === 'VERIFICATION_ADMIN' ? 'GenuAI Admin' : 'Company User',
      organization: u.company_name || 'GenuAI Platform',
      companyId: u.company_id,
      companyStatus: u.verification_status,
      accountStatus: u.status || 'Active',
      createdDate: u.created_at ? u.created_at.toISOString().split('T')[0] : '',
      lastLogin: u.created_at ? u.created_at.toISOString().split('T')[0] : '',
    }));

    return res.json({ users });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const validStatuses = ['Active', 'Suspended', 'Deactivated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}` });
    }

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const prevStatus = userRes.rows[0].status || 'Active';

    await pool.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata)
       VALUES ($1, $2, $3, 'User', $4, $5, $6, $7, $8)`,
      [
        req.user.id,
        req.user.role || 'SUPER_ADMIN',
        `USER_${status.toUpperCase()}`,
        id,
        prevStatus,
        status,
        reason || `User status changed to ${status}`,
        JSON.stringify({ targetEmail: userRes.rows[0].email }),
      ]
    );

    return res.json({ success: true, message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Admin user status update error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const prevRole = userRes.rows[0].role;

    await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);

    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata)
       VALUES ($1, $2, 'USER_ROLE_CHANGED', 'User', $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        req.user.role || 'SUPER_ADMIN',
        id,
        prevRole,
        role,
        reason || `User role updated from ${prevRole} to ${role}`,
        JSON.stringify({ targetEmail: userRes.rows[0].email }),
      ]
    );

    return res.json({ success: true, message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Admin user role update error:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ============================================================
// 10. GET /api/admin/integrity
// Fetch real integrity signals across all companies
// ============================================================
router.get('/integrity', async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = `
      SELECT is2.*,
             c.name AS company_name,
             cr.title AS vacancy_title,
             cand.first_name AS candidate_first, cand.last_name AS candidate_last, cand.email AS candidate_email,
             u.email AS reviewer_email, CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
      FROM integrity_signals is2
      LEFT JOIN companies c ON c.id = is2.company_id
      LEFT JOIN applications a ON a.id = is2.application_id
      LEFT JOIN company_roles cr ON cr.id = a.role_id
      LEFT JOIN candidates cand ON cand.id = a.candidate_id
      LEFT JOIN users u ON u.id = is2.reviewed_by
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND is2.status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND is2.severity = $${params.length}`;
    }
    query += ' ORDER BY is2.signal_time DESC LIMIT 100';

    const result = await pool.query(query, params);
    const signals = result.rows.map((s) => ({
      id: s.id,
      applicationId: s.application_id,
      companyId: s.company_id,
      companyName: s.company_name || 'Platform Company',
      vacancyTitle: s.vacancy_title || 'Unassigned Vacancy',
      candidateName: `${s.candidate_first || ''} ${s.candidate_last || ''}`.trim() || 'Candidate',
      candidateEmail: s.candidate_email || '',
      signalType: s.signal_type,
      severity: s.severity,
      details: s.details,
      status: s.status,
      signalTime: s.signal_time ? s.signal_time.toISOString() : '',
      reviewedBy: s.reviewer_name || null,
      reviewedAt: s.reviewed_at ? s.reviewed_at.toISOString() : null,
      reviewNote: s.review_note || '',
    }));

    return res.json({ signals });
  } catch (err) {
    console.error('Admin get integrity signals error:', err);
    return res.status(500).json({ error: 'Failed to fetch integrity signals' });
  }
});

// PATCH /api/admin/integrity/:id
router.patch('/integrity/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    const validStatuses = ['New', 'Under Review', 'Candidate explanation requested', 'Resolved', 'No action', 'Assessment attempt invalidated', 'Escalated', 'Acknowledged', 'Dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status '${status}'` });
    }

    const sigRes = await pool.query('SELECT * FROM integrity_signals WHERE id = $1', [id]);
    if (sigRes.rowCount === 0) return res.status(404).json({ error: 'Integrity signal not found' });
    const prevStatus = sigRes.rows[0].status;

    const result = await pool.query(
      `UPDATE integrity_signals
       SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, reviewNote || `Status updated to ${status}`, req.user.id, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason)
       VALUES ($1, $2, $3, 'INTEGRITY_SIGNAL_REVIEWED', 'IntegritySignal', $4, $5, $6, $7)`,
      [
        sigRes.rows[0].company_id,
        req.user.id,
        req.user.role || 'SUPER_ADMIN',
        id,
        prevStatus,
        status,
        reviewNote || `Status updated to ${status}`,
      ]
    );

    return res.json({ success: true, signal: result.rows[0] });
  } catch (err) {
    console.error('Admin review integrity signal error:', err);
    return res.status(500).json({ error: 'Failed to update integrity signal' });
  }
});

// ============================================================
// 11. GET /api/admin/assessments
// Fetch assessment configurations from PostgreSQL
// ============================================================
router.get('/assessments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ag.*,
             c.name AS company_name,
             cr.title AS vacancy_title,
             COUNT(DISTINCT eg.id)::int AS evaluation_group_count,
             COUNT(DISTINCT q.id)::int AS question_count
      FROM assessment_groups ag
      JOIN companies c ON c.id = ag.company_id
      LEFT JOIN company_roles cr ON cr.id = ag.role_id
      LEFT JOIN evaluation_groups eg ON eg.assessment_group_id = ag.id
      LEFT JOIN questions q ON q.evaluation_group_id = eg.id
      GROUP BY ag.id, c.id, cr.id
      ORDER BY ag.created_at DESC
    `);

    const assessments = result.rows.map((a) => ({
      id: a.id,
      title: a.name,
      companyId: a.company_id,
      companyName: a.company_name,
      vacancyTitle: a.vacancy_title || 'General Vacancy',
      type: a.type,
      durationMinutes: a.duration,
      questionCount: a.question_count || 0,
      evaluationGroupCount: a.evaluation_group_count || 0,
      status: a.status || 'Active',
      integrityConfig: a.integrity_config || {},
      createdDate: a.created_at ? a.created_at.toISOString().split('T')[0] : '',
    }));

    return res.json({ assessments });
  } catch (err) {
    console.error('Admin get assessments error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessment configurations' });
  }
});

// ============================================================
// 12. GET /api/admin/disputes
// Module status indicator for Reports & Disputes
// ============================================================
router.get('/disputes', async (req, res) => {
  return res.json({
    disputes: [],
    moduleActive: false,
    message: 'Governance case module not yet active',
  });
});

module.exports = router;

