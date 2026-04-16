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
        
        console.log('--- STARTING COMPLETE AUTO-REPAIR MIGRATION ---');

        const tables = [
            'users', 'customers', 'projects', 'estimates', 
            'takeoff_items', 'estimate_results', 'rail_types', 
            'platform_types', 'stringer_types', 'labor_rates', 
            'system_config', 'categories', 'dictionary', 
            'notifications', 'pricing'
        ];

        for (const table of tables) {
            if (!data[table] || data[table].length === 0) continue;
            
            console.log(`Working on table: ${table}...`);
            
            // 1. Check if table exists
            const tabCheck = await pool.request().query(`SELECT * FROM sys.tables WHERE name = '${table}'`);
            
            if (tabCheck.recordset.length === 0) {
                console.log(`⚠️  Table [${table}] missing! Creating it now...`);
                // Auto-create table based on JSON columns
                const firstRow = data[table][0];
                const cols = Object.keys(firstRow).map(c => {
                    if (c.toLowerCase() === 'id') return `[${c}] INT IDENTITY(1,1) PRIMARY KEY`;
                    return `[${c}] NVARCHAR(MAX)`;
                }).join(', ');
                
                await pool.request().query(`CREATE TABLE [${table}] (${cols})`);
                console.log(`✅ Table [${table}] created.`);
            }

            // 2. Clear existing data
            await pool.request().query(`DELETE FROM [${table}]`);
            
            // 3. Batch migration with Identity support
            for (const row of data[table]) {
                const columns = Object.keys(row).map(c => `[${c}]`).join(', ');
                const params = Object.keys(row).map((c, i) => `@p${i}`).join(', ');
                
                const request = pool.request();
                Object.keys(row).forEach((c, i) => { request.input(`p${i}`, row[c]); });

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
                    console.error(`❌ Row failed in ${table}:`, err.message);
                    throw err;
                }
            }
            console.log(`✅ Table [${table}] synchronized successfully.`);
        }

        console.log('\n🏆 FULL MIGRATION SUCCESSFUL! VPS IS NOW UPDATED.');
    } catch (err) {
        console.error('\n❌ MIGRATION FAILED:', err.message);
    } finally {
        if (pool) await pool.close();
    }
}
importFullDB();
