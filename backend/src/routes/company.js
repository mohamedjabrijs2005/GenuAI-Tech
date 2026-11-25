const express = require('express');
const { authenticate, requireCompany } = require('../middleware/auth');
const companyController = require('../controllers/companyController');
const { companyUpdateValidator } = require('../validators/companyValidator');

const router = express.Router();

router.use(authenticate, requireCompany);

router.get('/', companyController.getCompanyProfile);
router.get('/profile', companyController.getCompanyProfile);
router.patch('/', companyUpdateValidator, companyController.updateCompanyProfile);
router.patch('/profile', companyUpdateValidator, companyController.updateCompanyProfile);
router.put('/', companyUpdateValidator, companyController.updateCompanyProfile);
router.put('/profile', companyUpdateValidator, companyController.updateCompanyProfile);

router.get('/overview', companyController.getCompanyOverview);
router.get('/activity', companyController.getCompanyActivity);
router.post('/submit-onboarding', companyController.submitOnboarding);

module.exports = router;
