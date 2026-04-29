require('dotenv').config();
const db = require('../src/config/mssql');
async function run() {
    try {
        const [rows] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_type='BASE TABLE'");
        console.log(rows.map(r => r.table_name));
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}
run();
