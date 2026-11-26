/**
 * Environment-variable validation for GenuAI Backend.
 * Logs explicit warnings in development/test and fails fast in production if critical vars are missing.
 */
function validateBackendEnv() {
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  const requiredInProd = ['DATABASE_URL', 'JWT_SECRET'];
  const recommended = ['FRONTEND_URL', 'PORT'];

  const missingRequired = requiredInProd.filter((k) => !(process.env[k] || '').trim());
  const missingRecommended = recommended.filter((k) => !(process.env[k] || '').trim());

  const hasBrokenRenderHost = (process.env.DATABASE_URL || '').includes('dpg-db4uf0bbc2fs73dlovbg-a');

  if (hasBrokenRenderHost) {
    console.warn('[ENV] DATABASE_URL points to retired Render host dpg-db4uf0bbc2fs73dlovbg-a; pool.js fallback active. Update Render env var.');
  }

  if (missingRequired.length > 0) {
    const msg = `[ENV] Missing critical environment variable(s): ${missingRequired.join(', ')}`;
    if (isProd) {
      console.error(msg);
      throw new Error(msg);
    } else if (env !== 'test') {
      console.warn(`${msg} (non-production mode; continuing with fallback where available)`);
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
    frontendUrlConfigured: Boolean((process.env.FRONTEND_URL || '').trim()),
    emailConfigured: Boolean((process.env.SMTP_USER || process.env.GMAIL_USER) && (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD)),
  };
}

module.exports = { validateBackendEnv };
