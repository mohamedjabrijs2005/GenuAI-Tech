const pool = require('../database/pool');
const { generateRoleBlueprint } = require('./aiRoleBlueprintGenerator');
const { logAudit } = require('./auditService');

function mapRequirementRow(item, index = 0) {
  const impRaw = String(item.importance || item.reqType || 'REQUIRED').toUpperCase();
  const isPreferred = impRaw.includes('PREFERRED') || impRaw.includes('GOOD') || impRaw.includes('OPTIONAL');
  return {
    name: String(item.name || '').trim(),
    description: item.description ? String(item.description).trim() : null,
    category: item.category ? String(item.category).trim() : 'Technical',
    reqType: isPreferred ? 'Preferred' : 'Required',
    importance: isPreferred ? 'PREFERRED' : 'REQUIRED',
    priority: isPreferred ? 'Medium' : 'High',
    proficiency: item.proficiency || 'Intermediate',
    evalMethod: item.evalMethod || 'Official Technical Assessment',
    displayOrder: index + 1,
    weight: Number(item.weight) > 0 ? Number(item.weight) : 1.0,
  };
}

async function getVacancyOwned(db, vacancyId, companyId) {
  const res = await db.query(
    `SELECT id, company_id, title, job_description, status
     FROM company_roles
     WHERE id = $1 AND company_id = $2`,
    [vacancyId, companyId]
  );
  return res.rowCount > 0 ? res.rows[0] : null;
}

async function getChecklist(vacancyId, companyId) {
  const vacancy = await getVacancyOwned(pool, vacancyId, companyId);
  if (!vacancy) return null;

  const [clRes, reqRes] = await Promise.all([
    pool.query(
      `SELECT * FROM vacancy_skill_checklists
       WHERE vacancy_id = $1
       ORDER BY version DESC LIMIT 1`,
      [vacancyId]
    ),
    pool.query(
      `SELECT id, name, description, category, req_type, importance, priority, proficiency, display_order, weight
       FROM requirements
       WHERE role_id = $1 AND company_id = $2
       ORDER BY display_order ASC, created_at ASC`,
      [vacancyId, companyId]
    ),
  ]);

  return {
    vacancyId,
    vacancyTitle: vacancy.title,
    checklist: clRes.rows[0] || {
      vacancy_id: vacancyId,
      company_id: companyId,
      version: 1,
      status: reqRes.rowCount > 0 ? 'draft' : 'draft',
      source: 'manual',
    },
    items: reqRes.rows,
  };
}

async function replaceRequirements(client, vacancyId, companyId, mappedItems) {
  await client.query(
    'DELETE FROM requirements WHERE role_id = $1 AND company_id = $2',
    [vacancyId, companyId]
  );

  const inserted = [];
  for (const item of mappedItems) {
    const r = await client.query(
      `INSERT INTO requirements
         (role_id, company_id, name, description, category, req_type, priority,
          proficiency, eval_method, requirement_type, importance, display_order, weight)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SKILL', $10, $11, $12)
       RETURNING *`,
      [
        vacancyId,
        companyId,
        item.name,
        item.description,
        item.category,
        item.reqType,
        item.priority,
        item.proficiency,
        item.evalMethod,
        item.importance,
        item.displayOrder,
        item.weight,
      ]
    );
    inserted.push(r.rows[0]);
  }
  return inserted;
}

/**
 * Step 2 of spine: generate rule/preset-based skill checklist (draft -> ai_generated).
 * No external LLM calls in Phase 1.
 */
async function generateChecklist(vacancyId, companyId, user, options = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vacancy = await getVacancyOwned(client, vacancyId, companyId);
    if (!vacancy) {
      await client.query('ROLLBACK');
      const err = new Error('Vacancy not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    const latestRes = await client.query(
      `SELECT * FROM vacancy_skill_checklists WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE`,
      [vacancyId]
    );
    const latest = latestRes.rows[0];
    if (latest && latest.status === 'locked') {
      await client.query('ROLLBACK');
      const err = new Error('Checklist is locked and cannot be regenerated');
      err.statusCode = 409;
      throw err;
    }

    let rawItems = Array.isArray(options.items) && options.items.length > 0 ? options.items : null;
    let source = 'manual';
    if (!rawItems) {
      const bp = generateRoleBlueprint(vacancy.title, vacancy.job_description || '', {
        includeCommon: options.includeCommon !== false,
      });
      rawItems = bp.suggestedSkills;
      source = 'ai'; // preset/rules generator in Phase 1
    }

    const mapped = rawItems.map(mapRequirementRow).filter((x) => x.name);
    const items = await replaceRequirements(client, vacancyId, companyId, mapped);

    const nextStatus = 'ai_generated';
    let checklist;
    if (latest) {
      const upd = await client.query(
        `UPDATE vacancy_skill_checklists
         SET status = $1, source = $2, approved_by = NULL, approved_at = NULL, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [nextStatus, source, latest.id]
      );
      checklist = upd.rows[0];
    } else {
      const ins = await client.query(
        `INSERT INTO vacancy_skill_checklists (vacancy_id, company_id, version, status, source)
         VALUES ($1, $2, 1, $3, $4) RETURNING *`,
        [vacancyId, companyId, nextStatus, source]
      );
      checklist = ins.rows[0];
    }

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'COMPANY',
      action: 'VACANCY_CHECKLIST_GENERATED',
      entityType: 'VacancyChecklist',
      entityId: checklist.id,
      oldStatus: latest?.status || null,
      newStatus: nextStatus,
      reason: `Generated ${items.length} skill checklist items (${source})`,
      details: { vacancyId, itemCount: items.length, source },
    });

    await client.query('COMMIT');
    return { checklist, items };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function updateChecklistItems(vacancyId, companyId, user, rawItems) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vacancy = await getVacancyOwned(client, vacancyId, companyId);
    if (!vacancy) {
      await client.query('ROLLBACK');
      const err = new Error('Vacancy not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    const latestRes = await client.query(
      `SELECT * FROM vacancy_skill_checklists WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE`,
      [vacancyId]
    );
    const latest = latestRes.rows[0];
    if (latest && latest.status === 'locked') {
      await client.query('ROLLBACK');
      const err = new Error('Checklist is locked and cannot be edited');
      err.statusCode = 409;
      throw err;
    }

    const mapped = rawItems.map(mapRequirementRow).filter((x) => x.name);
    if (mapped.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('At least one valid skill item is required');
      err.statusCode = 400;
      throw err;
    }

    const items = await replaceRequirements(client, vacancyId, companyId, mapped);

    let checklist;
    if (latest) {
      // Editing an already-approved checklist moves it back to draft for fresh HR sign-off
      const nextStatus = latest.status === 'approved' ? 'draft' : latest.status;
      const upd = await client.query(
        `UPDATE vacancy_skill_checklists
         SET status = $1, approved_by = NULL, approved_at = NULL, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [nextStatus, latest.id]
      );
      checklist = upd.rows[0];
    } else {
      const ins = await client.query(
        `INSERT INTO vacancy_skill_checklists (vacancy_id, company_id, version, status, source)
         VALUES ($1, $2, 1, 'draft', 'manual') RETURNING *`,
        [vacancyId, companyId]
      );
      checklist = ins.rows[0];
    }

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'COMPANY',
      action: 'VACANCY_CHECKLIST_UPDATED',
      entityType: 'VacancyChecklist',
      entityId: checklist.id,
      oldStatus: latest?.status || null,
      newStatus: checklist.status,
      reason: `Updated checklist items (${items.length} skills)`,
      details: { vacancyId, itemCount: items.length },
    });

    await client.query('COMMIT');
    return { checklist, items };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Step 3 of spine: HR approves (and optionally locks) the vacancy skill checklist.
 */
async function approveChecklist(vacancyId, companyId, user, { notes = null, lockNow = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vacancy = await getVacancyOwned(client, vacancyId, companyId);
    if (!vacancy) {
      await client.query('ROLLBACK');
      const err = new Error('Vacancy not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    const reqCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM requirements WHERE role_id = $1 AND company_id = $2',
      [vacancyId, companyId]
    );
    if (reqCountRes.rows[0].count === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Cannot approve an empty checklist. Generate or add skill items first.');
      err.statusCode = 400;
      throw err;
    }

    const latestRes = await client.query(
      `SELECT * FROM vacancy_skill_checklists WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE`,
      [vacancyId]
    );
    const latest = latestRes.rows[0];
    if (latest && latest.status === 'locked') {
      await client.query('ROLLBACK');
      const err = new Error('Checklist is already locked');
      err.statusCode = 409;
      throw err;
    }

    const nextStatus = lockNow ? 'locked' : 'approved';
    let checklist;
    if (latest) {
      const upd = await client.query(
        `UPDATE vacancy_skill_checklists
         SET status = $1, approved_by = $2, approved_at = NOW(), notes = COALESCE($3, notes), updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [nextStatus, user.id, notes, latest.id]
      );
      checklist = upd.rows[0];
    } else {
      const ins = await client.query(
        `INSERT INTO vacancy_skill_checklists
           (vacancy_id, company_id, version, status, source, approved_by, approved_at, notes)
         VALUES ($1, $2, 1, $3, 'manual', $4, NOW(), $5) RETURNING *`,
        [vacancyId, companyId, nextStatus, user.id, notes]
      );
      checklist = ins.rows[0];
    }

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'COMPANY',
      action: lockNow ? 'VACANCY_CHECKLIST_APPROVED_AND_LOCKED' : 'VACANCY_CHECKLIST_APPROVED',
      entityType: 'VacancyChecklist',
      entityId: checklist.id,
      oldStatus: latest?.status || 'draft',
      newStatus: nextStatus,
      reason: notes || 'HR approved vacancy skill checklist',
      details: { vacancyId, itemCount: reqCountRes.rows[0].count },
    });

    await client.query('COMMIT');
    return { checklist };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function lockChecklist(vacancyId, companyId, user, { notes = null } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vacancy = await getVacancyOwned(client, vacancyId, companyId);
    if (!vacancy) {
      await client.query('ROLLBACK');
      const err = new Error('Vacancy not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    const latestRes = await client.query(
      `SELECT * FROM vacancy_skill_checklists WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE`,
      [vacancyId]
    );
    const latest = latestRes.rows[0];
    if (!latest || (latest.status !== 'approved' && latest.status !== 'locked')) {
      await client.query('ROLLBACK');
      const err = new Error('Checklist must be approved before it can be locked');
      err.statusCode = 400;
      throw err;
    }
    if (latest.status === 'locked') {
      await client.query('COMMIT');
      return { checklist: latest, alreadyLocked: true };
    }

    const upd = await client.query(
      `UPDATE vacancy_skill_checklists
       SET status = 'locked', notes = COALESCE($1, notes), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [notes, latest.id]
    );
    const checklist = upd.rows[0];

    await logAudit(client, {
      companyId,
      user,
      actorRole: 'COMPANY',
      action: 'VACANCY_CHECKLIST_LOCKED',
      entityType: 'VacancyChecklist',
      entityId: checklist.id,
      oldStatus: latest.status,
      newStatus: 'locked',
      reason: notes || 'HR locked vacancy skill checklist',
      details: { vacancyId },
    });

    await client.query('COMMIT');
    return { checklist };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getChecklist,
  generateChecklist,
  updateChecklistItems,
  approveChecklist,
  lockChecklist,
};
