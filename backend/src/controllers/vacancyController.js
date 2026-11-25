const pool = require('../database/pool');
const vacancyChecklistService = require('../services/vacancyChecklistService');

async function getChecklist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const data = await vacancyChecklistService.getChecklist(req.params.id, companyId);
    if (!data) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }
    return res.json(data);
  } catch (err) {
    console.error('Get checklist error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to load checklist' });
  }
}

async function generateChecklist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await vacancyChecklistService.generateChecklist(
      req.params.id,
      companyId,
      req.user,
      req.body || {}
    );
    return res.status(201).json({
      ...result,
      message: 'Skill checklist generated',
    });
  } catch (err) {
    console.error('Generate checklist error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to generate checklist' });
  }
}

async function updateChecklistItems(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await vacancyChecklistService.updateChecklistItems(
      req.params.id,
      companyId,
      req.user,
      req.body.items
    );
    return res.json({
      ...result,
      message: 'Checklist items updated',
    });
  } catch (err) {
    console.error('Update checklist items error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update checklist' });
  }
}

async function approveChecklist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await vacancyChecklistService.approveChecklist(
      req.params.id,
      companyId,
      req.user,
      { notes: req.body?.notes, lockNow: Boolean(req.body?.lockNow) }
    );
    return res.json({
      ...result,
      message: result.checklist.status === 'locked' ? 'Checklist approved and locked' : 'Checklist approved',
    });
  } catch (err) {
    console.error('Approve checklist error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to approve checklist' });
  }
}

async function lockChecklist(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await vacancyChecklistService.lockChecklist(
      req.params.id,
      companyId,
      req.user,
      { notes: req.body?.notes }
    );
    return res.json({
      ...result,
      message: 'Checklist locked',
    });
  } catch (err) {
    console.error('Lock checklist error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to lock checklist' });
  }
}

async function getRequirements(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT r.* FROM requirements r
       JOIN company_roles cr ON cr.id = r.role_id
       WHERE r.role_id = $1 AND cr.company_id = $2 ORDER BY r.display_order ASC, r.created_at ASC`,
      [req.params.id, companyId]
    );
    return res.json({ requirements: result.rows });
  } catch (err) {
    console.error('Get requirements error:', err);
    return res.status(500).json({ error: 'Failed to fetch requirements' });
  }
}

async function createRequirement(req, res) {
  try {
    const companyId = req.companyMembership.company_id;
    const roleId = req.params.id;
    const {
      name,
      description,
      category,
      reqType,
      priority,
      proficiency,
      evalMethod,
      evaluationMethods,
      requirementType,
      importance,
      weight,
    } = req.body;

    const vacCheck = await pool.query(
      'SELECT id, status FROM company_roles WHERE id = $1 AND company_id = $2',
      [roleId, companyId]
    );
    if (vacCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found in your company' });
    }

    const clCheck = await pool.query(
      `SELECT status FROM vacancy_skill_checklists WHERE vacancy_id = $1 ORDER BY version DESC LIMIT 1`,
      [roleId]
    );
    if (clCheck.rowCount > 0 && clCheck.rows[0].status === 'locked') {
      return res.status(409).json({ error: 'Checklist is locked and cannot be modified' });
    }

    const normalizedReqType = reqType || (importance ? (importance.toUpperCase() === 'REQUIRED' ? 'Required' : 'Preferred') : 'Required');
    const normalizedImportance = importance || (reqType ? reqType.toUpperCase() : 'REQUIRED');
    const normalizedType = requirementType || (category ? category.toUpperCase() : 'SKILL');
    const normalizedEvalMethods = evaluationMethods || [evalMethod || 'ASSESSMENT'];

    const result = await pool.query(
      `INSERT INTO requirements
       (role_id, company_id, name, description, category, req_type, priority,
        proficiency, eval_method, requirement_type, importance, evaluation_methods, weight)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        roleId,
        companyId,
        name,
        description || null,
        category || 'Technical',
        normalizedReqType,
        priority || 'High',
        proficiency || 'Intermediate',
        evalMethod || 'Official Technical Assessment',
        normalizedType,
        normalizedImportance,
        JSON.stringify(normalizedEvalMethods),
        weight || 1.0,
      ]
    );

    return res.status(201).json({ requirement: result.rows[0] });
  } catch (err) {
    console.error('Create requirement error:', err);
    return res.status(500).json({ error: 'Failed to create requirement' });
  }
}

module.exports = {
  getChecklist,
  generateChecklist,
  updateChecklistItems,
  approveChecklist,
  lockChecklist,
  getRequirements,
  createRequirement,
};
