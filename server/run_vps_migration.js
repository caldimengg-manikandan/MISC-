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
    requestTimeout: 300000 // 5 minutes
};

async function runMigration() {
    let pool;
    try {
        const sqlFile = 'vps_migration.sql'; 
        if (!fs.existsSync(sqlFile)) {
            console.error(`❌ Error: ${sqlFile} not found in the current directory.`);
            process.exit(1);
        }

        console.log(`Reading ${sqlFile}...`);
        let content = fs.readFileSync(sqlFile, 'utf8');
        
        // Check for UTF-16 encoding (common in SSMS exports)
        // If it looks like UTF-16 (null characters between letters), convert it
        if (content.includes('\u0000')) {
            console.log('Detected UTF-16 encoding. Converting to UTF-8...');
            const buffer = fs.readFileSync(sqlFile);
            // Try to detect if it's LE or BE, or just strip nulls if it's simple
            content = buffer.toString('utf16le').replace(/^\uFEFF/, ''); 
            // If it's still messy, fallback to stripping nulls
            if (content.includes('\u0000')) {
                content = buffer.toString('utf8').replace(/\u0000/g, '');
            }
        }
        
        // SSMS scripts often use 'GO' to separate batches. 
        // Tedious/mssql-node doesn't support 'GO', so we split the file into batches.
        const batches = content.split(/^\s*GO\s*$/im);

        console.log(`Connecting to database ${config.database} on ${config.server}...`);
        pool = await mssql.connect(config);
        console.log('Connected! Executing migration batches...');

        for (let i = 0; i < batches.length; i++) {
            let batch = batches[i].trim();
            if (batch.length === 0) continue;

            try {
                process.stdout.write(`Executing batch ${i + 1}/${batches.length}... `);
                await pool.request().query(batch);
                process.stdout.write('✅\n');
            } catch (e) {
                console.error(`\n❌ Error in batch ${i + 1}: ${e.message}`);
                // We continue because some errors (like 'already exists') might be expected depending on the script
            }
        }

        console.log('\n🌟 SUCCESS: Migration script execution finished!');
    } catch (err) {
        console.error('\n❌ CRITICAL ERROR:', err.message);
    } finally {
        if (pool) await pool.close();
        process.exit(0);
    }
}

runMigration();
