const { Pool } = require('pg');

const isSupabase = (process.env.DATABASE_URL || '').includes('supabase.co');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Database connected');
  }
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  process.exit(-1);
});

module.exports = pool;
