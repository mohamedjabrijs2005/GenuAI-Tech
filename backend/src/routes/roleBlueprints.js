const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');
const { generateRoleBlueprint, ROLE_PRESETS, COMMON_SKILLS } = require('../services/aiRoleBlueprintGenerator');

const router = express.Router();

// Strict authentication & tenant enforcement
// Non-company accounts (such as CANDIDATE) are blocked with 403 Forbidden
router.use(authenticate);
router.use(requireCompany);

// ============================================================
// GET /api/company/role-blueprints/supported-roles
// Returns list of supported roles and optional common skills
// ============================================================
router.get('/supported-roles', (req, res) => {
  return res.json({
    supportedRoles: Object.keys(ROLE_PRESETS),
    commonSkills: COMMON_SKILLS,
  });
});

// ============================================================
// GET /api/company/role-blueprints/approved
// Returns all approved blueprints for the company
// ============================================================
router.get('/approved', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes
       FROM ai_role_blueprint_suggestions s
       LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       WHERE s.company_id = $1 AND s.status = 'APPROVED'
       ORDER BY s.updated_at DESC`,
      [companyId]
    );
    return res.json({ blueprints: result.rows });
  } catch (err) {
    console.error('Fetch approved blueprints error:', err);
    return res.status(500).json({ error: 'Failed to fetch approved blueprints' });
  }
});

// ============================================================
// GET /api/company/role-blueprints/approved
// Returns all approved blueprints for the authenticated company
// for direct import into vacancy creation or role master
// ============================================================
router.get('/approved', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const result = await pool.query(
      `SELECT s.id, s.role_title, s.role_description, s.role_master_id,
              s.suggested_skills, s.suggested_learning_paths,
              s.suggested_flashcards, s.suggested_practice_tasks,
              s.suggested_assessment_ideas, s.suggested_evidence_types,
              s.status, s.created_at, s.updated_at,
              a.approved_at, a.approval_notes
       FROM ai_role_blueprint_suggestions s
       JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       WHERE s.company_id = $1 AND s.status = 'APPROVED'
       ORDER BY a.approved_at DESC`,
      [companyId]
    );

    return res.json({ blueprints: result.rows });
  } catch (err) {
    console.error('List approved blueprints error:', err);
    return res.status(500).json({ error: 'Failed to fetch approved blueprints' });
  }
});

// ============================================================
// POST /api/company/vacancies/ai-suggest-blueprint
// AND POST /api/company/role-blueprints/ai-suggest
// Integrated endpoint: generates draft suggestions based on role title,
// description, department, and role master / vacancy context.
// Checks if an approved blueprint already exists for the role master.
// ============================================================
const handleAiSuggest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership.company_id;
  const {
    roleTitle,
    roleDescription,
    roleMasterId,
    vacancyId,
    departmentId,
    includeCommon,
  } = req.body;

  let finalRoleTitle = (roleTitle || '').trim();
  let finalDescription = (roleDescription || '').trim();
  let finalDeptId = departmentId;

  // 1. If roleMasterId is provided, verify it belongs to this company and load its info
  let existingApprovedBlueprint = null;
  if (roleMasterId) {
    const roleCheck = await pool.query(
      `SELECT r.id, r.title, r.job_description, r.department_id, r.approved_role_blueprint_id,
              d.name AS department_name
       FROM company_roles r
       LEFT JOIN departments d ON d.id = r.department_id
       WHERE r.id = $1 AND r.company_id = $2`,
      [roleMasterId, companyId]
    );

    if (roleCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Role Master not found for this company' });
    }

    const roleData = roleCheck.rows[0];
    if (!finalRoleTitle) finalRoleTitle = roleData.title;
    if (!finalDescription && roleData.job_description) finalDescription = roleData.job_description;
    if (!finalDeptId && roleData.department_id) finalDeptId = roleData.department_id;

    // Check if an approved blueprint already exists for this role master
    const existingBpRes = await pool.query(
      `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes
       FROM ai_role_blueprint_suggestions s
       LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       WHERE (s.role_master_id = $1 OR s.id = $2)
         AND s.company_id = $3 AND s.status = 'APPROVED'
       ORDER BY s.updated_at DESC LIMIT 1`,
      [roleMasterId, roleData.approved_role_blueprint_id || null, companyId]
    );

    if (existingBpRes.rowCount > 0) {
      existingApprovedBlueprint = existingBpRes.rows[0];
    }
  }

  // 2. If vacancyId is provided, verify and check for existing blueprint
  if (vacancyId) {
    const vacCheck = await pool.query(
      `SELECT id, title, job_description, department_id, approved_role_blueprint_id, role_master_id
       FROM company_roles
       WHERE id = $1 AND company_id = $2`,
      [vacancyId, companyId]
    );

    if (vacCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found for this company' });
    }

    const vac = vacCheck.rows[0];
    if (!finalRoleTitle && vac.title) finalRoleTitle = vac.title;
    if (!finalDescription && vac.job_description) finalDescription = vac.job_description;
    if (!finalDeptId && vac.department_id) finalDeptId = vac.department_id;

    if (!existingApprovedBlueprint && vac.approved_role_blueprint_id) {
      const existingVacBp = await pool.query(
        `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes
         FROM ai_role_blueprint_suggestions s
         LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
         WHERE s.id = $1 AND s.company_id = $2 AND s.status = 'APPROVED'`,
        [vac.approved_role_blueprint_id, companyId]
      );
      if (existingVacBp.rowCount > 0) {
        existingApprovedBlueprint = existingVacBp.rows[0];
      }
    }
  }

  if (!finalRoleTitle) {
    return res.status(422).json({ error: 'Role title is required to generate AI suggestions.' });
  }

  try {
    // Generate AI draft blueprint
    const blueprint = generateRoleBlueprint(finalRoleTitle, finalDescription, { includeCommon });

    // Save as strictly DRAFT in database
    const insertRes = await pool.query(
      `INSERT INTO ai_role_blueprint_suggestions
         (role_master_id, vacancy_id, company_id, role_title, role_description,
          suggested_skills, suggested_learning_paths, suggested_flashcards,
          suggested_practice_tasks, suggested_assessment_ideas, suggested_evidence_types,
          ai_model, prompt_version, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'DRAFT')
       RETURNING *`,
      [
        roleMasterId || null,
        vacancyId || null,
        companyId,
        finalRoleTitle,
        finalDescription,
        JSON.stringify(blueprint.suggestedSkills),
        JSON.stringify(blueprint.suggestedLearningPaths),
        JSON.stringify(blueprint.suggestedFlashcards),
        JSON.stringify(blueprint.suggestedPracticeTasks),
        JSON.stringify(blueprint.suggestedAssessmentIdeas),
        JSON.stringify(blueprint.suggestedEvidenceTypes),
        blueprint.aiModel,
        blueprint.promptVersion,
      ]
    );

    const savedSuggestion = insertRes.rows[0];

    return res.status(201).json({
      message: 'AI Blueprint suggestions generated as DRAFT. Review and approve before activating.',
      suggestion: savedSuggestion,
      existingApprovedBlueprint,
      safetyNotice: blueprint.safetyNotice,
    });
  } catch (err) {
    console.error('AI suggest blueprint error:', err);
    return res.status(500).json({ error: 'Failed to generate AI role blueprint suggestions' });
  }
};

router.post(
  '/ai-suggest',
  [
    body('roleTitle').optional().trim(),
    body('roleDescription').optional().trim(),
    body('roleMasterId').optional().isUUID(),
    body('vacancyId').optional().isUUID(),
    body('includeCommon').optional().isBoolean(),
  ],
  handleAiSuggest
);

router.post(
  '/vacancies/ai-suggest-blueprint',
  [
    body('roleTitle').optional().trim(),
    body('roleDescription').optional().trim(),
    body('roleMasterId').optional().isUUID(),
    body('vacancyId').optional().isUUID(),
    body('includeCommon').optional().isBoolean(),
  ],
  handleAiSuggest
);

// ============================================================
// GET /api/company/role-masters/:id/blueprint
// AND GET /api/company/roles/:id/blueprint
// Load existing approved blueprint for a Role Master
// ============================================================
const handleGetRoleMasterBlueprint = async (req, res) => {
  const companyId = req.companyMembership.company_id;
  const { id } = req.params;

  try {
    // 1. Verify role belongs to company
    const roleRes = await pool.query(
      'SELECT id, title, approved_role_blueprint_id FROM company_roles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (roleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Role Master not found' });
    }

    const role = roleRes.rows[0];

    // 2. Fetch approved blueprint
    const bpRes = await pool.query(
      `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes,
              u.first_name AS approver_first_name, u.last_name AS approver_last_name
       FROM ai_role_blueprint_suggestions s
       LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       LEFT JOIN users u ON u.id = a.approved_by
       WHERE (s.role_master_id = $1 OR s.id = $2)
         AND s.company_id = $3 AND s.status = 'APPROVED'
       ORDER BY s.updated_at DESC LIMIT 1`,
      [id, role.approved_role_blueprint_id || null, companyId]
    );

    return res.json({
      roleId: role.id,
      roleTitle: role.title,
      blueprint: bpRes.rowCount > 0 ? bpRes.rows[0] : null,
    });
  } catch (err) {
    console.error('Get role master blueprint error:', err);
    return res.status(500).json({ error: 'Failed to fetch role blueprint' });
  }
};

router.get('/role-masters/:id/blueprint', [param('id').isUUID()], handleGetRoleMasterBlueprint);
router.get('/roles/:id/blueprint', [param('id').isUUID()], handleGetRoleMasterBlueprint);

// ============================================================
// GET /api/company/vacancies/:id/blueprint
// Load blueprint linked to a vacancy
// ============================================================
const handleGetVacancyBlueprint = async (req, res) => {
  const companyId = req.companyMembership.company_id;
  const { id } = req.params;

  try {
    const vacRes = await pool.query(
      'SELECT id, title, role_master_id, approved_role_blueprint_id FROM company_roles WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (vacRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    const vac = vacRes.rows[0];

    const bpRes = await pool.query(
      `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes,
              u.first_name AS approver_first_name, u.last_name AS approver_last_name
       FROM ai_role_blueprint_suggestions s
       LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       LEFT JOIN users u ON u.id = a.approved_by
       WHERE (s.vacancy_id = $1 OR s.id = $2 OR (s.role_master_id IS NOT NULL AND s.role_master_id = $3))
         AND s.company_id = $4
       ORDER BY (s.status = 'APPROVED') DESC, s.updated_at DESC LIMIT 1`,
      [id, vac.approved_role_blueprint_id || null, vac.role_master_id || null, companyId]
    );

    return res.json({
      vacancyId: vac.id,
      vacancyTitle: vac.title,
      blueprint: bpRes.rowCount > 0 ? bpRes.rows[0] : null,
    });
  } catch (err) {
    console.error('Get vacancy blueprint error:', err);
    return res.status(500).json({ error: 'Failed to fetch vacancy blueprint' });
  }
};

router.get('/vacancies/:id/blueprint', [param('id').isUUID()], handleGetVacancyBlueprint);

// ============================================================
// GET /api/company/ai-suggestions/:suggestionId
// Fetch a specific suggestion (tenant-scoped)
// ============================================================
const handleGetSuggestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership.company_id;
  const { suggestionId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.*, a.approved_at, a.approved_by, a.approval_notes,
              u.first_name AS approver_first_name, u.last_name AS approver_last_name
       FROM ai_role_blueprint_suggestions s
       LEFT JOIN role_blueprint_approval a ON a.role_blueprint_id = s.id
       LEFT JOIN users u ON u.id = a.approved_by
       WHERE s.id = $1 AND s.company_id = $2`,
      [suggestionId, companyId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Blueprint suggestion not found' });
    }

    return res.json({ suggestion: result.rows[0] });
  } catch (err) {
    console.error('Get suggestion error:', err);
    return res.status(500).json({ error: 'Failed to fetch suggestion' });
  }
};

router.get('/ai-suggestions/:suggestionId', [param('suggestionId').isUUID()], handleGetSuggestion);

// ============================================================
// PUT /api/company/ai-suggestions/:suggestionId
// Edit and customize draft AI suggestions
// ============================================================
const handleUpdateSuggestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership.company_id;
  const { suggestionId } = req.params;

  try {
    // Tenant check & ensure suggestion exists
    const checkRes = await pool.query(
      'SELECT id, status FROM ai_role_blueprint_suggestions WHERE id = $1 AND company_id = $2',
      [suggestionId, companyId]
    );

    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Blueprint suggestion not found' });
    }

    const {
      suggestedSkills,
      suggestedLearningPaths,
      suggestedFlashcards,
      suggestedPracticeTasks,
      suggestedAssessmentIdeas,
      suggestedEvidenceTypes,
      roleTitle,
      roleDescription,
      roleMasterId,
      vacancyId,
    } = req.body;

    const updateRes = await pool.query(
      `UPDATE ai_role_blueprint_suggestions
       SET suggested_skills = COALESCE($1, suggested_skills),
           suggested_learning_paths = COALESCE($2, suggested_learning_paths),
           suggested_flashcards = COALESCE($3, suggested_flashcards),
           suggested_practice_tasks = COALESCE($4, suggested_practice_tasks),
           suggested_assessment_ideas = COALESCE($5, suggested_assessment_ideas),
           suggested_evidence_types = COALESCE($6, suggested_evidence_types),
           role_title = COALESCE($7, role_title),
           role_description = COALESCE($8, role_description),
           role_master_id = COALESCE($9, role_master_id),
           vacancy_id = COALESCE($10, vacancy_id),
           updated_at = NOW()
       WHERE id = $11 AND company_id = $12
       RETURNING *`,
      [
        suggestedSkills ? JSON.stringify(suggestedSkills) : null,
        suggestedLearningPaths ? JSON.stringify(suggestedLearningPaths) : null,
        suggestedFlashcards ? JSON.stringify(suggestedFlashcards) : null,
        suggestedPracticeTasks ? JSON.stringify(suggestedPracticeTasks) : null,
        suggestedAssessmentIdeas ? JSON.stringify(suggestedAssessmentIdeas) : null,
        suggestedEvidenceTypes ? JSON.stringify(suggestedEvidenceTypes) : null,
        roleTitle || null,
        roleDescription !== undefined ? roleDescription : null,
        roleMasterId || null,
        vacancyId || null,
        suggestionId,
        companyId,
      ]
    );

    return res.json({
      message: 'Draft blueprint suggestions updated successfully',
      suggestion: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Update suggestion error:', err);
    return res.status(500).json({ error: 'Failed to update blueprint suggestion' });
  }
};

router.put(
  '/ai-suggestions/:suggestionId',
  [
    param('suggestionId').isUUID().withMessage('Invalid suggestionId'),
    body('suggestedSkills').optional().isArray(),
    body('suggestedLearningPaths').optional().isArray(),
    body('suggestedFlashcards').optional().isArray(),
    body('suggestedPracticeTasks').optional().isArray(),
    body('suggestedAssessmentIdeas').optional().isArray(),
    body('suggestedEvidenceTypes').optional().isArray(),
    body('roleTitle').optional().trim().notEmpty(),
    body('roleDescription').optional().trim(),
    body('roleMasterId').optional().isUUID(),
    body('vacancyId').optional().isUUID(),
  ],
  handleUpdateSuggestion
);

// ============================================================
// POST /api/company/ai-suggestions/:suggestionId/reject
// ============================================================
const handleRejectSuggestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership.company_id;
  const userId = req.user.id;
  const { suggestionId } = req.params;
  const { reason } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE ai_role_blueprint_suggestions
       SET status = 'REJECTED',
           review_notes = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [reason || 'Rejected by company reviewer', userId, suggestionId, companyId]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Blueprint suggestion not found' });
    }

    return res.json({
      message: 'Blueprint suggestion rejected',
      suggestion: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Reject suggestion error:', err);
    return res.status(500).json({ error: 'Failed to reject blueprint suggestion' });
  }
};

router.post(
  '/ai-suggestions/:suggestionId/reject',
  [
    param('suggestionId').isUUID().withMessage('Invalid suggestionId'),
    body('reason').optional().trim(),
  ],
  handleRejectSuggestion
);

// ============================================================
// POST /api/company/ai-suggestions/:suggestionId/approve
// Approves blueprint, links to Role Master and Vacancy, creates requirements,
// inserts learning resources, and writes audit trail.
// ============================================================
const handleApproveSuggestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const companyId = req.companyMembership.company_id;
  const userId = req.user.id;
  const { suggestionId } = req.params;
  const {
    approvalNotes,
    departmentId,
    createRoleMaster,
    roleMasterId: incomingRoleMasterId,
    vacancyId: incomingVacancyId,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sugRes = await client.query(
      'SELECT * FROM ai_role_blueprint_suggestions WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [suggestionId, companyId]
    );

    if (sugRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Blueprint suggestion not found' });
    }

    const suggestion = sugRes.rows[0];

    let targetRoleId = incomingRoleMasterId || suggestion.role_master_id;
    let targetVacancyId = incomingVacancyId || suggestion.vacancy_id;

    // If requested or if role_master_id is missing, create a role master under the company
    if (!targetRoleId && createRoleMaster) {
      let deptId = departmentId;
      if (!deptId) {
        const deptRes = await client.query('SELECT id FROM departments WHERE company_id = $1 LIMIT 1', [companyId]);
        if (deptRes.rowCount > 0) {
          deptId = deptRes.rows[0].id;
        } else {
          const newDept = await client.query(
            `INSERT INTO departments (company_id, name, description)
             VALUES ($1, 'General Engineering & Operations', 'Default departmental group')
             RETURNING id`,
            [companyId]
          );
          deptId = newDept.rows[0].id;
        }
      }

      const newRoleRes = await client.query(
        `INSERT INTO company_roles
           (company_id, department_id, title, job_description, experience_level, employment_type, location, status, approved_role_blueprint_id)
         VALUES ($1, $2, $3, $4, 'senior', 'full_time', 'Remote', 'DRAFT', $5)
         RETURNING id`,
        [companyId, deptId, suggestion.role_title, suggestion.role_description || 'Role blueprint created via AI assistant', suggestion.id]
      );
      targetRoleId = newRoleRes.rows[0].id;
    }

    // 1. Mark suggestion as APPROVED and link role_master_id and vacancy_id
    await client.query(
      `UPDATE ai_role_blueprint_suggestions
       SET status = 'APPROVED',
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_notes = $2,
           role_master_id = COALESCE($3, role_master_id),
           vacancy_id = COALESCE($4, vacancy_id),
           updated_at = NOW()
       WHERE id = $5`,
      [
        userId,
        approvalNotes || 'Approved by company owner/recruiter',
        targetRoleId || null,
        targetVacancyId || null,
        suggestion.id,
      ]
    );

    // 2. Link approved_role_blueprint_id to role master if exists
    if (targetRoleId) {
      await client.query(
        `UPDATE company_roles
         SET approved_role_blueprint_id = $1, updated_at = NOW()
         WHERE id = $2 AND company_id = $3`,
        [suggestion.id, targetRoleId, companyId]
      );
    }

    // 3. Link approved_role_blueprint_id and role_master_id to vacancy if exists
    if (targetVacancyId) {
      await client.query(
        `UPDATE company_roles
         SET approved_role_blueprint_id = $1,
             role_master_id = COALESCE($2, role_master_id),
             updated_at = NOW()
         WHERE id = $3 AND company_id = $4`,
        [suggestion.id, targetRoleId || null, targetVacancyId, companyId]
      );
    }

    // 4. Parse approved skills and create requirements for targetRoleId and targetVacancyId
    const skills = Array.isArray(suggestion.suggested_skills) ? suggestion.suggested_skills : [];
    let appliedRequirements = 0;

    const rolesToApplyRequirements = [targetRoleId, targetVacancyId].filter(Boolean);

    for (const rId of rolesToApplyRequirements) {
      for (const skill of skills) {
        const skillName = skill.name || skill.title || 'Required Skill';
        const isMustHave = (skill.importance || '').toLowerCase() === 'must-have';

        await client.query(
          `INSERT INTO requirements
             (role_id, company_id, name, description, category, req_type, priority, proficiency, eval_method, importance, weight)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT DO NOTHING`,
          [
            rId,
            companyId,
            skillName,
            skill.description || `Verified competency for ${skillName}`,
            skill.category || 'Technical',
            isMustHave ? 'Required' : 'Preferred',
            isMustHave ? 'High' : 'Medium',
            'Advanced',
            'Work Product Evidence & Objective Evaluation',
            isMustHave ? 'REQUIRED' : 'PREFERRED',
            isMustHave ? 1.5 : 1.0,
          ]
        );
        appliedRequirements++;
      }
    }

    // 5. Insert learning resources
    const learningPaths = Array.isArray(suggestion.suggested_learning_paths) ? suggestion.suggested_learning_paths : [];
    let appliedResources = 0;
    for (const lp of learningPaths) {
      if (lp.title && lp.skill) {
        await client.query(
          `INSERT INTO learning_resources
             (requirement_name, title, description, source, resource_type, language, estimated_duration_mins, url)
           VALUES ($1, $2, $3, $4, $5, 'English', $6, $7)
           ON CONFLICT DO NOTHING`,
          [
            lp.skill,
            lp.title,
            `Curriculum resource for ${lp.skill}`,
            'Curated Learning Curriculum',
            lp.type || 'GUIDE',
            parseInt(lp.duration, 10) || 45,
            lp.url || 'https://genuai.io/learn',
          ]
        );
        appliedResources++;
      }
    }

    // 6. Record official approval in role_blueprint_approval
    const approvalRes = await client.query(
      `INSERT INTO role_blueprint_approval
         (role_blueprint_id, company_id, vacancy_id, approved_by, approved_at, approval_notes,
          applied_requirements_count, applied_resources_count, applied_questions_count)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
       RETURNING *`,
      [
        suggestion.id,
        companyId,
        targetVacancyId || null,
        userId,
        approvalNotes || 'Official company blueprint approval',
        appliedRequirements,
        appliedResources,
        0,
      ]
    );

    // 7. Write audit log
    try {
      await client.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata)
         VALUES ($1, $2, $3, 'ROLE_BLUEPRINT_APPROVED', 'RoleBlueprint', $4, 'APPROVED', $5, $6)`,
        [
          companyId,
          userId,
          req.companyMembership.member_role || 'COMPANY_OWNER',
          suggestion.id,
          'Company approved role blueprint suggestions',
          JSON.stringify({
            roleTitle: suggestion.role_title,
            appliedRequirements,
            appliedResources,
            roleMasterId: targetRoleId,
            vacancyId: targetVacancyId,
          }),
        ]
      );
    } catch (logErr) {
      console.warn('Audit log write error:', logErr.message);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Role blueprint approved and activated.',
      approval: approvalRes.rows[0],
      roleMasterId: targetRoleId,
      vacancyId: targetVacancyId,
      appliedRequirementsCount: appliedRequirements,
      appliedResourcesCount: appliedResources,
      suggestion: {
        ...suggestion,
        status: 'APPROVED',
        role_master_id: targetRoleId,
        vacancy_id: targetVacancyId,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve blueprint error:', err);
    return res.status(500).json({ error: 'Failed to approve blueprint' });
  } finally {
    client.release();
  }
};

router.post(
  '/ai-suggestions/:suggestionId/approve',
  [
    param('suggestionId').isUUID().withMessage('Invalid suggestionId'),
    body('approvalNotes').optional().trim(),
    body('departmentId').optional().isUUID(),
    body('createRoleMaster').optional().isBoolean(),
    body('roleMasterId').optional().isUUID(),
    body('vacancyId').optional().isUUID(),
  ],
  handleApproveSuggestion
);

module.exports = {
  router,
  handleAiSuggest,
  handleGetRoleMasterBlueprint,
  handleGetVacancyBlueprint,
  handleGetSuggestion,
  handleUpdateSuggestion,
  handleRejectSuggestion,
  handleApproveSuggestion,
};
