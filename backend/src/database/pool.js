const { Pool } = require('pg');

const SUPABASE_FALLBACK_URL = 'postgresql://postgres.sbdwwtjjpofopnwpqrde:FwM7xr416gKCYQK7@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

let rawDbUrl = (process.env.DATABASE_URL || '').trim();

// If DATABASE_URL is missing, unconfigured, or points to the dead/expired Render internal database (dpg-db4uf0bbc2fs73dlovbg-a),
// automatically fall back to the live, working Supabase PostgreSQL database.
if (!rawDbUrl || rawDbUrl.includes('dpg-db4uf0bbc2fs73dlovbg-a')) {
  console.warn('⚠️ Warning: DATABASE_URL is pointing to expired Render DB (dpg-db4uf0bbc2fs73dlovbg-a) or is empty. Falling back to active Supabase database.');
  rawDbUrl = process.env.SUPABASE_DATABASE_URL || SUPABASE_FALLBACK_URL;
}

const isRemote = rawDbUrl.includes('supabase') || rawDbUrl.includes('pooler') || rawDbUrl.includes('aws') || rawDbUrl.includes('render') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: rawDbUrl || undefined,
  ssl: isRemote
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
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
