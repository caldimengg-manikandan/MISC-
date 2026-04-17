// scripts/migrate_otp.js
const db = require('../server/src/config/mssql');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Check if columns exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('otp', 'otpExpires')
    `);

    const hasOtp = columns.some(c => c.COLUMN_NAME === 'otp');
    const hasOtpExpires = columns.some(c => c.COLUMN_NAME === 'otpExpires');

    if (!hasOtp) {
      console.log('Adding otp column...');
      await db.query('ALTER TABLE users ADD otp VARCHAR(6)');
    }

    if (!hasOtpExpires) {
      console.log('Adding otpExpires column...');
      await db.query('ALTER TABLE users ADD otpExpires DATETIME');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
