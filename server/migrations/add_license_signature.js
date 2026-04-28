require('dotenv').config({ path: '../.env' });
const db = require('../src/config/mssql');

async function migrate() {
  try {
    console.log('Adding signature column to licenses table...');
    await db.query(`
      IF COL_LENGTH('licenses', 'signature') IS NULL
      BEGIN
        ALTER TABLE licenses ADD signature VARCHAR(255) NULL;
      END
    `);
    console.log('✅ Added signature column');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
