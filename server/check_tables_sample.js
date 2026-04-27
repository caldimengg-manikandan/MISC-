require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [p] = await db.query('SELECT TOP 1 * FROM projects');
    const [e] = await db.query('SELECT TOP 1 * FROM estimates');
    console.log('Project sample:', JSON.stringify(p[0], null, 2));
    console.log('Estimate sample:', JSON.stringify(e[0], null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
