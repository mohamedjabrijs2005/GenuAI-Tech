const crypto = require('crypto');

/**
 * Attaches a unique X-Request-Id and logs structured JSON telemetry for every API request.
 * Never logs Authorization headers or sensitive request bodies.
 */
function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || `req_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startHr = process.hrtime.bigint();
  res.on('finish', () => {
    if (process.env.NODE_ENV === 'test') return;
    const durationMs = Number(process.hrtime.bigint() - startHr) / 1e6;
    const logEntry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      userId: req.user?.id || null,
      companyId: req.companyMembership?.company_id || null,
      ts: new Date().toISOString(),
    };
    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = { requestLogger };
