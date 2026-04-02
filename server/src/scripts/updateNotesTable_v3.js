const mssql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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

async function updateNotesTable() {
    let pool;
    try {
        console.log('Connecting to MSSQL...');
        pool = await mssql.connect(config);
        
        console.log('Updating project_notes table...');
        
        const alterTable = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'is_deleted')
            BEGIN
                ALTER TABLE [project_notes] ADD [is_deleted] BIT DEFAULT 0;
                -- Update existing records
                EXEC('UPDATE [project_notes] SET [is_deleted] = 0');
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'deleted_at')
            BEGIN
                ALTER TABLE [project_notes] ADD [deleted_at] DATETIME NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'is_locked')
            BEGIN
                ALTER TABLE [project_notes] ADD [is_locked] BIT DEFAULT 0;
                -- Update existing records
                EXEC('UPDATE [project_notes] SET [is_locked] = 0');
            END
        `;

        await pool.request().query(alterTable);
        console.log('✅ Migration completed successfully: added is_deleted, deleted_at, is_locked');
        await pool.close();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (pool) await pool.close();
        process.exit(1);
    }
}

updateNotesTable();
