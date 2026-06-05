-- ==========================================================
-- Phase 1.1 Security: Replace 'sa' with least-privilege app user
-- Run this in SSMS as sa BEFORE updating .env
-- ==========================================================

USE MISC_DB;
GO

-- 1. Create the app login and user
IF NOT EXISTS (SELECT name FROM sys.sql_logins WHERE name = 'misc_app_user')
BEGIN
    CREATE LOGIN misc_app_user WITH PASSWORD = 'M!sc@pp_2026#Secure';
    PRINT 'Login misc_app_user created.';
END
ELSE
    PRINT 'Login misc_app_user already exists.';
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'misc_app_user')
BEGIN
    CREATE USER misc_app_user FOR LOGIN misc_app_user;
    PRINT 'User misc_app_user created in MISC_DB.';
END
GO

-- 2. Grant only what the app needs
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO misc_app_user;
PRINT 'SELECT/INSERT/UPDATE/DELETE granted on dbo schema.';
GO

-- 3. Deny dangerous DDL operations
DENY ALTER ON SCHEMA::dbo TO misc_app_user;
DENY CREATE TABLE TO misc_app_user;
PRINT 'ALTER on schema and CREATE TABLE denied.';
GO

-- 4. Verify permissions before proceeding
SELECT
    dp.name               AS principal,
    dp.type_desc          AS type,
    o.name                AS object_name,
    p.permission_name,
    p.state_desc
FROM sys.database_permissions p
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
LEFT JOIN sys.objects o ON p.major_id = o.object_id
WHERE dp.name = 'misc_app_user'
ORDER BY p.permission_name;
GO

-- ==========================================================
-- ONLY run the block below AFTER confirming:
--   1. No SQL Agent jobs run under 'sa'
--   2. No SSMS maintenance plans reference 'sa' credentials
--   3. No backup scripts hardcode 'sa'
--   4. No monitoring tools connect via 'sa'
-- Then update .env: MSSQL_USER=misc_app_user
-- ==========================================================

-- UNCOMMENT WHEN READY:
-- ALTER LOGIN sa DISABLE;
-- PRINT 'sa login disabled.';
-- GO
