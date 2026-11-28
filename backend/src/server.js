require('dotenv').config();

const { validateBackendEnv } = require('./config/env');
validateBackendEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const departmentRoutes = require('./routes/departments');
const roleRoutes = require('./routes/roles');
const vacancyRoutes = require('./routes/vacancies');
const candidateRoutes = require('./routes/candidates');
const assessmentRoutes = require('./routes/assessments');
const integrityRoutes = require('./routes/integrity');
const interviewRoutes = require('./routes/interviews');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const { router: evidenceRoutes } = require('./routes/evidence');

const candidatePortalRoutes = require('./routes/candidatePortal');
const candidateInterestRoutes = require('./routes/candidateInterest');
const readinessRoutes = require('./routes/readiness');
const { router: roleBlueprintRoutes } = require('./routes/roleBlueprints');
const { router: shortlistRoutes } = require('./routes/shortlist');
const { router: skillClaimRoutes } = require('./routes/skillClaims');

const { requestLogger } = require('./middleware/requestLogger');
const { sendSuccess, sendError } = require('./utils/apiResponse');

const app = express();

// ============================================================
// Security & Parsing
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration supporting local dev, Vercel preview/production domains, and FRONTEND_URL
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // allow same-origin, curl, server-to-server
  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // Exact match from FRONTEND_URL or defaults
  if (configuredOrigins.includes(cleanOrigin)) return true;
  if (cleanOrigin === 'http://localhost:3000' || cleanOrigin === 'http://127.0.0.1:3000') return true;

  // Allow all Vercel deployments (*.vercel.app)
  try {
    const parsed = new URL(cleanOrigin);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    if (parsed.hostname.endsWith('.vercel.app')) return true;
    if (parsed.hostname.endsWith('.onrender.com')) return true;
  } catch (_) {}

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Return false instead of Error so Express doesn't crash on preflight and responds cleanly
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
// In Express 5, handle all OPTIONS preflight requests using a RegExp path or router-level cors
app.options(/(.*)/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/company/role-blueprints', roleBlueprintRoutes);
app.use('/api/company', roleBlueprintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/integrity', integrityRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/evidence', evidenceRoutes);

app.use('/api/candidate-portal', candidatePortalRoutes);
app.use('/api/candidate-portal', candidateInterestRoutes);
app.use('/api/candidate', candidateInterestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/company/vacancies', readinessRoutes);
// New GenuAI proof-level core: explainable shortlist + hiring outcomes + skill claims
app.use('/api/company/vacancies', shortlistRoutes);
app.use('/api/candidate/skill-claims', skillClaimRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'GenuAI API', version: '2.0', message: 'Backend is running' });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let migrationVersion = null;
  let migrationCount = 0;
  try {
    const pool = require('./database/pool');
    await pool.query('SELECT 1');
    dbStatus = 'connected';
    const migRes = await pool.query(
      `SELECT version FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1`
    ).catch(() => null);
    const countRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM schema_migrations`).catch(() => null);
    migrationVersion = migRes?.rows?.[0]?.version || null;
    migrationCount = countRes?.rows?.[0]?.cnt ?? 0;
  } catch (e) {
    dbStatus = 'error';
    dbError = e.message;
  }
  const { validateBackendEnv } = require('./config/env');
  const envReadiness = validateBackendEnv();
  const isHealthy = dbStatus === 'connected' && envReadiness.dbConfigured && envReadiness.jwtConfigured;
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'GenuAI API',
    version: '2.0',
    database: dbStatus,
    databaseError: dbError,
    migrationVersion,
    migrationCount,
    environment: envReadiness,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  return sendError(res, { statusCode: 404, error: `Route ${req.method} ${req.path} not found`, code: 'NOT_FOUND' });
});

// Global error handler
app.use((err, req, res, next) => {
  const requestId = req.id || `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const isDbOffline = err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EAI_AGAIN' ||
    (Array.isArray(err.errors) && err.errors.some(e => e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND'));

  if (isDbOffline) {
    if (req.method === 'GET') {
      // Return sensible empty payloads per route prefix
      const path = req.path;
      if (path.startsWith('/api/vacancies')) return res.json({ vacancies: [] });
      if (path.startsWith('/api/candidates')) return res.json({ candidates: [] });
      if (path.startsWith('/api/interviews')) return res.json({ interviews: [] });
      if (path.startsWith('/api/integrity')) return res.json({ signals: [], stats: {} });
      if (path.startsWith('/api/departments')) return res.json({ departments: [] });
      if (path.startsWith('/api/roles')) return res.json({ roles: [] });
      if (path.startsWith('/api/assessments')) return res.json({ assessments: [] });
      if (path.startsWith('/api/reports')) return res.json({ vacancies: [], candidates: [], pipeline: [] });
      if (path.startsWith('/api/company')) return res.json({ company: null });
      return res.json({});
    }
    return sendError(res, {
      statusCode: 503,
      error: 'Database temporarily unavailable. Please try again later.',
      code: 'DB_UNAVAILABLE',
      requestId,
      guidance: 'Your data was not lost. Retry the request in a few moments.',
    });
  }

  console.error(`[requestId=${requestId}] Unhandled error:`, err);
  return sendError(res, {
    statusCode: 500,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
    guidance: 'Please retry. If the problem persists, contact support with this request ID.',
  });
});

// ============================================================
// Start Server with Schema Verification (No Auto-Seeding)
// ============================================================
const { runAll } = require('./database/migrate_all');
const { verifySchema } = require('./database/verify_schema');

const PORT = process.env.PORT || 4000;
let serverInstance = null;
if (require.main === module || !module.parent) {
  serverInstance = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 GenuAI API v2.0 running on http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

    try {
      const migResult = await runAll();
      if (migResult?.skippedBuildTime) {
        console.warn('⚠️  Database host is not accessible in this environment yet (e.g. Render internal host during spin-up/build).');
        console.warn('ℹ️  Server will continue running in read/safe mode. Schema verification deferred until database is reachable.');
      } else {
        await verifySchema();
        console.log('✅ Deployment schema validated successfully.');
      }
    } catch (err) {
      console.error('❌ Schema validation error on startup:', err.message);
      // If the error is network/DNS resolution (e.g. Render internal hostname ENOTFOUND during initial boot or service linkage)
      const isDnsOrNetwork = err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'ECONNREFUSED';
      if (isDnsOrNetwork) {
        console.warn('⚠️  Database is not reachable yet at startup (' + err.message + ').');
        console.warn('ℹ️  Server keeping port open for Render health check. Database requests will retry gracefully.');
      } else if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: Production server refusing to operate with unverified schema. Run npm run migrate:all first.');
        process.exit(1);
      } else {
        console.warn('⚠️ Non-production environment: continuing despite schema warning.');
      }
    }
  });
}

module.exports = app;
