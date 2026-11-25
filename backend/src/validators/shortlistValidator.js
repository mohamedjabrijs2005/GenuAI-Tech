const { body } = require('express-validator');
const { handleValidationErrors, uuidParam } = require('./common');

const shortlistGetValidator = [
  uuidParam('vacancyId'),
  handleValidationErrors,
];

const shortlistOverrideValidator = [
  uuidParam('vacancyId'),
  uuidParam('targetId'),
  body('overrideRank').optional({ nullable: true }).isInt({ min: 1, max: 10000 }).withMessage('overrideRank must be a positive integer'),
  body('overrideFit').optional({ nullable: true }).isIn(['strong', 'promising', 'partial', 'not_ready']).withMessage('Invalid overrideFit'),
  body('reason').trim().notEmpty().withMessage('Override reason is required').isLength({ max: 2000 }),
  handleValidationErrors,
];

const hiringOutcomeValidator = [
  uuidParam('vacancyId'),
  uuidParam('targetId'),
  body('decision')
    .trim()
    .notEmpty().withMessage('Decision is required')
    .custom((v) => ['rejected', 'offered', 'joined', 'on_hold'].includes(String(v).toLowerCase()))
    .withMessage('Invalid decision. Allowed: rejected, offered, joined, on_hold'),
  body('reasonCode').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  handleValidationErrors,
];

module.exports = {
  shortlistGetValidator,
  shortlistOverrideValidator,
  hiringOutcomeValidator,
};
