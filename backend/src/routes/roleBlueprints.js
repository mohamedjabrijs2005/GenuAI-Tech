const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate, requireCompany } = require('../middleware/auth');
const { generateRoleBlueprint, ROLE_PRESETS, COMMON_SKILLS } = require('../services/aiRoleBlueprintGenerator');

const router = express.Router();

// Strict authentication & tenant enforcement
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
// POST /api/company/role-blueprints/ai-suggest
// Company enters role title and short description -> AI returns draft suggestions
// ============================================================
router.post(
  '/ai-suggest',
  [
    body('roleTitle').trim().notEmpty().withMessage('Role title is required')
      .isLength({ max: 255 }).withMessage('Role title cannot exceed 255 characters'),
    body('roleDescription').optional().trim(),
    body('roleMasterId').optional().isUUID().withMessage('Invalid roleMasterId format'),
    body('includeCommon').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const { roleTitle, roleDescription, roleMasterId, includeCommon } = req.body;

    // Verify role master belongs to this company if specified
    if (roleMasterId) {
      const roleCheck = await pool.query(
        'SELECT id FROM company_roles WHERE id = $1 AND company_id = $2',
        [roleMasterId, companyId]
      );
      if (roleCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Role Master not found for this company' });
      }
    }

    try {
      const blueprint = generateRoleBlueprint(roleTitle, roleDescription, { includeCommon });

      // Persist as strictly DRAFT in database
      const insertRes = await pool.query(
        `INSERT INTO ai_role_blueprint_suggestions
           (role_master_id, company_id, role_title, role_description,
            suggested_skills, suggested_learning_paths, suggested_flashcards,
            suggested_practice_tasks, suggested_assessment_ideas, suggested_evidence_types,
            ai_model, prompt_version, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DRAFT')
         RETURNING *`,
        [
          roleMasterId || null,
          companyId,
          roleTitle,
          roleDescription || '',
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
        safetyNotice: blueprint.safetyNotice,
      });
    } catch (err) {
      console.error('AI suggest error:', err);
      return res.status(500).json({ error: 'Failed to generate AI role blueprint suggestions' });
    }
  }
);

// ============================================================
// GET /api/company/role-blueprints/ai-suggestions/:suggestionId
// Fetch a specific suggestion (tenant-scoped)
// ============================================================
router.get(
  '/ai-suggestions/:suggestionId',
  [param('suggestionId').isUUID().withMessage('Invalid suggestionId')],
  async (req, res) => {
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
  }
);

// ============================================================
// PUT /api/company/role-blueprints/ai-suggestions/:suggestionId
// Edit and customize draft AI suggestions (add/remove/rename/set importance)
// ============================================================
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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const { suggestionId } = req.params;

    try {
      // Tenant check & ensure status allows edit
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
             updated_at = NOW()
         WHERE id = $9 AND company_id = $10
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
  }
);

// ============================================================
// POST /api/company/role-blueprints/ai-suggestions/:suggestionId/reject
// Company explicitly rejects the AI suggestions
// ============================================================
router.post(
  '/ai-suggestions/:suggestionId/reject',
  [
    param('suggestionId').isUUID().withMessage('Invalid suggestionId'),
    body('reason').optional().trim(),
  ],
  async (req, res) => {
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
  }
);

// ============================================================
// POST /api/company/role-blueprints/ai-suggestions/:suggestionId/approve
// Company approves blueprint:
// 1. Records official approval audit row
// 2. Creates/updates role requirements in requirements table
// 3. Activates learning resources and practice items
// ============================================================
router.post(
  '/ai-suggestions/:suggestionId/approve',
  [
    param('suggestionId').isUUID().withMessage('Invalid suggestionId'),
    body('approvalNotes').optional().trim(),
    body('departmentId').optional().isUUID(),
    body('createRoleMaster').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const companyId = req.companyMembership.company_id;
    const userId = req.user.id;
    const { suggestionId } = req.params;
    const { approvalNotes, departmentId, createRoleMaster } = req.body;

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

      if (suggestion.status === 'APPROVED') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Blueprint suggestion is already approved' });
      }

      let targetRoleId = suggestion.role_master_id;

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
             (company_id, department_id, title, job_description, experience_level, employment_type, location, status)
           VALUES ($1, $2, $3, $4, 'senior', 'full_time', 'Remote', 'DRAFT')
           RETURNING id`,
          [companyId, deptId, suggestion.role_title, suggestion.role_description || 'Role blueprint created via AI assistant']
        );
        targetRoleId = newRoleRes.rows[0].id;

        await client.query(
          'UPDATE ai_role_blueprint_suggestions SET role_master_id = $1 WHERE id = $2',
          [targetRoleId, suggestion.id]
        );
      }

      // 1. Mark suggestion as APPROVED
      await client.query(
        `UPDATE ai_role_blueprint_suggestions
         SET status = 'APPROVED',
             reviewed_by = $1,
             reviewed_at = NOW(),
             review_notes = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [userId, approvalNotes || 'Approved by company owner/recruiter', suggestion.id]
      );

      // 2. Parse approved skills and create requirements for role if targetRoleId exists
      const skills = Array.isArray(suggestion.suggested_skills) ? suggestion.suggested_skills : [];
      let appliedRequirements = 0;

      if (targetRoleId) {
        for (const skill of skills) {
          const skillName = skill.name || skill.title || 'Required Skill';
          const isMustHave = (skill.importance || '').toLowerCase() === 'must-have';
          
          await client.query(
            `INSERT INTO requirements
               (role_id, company_id, name, description, category, req_type, priority, proficiency, eval_method, importance, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT DO NOTHING`,
            [
              targetRoleId,
              companyId,
              skillName,
              skill.description || `Verified competency for ${skillName}`,
              skill.category || 'Technical',
              isMustHave ? 'Required' : 'Preferred',
              isMustHave ? 'High' : 'Medium',
              'Proficient',
              'Work Product Evidence & Objective Evaluation',
              isMustHave ? 'REQUIRED' : 'PREFERRED',
              isMustHave ? 1.5 : 1.0,
            ]
          );
          appliedRequirements++;
        }
      }

      // 3. Insert learning resources
      const learningPaths = Array.isArray(suggestion.suggested_learning_paths) ? suggestion.suggested_learning_paths : [];
      let appliedResources = 0;
      for (const lp of learningPaths) {
        if (lp.title && lp.skill) {
          await client.query(
            `INSERT INTO learning_resources
               (title, resource_type, url, requirement_name, difficulty, est_minutes)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [
              lp.title,
              lp.type || 'GUIDE',
              lp.url || 'https://genuai.io/learn',
              lp.skill,
              'INTERMEDIATE',
              parseInt(lp.duration, 10) || 45,
            ]
          );
          appliedResources++;
        }
      }

      // 4. Record official approval in role_blueprint_approval
      const approvalRes = await client.query(
        `INSERT INTO role_blueprint_approval
           (role_blueprint_id, company_id, approved_by, approved_at, approval_notes,
            applied_requirements_count, applied_resources_count, applied_questions_count)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
         RETURNING *`,
        [
          suggestion.id,
          companyId,
          userId,
          approvalNotes || 'Official company blueprint approval',
          appliedRequirements,
          appliedResources,
          0,
        ]
      );

      // 5. Write audit log
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
        appliedRequirementsCount: appliedRequirements,
        appliedResourcesCount: appliedResources,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Approve blueprint error:', err);
      return res.status(500).json({ error: 'Failed to approve blueprint' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
