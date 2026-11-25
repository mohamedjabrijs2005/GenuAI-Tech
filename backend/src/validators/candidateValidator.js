const { body } = require('express-validator');
const { handleValidationErrors, uuidParam } = require('./common');

const VALID_CANDIDATE_STAGES = [
  'Applied', 'Eligible', 'Verified', 'Invited', 'Assessed',
  'Review', 'Interview', 'Decision', 'Selected', 'Rejected', 'Withdrawn',
];

const candidateAppIdValidator = [
  uuidParam('appId'),
  handleValidationErrors,
];

const candidateStageValidator = [
  uuidParam('appId'),
  body('status').isIn(VALID_CANDIDATE_STAGES).withMessage('Invalid status'),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  handleValidationErrors,
];

const candidateDecisionValidator = [
  uuidParam('appId'),
  body('decision').trim().notEmpty().withMessage('Decision is required').isLength({ max: 50 }),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  handleValidationErrors,
];

const candidateInterviewValidator = [
  uuidParam('appId'),
  body('scheduledAt').notEmpty().withMessage('scheduledAt is required'),
  body('durationMins').optional().isInt({ min: 5, max: 480 }),
  body('interviewType').optional().trim().isLength({ max: 60 }),
  handleValidationErrors,
];

module.exports = {
  candidateAppIdValidator,
  candidateStageValidator,
  candidateDecisionValidator,
  candidateInterviewValidator,
};
