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
        trustServerCertificate: true 
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function exportData() {
    try {
        console.log('--- Connecting to Local MSSQL ---');
        const pool = await mssql.connect(config);
        
        console.log('--- Querying dictionary table ---');
        const result = await pool.request().query('SELECT * FROM dictionary');
        
        fs.writeFileSync('dictionary_data.json', JSON.stringify(result.recordset, null, 2));
        console.log('✅ SUCCESS: Exported ' + result.recordset.length + ' rows to dictionary_data.json');
        
        await pool.close();
    } catch (err) { 
        console.error('❌ EXPORT FAILED:', err.message);
        if (err.message.includes('Login failed')) {
            console.log('Tip: Check your local .env file credentials.');
        }
    }
}
exportData();
