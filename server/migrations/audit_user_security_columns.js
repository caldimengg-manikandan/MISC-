require('dotenv').config({ path: '../.env' });
const db = require('../src/config/mssql');

async function migrate() {
  try {
    console.log('Auditing security columns for users table...');
    const columns = [
      ['session_token', 'VARCHAR(255) NULL'],
      ['session_ip', 'VARCHAR(50) NULL'],
      ['session_device', 'VARCHAR(255) NULL'],
      ['session_device_id', 'VARCHAR(255) NULL'],
      ['session_at', 'DATETIME NULL'],
      ['lastLogin', 'DATETIME NULL'],
      ['otp_code', 'VARCHAR(10) NULL'],
      ['otp_expires_at', 'DATETIME NULL'],
      ['otp_attempts', 'INT DEFAULT 0'],
      ['otp_resend_count', 'INT DEFAULT 0'],
      ['otp_resend_window_start', 'DATETIME NULL'],
      ['failed_attempts', 'INT DEFAULT 0'],
      ['is_locked', 'BIT DEFAULT 0'],
      ['locked_at', 'DATETIME NULL'],
      ['locked_until', 'DATETIME NULL'],
      ['mfa_secret', 'VARCHAR(255) NULL'],
      ['mfa_enabled', 'BIT DEFAULT 0'],
      ['mfa_enrollment_deadline', 'DATETIME NULL']
    ];

    for (const [colName, colDef] of columns) {
      const [rows] = await db.query(`
        IF COL_LENGTH('users', '${colName}') IS NULL
        BEGIN
          ALTER TABLE users ADD ${colName} ${colDef};
          SELECT 'ADDED' as status;
        END
        ELSE
        BEGIN
          SELECT 'EXISTS' as status;
        END
      `);
      console.log(`Column ${colName.padEnd(25)}: ${rows[0].status}`);
    }
    
    console.log('✅ Security columns audit complete');
    
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
