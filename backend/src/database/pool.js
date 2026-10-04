const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('connect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Database connected');
      }
    });

    pool.on('error', (err) => {
      console.warn('⚠️ Database pool error:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ DB connection failed:', err.message);
  }
}

if (!pool) {
  console.warn('⚠️ [GenuAI] DATABASE_URL not set — using safe mock pool');
  const mockQuery = async () => ({ rows: [], rowCount: 0 });
  pool = {
    query: mockQuery,
    connect: async () => ({
      query: mockQuery,
      release: () => {},
    }),
    end: async () => {},
    on: () => {},
  };
}

module.exports = pool;
