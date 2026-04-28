-- ==========================================================
-- Security Migration v3: Audit Logs + User Lockout Columns
-- Run once in SSMS on MISC_DB
-- ==========================================================

USE MISC_DB;
GO

-- 1. Create audit_logs table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        user_id    INT NULL,
        action     VARCHAR(50)  NOT NULL,   -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAIL
        resource   VARCHAR(100) NOT NULL,   -- projects, users, customers, etc.
        record_id  VARCHAR(50)  NULL,
        before_val NVARCHAR(MAX) NULL,      -- JSON snapshot before (sanitized)
        after_val  NVARCHAR(MAX) NULL,      -- JSON snapshot after  (sanitized)
        ip_address VARCHAR(45)  NULL,
        user_agent VARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE() NOT NULL
    );

    -- Index for retention queries and user-based lookups
    CREATE INDEX idx_audit_created ON audit_logs(created_at);
    CREATE INDEX idx_audit_user    ON audit_logs(user_id);
    CREATE INDEX idx_audit_action  ON audit_logs(action);

    PRINT '✅ audit_logs table created.';
END
ELSE
    PRINT 'audit_logs already exists — skipped.';
GO

-- 2. Add failed_attempts and is_locked columns to users (if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'failed_attempts')
BEGIN
    ALTER TABLE users ADD failed_attempts INT NOT NULL DEFAULT 0;
    PRINT '✅ Added failed_attempts to users.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_locked')
BEGIN
    ALTER TABLE users ADD is_locked BIT NOT NULL DEFAULT 0;
    PRINT '✅ Added is_locked to users.';
END
GO

-- Note: locked_until already exists from previous OTP lockout migration.
-- Verify:
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('failed_attempts', 'is_locked', 'locked_until');
GO

-- 3. Retention policy: SQL Server Agent job to delete records older than 90 days
-- Create this job in SSMS > SQL Server Agent > Jobs > New Job
-- Step command (run nightly at 2:00 AM):
--
-- DELETE FROM audit_logs WHERE created_at < DATEADD(DAY, -90, GETDATE());
--
-- Document this in: server/docs/LOG_RETENTION_RUNBOOK.md
