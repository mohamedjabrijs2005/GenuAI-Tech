const express = require('express');
const { authenticate, requireCompany } = require('../middleware/auth');
const shortlistController = require('../controllers/shortlistController');
const {
  shortlistGetValidator,
  shortlistOverrideValidator,
  hiringOutcomeValidator,
  interviewStageValidator,
} = require('../validators/shortlistValidator');

const router = express.Router();

/**
 * GET /api/company/vacancies/:vacancyId/shortlist
 * Explainable shortlist for ONE vacancy with per-skill proof levels, reasons,
 * missing skills, trainable gaps, interview focus, and HR overrides.
 */
router.get('/:vacancyId/shortlist', authenticate, requireCompany, shortlistGetValidator, shortlistController.getShortlist);

/**
 * POST /api/company/vacancies/:vacancyId/candidates/:targetId/shortlist-override
 * Explicit HR shortlist ranking/fit override with immutable audit trail.
 */
router.post(
  '/:vacancyId/candidates/:targetId/shortlist-override',
  authenticate,
  requireCompany,
  shortlistOverrideValidator,
  shortlistController.overrideRank
);

/**
 * POST /api/company/vacancies/:vacancyId/candidates/:targetId/hiring-outcome
 * Structured HR hiring outcome record (rejected | offered | joined | on_hold).
 */
router.post(
  '/:vacancyId/candidates/:targetId/hiring-outcome',
  authenticate,
  requireCompany,
  hiringOutcomeValidator,
  shortlistController.recordHiringOutcome
);

router.patch(
  '/:vacancyId/candidates/:targetId/interview-stage',
  authenticate,
  requireCompany,
  interviewStageValidator,
  shortlistController.updateInterviewStage
);

module.exports = { router };
