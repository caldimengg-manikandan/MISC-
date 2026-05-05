/**
 * deploy_migrations.js
 * Run this on the VPS to apply the new MFA and Attachment schema changes.
 */

process.env.MSSQL_TRUST_SERVER_CERTIFICATE = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function migrate() {
  console.log('🚀 Starting production migrations...');

  try {
    // 1. Add MFA columns to Users
    console.log('--- Checking MFA columns ---');
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'mfa_enabled')
      BEGIN
          ALTER TABLE users ADD mfa_enabled BIT DEFAULT 0;
          ALTER TABLE users ADD mfa_secret NVARCHAR(MAX) NULL;
          PRINT '✅ Added MFA columns to users table.';
      END
      ELSE PRINT 'ℹ️ MFA columns already exist.';
    `);

    // 2. Add additionalCosts to Projects
    console.log('--- Checking Projects columns ---');
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'additionalCosts')
      BEGIN
          ALTER TABLE projects ADD additionalCosts NVARCHAR(MAX) NULL;
          PRINT '✅ Added additionalCosts column to projects table.';
      END
      ELSE PRINT 'ℹ️ additionalCosts column already exists.';
    `);

    // 3. Create Attachments Table
    console.log('--- Checking Attachments table ---');
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('project_attachments') AND type = 'U')
      BEGIN
          CREATE TABLE project_attachments (
              id INT PRIMARY KEY IDENTITY(1,1),
              projectId INT NOT NULL,
              userId INT NOT NULL,
              filename NVARCHAR(255),
              original_name NVARCHAR(255),
              mime_type NVARCHAR(100),
              file_path NVARCHAR(MAX),
              storage_key NVARCHAR(MAX),
              file_size BIGINT,
              is_deleted BIT DEFAULT 0,
              createdAt DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_ProjectAttachments_Project FOREIGN KEY (projectId) REFERENCES projects(id),
              CONSTRAINT FK_ProjectAttachments_User FOREIGN KEY (userId) REFERENCES users(id)
          );
          PRINT '✅ Created project_attachments table.';
      END
      ELSE PRINT 'ℹ️ project_attachments table already exists.';
    `);

    console.log('\n✨ All migrations applied successfully!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.originalError) console.error(err.originalError.message);
  } finally {
    process.exit(0);
  }
}

migrate();
