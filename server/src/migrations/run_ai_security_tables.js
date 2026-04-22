const db = require('../config/mssql');
const logger = require('../utils/logger');

async function runMigration() {
  try {
    logger.info('Starting ai_security_log migration...');

    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ai_security_log' AND xtype='U')
      BEGIN
        CREATE TABLE [dbo].[ai_security_log] (
          [id]         INT IDENTITY PRIMARY KEY,
          [user_id]    INT NOT NULL,
          [company_id] INT NOT NULL,
          [query]      NVARCHAR(MAX),
          [category]   NVARCHAR(100),
          [ip_address] NVARCHAR(50),
          [created_at] DATETIME DEFAULT GETDATE()
        );
        PRINT 'Created ai_security_log table.';
      END
      ELSE
      BEGIN
        PRINT 'ai_security_log table already exists.';
      END
    `;

    await db.query(createTableQuery);

    logger.info('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', err);
    process.exit(1);
  }
}

runMigration();
