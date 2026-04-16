-- =========================================================================
-- MISC Workflow State Machine Migration (FINAL MSSQL VERSION)
-- =========================================================================

-- 1. Add workflow columns to projects table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'workflow_status')
BEGIN
    ALTER TABLE projects ADD 
        assigned_engineer_id INT NULL,
        workflow_status NVARCHAR(20) NOT NULL DEFAULT 'new',
        revision_number INT NOT NULL DEFAULT 0,
        review_comment NVARCHAR(MAX) NULL,
        submitted_at DATETIME NULL,
        sent_to_client_at DATETIME NULL,
        sent_to_email NVARCHAR(255) NULL;
END
GO

-- 2. Create activity_log table
IF OBJECT_ID('activity_log', 'U') IS NULL
BEGIN
    CREATE TABLE activity_log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        action NVARCHAR(100) NOT NULL,
        comment NVARCHAR(MAX) NULL,
        from_status NVARCHAR(50) NULL,
        to_status NVARCHAR(50) NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 3. Create notifications table
IF OBJECT_ID('notifications', 'U') IS NULL
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NULL,
        type NVARCHAR(100) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4. Update the User Role Constraint
DECLARE @ConstraintName nvarchar(200);
SELECT @ConstraintName = Name FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('users') AND definition LIKE '%role%';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE users DROP CONSTRAINT ' + @ConstraintName);
END

-- Add new constraint including new roles
ALTER TABLE users ADD CONSTRAINT CK_users_role 
CHECK (role IN ('user', 'owner', 'admin', 'estimator'));
GO

-- 5. Seed Users (Corrected hashes for '12345678')
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@caldim.com')
BEGIN
    INSERT INTO users (email, password, full_name, role)
    VALUES ('admin@caldim.com', '$2a$10$wkm6u66YuVlNc/SubyhNg.wKbWtb7KEHDzSG8MEF57sEEk.bQwwbm', 'System Admin', 'admin');
END
ELSE
BEGIN
    UPDATE users SET password = '$2a$10$wkm6u66YuVlNc/SubyhNg.wKbWtb7KEHDzSG8MEF57sEEk.bQwwbm' WHERE email = 'admin@caldim.com';
END

IF NOT EXISTS (SELECT * FROM users WHERE email = 'estimator@caldim.com')
BEGIN
    INSERT INTO users (email, password, full_name, role)
    VALUES ('estimator@caldim.com', '$2a$10$wkm6u66YuVlNc/SubyhNg.wKbWtb7KEHDzSG8MEF57sEEk.bQwwbm', 'Lead Estimator', 'estimator');
END
ELSE
BEGIN
    UPDATE users SET password = '$2a$10$wkm6u66YuVlNc/SubyhNg.wKbWtb7KEHDzSG8MEF57sEEk.bQwwbm' WHERE email = 'estimator@caldim.com';
END
GO
