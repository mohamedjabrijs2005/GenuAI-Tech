const pool = require('../database/pool');

async function updateCompanyStatus(req, res) {
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

    const existingRes = await client.query('SELECT * FROM companies WHERE id = $1 FOR UPDATE', [id]);
    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = existingRes.rows[0];
    const prevStatus = company.verification_status;
    const finalNote = note || reason || `Status changed to ${normalizedStatus}`;
    const isSuspended = normalizedStatus === 'SUSPENDED';

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

    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, 'Company', $5, $6, $7, $8, $9, $10, $11, $12)`,
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
        JSON.stringify({ verification_status: prevStatus }),
        JSON.stringify({ verification_status: normalizedStatus, review_note: finalNote }),
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
    return res.status(500).json({ error: err.message || 'Failed to update company verification status' });
  } finally {
    try { client.release(); } catch (_) {}
  }
}

async function updateVacancyStatus(req, res) {
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

    const vacRes = await client.query(
      `SELECT cr.*, c.verification_status AS company_verification_status, c.name AS company_name
       FROM company_roles cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1
       FOR UPDATE OF cr`,
      [id]
    );

    if (vacRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vacancy = vacRes.rows[0];

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

    const updateRes = await client.query(
      `UPDATE company_roles SET
         status = $1::varchar,
         reviewed_by = $2::uuid,
         reviewed_at = NOW(),
         review_note = $3::text,
         approved_at = CASE WHEN $1::varchar = 'APPROVED' THEN NOW() ELSE approved_at END,
         published_at = CASE WHEN $1::varchar = 'PUBLISHED' THEN COALESCE(published_at, NOW()) ELSE published_at END,
         closed_at = CASE WHEN $1::varchar = 'CLOSED' THEN NOW() ELSE closed_at END,
         updated_at = NOW()
       WHERE id = $4::uuid
       RETURNING *`,
      [normalizedStatus, req.user.id, finalNote, id]
    );

    const updatedVacancy = updateRes.rows[0];

    await client.query(
      `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, old_status, new_status, reason, metadata, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, 'Vacancy', $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        vacancy.company_id,
        req.user.id,
        req.user.role || 'SUPER_ADMIN',
        `VACANCY_${normalizedStatus}`,
        id,
        prevStatus,
        normalizedStatus,
        finalNote,
        JSON.stringify({ roleTitle: updatedVacancy.title, companyName: vacancy.company_name }),
        JSON.stringify({ status: prevStatus }),
        JSON.stringify({ status: normalizedStatus, review_note: finalNote }),
        req.ip || null,
      ]
    );

    await client.query('COMMIT');

    if (normalizedStatus === 'APPROVED') {
      try {
        const companyUserRes = await pool.query(
          `SELECT u.email, u.first_name, u.last_name
           FROM company_members cm
           JOIN users u ON u.id = cm.user_id
           WHERE cm.company_id = $1 AND u.is_active = TRUE
           LIMIT 1`,
          [vacancy.company_id]
        );
        if (companyUserRes.rowCount > 0) {
          const compUser = companyUserRes.rows[0];
          const { sendVacancyApprovedNotification } = require('../services/email');
          const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
          sendVacancyApprovedNotification({
            to: compUser.email,
            companyUserName: `${compUser.first_name || ''} ${compUser.last_name || ''}`.trim() || 'Hiring Lead',
            vacancyTitle: updatedVacancy.title,
            companyName: vacancy.company_name || 'Your Organization',
            actionUrl: `${frontendUrl}/dashboard/vacancies/${id}`,
          }).catch((err) => console.warn('Vacancy approved email note:', err.message));
        }
      } catch (_) {}
    }

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
    return res.status(500).json({ error: err.message || 'Failed to update vacancy status' });
  } finally {
    try { client.release(); } catch (_) {}
  }
}

module.exports = {
  updateCompanyStatus,
  updateVacancyStatus,
};
