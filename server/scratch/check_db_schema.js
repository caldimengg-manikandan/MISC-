require('dotenv').config();
const db = require('../src/config/mssql');

async function checkColumns() {
    try {
        console.log('Checking columns for projects table...');
        const [rows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects'");
        console.log('Columns in projects:', rows.map(r => r.COLUMN_NAME).join(', '));

        console.log('Checking columns for users table...');
        const [userRows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'");
        console.log('Columns in users:', userRows.map(r => r.COLUMN_NAME).join(', '));

        const [sampleRows] = await db.query("SELECT TOP 1 * FROM projects ORDER BY created_at DESC");
        console.log('Sample project:', JSON.stringify(sampleRows[0], null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
