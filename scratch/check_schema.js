require('dotenv').config({ path: './server/.env' });
const db = require('../server/src/config/mssql');

async function checkSchema() {
    try {
        const [rows] = await db.query("SELECT TOP 1 * FROM projects", []);
        console.log('Columns:', Object.keys(rows[0]));
    } catch (err) {
        console.error('Schema check failed:', err.message);
    }
}

checkSchema();
