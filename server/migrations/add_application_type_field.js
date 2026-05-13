require('dotenv').config();
const db = require('../src/config/mssql');

async function run() {
  try {
    console.log('🔧 Running migration: add_application_type_field...');

    // Check if column already exists
    const checkResult = await db.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'dictionary'
      AND COLUMN_NAME = 'recommended_application_type'
    `);
    const exists = checkResult[0]?.[0]?.cnt > 0;

    if (exists) {
      console.log('ℹ️  Column recommended_application_type already exists. Skipping.');
    } else {
      await db.query(`
        ALTER TABLE dictionary
        ADD recommended_application_type NVARCHAR(255) NULL;
      `);
      console.log('✅ Column recommended_application_type added to dictionary table.');
    }

    console.log('✅ Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
