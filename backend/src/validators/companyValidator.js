const { body } = require('express-validator');
const { handleValidationErrors } = require('./common');

const companyUpdateValidator = [
  body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('industry').optional().trim().isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('website').optional().trim().isLength({ max: 300 }),
  body('officialEmail').optional().isEmail().withMessage('Invalid email'),
  body('location').optional().trim().isLength({ max: 255 }),
  body('hiringContactName').optional().trim().isLength({ max: 150 }),
  body('hiringContactEmail').optional().isEmail().withMessage('Invalid hiring contact email'),
  body('hiringContactPhone').optional().trim().isLength({ max: 50 }),
  handleValidationErrors,
];

module.exports = {
  companyUpdateValidator,
};
