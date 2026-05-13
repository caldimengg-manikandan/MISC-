const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_PORT),
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

async function checkStringers() {
  try {
    let pool = await sql.connect(config);
    const res = await pool.request().query("SELECT TOP 20 label, [value], steelLbsLf FROM dictionary WHERE category = 'stringer_size' ORDER BY [order]");
    console.log(JSON.stringify(res.recordset, null, 2));
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}

checkStringers();
