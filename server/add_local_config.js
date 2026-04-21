require('dotenv').config();
const { sql, poolPromise } = require('./src/config/mssql.js');

async function run() {
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE projects ADD localConfig NVARCHAR(MAX);');
    console.log('Success - localConfig added');
  } catch (e) {
    if (e.message.includes('Column names in each table must be unique')) {
        console.log('Column already exists');
    } else {
        console.error(e);
    }
  }
  process.exit();
}
run();
