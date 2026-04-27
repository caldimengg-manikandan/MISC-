require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const [res] = await db.query(`
      SELECT name FROM sys.triggers WHERE parent_id = OBJECT_ID('project_notes')
    `);
    console.log('Triggers on project_notes:', res.map(r => r.name).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
