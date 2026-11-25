const { body } = require('express-validator');
const { handleValidationErrors, uuidParam } = require('./common');

const createSkillClaimsValidator = [
  body('claims').isArray({ min: 1, max: 50 }).withMessage('Provide claims array (1-50 items)'),
  body('claims.*.skillName').trim().notEmpty().withMessage('skillName is required').isLength({ max: 255 }),
  body('claims.*.claimText').optional({ nullable: true }).isString().isLength({ max: 1000 }),
  body('claims.*.source').optional().isIn(['resume', 'profile', 'manual']).withMessage('source must be resume, profile, or manual'),
  handleValidationErrors,
];

const claimIdValidator = [
  uuidParam('claimId'),
  handleValidationErrors,
];

const targetIdProofValidator = [
  uuidParam('targetId'),
  handleValidationErrors,
];

module.exports = {
  createSkillClaimsValidator,
  claimIdValidator,
  targetIdProofValidator,
};
