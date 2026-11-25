const { body } = require('express-validator');
const { handleValidationErrors, uuidParam } = require('./common');

const ALLOWED_COMPANY_STATUSES = [
  'PENDING_VERIFICATION',
  'PENDING',
  'UNDER_REVIEW',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'NEEDS_CORRECTION',
  'APPROVED',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
  'ARCHIVED',
];

const ALLOWED_VACANCY_STATUSES = [
  'DRAFT',
  'PENDING_ADMIN_REVIEW',
  'PENDING_REVIEW',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'VERIFIED',
  'CHANGES_REQUESTED',
  'NEEDS_CORRECTION',
  'REJECTED',
  'SUSPENDED',
  'PUBLISHED',
  'PAUSED',
  'CLOSED',
  'ARCHIVED',
];

const adminCompanyStatusValidator = [
  uuidParam('id'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .custom((val) => ALLOWED_COMPANY_STATUSES.includes(String(val).toUpperCase().replace(/\s+/g, '_')))
    .withMessage('Invalid company verification status'),
  body('note').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  body('reason').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  handleValidationErrors,
];

const adminVacancyStatusValidator = [
  uuidParam('id'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .custom((val) => ALLOWED_VACANCY_STATUSES.includes(String(val).toUpperCase().replace(/\s+/g, '_')))
    .withMessage('Invalid vacancy moderation status'),
  body('note').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  body('reason').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  handleValidationErrors,
];

module.exports = {
  adminCompanyStatusValidator,
  adminVacancyStatusValidator,
};
