require('dotenv').config({ path: '../.env' });
const db = require('../src/config/mssql');

async function migrate() {
  try {
    console.log('Adding MFA columns to users table...');
    await db.query(`
      IF COL_LENGTH('users', 'mfa_secret') IS NULL
      BEGIN
        ALTER TABLE users ADD mfa_secret VARCHAR(255) NULL;
      END
      
      IF COL_LENGTH('users', 'mfa_enabled') IS NULL
      BEGIN
        ALTER TABLE users ADD mfa_enabled BIT DEFAULT 0;
      END
      
      IF COL_LENGTH('users', 'mfa_enrollment_deadline') IS NULL
      BEGIN
        ALTER TABLE users ADD mfa_enrollment_deadline DATETIME NULL;
      END
    `);
    console.log('✅ Added MFA columns');
    
    // Set grace period for existing admins
    console.log('Setting MFA grace period for existing admins...');
    await db.query(`
      UPDATE users 
      SET mfa_enrollment_deadline = DATEADD(day, 7, GETDATE())
      WHERE role IN ('admin', 'superadmin') AND mfa_enrollment_deadline IS NULL
    `);
    console.log('✅ Grace period set');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
