const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || 'Caldim@2026',
    server: process.env.MSSQL_SERVER || 'localhost',
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function runNormalization() {
    try {
        console.log('Connecting to SQL Server...');
        await sql.connect(config);
        console.log('Connected.');

        const script = `
        /* 1. Consolidate status columns and recover hidden data */
        UPDATE [dictionary] 
        SET [isActive] = 1, [is_active] = 1 
        WHERE [isActive] IS NULL OR [isActive] = 0 OR [is_active] IS NULL;

        /* 2. Ensure both schema variants exist to prevent code errors */
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dictionary]') AND name = 'isActive')
        BEGIN
            ALTER TABLE [dictionary] ADD [isActive] BIT DEFAULT 1;
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dictionary]') AND name = 'is_active')
        BEGIN
            ALTER TABLE [dictionary] ADD [is_active] BIT DEFAULT 1;
        END
        `;

        console.log('Running normalization script...');
        await sql.query(script);
        console.log('✅ Database normalization complete.');

    } catch (err) {
        console.error('❌ Error during normalization:', err.message);
    } finally {
        await sql.close();
    }
}

runNormalization();
