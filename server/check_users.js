require('dotenv').config();
const db = require('./src/config/mssql');
async function run() {
  try {
    const [rows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'");
    console.log(rows.map(r => r.COLUMN_NAME));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
