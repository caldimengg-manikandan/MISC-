require('dotenv').config({ path: '../.env' });
const db = require('../src/config/mssql');

async function migrate() {
  try {
    console.log('Adding account lockout columns to users table...');
    await db.query(`
      IF COL_LENGTH('users', 'failed_attempts') IS NULL
      BEGIN
        ALTER TABLE users ADD failed_attempts INT DEFAULT 0;
      END
      
      IF COL_LENGTH('users', 'is_locked') IS NULL
      BEGIN
        ALTER TABLE users ADD is_locked BIT DEFAULT 0;
      END
      
      IF COL_LENGTH('users', 'locked_at') IS NULL
      BEGIN
        ALTER TABLE users ADD locked_at DATETIME NULL;
      END

      IF COL_LENGTH('users', 'locked_until') IS NULL
      BEGIN
        ALTER TABLE users ADD locked_until DATETIME NULL;
      END
    `);
    console.log('✅ Added account lockout columns');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
