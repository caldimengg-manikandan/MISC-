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

async function addNotesTable() {
    let pool;
    try {
        console.log('Connecting to MSSQL...');
        pool = await mssql.connect(config);
        
        console.log('Checking for project_notes table...');
        const checkTable = `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'project_notes')
            BEGIN
                CREATE TABLE [project_notes] (
                    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                    [projectId] BIGINT NOT NULL,
                    [userId] BIGINT NOT NULL,
                    [title] NVARCHAR(255),
                    [content] NVARCHAR(MAX),
                    [note_type] NVARCHAR(50) DEFAULT 'personal', -- 'personal' or 'general'
                    [pos_x] FLOAT DEFAULT 100,
                    [pos_y] FLOAT DEFAULT 100,
                    [isPinned] BIT DEFAULT 1,
                    [color] NVARCHAR(20) DEFAULT '#e0f7fa',
                    [mentions] NVARCHAR(MAX), -- Store as JSON string
                    [createdAt] DATETIME DEFAULT GETDATE(),
                    [updatedAt] DATETIME DEFAULT GETDATE(),
                    CONSTRAINT [fk_note_project] FOREIGN KEY ([projectId]) REFERENCES [projects]([id]) ON DELETE CASCADE,
                    CONSTRAINT [fk_note_user] FOREIGN KEY ([userId]) REFERENCES [users]([id])
                );
                PRINT '✅ Created project_notes table';
            END
            ELSE
            BEGIN
                PRINT 'ℹ️ project_notes table already exists';
            END`;

        await pool.request().query(checkTable);
        console.log('✅ Migration completed successfully');
        await pool.close();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (pool) await pool.close();
        process.exit(1);
    }
}

addNotesTable();
