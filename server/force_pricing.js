const mssql = require('mssql');
require('dotenv').config();
const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};
async function run() {
    try {
        const pool = await mssql.connect(config);
        console.log('--- FORCING PRICING TABLE ---');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pricing')
            CREATE TABLE pricing (
                id INT IDENTITY(1,1) PRIMARY KEY,
                item_key NVARCHAR(MAX),
                rate NVARCHAR(MAX),
                updatedAt NVARCHAR(MAX)
            )
        `);
        
        console.log('✅ Pricing table created/verified!');
        await pool.close();
    } catch (err) { console.error('❌ Error:', err.message); }
}
run();
