require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [res] = await db.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'project_notes'
    `);
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
