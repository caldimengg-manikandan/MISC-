require('dotenv').config();
const db = require('../src/config/mssql');
async function run() {
    try {
        const [rows] = await db.query("SELECT id, email, role, company_id FROM users");
        console.table(rows);
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}
run();
