const express = require('express');
const { authenticate, requireCompany, requireRole } = require('../middleware/auth');
const companyController = require('../controllers/companyController');
const teamController = require('../controllers/teamController');
const { companyUpdateValidator } = require('../validators/companyValidator');
const { uuidParam, handleValidationErrors } = require('../validators/common');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logAudit } = require('../services/auditService');
const pool = require('../database/pool');

const router = express.Router();

router.use(authenticate, requireCompany);

router.get('/', companyController.getCompanyProfile);
router.get('/profile', companyController.getCompanyProfile);
router.patch('/', requireRole('COMPANY_OWNER'), companyUpdateValidator, companyController.updateCompanyProfile);
router.patch('/profile', requireRole('COMPANY_OWNER'), companyUpdateValidator, companyController.updateCompanyProfile);
router.put('/', requireRole('COMPANY_OWNER'), companyUpdateValidator, companyController.updateCompanyProfile);
router.put('/profile', requireRole('COMPANY_OWNER'), companyUpdateValidator, companyController.updateCompanyProfile);

router.get('/overview', companyController.getCompanyOverview);
router.get('/activity', companyController.getCompanyActivity);
router.post('/submit-onboarding', requireRole('COMPANY_OWNER'), companyController.submitOnboarding);

// Team / Recruiter sub-user RBAC management
router.get('/members', teamController.listMembers);
router.post('/members/invite', requireRole('COMPANY_OWNER'), teamController.inviteMember);
router.patch('/members/:memberId/role', requireRole('COMPANY_OWNER'), [uuidParam('memberId'), handleValidationErrors], teamController.updateMemberRole);
router.patch('/members/:memberId/status', requireRole('COMPANY_OWNER'), [uuidParam('memberId'), handleValidationErrors], teamController.updateMemberStatus);
router.delete('/members/:memberId', requireRole('COMPANY_OWNER'), [uuidParam('memberId'), handleValidationErrors], teamController.removeMember);

// POST /api/company/pilot-feedback  — HR rates shortlist quality during pilot
router.post('/pilot-feedback', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const {
      vacancyId = null,
      shortlistUsefulness,
      proofLevelClarity,
      missingSkillAccuracy,
      interviewFocusUsefulness,
      trustInRecommendations,
      timeSavedEstimate = null,
      missingInformation = null,
      additionalNotes = null,
    } = req.body;

    const ratings = [shortlistUsefulness, proofLevelClarity, missingSkillAccuracy, interviewFocusUsefulness, trustInRecommendations];
    if (ratings.some((r) => !Number.isInteger(Number(r)) || Number(r) < 1 || Number(r) > 5)) {
      return sendError(res, { statusCode: 422, error: 'All ratings must be integers between 1 and 5', code: 'VALIDATION_ERROR' });
    }

    const ins = await pool.query(
      `INSERT INTO pilot_feedback
         (company_id, vacancy_id, submitted_by,
          shortlist_usefulness, proof_level_clarity, missing_skill_accuracy,
          interview_focus_usefulness, trust_in_recommendations,
          time_saved_estimate, missing_information, additional_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [companyId, vacancyId || null, req.user.id,
       shortlistUsefulness, proofLevelClarity, missingSkillAccuracy,
       interviewFocusUsefulness, trustInRecommendations,
       timeSavedEstimate, missingInformation, additionalNotes]
    );

    await logAudit(pool, {
      companyId, user: req.user, actorRole: req.companyMembership.member_role || req.user.role,
      action: 'PILOT_FEEDBACK_SUBMITTED', entityType: 'Company', entityId: companyId,
      details: { vacancyId, ratings: { shortlistUsefulness, proofLevelClarity, missingSkillAccuracy, interviewFocusUsefulness, trustInRecommendations } },
    }).catch(() => {});

    return sendSuccess(res, { feedback: ins.rows[0], message: 'Pilot feedback recorded. Thank you!' }, 201);
  } catch (err) {
    console.error('Pilot feedback error:', err);
    return sendError(res, { statusCode: 500, error: 'Failed to submit pilot feedback' });
  }
});

// GET /api/company/pilot-feedback  — List own company's feedback
router.get('/pilot-feedback', async (req, res) => {
  try {
    const companyId = req.companyMembership.company_id;
    const res2 = await pool.query(
      `SELECT * FROM pilot_feedback WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return sendSuccess(res, { feedback: res2.rows, count: res2.rowCount });
  } catch (err) {
    return sendError(res, { statusCode: 500, error: 'Failed to load pilot feedback' });
  }
});

module.exports = router;
