const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MIGRATIONS = [
  'migrate.js',
  'migrate_v2.js',
  'migrate_v3.js',
  'migrate_v4.js',
  'migrate_v5.js',
  'migrate_v6.js',
  'migrate_v7.js',
  'migrate_v8.js',
  'migrate_v9.js',
  'migrate_v10.js',
  'migrate_v11.js',
  'migrate_v12.js',
  'migrate_v13.js',
  'migrate_v14.js',
  'migrate_v15.js',
  'migrate_v16.js'
];

async function runAll() {
  console.log('============================================================');
  console.log('🚀 Running all GenuAI database migrations in sequence...');
  console.log('============================================================');

  for (const file of MIGRATIONS) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Warning: Migration file ${file} not found, skipping.`);
      continue;
    }

    console.log(`\n▶️ Executing: ${file}`);
    try {
      execFileSync(process.execPath, [fullPath], {
        stdio: 'inherit',
        env: process.env
      });
      console.log(`✅ ${file} completed successfully.`);
    } catch (err) {
      console.error(`❌ ${file} failed! Stopping migration runner.`);
      process.exit(1);
    }
  }

  console.log('\n============================================================');
  console.log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
  console.log('============================================================\n');
}

if (require.main === module) {
  runAll().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });
}

module.exports = { runAll, MIGRATIONS };
