// server/src/scripts/migrate_core_refactor.js
require('dotenv').config({ path: '.env' });
const db = require('../config/mssql');

async function migrate() {
    try {
        console.log('🔄 Starting Core Engine Migration (BIGINT Types)...');

        // 1. Update projects table
        console.log('Adding columns to projects...');
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'engineerId')
            ALTER TABLE projects ADD engineerId BIGINT NULL;`);
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'assignedAt')
            ALTER TABLE projects ADD assignedAt DATETIME NULL;`);
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'dueDate')
            ALTER TABLE projects ADD dueDate DATETIME NULL;`);
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'submittedAt')
            ALTER TABLE projects ADD submittedAt DATETIME NULL;`);
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'modules')
            ALTER TABLE projects ADD modules NVARCHAR(MAX) NULL;`);
        await db.query(`IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'createdBy')
            ALTER TABLE projects ADD createdBy BIGINT NULL;`);

        console.log('✅ Updated columns in projects (using BIGINT for IDs).');

        // 2. Data Mapping
        console.log('Mapping data...');
        await db.query(`UPDATE projects SET createdBy = userId WHERE createdBy IS NULL;`);
        await db.query(`UPDATE projects SET dueDate = submissionDeadline WHERE dueDate IS NULL AND submissionDeadline IS NOT NULL;`);
        await db.query(`UPDATE projects SET status = 'NEW' WHERE status IS NULL OR status NOT IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED', 'OVERDUE');`);

        console.log('✅ Mapped existing data and initialized status.');

        // 3. Create activity logs table
        console.log('Creating estimation_activity_logs (dropping if wrong type)...');
        // Always drop it for now as we're in the middle of migration and want it clean
        await db.query(`IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'estimation_activity_logs') DROP TABLE estimation_activity_logs;`);

        await db.query(`
            CREATE TABLE estimation_activity_logs (
                id BIGINT IDENTITY(1,1) PRIMARY KEY,
                estimationId BIGINT NOT NULL,
                action NVARCHAR(50) NOT NULL,
                performedBy BIGINT NOT NULL,
                timestamp DATETIME DEFAULT GETDATE(),
                notes NVARCHAR(MAX) NULL,
                CONSTRAINT FK_estimation_activity_logs_projects FOREIGN KEY (estimationId) REFERENCES projects(id)
            );
        `);

        console.log('✅ Created estimation_activity_logs table with BIGINT types.');

        console.log('🚀 Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
