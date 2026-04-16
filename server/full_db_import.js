const mssql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function importFullDB() {
    let pool;
    try {
        pool = await mssql.connect(config);
        const data = JSON.parse(fs.readFileSync('full_db_migration.json', 'utf8'));
        
        console.log('--- STARTING COMPLETE MIGRATION (NUCLEAR VERSION) ---');

        const tables = [
            'users', 'customers', 'projects', 'estimates', 
            'takeoff_items', 'estimate_results', 'rail_types', 
            'platform_types', 'stringer_types', 'labor_rates', 
            'system_config', 'categories', 'dictionary', 
            'notifications', 'pricing'
        ];

        for (const table of tables) {
            if (!data[table] || data[table].length === 0) {
                console.log(`Skipping ${table} (No data)`);
                continue;
            }
            
            console.log(`Migrating ${table} (${data[table].length} rows)...`);
            
            // 1. Clear existing data
            await pool.request().query(`DELETE FROM [${table}]`);
            
            // 2. Insert rows one-by-one with bundled IDENTITY_INSERT commands
            for (const row of data[table]) {
                const columns = Object.keys(row).map(c => `[${c}]`).join(', ');
                const params = Object.keys(row).map((c, i) => `@p${i}`).join(', ');
                
                const request = pool.request();
                Object.keys(row).forEach((c, i) => { request.input(`p${i}`, row[c]); });

                // THE NUCLEAR TRICK: Bundle SET ON and SET OFF in the SAME query call
                const sql = `
                    IF OBJECTPROPERTY(OBJECT_ID('[${table}]'), 'TableHasIdentity') = 1 
                        SET IDENTITY_INSERT [${table}] ON;
                    
                    INSERT INTO [${table}] (${columns}) VALUES (${params});
                    
                    IF OBJECTPROPERTY(OBJECT_ID('[${table}]'), 'TableHasIdentity') = 1 
                        SET IDENTITY_INSERT [${table}] OFF;
                `;

                try {
                    await request.query(sql);
                } catch (err) {
                    console.error(`❌ Error in ${table} row:`, err.message);
                    throw err; // Stop on first error
                }
            }
            console.log(`✅ ${table} fully migrated.`);
        }

        console.log('\n🏆 FULL MIGRATION SUCCESSFUL! YOUR VPS NOW MATCHES LOCAL.');
    } catch (err) {
        console.error('\n❌ MIGRATION FAILED:', err.message);
    } finally {
        if (pool) await pool.close();
    }
}
importFullDB();
