require('dotenv').config();

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
const candidateAssessmentRoutes = require('./routes/candidateAssessments');

const app = express();

// ============================================================
// Security & Parsing
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/integrity', integrityRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/candidate-assessments', candidateAssessmentRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GenuAI API', version: '2.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  const isDbOffline = err.code === 'ECONNREFUSED' ||
    (Array.isArray(err.errors) && err.errors.some(e => e.code === 'ECONNREFUSED'));

  if (isDbOffline) {
    console.warn(`[DB OFFLINE] ${req.method} ${req.path} — returning empty response`);
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
    return res.status(503).json({ error: 'Database temporarily unavailable. Please try again later.' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Start
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GenuAI API v2.0 running on http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Routes: auth, company, departments, roles, vacancies, candidates, assessments, integrity, interviews, reports`);
});

module.exports = app;
