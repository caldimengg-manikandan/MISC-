/**
 * Migration: addAttachmentIndexes.js
 *
 * SAFE — adds missing indexes to project_attachments.
 * Does NOT alter schema or rename any columns.
 * Idempotent: skips creation if index already exists.
 *
 * Run with: node server/src/migrations/addAttachmentIndexes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { poolPromise } = require('../config/mssql');

async function run() {
    const pool = await poolPromise;
    const r = pool.request();

    console.log('🔧 Adding indexes to project_attachments...');

    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_PA_ProjectId'
              AND object_id = OBJECT_ID('project_attachments')
        )
        BEGIN
            CREATE INDEX IX_PA_ProjectId
            ON project_attachments (projectId);
            PRINT 'Created IX_PA_ProjectId';
        END
        ELSE
            PRINT 'IX_PA_ProjectId already exists — skipped';
    `);

    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_PA_IsDeleted'
              AND object_id = OBJECT_ID('project_attachments')
        )
        BEGIN
            CREATE INDEX IX_PA_IsDeleted
            ON project_attachments (is_deleted);
            PRINT 'Created IX_PA_IsDeleted';
        END
        ELSE
            PRINT 'IX_PA_IsDeleted already exists — skipped';
    `);

    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_PA_CreatedAt'
              AND object_id = OBJECT_ID('project_attachments')
        )
        BEGIN
            CREATE INDEX IX_PA_CreatedAt
            ON project_attachments (createdAt DESC);
            PRINT 'Created IX_PA_CreatedAt';
        END
        ELSE
            PRINT 'IX_PA_CreatedAt already exists — skipped';
    `);

    console.log('✅ Index migration complete.');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
