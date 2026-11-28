/**
 * Environment-variable validation for GenuAI Backend.
 * Logs explicit warnings in development/test and fails fast in production if critical vars are missing.
 */
function validateBackendEnv() {
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  const requiredInProd = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'APP_URL'];
  const recommended = ['PORT', 'JWT_EXPIRES_IN', 'DEADLINE_TZ'];

  const missingRequired = requiredInProd.filter((k) => !(process.env[k] || '').trim());
  const missingRecommended = recommended.filter((k) => !(process.env[k] || '').trim());

  const hasBrokenRenderHost = (process.env.DATABASE_URL || '').includes('dpg-db4uf0bbc2fs73dlovbg-a');

  if (hasBrokenRenderHost) {
    console.warn('[ENV] DATABASE_URL points to retired Render host dpg-db4uf0bbc2fs73dlovbg-a; pool.js fallback active. Update Render env var.');
  }

  // Check URL scheme in production for FRONTEND_URL and APP_URL
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();
  const appUrl = (process.env.APP_URL || '').trim();

  const invalidUrls = [];
  if (isProd) {
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      invalidUrls.push(`FRONTEND_URL must use https:// in production (current: "${frontendUrl}")`);
    }
    if (appUrl && !appUrl.startsWith('https://')) {
      invalidUrls.push(`APP_URL must use https:// in production (current: "${appUrl}")`);
    }
  }

  if (missingRequired.length > 0 || invalidUrls.length > 0) {
    const issues = [
      missingRequired.length > 0 ? `Missing critical environment variable(s): ${missingRequired.join(', ')}` : null,
      ...invalidUrls,
    ].filter(Boolean);
    const msg = `[ENV] ${issues.join('; ')}`;
    if (isProd) {
      console.error(msg);
      throw new Error(msg);
    } else if (env !== 'test') {
      console.warn(`${msg} (non-production mode; continuing with fallback where available)`);
    }
  }

  // Validate partial/misconfigured Google OAuth setup
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const googleCallbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();
  const oauthConfigured = Boolean(googleClientId && googleClientSecret);
  if ((googleClientId || googleClientSecret || googleCallbackUrl) && !oauthConfigured) {
    console.warn('[ENV] Partial Google OAuth config: both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for OAuth flow.');
  }
  if (isProd && oauthConfigured && !googleCallbackUrl && !(process.env.APP_URL || '').trim()) {
    console.warn('[ENV] GOOGLE_CALLBACK_URL or APP_URL should be set in production when Google OAuth is enabled.');
  }

  // Validate SMTP / Gmail email configuration
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASSWORD || '').trim();
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  const emailConfigured = Boolean((smtpUser && smtpPass) || (gmailUser && gmailPass));
  if ((smtpUser || smtpPass) && !(smtpUser && smtpPass)) {
    console.warn('[ENV] Partial SMTP config: both SMTP_USER and SMTP_PASSWORD must be set.');
  }
  if ((gmailUser || gmailPass) && !(gmailUser && gmailPass)) {
    console.warn('[ENV] Partial Gmail config: both GMAIL_USER and GMAIL_APP_PASSWORD must be set.');
  }
  if (isProd && !emailConfigured) {
    console.warn('[ENV] No email credentials configured (SMTP_USER/SMTP_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD); transactional emails will fail.');
  }

  // Validate DEADLINE_TZ if provided
  const deadlineTz = (process.env.DEADLINE_TZ || '').trim();
  if (deadlineTz) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: deadlineTz });
    } catch {
      const tzMsg = `[ENV] Invalid DEADLINE_TZ "${deadlineTz}". Must be a valid IANA time zone (e.g., UTC, Asia/Kolkata).`;
      if (isProd) throw new Error(tzMsg);
      console.warn(tzMsg);
    }
  }

  if (isProd && missingRecommended.length > 0) {
    console.warn(`[ENV] Missing recommended environment variable(s): ${missingRecommended.join(', ')}`);
  }

  return {
    env,
    isProd,
    dbConfigured: Boolean((process.env.DATABASE_URL || '').trim()),
    jwtConfigured: Boolean((process.env.JWT_SECRET || '').trim()),
    jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d').trim(),
    appUrlConfigured: Boolean((process.env.APP_URL || '').trim()),
    frontendUrlConfigured: Boolean((process.env.FRONTEND_URL || '').trim()),
    oauthConfigured,
    emailConfigured,
    deadlineTz: deadlineTz || 'UTC',
  };
}

module.exports = { validateBackendEnv };
