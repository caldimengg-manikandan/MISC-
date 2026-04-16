const mssql = require('mssql');
require('dotenv').config();
const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { encrypt: true, trustServerCertificate: true },
    port: 1433
};
async function list() {
    try {
        const pool = await mssql.connect(config);
        const result = await pool.request().query("SELECT name FROM sys.tables");
        console.log('TABLE_LIST:' + JSON.stringify(result.recordset.map(t => t.name)));
        await pool.close();
    } catch (err) { console.error(err); }
}
list();
