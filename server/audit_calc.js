const mssql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function check() {
    console.log('--- 🛡️ VPS CALCULATION AUDIT ---');

    // 1. Check Benchmark JSON
    const jsonPath = path.join(__dirname, '../Misc Worksheet  reworked KDF 11-12-25.json');
    console.log(`Checking JSON at: ${jsonPath}`);
    if (fs.existsSync(jsonPath)) {
        console.log('✅ Benchmark JSON exists on disk.');
        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            console.log(`✅ JSON valid. Sheets found: ${Object.keys(data).join(', ')}`);
        } catch (e) {
            console.error('❌ JSON corrupted or invalid format:', e.message);
        }
    } else {
        console.error('❌ Benchmark JSON MISSING on VPS disk!');
    }

    // 2. Check Database Tables
    try {
        const pool = await mssql.connect(config);
        console.log('✅ Connected to Database');

        const tables = ['dictionary', 'pricing', 'labor_rates', 'stringer_types', 'galvanized_labor', 'system_config'];
        for (const t of tables) {
            const res = await pool.request().query(`SELECT COUNT(*) as count FROM [${t}]`);
            console.log(`📊 Table [${t}]: ${res.recordset[0].count} rows found.`);
        }

        // 3. Check specific critical pricing
        const pRes = await pool.request().query("SELECT * FROM pricing");
        console.log('\n--- 💰 Pricing Records ---');
        console.table(pRes.recordset);

        // 4. Check system config
        const cRes = await pool.request().query("SELECT * FROM system_config");
        console.log('\n--- ⚙️ System Config ---');
        console.table(cRes.recordset);

        await pool.close();
    } catch (err) {
        console.error('❌ Database connectivity or query failure:', err.message);
    }
}

check();
