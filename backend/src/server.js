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

const app = express();

// ============================================================
// Security & Parsing
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/integrity', integrityRoutes);
app.use('/api/interviews', interviewRoutes);
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
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Start
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GenuAI API v2.0 running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Routes: auth, company, departments, roles, vacancies, candidates, assessments, integrity, interviews, reports`);
});

module.exports = app;
