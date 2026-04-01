require('dotenv').config();
const db = require('../src/config/mssql');

async function migrate() {
    console.log('Running projects table schema migration...');
    const queries = [
        "ALTER TABLE projects ADD projectNumber VARCHAR(255);",
        "ALTER TABLE projects ADD projectLocation VARCHAR(255);",
        "ALTER TABLE projects ADD architect VARCHAR(255);",
        "ALTER TABLE projects ADD eor VARCHAR(255);",
        "ALTER TABLE projects ADD gcName VARCHAR(255);",
        "ALTER TABLE projects ADD detailer VARCHAR(255);",
        "ALTER TABLE projects ADD vendorName VARCHAR(255);",
        "ALTER TABLE projects ADD aiscCertified VARCHAR(10) DEFAULT 'Y';",
        "ALTER TABLE projects ADD units VARCHAR(20) DEFAULT 'Imperial';"
    ];

    for (const q of queries) {
        try {
            await db.query(q);
            console.log(`Success: ${q}`);
        } catch (err) {
            console.log(`Skipped or Error on ${q}: `, err.message);
        }
    }
    console.log('Migration complete.');
    process.exit(0);
}

migrate();
