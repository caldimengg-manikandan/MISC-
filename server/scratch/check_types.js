require('dotenv').config();
const db = require('../src/config/mssql');

async function checkTypes() {
    try {
        console.log('Project column types:');
        const [pTypes] = await db.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME IN ('userId', 'createdBy', 'engineerId', 'assigned_engineer_id')");
        console.table(pTypes);

        console.log('User column types:');
        const [uTypes] = await db.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('id')");
        console.table(uTypes);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTypes();
