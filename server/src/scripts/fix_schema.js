const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function fixSchema() {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await mssql.connect(config);
        
        const alterTableSql = `
            -- Add missing columns to projects table if they don't exist
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'totalWeight')
                ALTER TABLE projects ADD totalWeight DECIMAL(15,2) DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'totalCost')
                ALTER TABLE projects ADD totalCost DECIMAL(15,2) DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'estimationResult')
                ALTER TABLE projects ADD estimationResult NVARCHAR(MAX);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'isPinned')
                ALTER TABLE projects ADD isPinned BIT DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'isArchived')
                ALTER TABLE projects ADD isArchived BIT DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'workflow_status')
                ALTER TABLE projects ADD workflow_status NVARCHAR(50);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'assigned_engineer_id')
                ALTER TABLE projects ADD assigned_engineer_id BIGINT;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'assignedAt')
                ALTER TABLE projects ADD assignedAt DATETIME;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'submittedAt')
                ALTER TABLE projects ADD submittedAt DATETIME;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'engineerId')
                ALTER TABLE projects ADD engineerId BIGINT;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'assignedEngineer')
                ALTER TABLE projects ADD assignedEngineer NVARCHAR(255);

            -- Ensure snake_case columns exist for Repository compatibility if not already there
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'project_location')
                ALTER TABLE projects ADD project_location NVARCHAR(255);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'gc_name')
                ALTER TABLE projects ADD gc_name NVARCHAR(255);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'vendor_name')
                ALTER TABLE projects ADD vendor_name NVARCHAR(255);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'aisc_certified')
                ALTER TABLE projects ADD aisc_certified NVARCHAR(50) DEFAULT 'Yes';
        `;
        
        console.log('Applying schema fixes...');
        await pool.request().query(alterTableSql);
        console.log('✅ Schema synchronization complete.');
        
        await pool.close();
    } catch (err) {
        console.error('❌ Schema fix failed:', err.message);
        if (pool) await pool.close();
    }
}

fixSchema();
