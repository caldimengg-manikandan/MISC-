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

async function checkCategories() {
  try {
    let pool = await sql.connect(config);
    const res = await pool.request().query("SELECT DISTINCT category FROM dictionary WHERE category LIKE 'stringer%'");
    console.log(res.recordset);
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}

checkCategories();
