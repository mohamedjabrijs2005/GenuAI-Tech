const { param, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Shared express-validator error formatter returning 422 with clear error payload.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return sendError(res, {
      statusCode: 422,
      error: first?.msg || 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array(),
    });
  }
  return next();
}

const uuidParam = (name) => param(name).isUUID().withMessage(`Invalid ${name} UUID`);

module.exports = {
  handleValidationErrors,
  uuidParam,
};
