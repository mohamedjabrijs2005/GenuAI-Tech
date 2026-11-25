const express = require('express');
const { authenticate, requireCompany } = require('../middleware/auth');
const candidateController = require('../controllers/candidateController');
const {
  candidateAppIdValidator,
  candidateStageValidator,
  candidateDecisionValidator,
  candidateInterviewValidator,
} = require('../validators/candidateValidator');

const router = express.Router();
router.use(authenticate, requireCompany);

router.get('/', candidateController.listCandidates);
router.get('/:appId', candidateAppIdValidator, candidateController.getCandidateDetail);
router.patch('/:appId/status', candidateStageValidator, candidateController.updateCandidateStage);
router.post('/:appId/decision', candidateDecisionValidator, candidateController.recordCandidateDecision);
router.get('/:appId/evidence', candidateAppIdValidator, candidateController.getCandidateEvidence);
router.post('/:appId/interviews', candidateInterviewValidator, candidateController.scheduleInterview);

module.exports = router;
