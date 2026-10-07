const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// POST /api/auth/register
// Register a new user and create their company with PENDING_VERIFICATION
// ============================================================
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('website').optional().trim(),
    body('industry').optional().trim(),
    body('description').optional().trim(),
    body('location').optional().trim(),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      companyName,
      website,
      industry,
      description,
      location,
      phone,
    } = req.body;

    let client;
    try {
      client = await pool.connect();
    } catch (connErr) {
      console.error('DB connection failed in register:', connErr.message);
      return res.status(503).json({ error: 'Database unavailable. Check your connection and try again.' });
    }

    try {
      await client.query('BEGIN');

      // Check email uniqueness
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with COMPANY_OWNER role
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'COMPANY_OWNER')
         RETURNING id, email, first_name, last_name, role`,
        [email, passwordHash, firstName, lastName]
      );
      const user = userResult.rows[0];

      // Create company with canonical PENDING_VERIFICATION status
      const companyResult = await client.query(
        `INSERT INTO companies (name, official_email, website, industry, description, location, hiring_contact_name, hiring_contact_email, hiring_contact_phone, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_VERIFICATION')
         RETURNING id, name, verification_status, created_at`,
        [
          companyName,
          email,
          website || null,
          industry || 'Technology',
          description || null,
          location || 'Global',
          `${firstName} ${lastName}`,
          email,
          phone || null,
        ]
      );
      const company = companyResult.rows[0];

      // Create membership linking owner to company
      await client.query(
        `INSERT INTO company_members (company_id, user_id, member_role)
         VALUES ($1, $2, 'COMPANY_OWNER')`,
        [company.id, user.id]
      );

      // Record registration in audit_logs
      await client.query(
        `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata, ip_address)
         VALUES ($1, $2, 'COMPANY_OWNER', 'COMPANY_REGISTERED', 'Company', $3, 'PENDING_VERIFICATION', 'Initial registration submitted', $4, $5)`,
        [
          company.id,
          user.id,
          company.id,
          JSON.stringify({ companyName, email, contact: `${firstName} ${lastName}` }),
          req.ip || null,
        ]
      );

      await client.query('COMMIT');

      // Issue JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'genuai-super-secret-jwt-key-change-in-production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        company: {
          id: company.id,
          name: company.name,
          verificationStatus: company.verification_status,
          createdAt: company.created_at,
        },
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    } finally {
      try { client.release(); } catch (_) {}
    }
  }
);

// ============================================================
// POST /api/auth/login
// Verify credentials and return active user & company membership
// ============================================================
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const userResult = await pool.query(
        'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rowCount === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get company membership
      const memberResult = await pool.query(
        `SELECT cm.company_id, cm.member_role, c.name as company_name, c.verification_status, c.suspended_at
         FROM company_members cm
         JOIN companies c ON c.id = cm.company_id
         WHERE cm.user_id = $1
         LIMIT 1`,
        [user.id]
      );

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'genuai-super-secret-jwt-key-change-in-production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const companyData = memberResult.rowCount > 0 ? {
        id: memberResult.rows[0].company_id,
        name: memberResult.rows[0].company_name,
        verificationStatus: memberResult.rows[0].verification_status,
        isSuspended: memberResult.rows[0].verification_status === 'SUSPENDED' || !!memberResult.rows[0].suspended_at,
      } : null;

      // Log login event in audit_logs
      try {
        await pool.query(
          `INSERT INTO audit_logs (company_id, actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
           VALUES ($1, $2, $3, 'USER_LOGIN', 'User', $4, $5, $6)`,
          [
            companyData?.id || null,
            user.id,
            user.role,
            user.id,
            JSON.stringify({ email: user.email, role: user.role }),
            req.ip || null,
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write error on login:', logErr.message);
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        company: companyData,
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

// ============================================================
// GET /api/auth/me
// Get current authenticated user + company state
// ============================================================
router.get('/me', authenticate, async (req, res) => {
  try {
    let memberResult;
    try {
      memberResult = await pool.query(
        `SELECT cm.company_id, cm.member_role, c.name as company_name, c.verification_status, c.suspended_at
         FROM company_members cm
         JOIN companies c ON c.id = cm.company_id
         WHERE cm.user_id = $1
         LIMIT 1`,
        [req.user.id]
      );
    } catch (dbErr) {
      console.error('Company lookup failed in /me:', dbErr.message);
      return res.status(503).json({ error: 'Database unavailable.' });
    }

    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role,
      },
      company: memberResult.rowCount > 0 ? {
        id: memberResult.rows[0].company_id,
        name: memberResult.rows[0].company_name,
        verificationStatus: memberResult.rows[0].verification_status,
        isSuspended: memberResult.rows[0].verification_status === 'SUSPENDED' || !!memberResult.rows[0].suspended_at,
      } : null,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
