require('dotenv').config();
const db = require('../config/mssql');

async function up() {
  console.log('🚀 Running migration: Add additionalCosts to projects');
  try {
    await db.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'additionalCosts'
      )
      BEGIN
        ALTER TABLE projects ADD additionalCosts NVARCHAR(MAX) NULL;
        PRINT 'Column additionalCosts added to projects table.';
      END
      ELSE
      BEGIN
        PRINT 'Column additionalCosts already exists.';
      END
    `);
    console.log('✅ Migration successful');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
