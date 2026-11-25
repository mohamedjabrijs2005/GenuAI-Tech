const express = require('express');
const { authenticate, requireCandidate } = require('../middleware/auth');
const skillClaimController = require('../controllers/skillClaimController');
const {
  createSkillClaimsValidator,
  claimIdValidator,
  targetIdProofValidator,
} = require('../validators/skillClaimValidator');

const router = express.Router();

router.use(authenticate, requireCandidate);

router.get('/', skillClaimController.listClaims);
router.post('/', createSkillClaimsValidator, skillClaimController.createClaims);
router.patch('/:claimId/confirm', claimIdValidator, skillClaimController.confirmClaim);
router.delete('/:claimId', claimIdValidator, skillClaimController.withdrawClaim);
router.get('/targets/:targetId/proof', targetIdProofValidator, skillClaimController.getTargetProof);

module.exports = { router };
