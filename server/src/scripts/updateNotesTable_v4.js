const sql = require('mssql');
require('dotenv').config({ path: '../../.env' });

const config = {
    user: (process.env.MSSQL_USER || 'sa').trim(),
    password: (process.env.MSSQL_PASSWORD || '').trim(),
    server: (process.env.MSSQL_SERVER || 'localhost').trim(),
    database: (process.env.MSSQL_DATABASE || 'MISC_DB').trim(),
    port: parseInt(process.env.MSSQL_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: (process.env.MSSQL_TRUST_SERVER_CERTIFICATE || 'true').trim() === 'true',
        enableArithAbort: true
    }
};

async function migrate() {
    try {
        console.log('Connecting to MSSQL with config:', { ...config, password: '***' });
        const pool = await sql.connect(config);
        console.log('Connected to MSSQL');

        // 1. Add context columns
        console.log('Adding context columns...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'context_type')
            BEGIN
                ALTER TABLE project_notes ADD context_type NVARCHAR(100) DEFAULT 'global';
            END
        `);

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'context_id')
            BEGIN
                ALTER TABLE project_notes ADD context_id NVARCHAR(100) NULL;
            END
        `);

        // 2. Set default is_locked to 0 and ensure it is not null
        console.log('Updating is_locked defaults...');
        await pool.request().query(`
            -- First update any nulls
            UPDATE project_notes SET is_locked = 0 WHERE is_locked IS NULL;
            
            -- Set default for new rows
            IF EXISTS (SELECT * FROM sys.all_columns WHERE object_id = OBJECT_ID('project_notes') AND name = 'is_locked')
            BEGIN
                -- Drop existing default constraint if any
                DECLARE @ConstraintName nvarchar(200);
                SELECT @ConstraintName = Name FROM sys.default_constraints
                WHERE Parent_Object_ID = OBJECT_ID('project_notes') AND Parent_Column_ID = (
                    SELECT Column_ID FROM sys.columns WHERE Name = 'is_locked' AND Object_ID = OBJECT_ID('project_notes')
                );
                IF @ConstraintName IS NOT NULL
                    EXEC('ALTER TABLE project_notes DROP CONSTRAINT ' + @ConstraintName);
                
                ALTER TABLE project_notes ADD CONSTRAINT DF_project_notes_is_locked DEFAULT 0 FOR is_locked;
            END
        `);

        console.log('Migration v4 completed successfully');
        await pool.close();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
