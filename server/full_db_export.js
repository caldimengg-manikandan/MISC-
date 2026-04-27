const mssql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { 
        encrypt: true, 
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433,
    requestTimeout: 60000 // 60 seconds
};

async function exportFullDB() {
    try {
        const pool = await mssql.connect(config);
        console.log('--- 🚀 Connected to Local MSSQL ---');

        // Dynamically fetch all user-defined table names
        const tableQuery = await pool.request().query(`
            SELECT name FROM sys.tables WHERE is_ms_shipped = 0 AND name != 'sysdiagrams'
        `);
        const tables = tableQuery.recordset.map(r => r.name);
        
        const fullData = {};

        for (const table of tables) {
            try {
                console.log(`Exporting table: ${table}...`);
                const result = await pool.request().query(`SELECT * FROM [${table}]`);
                fullData[table] = result.recordset;
                console.log(`✅ ${table}: ${result.recordset.length} rows`);
            } catch (e) {
                console.warn(`⚠️ Skipping ${table}: ${e.message}`);
            }
        }

        fs.writeFileSync('full_db_migration.json', JSON.stringify(fullData, null, 2));
        console.log('\n🌟 SUCCESS: Full database export saved to full_db_migration.json');
        
        await pool.close();
    } catch (err) {
        console.error('❌ EXPORT FAILED:', err.message);
    }
}
exportFullDB();
