/**
 * addStorageColumns.js
 *
 * SAFE — adds storage_key and storage_backend columns to project_attachments.
 * Idempotent: checks column existence before adding.
 * Does NOT modify any existing columns or data.
 *
 * Run with: node -e "require('dotenv').config(); require('./src/migrations/addStorageColumns.js')"
 * (from server/ directory)
 */
const { poolPromise } = require('../config/mssql');

async function run() {
    const pool = await poolPromise;
    const r    = pool.request();

    console.log('🔧 Adding storage columns to project_attachments...');

    // storage_key: S3 object key (e.g. projects/uuid/filename.pdf)
    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME  = 'project_attachments'
              AND COLUMN_NAME = 'storage_key'
        )
        BEGIN
            ALTER TABLE project_attachments
            ADD storage_key NVARCHAR(2000) NULL;
            PRINT 'Added column: storage_key';
        END
        ELSE
            PRINT 'Column storage_key already exists — skipped';
    `);

    // storage_backend: 'local' | 's3' — tells the serve endpoint which adapter to use
    await r.query(`
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME  = 'project_attachments'
              AND COLUMN_NAME = 'storage_backend'
        )
        BEGIN
            ALTER TABLE project_attachments
            ADD storage_backend VARCHAR(10) NOT NULL DEFAULT 'local';
            PRINT 'Added column: storage_backend';
        END
        ELSE
            PRINT 'Column storage_backend already exists — skipped';
    `);

    // Backfill storage_key for existing local records so the adapter can resolve them
    await r.query(`
        UPDATE project_attachments
        SET storage_key = file_path
        WHERE storage_key IS NULL
          AND file_path IS NOT NULL
          AND (is_deleted = 0 OR is_deleted IS NULL);
        PRINT 'Backfilled storage_key for existing local records';
    `);

    console.log('✅ Storage column migration complete.');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
