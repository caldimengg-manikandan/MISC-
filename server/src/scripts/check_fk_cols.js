require('dotenv').config();
const db = require('../config/mssql');

async function run() {
  const tables = ['project_notes', 'project_attachments', 'estimates', 'estimation_activity_logs', 'takeoff_items', 'estimate_results'];
  for (const t of tables) {
    const [rows] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME IN ('projectId','project_id','estimationId','estimate_id','estimateId')",
      [t]
    );
    console.log(t, ':', rows.map(r => r.COLUMN_NAME).join(', ') || 'NONE');
  }
  console.log('\n--- All columns check done ---');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
