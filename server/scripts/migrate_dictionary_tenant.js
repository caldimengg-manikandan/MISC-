/**
 * Migration: Add admin_owner_id column to dictionary table for multi-tenant isolation.
 *
 * Rules after migration:
 *   - admin_owner_id IS NULL  → Global system default (visible to ALL tenants)
 *   - admin_owner_id = X      → Custom entry for admin X (visible only to X + their estimators)
 *
 * Run this once on both local and VPS:
 *   node server/scripts/migrate_dictionary_tenant.js
 */

process.env.MSSQL_TRUST_SERVER_CERTIFICATE = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function run() {
  console.log('🔧 Starting dictionary tenant migration...');

  // 1. Add admin_owner_id column if it doesn't exist
  try {
    await db.query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'dictionary' AND COLUMN_NAME = 'admin_owner_id'
      )
      BEGIN
        ALTER TABLE dictionary ADD admin_owner_id INT NULL;
        PRINT 'Column admin_owner_id added.';
      END
      ELSE
      BEGIN
        PRINT 'Column admin_owner_id already exists.';
      END
    `);
    console.log('✅ Step 1: admin_owner_id column verified.');
  } catch (e) {
    console.error('❌ Step 1 failed:', e.message);
    process.exit(1);
  }

  // 2. All EXISTING entries become global defaults (admin_owner_id = NULL)
  //    This preserves backward compatibility — existing data is shared with everyone.
  try {
    const [result] = await db.query(`
      UPDATE dictionary SET admin_owner_id = NULL
      WHERE admin_owner_id IS NOT NULL
    `);
    console.log(`✅ Step 2: Existing entries set as global defaults.`);
  } catch (e) {
    console.error('❌ Step 2 failed:', e.message);
    process.exit(1);
  }

  // 3. Add index for performance
  try {
    await db.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_dictionary_category_tenant' AND object_id = OBJECT_ID('dictionary')
      )
      BEGIN
        CREATE INDEX IX_dictionary_category_tenant ON dictionary (category, admin_owner_id, isActive);
        PRINT 'Index created.';
      END
    `);
    console.log('✅ Step 3: Index verified.');
  } catch (e) {
    // Non-fatal - index is for performance only
    console.warn('⚠️  Step 3 (index creation) skipped:', e.message);
  }

  console.log('');
  console.log('✅ Migration complete!');
  console.log('   • All existing entries are now global defaults (visible to everyone).');
  console.log('   • New entries added via QuickManageModal will be tenant-specific.');
  console.log('');
  process.exit(0);
}

run().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
