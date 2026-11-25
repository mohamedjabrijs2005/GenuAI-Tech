const pool = require('../database/pool');

/**
 * Persist an immutable governance/workflow entry into audit_logs.
 * Safely writes both legacy (user_id, details) and canonical (actor_user_id, metadata) columns.
 */
async function logAudit(dbOrPool, {
  companyId = null,
  user = null,
  userId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  oldStatus = null,
  newStatus = null,
  reason = null,
  details = {},
  ipAddress = null,
}) {
  const db = dbOrPool || pool;
  const resolvedUserId = user?.id || userId || null;
  const actorName = user
    ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.email || 'User'
    : 'System';
  const actorEmail = user?.email || null;
  const resolvedRole = actorRole || user?.role || null;
  const serialized = JSON.stringify(details || {});

  await db.query(
    `INSERT INTO audit_logs
       (company_id, user_id, actor_user_id, actor_name, actor_email, actor_role,
        action, entity_type, entity_id, old_status, new_status, reason, details, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $14)`,
    [
      companyId,
      resolvedUserId,
      resolvedUserId,
      actorName,
      actorEmail,
      resolvedRole,
      action,
      entityType,
      entityId ? String(entityId) : null,
      oldStatus,
      newStatus,
      reason,
      serialized,
      ipAddress,
    ]
  );
}

module.exports = { logAudit };
