/**
 * Standardized API response helpers for consistent error/success envelopes.
 */
function sendSuccess(res, payload = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...payload,
  });
}

function sendError(res, { statusCode = 500, error = 'Internal server error', code = 'INTERNAL_ERROR', details = undefined, requestId = undefined }) {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
    ...(details ? { details } : {}),
    ...(requestId ? { requestId } : {}),
  });
}

module.exports = { sendSuccess, sendError };
