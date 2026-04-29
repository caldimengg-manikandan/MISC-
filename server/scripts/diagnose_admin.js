require('dotenv').config();
const db = require('../src/config/mssql');

async function diagnose() {
    try {
        // Check projects table columns
        const [cols] = await db.query(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_NAME = 'projects' 
             ORDER BY ORDINAL_POSITION`
        );
        console.log('\n=== PROJECTS TABLE COLUMNS ===');
        console.table(cols.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE, nullable: c.IS_NULLABLE })));
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
diagnose();
