require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [res] = await db.query('SELECT TOP 5 id, projectName FROM projects ORDER BY id DESC');
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
