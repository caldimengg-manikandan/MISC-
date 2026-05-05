const mssql = require('mssql');
require('dotenv').config();
const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};
async function run() {
    try {
        const pool = await mssql.connect(config);
        const res = await pool.request().query("SELECT * FROM dictionary WHERE category = 'stringer_size'");
        console.table(res.recordset);
        await pool.close();
    } catch (err) { console.error(err); }
}
run();
