require('dotenv').config();
const db = require('../src/config/mssql');
async function run() {
    try {
        const [rows] = await db.query("SELECT id, projectName, company_id, userId, createdBy, owner_admin_id, reviewer_id, assigned_engineer_id FROM projects");
        console.table(rows);
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}
run();
