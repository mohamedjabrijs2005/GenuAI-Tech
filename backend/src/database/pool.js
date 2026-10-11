const { Pool } = require('pg');

const rawDbUrl = (process.env.DATABASE_URL || '').trim();
const isRemote = rawDbUrl.includes('supabase') || rawDbUrl.includes('pooler') || rawDbUrl.includes('aws') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: rawDbUrl || undefined,
  ssl: isRemote
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Database connected');
  }
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message || err);
});

module.exports = pool;
