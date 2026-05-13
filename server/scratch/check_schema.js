require('dotenv').config({ path: 'server/.env' });
const db = require('../src/config/mssql');

async function checkSchema() {
    try {
        console.log('Connecting to:', process.env.MSSQL_SERVER, 'Database:', process.env.MSSQL_DATABASE);
        const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dictionary'");
        console.log('Columns in dictionary table:');
        console.log(cols.map(c => c.COLUMN_NAME).join(', '));
    } catch (err) {
        console.error('Failed to check schema:', err);
    }
    process.exit();
}

checkSchema();
