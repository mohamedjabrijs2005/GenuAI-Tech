const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const { sendEmail, emailVerificationTemplate, passwordResetTemplate } = require('../services/email');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'genuai-super-secret-jwt-key-change-in-production') {
  console.error('FATAL: JWT_SECRET is missing or using the insecure default. Set a strong secret in .env');
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function signToken(user) {
  const userId = typeof user === 'object' && user ? user.id : user;
  const tokenVersion = typeof user === 'object' && user ? (user.token_version || 1) : 1;
  return jwt.sign({ userId, tokenVersion }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}


// ============================================================
// POST /api/auth/register
// Register a new user and create their company with PENDING_VERIFICATION
// ============================================================
router.post(
  '/register',
  registerLimiter,
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
      role: requestedRole,
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

      const isAdmin = requestedRole === 'SUPER_ADMIN' || requestedRole === 'ADMIN' || requestedRole === 'VERIFICATION_ADMIN';
      const isCandidate = requestedRole === 'CANDIDATE' || companyName === 'Candidate Workspace' || (!companyName && !isAdmin);
      const userRole = isAdmin ? 'SUPER_ADMIN' : (isCandidate ? 'CANDIDATE' : 'COMPANY_OWNER');

      // Generate email verification token (store hash in DB, send raw token in email)
      const rawVerificationToken = crypto.randomBytes(32).toString('hex');
      const hashedVerificationToken = hashToken(rawVerificationToken);
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, email_verification_token, email_verification_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, role, token_version`,
        [email, passwordHash, firstName, lastName, userRole, isAdmin, hashedVerificationToken, verificationExpires]
      );
      const user = userResult.rows[0];

      let companyData = null;

      if (isAdmin) {
        // Record platform admin registration in audit logs
        try {
          await client.query(
            `INSERT INTO audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, new_status, reason, metadata, ip_address)
             VALUES ($1, 'SUPER_ADMIN', 'ADMIN_ACCOUNT_REGISTERED', 'User', $2, 'ACTIVE', 'Platform governance admin registered', $3, $4)`,
            [user.id, user.id, JSON.stringify({ email: user.email }), req.ip || null]
          );
        } catch (auditErr) {
          console.warn('Admin registration audit log note:', auditErr.message);
        }
      } else if (isCandidate) {
        // Create candidate profile record if candidates table exists
        try {
          await client.query(
            `INSERT INTO candidates (first_name, last_name, email, phone, location)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO NOTHING`,
            [firstName, lastName, email, phone || '—', location || 'Global']
          );
        } catch (candErr) {
          console.warn('Candidate profile creation note:', candErr.message);
        }
      } else {
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
        try {
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
        } catch (_) {}

        companyData = {
          id: company.id,
          name: company.name,
          verificationStatus: company.verification_status,
          createdAt: company.created_at,
        };
      }

      await client.query('COMMIT');

      // Send verification email (async, don't block response)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verifyUrl = `${frontendUrl}/verify-email?token=${rawVerificationToken}`;
      sendEmail({
        to: email,
        toName: `${firstName} ${lastName}`,
        subject: 'Verify your GenuAI Technologies account',
        html: emailVerificationTemplate(`${firstName}`, verifyUrl),
        templateName: 'email_verification',
      }).catch(err => console.warn('Verification email send note:', err.message));

      // Issue JWT
      const token = signToken(user);

      return res.status(201).json({
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
  loginLimiter,
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
        'SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified, token_version FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rowCount === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = userResult.rows[0];

      // Enforce account active status
      if (user.is_active === false) {
        return res.status(403).json({ error: 'Account has been disabled. Please contact support.' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get company membership
      const memberResult = await pool.query(
        `SELECT cm.company_id, cm.member_role, c.name as company_name, c.verification_status, c.suspended_at, c.onboarding_submitted
         FROM company_members cm
         JOIN companies c ON c.id = cm.company_id
         WHERE cm.user_id = $1
         LIMIT 1`,
        [user.id]
      );

      const token = signToken(user);

      const companyData = memberResult.rowCount > 0 ? {
        id: memberResult.rows[0].company_id,
        name: memberResult.rows[0].company_name,
        verificationStatus: memberResult.rows[0].verification_status,
        isSuspended: memberResult.rows[0].verification_status === 'SUSPENDED' || !!memberResult.rows[0].suspended_at,
        onboardingSubmitted: memberResult.rows[0].onboarding_submitted === true,
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

      // Get candidate onboarding status if this is a candidate
      let candidateOnboardingSubmitted = false;
      const roleUpper = (user.role || '').toUpperCase();
      if (roleUpper === 'CANDIDATE' || roleUpper === 'APPLICANT' || roleUpper === 'USER') {
        try {
          const candRes = await pool.query(
            'SELECT onboarding_submitted FROM candidates WHERE LOWER(email) = LOWER($1)',
            [user.email]
          );
          if (candRes.rowCount > 0) {
            candidateOnboardingSubmitted = candRes.rows[0].onboarding_submitted === true;
          } else {
            await pool.query(
              `INSERT INTO candidates (first_name, last_name, email, phone, location)
               VALUES ($1, $2, $3, '—', 'Global')
               ON CONFLICT (email) DO NOTHING`,
              [user.first_name || 'Candidate', user.last_name || 'User', user.email]
            );
            candidateOnboardingSubmitted = false;
          }
        } catch (_) {}
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
        company: companyData,
        candidateOnboardingSubmitted,
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
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
        `SELECT cm.company_id, cm.member_role, c.name as company_name, c.verification_status, c.suspended_at, c.onboarding_submitted
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

    // Get candidate onboarding status
    let candidateOnboardingSubmitted = false;
    const roleUpper = (req.user?.role || '').toUpperCase();
    if (roleUpper === 'CANDIDATE' || roleUpper === 'APPLICANT' || roleUpper === 'USER') {
      try {
        const candRes = await pool.query(
          'SELECT onboarding_submitted FROM candidates WHERE LOWER(email) = LOWER($1)',
          [req.user.email]
        );
        if (candRes.rowCount > 0) {
          candidateOnboardingSubmitted = candRes.rows[0].onboarding_submitted === true;
        } else {
          await pool.query(
            `INSERT INTO candidates (first_name, last_name, email, phone, location)
             VALUES ($1, $2, $3, '—', 'Global')
             ON CONFLICT (email) DO NOTHING`,
            [req.user.first_name || 'Candidate', req.user.last_name || 'User', req.user.email]
          );
          candidateOnboardingSubmitted = false;
        }
      } catch (_) {}
    }

    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role,
        emailVerified: req.user.email_verified,
      },
      company: memberResult.rowCount > 0 ? {
        id: memberResult.rows[0].company_id,
        name: memberResult.rows[0].company_name,
        verificationStatus: memberResult.rows[0].verification_status,
        isSuspended: memberResult.rows[0].verification_status === 'SUSPENDED' || !!memberResult.rows[0].suspended_at,
        onboardingSubmitted: memberResult.rows[0].onboarding_submitted === true,
      } : null,
      candidateOnboardingSubmitted,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================
// ============================================================
// POST /api/auth/verify-email
// Verify user email via token (compares against sha256 hash or legacy raw)
// ============================================================
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  try {
    const hashedToken = hashToken(token);
    const result = await pool.query(
      `UPDATE users
       SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL
       WHERE email_verification_token = $1 AND email_verification_expires > NOW() AND email_verified = FALSE
       RETURNING id, email, first_name`,
      [hashedToken]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================================
// POST /api/auth/resend-verification
// Resend email verification token
// ============================================================
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    if (req.user.email_verified) {
      return res.json({ message: 'Email is already verified' });
    }

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = hashToken(rawVerificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3`,
      [hashedVerificationToken, verificationExpires, req.user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${rawVerificationToken}`;

    await sendEmail({
      to: req.user.email,
      toName: `${req.user.first_name} ${req.user.last_name}`,
      subject: 'Verify your GenuAI Technologies account',
      html: emailVerificationTemplate(req.user.first_name, verifyUrl),
      templateName: 'email_verification',
    });

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// ============================================================
// POST /api/auth/forgot-password
// Generate password reset token (stored as SHA-256 hash) and send email
// ============================================================
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Always return success to prevent email enumeration
      const userResult = await pool.query(
        'SELECT id, email, first_name, last_name, is_active FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rowCount > 0 && userResult.rows[0].is_active !== false) {
        const user = userResult.rows[0];
        const rawResetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = hashToken(rawResetToken);
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
          `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
          [hashedResetToken, resetExpires, user.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawResetToken}`;

        sendEmail({
          to: user.email,
          toName: `${user.first_name} ${user.last_name}`,
          subject: 'Reset your GenuAI Technologies password',
          html: passwordResetTemplate(user.first_name, resetUrl),
          templateName: 'password_reset',
        }).catch(err => console.warn('Password reset email note:', err.message));
      }

      // Always return generic success (prevents email enumeration)
      return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
);

// ============================================================
// POST /api/auth/reset-password
// Validate reset token, update password, and invalidate existing sessions
// ============================================================
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const hashedToken = hashToken(token);

      // Invalidate existing sessions by incrementing token_version
      const result = await pool.query(
        `UPDATE users
         SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, token_version = token_version + 1
         WHERE password_reset_token = $2 AND password_reset_expires > NOW() AND is_active = TRUE
         RETURNING id, email`,
        [passwordHash, hashedToken]
      );

      if (result.rowCount === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      return res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

// ============================================================
// POST /api/auth/change-password
// Authenticated user changes their own password and invalidates other sessions
// ============================================================
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const userResult = await pool.query(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      const updateResult = await pool.query(
        'UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2 RETURNING token_version',
        [newHash, req.user.id]
      );
      const updatedVersion = updateResult.rows[0].token_version;
      const newToken = generateToken(req.user.id, { token_version: updatedVersion });

      return res.json({
        success: true,
        message: 'Password changed successfully. All other sessions have been logged out.',
        token: newToken,
      });
    } catch (err) {
      console.error('Change password error:', err);
      return res.status(500).json({ error: 'Password change failed' });
    }
  }
);
// ============================================================
// POST /api/auth/google
// Verify Google ID token, find-or-create user, link account, issue JWT
// ============================================================
router.post('/google', loginLimiter, async (req, res) => {
  const { idToken, requestedRole, companyName } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google ID token verification failed:', verifyErr.message);
      return res.status(401).json({ error: 'Invalid Google identity token' });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Google token does not contain an email address' });
    }

    // 1. Enforce issuer validation
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      return res.status(401).json({ error: 'Untrusted Google identity token issuer.' });
    }

    // 2. Enforce verified email claim
    if (payload.email_verified !== true) {
      return res.status(403).json({ error: 'Google account email has not been verified by Google.' });
    }

    const { email, sub: googleId, given_name: firstName = 'Google', family_name: lastName = 'User' } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. First: Resolve identity by provider + Google sub
    let userResult = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, email_verified, auth_provider, provider_id, token_version
       FROM users
       WHERE auth_provider = 'google' AND provider_id = $1`,
      [googleId]
    );

    let user;
    let companyData = null;

    if (userResult.rowCount > 0) {
      user = userResult.rows[0];

      if (user.is_active === false) {
        return res.status(403).json({ error: 'Account has been disabled. Please contact support.' });
      }

      // Verify that stored Google sub matches incoming sub
      if (user.provider_id !== googleId) {
        return res.status(403).json({ error: 'Google identity mismatch. Authentication rejected.' });
      }

      // Admin privilege protection
      const roleUpper = (user.role || '').toUpperCase();
      const isAdminRole = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'].includes(roleUpper);
      if (isAdminRole) {
        return res.status(403).json({ error: 'Platform administrative accounts must authenticate via dedicated governance credentials.' });
      }
    } else {
      // 2. Second: Not linked by provider_id; check if an account exists with the verified Google email
      const emailUserResult = await pool.query(
        `SELECT id, email, first_name, last_name, role, is_active, email_verified, auth_provider, provider_id, token_version
         FROM users
         WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );

      if (emailUserResult.rowCount > 0) {
        user = emailUserResult.rows[0];

        if (user.is_active === false) {
          return res.status(403).json({ error: 'Account has been disabled. Please contact support.' });
        }

        // Prevent administrative account takeover via public Google OAuth
        const roleUpper = (user.role || '').toUpperCase();
        const isAdminRole = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'].includes(roleUpper);
        if (isAdminRole) {
          return res.status(403).json({ error: 'Platform administrative accounts must authenticate via dedicated governance credentials.' });
        }

        // If the account was already linked to a DIFFERENT Google sub, reject (identity mismatch protection)
        if (user.auth_provider === 'google' && user.provider_id && user.provider_id !== googleId) {
          return res.status(409).json({ error: 'This email is already associated with a different Google account. Authentication rejected.' });
        }

        // Secure explicit linking: account was password-based; link Google credentials
        await pool.query(
          `UPDATE users SET auth_provider = 'google', provider_id = $1, email_verified = TRUE WHERE id = $2`,
          [googleId, user.id]
        );
        user.auth_provider = 'google';
        user.provider_id = googleId;
        user.email_verified = true;
      } else {
      // New user creation
      const isCandidate = requestedRole === 'CANDIDATE' || !companyName || companyName === 'Candidate Workspace';
      const userRole = isCandidate ? 'CANDIDATE' : 'COMPANY_OWNER';
      const safeRole = ['CANDIDATE', 'COMPANY_OWNER'].includes(userRole) ? userRole : 'CANDIDATE';

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const insertUser = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, auth_provider, provider_id)
           VALUES ($1, 'OAUTH_GOOGLE_USER', $2, $3, $4, TRUE, 'google', $5)
           RETURNING id, email, first_name, last_name, role, token_version`,
          [normalizedEmail, firstName, lastName, safeRole, googleId]
        );
        user = insertUser.rows[0];

        if (safeRole === 'COMPANY_OWNER') {
          const compResult = await client.query(
            `INSERT INTO companies (name, official_email, verification_status)
             VALUES ($1, $2, 'PENDING_VERIFICATION')
             RETURNING id, name, verification_status, created_at`,
            [companyName || `${firstName}'s Organization`, normalizedEmail]
          );
          const comp = compResult.rows[0];
          await client.query(
            `INSERT INTO company_members (company_id, user_id, member_role)
             VALUES ($1, $2, 'COMPANY_OWNER')`,
            [comp.id, user.id]
          );
          companyData = {
            id: comp.id,
            name: comp.name,
            verificationStatus: comp.verification_status,
            createdAt: comp.created_at,
          };
        } else {
          await client.query(
            `INSERT INTO candidates (first_name, last_name, email, phone, location)
             VALUES ($1, $2, $3, '—', 'Global')
             ON CONFLICT (email) DO NOTHING`,
            [firstName, lastName, normalizedEmail]
          );
        }

        await client.query('COMMIT');
      } catch (insertErr) {
        await client.query('ROLLBACK');
        throw insertErr;
      } finally {
        client.release();
      }
    }
  }

    if (!companyData) {
      const memberResult = await pool.query(
        `SELECT cm.company_id, cm.member_role, c.name as company_name, c.verification_status, c.suspended_at, c.onboarding_submitted
         FROM company_members cm
         JOIN companies c ON c.id = cm.company_id
         WHERE cm.user_id = $1
         LIMIT 1`,
        [user.id]
      );
      if (memberResult.rowCount > 0) {
        companyData = {
          id: memberResult.rows[0].company_id,
          name: memberResult.rows[0].company_name,
          verificationStatus: memberResult.rows[0].verification_status,
          isSuspended: memberResult.rows[0].verification_status === 'SUSPENDED' || !!memberResult.rows[0].suspended_at,
          onboardingSubmitted: memberResult.rows[0].onboarding_submitted === true,
        };
      }
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: true,
      },
      company: companyData,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
});

module.exports = router;

