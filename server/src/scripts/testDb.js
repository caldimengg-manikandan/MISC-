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

async function test() {
    let pool;
    try {
        pool = await mssql.connect(config);
        const result = await pool.request().query("SELECT label, value, description FROM dictionary WHERE category='stringer_size'");
        console.log(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        if (pool) pool.close();
    }
}

test();
