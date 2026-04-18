const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function checkProject(id) {
    let pool;
    try {
        pool = await mssql.connect(config);
        const result = await pool.request().query(`SELECT id, totalWeight, totalCost, estimationResult FROM projects WHERE id = ${id}`);
        console.log('Project Data:');
        console.log(JSON.stringify(result.recordset[0], null, 2));
        await pool.close();
    } catch (err) {
        console.error('Error:', err.message);
        if (pool) await pool.close();
    }
}

checkProject(136); // The project ID from the screenshot
