const { poolPromise } = require('../config/mssql');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Running migration: Create project_attachments table...');

        const query = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='project_attachments' and xtype='U')
        BEGIN
            CREATE TABLE [project_attachments] (
                [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                [project_id] VARCHAR(100) NOT NULL,
                [file_name] NVARCHAR(255) NOT NULL,
                [file_path] NVARCHAR(1000) NOT NULL,
                [file_type] NVARCHAR(100),
                [file_size] BIGINT,
                [created_at] DATETIME DEFAULT GETDATE(),
                
                -- Foreign key constraint
                -- CONSTRAINT FK_ProjectAttachments_Project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            
            -- Create index for faster lookups by project
            CREATE INDEX IX_ProjectAttachments_ProjectId ON [project_attachments](project_id);
            
            PRINT 'Table project_attachments created successfully.'
        END
        ELSE
        BEGIN
            PRINT 'Table project_attachments already exists.'
        END
        `;

        await pool.request().query(query);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
