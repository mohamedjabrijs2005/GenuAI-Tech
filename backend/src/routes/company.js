const express = require('express');
const { authenticate, requireCompany, requireRole } = require('../middleware/auth');
const companyController = require('../controllers/companyController');
const teamController = require('../controllers/teamController');
const { companyUpdateValidator } = require('../validators/companyValidator');
const { uuidParam, handleValidationErrors } = require('../validators/common');

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

module.exports = router;
