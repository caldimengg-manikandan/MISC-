/**
 * addMultiTenantColumns.js
 * 
 * SAFE — adds company_id and owner_admin_id to project_attachments.
 * Essential for the hardened multi-tenant isolation logic.
 */
const { poolPromise } = require('../config/mssql');

async function run() {
    const pool = await poolPromise;
    const r = pool.request();

    console.log('🔧 Adding multi-tenant isolation columns to project_attachments...');

    // company_id: identifies which tenant owns this file
    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'project_attachments'
              AND COLUMN_NAME = 'company_id'
        )
        BEGIN
            ALTER TABLE project_attachments
            ADD company_id INT NULL;
            PRINT 'Added column: company_id';
        END
    `);

    // owner_admin_id: identifies the root admin for this tenant
    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'project_attachments'
              AND COLUMN_NAME = 'owner_admin_id'
        )
        BEGIN
            ALTER TABLE project_attachments
            ADD owner_admin_id INT NULL;
            PRINT 'Added column: owner_admin_id';
        END
    `);

    // Backfill columns from projects table
    await r.query(`
        UPDATE pa
        SET pa.company_id = p.company_id,
            pa.owner_admin_id = p.owner_admin_id
        FROM project_attachments pa
        JOIN projects p ON pa.projectId = p.id
        WHERE pa.company_id IS NULL OR pa.owner_admin_id IS NULL;
        PRINT 'Backfilled multi-tenant columns from projects table';
    `);

    console.log('✅ Multi-tenant isolation columns added.');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
