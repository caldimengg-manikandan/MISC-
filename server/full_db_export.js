const mssql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function exportFullDB() {
    try {
        const pool = await mssql.connect(config);
        console.log('--- Connected to Local MSSQL ---');

        // List of all tables to migrate
        const tables = [
            'users', 
            'projects', 
            'estimates', 
            'takeoff_items', 
            'estimate_results', 
            'rail_types', 
            'platform_types', 
            'stringer_types', 
            'labor_rates', 
            'system_config', 
            'categories', 
            'dictionary',
            'notifications',
            'customers',
            'pricing'
        ];

        const fullData = {};

        for (const table of tables) {
            try {
                console.log(`Exporting table: ${table}...`);
                const result = await pool.request().query(`SELECT * FROM ${table}`);
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
