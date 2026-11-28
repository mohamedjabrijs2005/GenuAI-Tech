const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../database/pool');
const { logAudit } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const ALLOWED_MEMBER_ROLES = ['COMPANY_OWNER', 'COMPANY_RECRUITER'];

function normalizeMemberRole(role) {
  const r = String(role || '').trim().toUpperCase();
  if (r === 'OWNER' || r === 'COMPANY_ADMIN' || r === 'ADMIN' || r === 'COMPANY_OWNER') return 'COMPANY_OWNER';
  if (r === 'RECRUITER' || r === 'COMPANY_RECRUITER' || r === 'HR') return 'COMPANY_RECRUITER';
  return null;
}

async function listMembers(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT cm.id AS member_id, cm.company_id, cm.user_id, cm.member_role,
              COALESCE(cm.is_active, TRUE) AS is_active, cm.created_at, cm.updated_at,
              u.email, u.first_name, u.last_name, u.is_active AS user_is_active
       FROM company_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.company_id = $1
       ORDER BY (cm.member_role = 'COMPANY_OWNER') DESC, cm.created_at ASC`,
      [companyId]
    );
    return sendSuccess(res, { members: result.rows });
  } catch (err) {
    console.error('List company members error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to load company team members' });
  }
}

async function inviteMember(req, res) {
  const companyId = req.companyMembership.company_id;
  const { email, firstName, lastName, role, memberRole, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = normalizeMemberRole(memberRole || role || 'COMPANY_RECRUITER');

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return sendError(res, { statusCode: 422, error: 'Valid email is required', code: 'VALIDATION_ERROR' });
  }
  if (!normalizedRole || !ALLOWED_MEMBER_ROLES.includes(normalizedRole)) {
    return sendError(res, { statusCode: 422, error: 'Role must be COMPANY_OWNER or COMPANY_RECRUITER', code: 'VALIDATION_ERROR' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    );

    let userId;
    let tempPassword = null;

    if (existingUser.rowCount > 0) {
      const existing = existingUser.rows[0];
      const existingMember = await client.query(
        'SELECT id, company_id FROM company_members WHERE user_id = $1 LIMIT 1',
        [existing.id]
      );
      if (existingMember.rowCount > 0) {
        await client.query('ROLLBACK');
        const msg = existingMember.rows[0].company_id === companyId
          ? 'User is already a member of your company'
          : 'User already belongs to another company workspace';
        return sendError(res, { statusCode: 409, error: msg, code: 'CONFLICT' });
      }
      if (['CANDIDATE', 'APPLICANT', 'SUPER_ADMIN', 'GENUAI_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN'].includes(String(existing.role || '').toUpperCase())) {
        await client.query('ROLLBACK');
        return sendError(res, { statusCode: 409, error: 'Existing account role cannot be added as a company team member', code: 'ROLE_CONFLICT' });
      }
      userId = existing.id;
      await client.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [normalizedRole, userId]);
    } else {
      tempPassword = password && String(password).length >= 8
        ? String(password)
        : `GenuAI-${crypto.randomBytes(6).toString('hex')}!`;
      const hash = await bcrypt.hash(tempPassword, 10);
      const userIns = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
         RETURNING id`,
        [
          normalizedEmail,
          hash,
          String(firstName || 'Team').trim(),
          String(lastName || 'Recruiter').trim(),
          normalizedRole,
        ]
      );
      userId = userIns.rows[0].id;
    }

    const memIns = await client.query(
      `INSERT INTO company_members (company_id, user_id, member_role, is_active, invited_by)
       VALUES ($1, $2, $3, TRUE, $4)
       RETURNING id AS member_id, company_id, user_id, member_role, is_active, created_at`,
      [companyId, userId, normalizedRole, req.user.id]
    );

    await logAudit(client, {
      companyId,
      user: req.user,
      actorRole: req.companyMembership.member_role || req.user.role,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'CompanyMember',
      entityId: memIns.rows[0].member_id,
      newStatus: normalizedRole,
      details: { invitedEmail: normalizedEmail, memberRole: normalizedRole },
      ipAddress: req.ip || null,
    });

    await client.query('COMMIT');
    return sendSuccess(res, {
      member: {
        ...memIns.rows[0],
        email: normalizedEmail,
        first_name: firstName || existingUser.rows[0]?.first_name || 'Team',
        last_name: lastName || existingUser.rows[0]?.last_name || 'Recruiter',
      },
      ...(tempPassword ? { temporaryPassword: tempPassword } : {}),
      message: 'Team member invited successfully',
    }, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Invite member error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to invite team member' });
  } finally {
    client.release();
  }
}

async function updateMemberRole(req, res) {
  const companyId = req.companyMembership.company_id;
  const { memberId } = req.params;
  const normalizedRole = normalizeMemberRole(req.body?.memberRole || req.body?.role);

  if (!normalizedRole) {
    return sendError(res, { statusCode: 422, error: 'Role must be COMPANY_OWNER or COMPANY_RECRUITER', code: 'VALIDATION_ERROR' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query(
      'SELECT id, user_id, member_role FROM company_members WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [memberId, companyId]
    );
    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 404, error: 'Team member not found', code: 'NOT_FOUND' });
    }
    const existing = existingRes.rows[0];
    if (existing.user_id === req.user.id && normalizedRole !== 'COMPANY_OWNER') {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 400, error: 'You cannot demote your own owner role', code: 'SELF_DEMOTION_FORBIDDEN' });
    }

    const upd = await client.query(
      `UPDATE company_members SET member_role = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING id AS member_id, company_id, user_id, member_role, is_active`,
      [normalizedRole, memberId, companyId]
    );
    await client.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [normalizedRole, existing.user_id]);

    await logAudit(client, {
      companyId,
      user: req.user,
      actorRole: req.companyMembership.member_role || req.user.role,
      action: 'TEAM_MEMBER_ROLE_UPDATED',
      entityType: 'CompanyMember',
      entityId: memberId,
      oldStatus: existing.member_role,
      newStatus: normalizedRole,
      ipAddress: req.ip || null,
    });

    await client.query('COMMIT');
    return sendSuccess(res, { member: upd.rows[0], message: 'Member role updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update member role error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to update member role' });
  } finally {
    client.release();
  }
}

async function updateMemberStatus(req, res) {
  const companyId = req.companyMembership.company_id;
  const { memberId } = req.params;
  const isActive = Boolean(req.body?.isActive);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query(
      'SELECT id, user_id, member_role, is_active FROM company_members WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [memberId, companyId]
    );
    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 404, error: 'Team member not found', code: 'NOT_FOUND' });
    }
    const existing = existingRes.rows[0];
    if (existing.user_id === req.user.id && !isActive) {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 400, error: 'You cannot deactivate your own membership', code: 'SELF_DEACTIVATE_FORBIDDEN' });
    }

    const upd = await client.query(
      `UPDATE company_members SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING id AS member_id, company_id, user_id, member_role, is_active`,
      [isActive, memberId, companyId]
    );
    await client.query(
      'UPDATE users SET is_active = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
      [isActive, existing.user_id]
    );

    await logAudit(client, {
      companyId,
      user: req.user,
      actorRole: req.companyMembership.member_role || req.user.role,
      action: isActive ? 'TEAM_MEMBER_ACTIVATED' : 'TEAM_MEMBER_DEACTIVATED',
      entityType: 'CompanyMember',
      entityId: memberId,
      oldStatus: existing.is_active ? 'ACTIVE' : 'INACTIVE',
      newStatus: isActive ? 'ACTIVE' : 'INACTIVE',
      ipAddress: req.ip || null,
    });

    await client.query('COMMIT');
    return sendSuccess(res, { member: upd.rows[0], message: `Member ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update member status error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to update member status' });
  } finally {
    client.release();
  }
}

async function removeMember(req, res) {
  const companyId = req.companyMembership.company_id;
  const { memberId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingRes = await client.query(
      'SELECT id, user_id, member_role FROM company_members WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [memberId, companyId]
    );
    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 404, error: 'Team member not found', code: 'NOT_FOUND' });
    }
    const existing = existingRes.rows[0];
    if (existing.user_id === req.user.id) {
      await client.query('ROLLBACK');
      return sendError(res, { statusCode: 400, error: 'You cannot remove yourself from the company', code: 'SELF_REMOVE_FORBIDDEN' });
    }

    await client.query('DELETE FROM company_members WHERE id = $1 AND company_id = $2', [memberId, companyId]);
    await client.query('UPDATE users SET is_active = FALSE, token_version = token_version + 1, updated_at = NOW() WHERE id = $1', [existing.user_id]);

    await logAudit(client, {
      companyId,
      user: req.user,
      actorRole: req.companyMembership.member_role || req.user.role,
      action: 'TEAM_MEMBER_REMOVED',
      entityType: 'CompanyMember',
      entityId: memberId,
      oldStatus: existing.member_role,
      newStatus: 'REMOVED',
      ipAddress: req.ip || null,
    });

    await client.query('COMMIT');
    return sendSuccess(res, { message: 'Team member removed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Remove member error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to remove team member' });
  } finally {
    client.release();
  }
}

module.exports = {
  listMembers,
  inviteMember,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
};
