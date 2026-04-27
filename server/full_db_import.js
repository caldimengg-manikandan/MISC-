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
    requestTimeout: 120000 // 2 minutes for import
};

async function importFullDB() {
    let pool;
    try {
        if (!fs.existsSync('full_db_migration.json')) {
            throw new Error('Migration file not found! Run export first.');
        }

        const data = JSON.parse(fs.readFileSync('full_db_migration.json'));
        pool = await mssql.connect(config);
        console.log('--- 📥 Connected to VPS MSSQL ---');

        // 1. Disable all foreign key constraints
        console.log('Disabling constraints...');
        await pool.request().query('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"');

        // Identify tables to process (order matters for identity inserts, but we handle them individually)
        const tableNames = Object.keys(data);

        for (const table of tableNames) {
            const rows = data[table];
            console.log(`\nProcessing table: ${table} (${rows.length} rows)...`);
            
            // 2. Clear existing data
            await pool.request().query(`DELETE FROM [${table}]`);

            if (rows.length === 0) {
                console.log(`Skipping insert (empty table).`);
                continue;
            }

            // 3. Enable Identity Insert if table has an identity column
            let hasIdentity = false;
            try {
                // Check if table has identity column
                const checkIdentity = await pool.request().query(`
                    SELECT OBJECTPROPERTY(OBJECT_ID('${table}'), 'TableHasIdentity') as hasId
                `);
                if (checkIdentity.recordset[0].hasId === 1) {
                    await pool.request().query(`SET IDENTITY_INSERT [${table}] ON`);
                    hasIdentity = true;
                    console.log(`Identity Insert ON for ${table}`);
                }
            } catch (e) { 
                console.warn(`Could not check/set identity for ${table}: ${e.message}`);
            }

            // 4. Insert data
            const columns = Object.keys(rows[0]);
            const colNames = columns.map(c => `[${c}]`).join(', ');
            const paramNames = columns.map((c, i) => `@p${i}`).join(', ');
            
            for (const row of rows) {
                const request = pool.request();
                columns.forEach((col, i) => {
                    request.input(`p${i}`, row[col]);
                });

                try {
                    await request.query(`INSERT INTO [${table}] (${colNames}) VALUES (${paramNames})`);
                } catch (e) {
                    console.error(`Error inserting into ${table}: ${e.message}`);
                }
            }

            if (hasIdentity) {
                try {
                    await pool.request().query(`SET IDENTITY_INSERT [${table}] OFF`);
                } catch (e) {}
            }
            console.log(`✅ ${table} import complete.`);
        }

        // 5. Re-enable all constraints
        console.log('\nRe-enabling constraints...');
        await pool.request().query('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL"');

        console.log('\n🌟 SUCCESS: Database migration complete!');
        
    } catch (err) {
        console.error('❌ IMPORT FAILED:', err);
    } finally {
        if (pool) await pool.close();
        process.exit(0);
    }
}

importFullDB();
