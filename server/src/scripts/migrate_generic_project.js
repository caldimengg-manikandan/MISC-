// server/src/scripts/migrate_generic_project.js
require('dotenv').config({ path: 'server/.env' });
const db = require('../config/mssql');

async function migrate() {
    try {
        console.log('🔄 Starting migration to generic project model...');
        
        // Add metadata column if it doesn't exist
        await db.query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'metadata')
            BEGIN
                ALTER TABLE projects ADD metadata NVARCHAR(MAX) NULL;
            END
        `);
        console.log('✅ Checked/Added metadata column');

        // Check for assignedTo, startDate, dueDate aliases if needed
        // For now, we will use the existing columns and map them in the service/repository layer
        // existing: assignedEngineer -> assignedTo
        // existing: enquiryDate -> startDate
        // existing: submissionDeadline -> dueDate

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
