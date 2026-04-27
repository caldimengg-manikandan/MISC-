require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [res] = await db.query('SELECT name FROM sys.tables');
    console.log(res.map(r => r.name).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
