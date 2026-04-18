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

async function migrate() {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await mssql.connect(config);
        
        const alterTableSql = `
            -- Check and add workflow targeted tracking columns
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'reviewer_id')
                ALTER TABLE projects ADD reviewer_id BIGINT;
                
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'reviewer_email')
                ALTER TABLE projects ADD reviewer_email NVARCHAR(255);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'review_count')
                ALTER TABLE projects ADD review_count INT DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'push_back_reason')
                ALTER TABLE projects ADD push_back_reason NVARCHAR(MAX);

            -- Check and add submission tracking columns
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'sent_to_email')
                ALTER TABLE projects ADD sent_to_email NVARCHAR(500);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'sent_to_cc')
                ALTER TABLE projects ADD sent_to_cc NVARCHAR(500);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'sent_at')
                ALTER TABLE projects ADD sent_at DATETIME;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'sent_by')
                ALTER TABLE projects ADD sent_by BIGINT;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'send_message')
                ALTER TABLE projects ADD send_message NVARCHAR(MAX);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'attachment_type')
                ALTER TABLE projects ADD attachment_type NVARCHAR(50);
        `;
        
        console.log('Applying reviewer workflow columns to projects table...');
        await pool.request().query(alterTableSql);
        console.log('✅ Migration complete. Database is ready for targeted reviewer workflow.');
        
        await pool.close();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (pool) await pool.close();
    }
}

migrate();
