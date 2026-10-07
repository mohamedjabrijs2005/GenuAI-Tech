const jwt = require('jsonwebtoken');
const pool = require('../database/pool');

/**
 * Canonical platform and company roles:
 * - SUPER_ADMIN
 * - VERIFICATION_ADMIN
 * - SUPPORT_ADMIN
 * - COMPANY_OWNER
 * - COMPANY_RECRUITER
 */

/**
 * Middleware: Verify JWT and attach user + company to request.
 * Never trusts company_id or role from request body/query.
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
      payload = jwt.verify(token, process.env.JWT_SECRET || 'genuai-super-secret-jwt-key-change-in-production');
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    let user = null;
    let companyMembership = null;

    try {
      const userResult = await pool.query(
        'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
        [payload.userId]
      );
      if (userResult.rowCount > 0) {
        user = userResult.rows[0];
        const memberResult = await pool.query(
          `SELECT cm.company_id, cm.member_role, c.name AS company_name, c.verification_status, c.suspended_at
           FROM company_members cm
           JOIN companies c ON c.id = cm.company_id
           WHERE cm.user_id = $1
           LIMIT 1`,
          [user.id]
        );
        companyMembership = memberResult.rowCount > 0 ? memberResult.rows[0] : null;
      }
    } catch (dbErr) {
      console.error('Auth DB lookup failed:', dbErr.message);
      return res.status(503).json({ error: 'Authentication service unavailable. Try again shortly.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    req.companyMembership = companyMembership;

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
  if (req.companyMembership.verification_status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'Forbidden: Company account is suspended. Contact platform administration.',
      code: 'COMPANY_SUSPENDED',
    });
  }
  next();
}

/**
 * Middleware: Ensure the company is APPROVED before allowing certain actions.
 */
function requireApprovedCompany(req, res, next) {
  if (!req.companyMembership) {
    return res.status(403).json({ error: 'Forbidden: No company membership found' });
  }
  const status = req.companyMembership.verification_status;
  if (status !== 'APPROVED') {
    return res.status(403).json({
      error: `Forbidden: Company verification status is ${status}. Only APPROVED companies can perform this action.`,
      verificationStatus: status,
    });
  }
  next();
}

/**
 * Middleware: Role-based access control (RBAC).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const memberRole = (req.companyMembership?.member_role || '').toUpperCase();

    // Map legacy role aliases
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    if (normalizedAllowed.includes('GENUAI_ADMIN') || normalizedAllowed.includes('SUPER_ADMIN')) {
      normalizedAllowed.push('SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN');
    }
    if (normalizedAllowed.includes('COMPANY_ADMIN') || normalizedAllowed.includes('COMPANY_OWNER')) {
      normalizedAllowed.push('COMPANY_OWNER', 'COMPANY_ADMIN', 'ADMIN');
    }

    const isAllowed = normalizedAllowed.includes(userRole) || (memberRole && normalizedAllowed.includes(memberRole));
    if (!isAllowed) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]` });
    }
    next();
  };
}

/**
 * Middleware: Platform governance admin check.
 * Allows SUPER_ADMIN, VERIFICATION_ADMIN, SUPPORT_ADMIN, genuai_admin.
 */
function requireGenuAIAdmin(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  const allowedAdminRoles = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'];
  if (!allowedAdminRoles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Requires GenuAI Platform Admin privilege' });
  }
  next();
}

module.exports = {
  authenticate,
  requireCompany,
  requireApprovedCompany,
  requireRole,
  requireGenuAIAdmin,
};
