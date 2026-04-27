
require('dotenv').config();
const db = require('../src/config/mssql');

async function describeTable() {
  try {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'licenses'
    `);
    console.table(cols);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

describeTable();
