require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [res] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'project_notes'");
    console.log(res.map(r => r.COLUMN_NAME).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
