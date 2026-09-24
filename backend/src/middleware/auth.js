const jwt = require('jsonwebtoken');
const pool = require('../database/pool');

/**
 * Middleware: Verify JWT and attach user + company to request.
 * Never trusts company_id from request body/query.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Load user from DB to ensure they still exist
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [payload.userId]
    );
    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const user = userResult.rows[0];

    // Load company membership — derive company from auth, never from client input
    const memberResult = await pool.query(
      `SELECT cm.company_id, cm.member_role, c.verification_status
       FROM company_members cm
       JOIN companies c ON c.id = cm.company_id
       WHERE cm.user_id = $1
       LIMIT 1`,
      [user.id]
    );

    req.user = user;
    req.companyMembership = memberResult.rowCount > 0 ? memberResult.rows[0] : null;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: Ensure the user belongs to a company.
 * Must be used after authenticate().
 */
function requireCompany(req, res, next) {
  if (!req.companyMembership) {
    return res.status(403).json({ error: 'Forbidden: No company membership found' });
  }
  next();
}

module.exports = { authenticate, requireCompany };
