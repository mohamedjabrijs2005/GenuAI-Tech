require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function inspect() {
  const r = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('companies', 'audit_logs', 'company_roles', 'users', 'departments', 'requirements', 'vacancy_versions')
    ORDER BY table_name, ordinal_position
  `);
  console.log('Columns:');
  r.rows.forEach(x => {
    console.log(`${x.table_name}.${x.column_name}: ${x.data_type} (nullable: ${x.is_nullable})`);
  });

  const constraints = await pool.query(`
    SELECT conname, contype, relname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'public'
  `);
  console.log('\nConstraints:');
  constraints.rows.forEach(c => {
    console.log(`${c.relname} -> ${c.conname} (${c.contype}): ${c.def}`);
  });

  await pool.end();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
