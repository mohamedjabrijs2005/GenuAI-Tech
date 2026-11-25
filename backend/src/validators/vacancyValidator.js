const { body } = require('express-validator');
const { handleValidationErrors, uuidParam } = require('./common');

const vacancyChecklistGenerateValidator = [
  uuidParam('id'),
  body('items').optional().isArray({ min: 1, max: 30 }).withMessage('items must be a non-empty array (max 30)'),
  body('items.*.name').optional().trim().notEmpty().isLength({ max: 255 }).withMessage('Skill name is required (max 255 chars)'),
  body('items.*.importance').optional().isIn(['REQUIRED', 'PREFERRED', 'Must-have', 'Good-to-have', 'Required', 'Preferred']),
  body('includeCommon').optional().isBoolean(),
  handleValidationErrors,
];

const vacancyChecklistActionValidator = [
  uuidParam('id'),
  body('notes').optional().isString().isLength({ max: 2000 }),
  handleValidationErrors,
];

const vacancyChecklistUpdateItemsValidator = [
  uuidParam('id'),
  body('items').isArray({ min: 1, max: 30 }).withMessage('items array (1-30 skills) is required'),
  body('items.*.name').trim().notEmpty().withMessage('Each skill item must have a name').isLength({ max: 255 }),
  body('items.*.importance').optional().isIn(['REQUIRED', 'PREFERRED', 'Must-have', 'Good-to-have', 'Required', 'Preferred']),
  body('items.*.category').optional().trim().isLength({ max: 100 }),
  body('items.*.description').optional().isString().isLength({ max: 2000 }),
  handleValidationErrors,
];

const vacancyRequirementValidator = [
  uuidParam('id'),
  body('name').trim().notEmpty().withMessage('Requirement name is required').isLength({ max: 255 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('reqType').optional().isIn(['Required', 'Preferred', 'Optional', 'REQUIRED', 'PREFERRED', 'OPTIONAL']),
  handleValidationErrors,
];

module.exports = {
  vacancyChecklistGenerateValidator,
  vacancyChecklistActionValidator,
  vacancyChecklistUpdateItemsValidator,
  vacancyRequirementValidator,
};
