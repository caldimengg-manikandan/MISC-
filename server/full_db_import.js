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
        
        console.log('--- STARTING COMPLETE MIGRATION (GITHUB VERSION) ---');

        const tables = [
            'users', 'customers', 'projects', 'estimates', 
            'takeoff_items', 'estimate_results', 'rail_types', 
            'platform_types', 'stringer_types', 'labor_rates', 
            'system_config', 'categories', 'dictionary', 
            'notifications', 'pricing'
        ];

        for (const table of tables) {
            if (!data[table] || data[table].length === 0) continue;
            
            console.log(`Importing ${table} (${data[table].length} rows)...`);
            
            const transaction = new mssql.Transaction(pool);
            await transaction.begin();
            
            try {
                // 1. Clear existing data
                await transaction.request().query(`DELETE FROM ${table}`);
                
                // 2. Identity Insert Logic
                let hasIdentity = false;
                try {
                    // Force ON and catch error to see if table lacks Identity
                    await transaction.request().query(`SET IDENTITY_INSERT [${table}] ON`);
                    hasIdentity = true;
                } catch(e) {
                    // If it fails with "table does not have identity", that's fine.
                    if (!e.message.includes('does not have the identity property')) {
                        console.warn(`⚠️  Identity check for ${table}: ${e.message}`);
                    }
                }

                // 3. Insert and await each to ensure session consistency
                for (const row of data[table]) {
                    const columns = Object.keys(row).map(c => `[${c}]`).join(', ');
                    const params = Object.keys(row).map((c, i) => `@p${i}`).join(', ');
                    
                    const request = transaction.request();
                    Object.keys(row).forEach((c, i) => {
                        request.input(`p${i}`, row[c]);
                    });

                    await request.query(`INSERT INTO [${table}] (${columns}) VALUES (${params})`);
                }
                
                if (hasIdentity) {
                    await transaction.request().query(`SET IDENTITY_INSERT [${table}] OFF`);
                }
                
                await transaction.commit();
                console.log(`✅ ${table} imported.`);
            } catch (err) {
                await transaction.rollback();
                console.error(`❌ Error in table ${table}:`, err.message);
                throw err;
            }
        }

        console.log('\n🏆 FULL MIGRATION SUCCESSFUL!');
    } catch (err) {
        console.error('\n❌ CRITICAL MIGRATION ERROR:', err.message);
    } finally {
        if (pool) await pool.close();
    }
}
importFullDB();
