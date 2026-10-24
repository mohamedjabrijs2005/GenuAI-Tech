require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V20 (Automatic updated_at Triggers)...');
    await client.query('BEGIN');

    // 1. Create reusable trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Function set_updated_at() defined.');

    // 2. Query all tables in public schema that have an updated_at column
    const tablesRes = await client.query(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'updated_at'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables with updated_at column.`);

    let attachedCount = 0;
    for (const table of tables) {
      const triggerName = `trg_${table}_updated_at`;
      await client.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${table}";`);
      await client.query(`
        CREATE TRIGGER "${triggerName}"
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      `);
      attachedCount++;
    }

    console.log(`Successfully attached BEFORE UPDATE trigger to ${attachedCount} tables.`);

    await client.query('COMMIT');
    console.log('Migration V20 applied successfully!');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration V20 failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
