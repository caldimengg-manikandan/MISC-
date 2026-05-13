/**
 * Migration: add_library_columns.js
 * Run ONCE to set up the Library Management Module schema.
 *
 * Changes:
 *   1. Add is_system_default, created_at, updated_at, updated_by to `dictionary`
 *   2. Mark global finish_option rows as system defaults
 *   3. Create library_audit_log table
 *   4. Add indexes
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function run() {
  console.log('🚀 Starting Library Module Migration...\n');

  // ── 1. Audit the existing columns ─────────────────────────────────────────
  console.log('📋 Step 1: Auditing dictionary table schema...');
  const [cols] = await db.query(
    `SELECT COLUMN_NAME, DATA_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'dictionary'
     ORDER BY ORDINAL_POSITION`
  );
  console.log('   Existing columns:');
  cols.forEach(c => console.log(`     • ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

  const existingColNames = cols.map(c => c.COLUMN_NAME.toLowerCase());

  // ── 2. Add is_system_default column ───────────────────────────────────────
  if (!existingColNames.includes('is_system_default')) {
    console.log('\n📋 Step 2: Adding is_system_default column...');
    await db.query(`ALTER TABLE dictionary ADD is_system_default BIT NOT NULL DEFAULT 0`);
    console.log('   ✅ is_system_default added');
  } else {
    console.log('\n📋 Step 2: is_system_default already exists — skipping');
  }

  // ── 3. Add created_at column ───────────────────────────────────────────────
  if (!existingColNames.includes('created_at')) {
    console.log('\n📋 Step 3: Adding created_at column...');
    await db.query(`ALTER TABLE dictionary ADD created_at DATETIME DEFAULT GETDATE()`);
    console.log('   ✅ created_at added');
  } else {
    console.log('\n📋 Step 3: created_at already exists — skipping');
  }

  // ── 4. Add updated_at column ───────────────────────────────────────────────
  if (!existingColNames.includes('updated_at')) {
    console.log('\n📋 Step 4: Adding updated_at column...');
    await db.query(`ALTER TABLE dictionary ADD updated_at DATETIME DEFAULT GETDATE()`);
    console.log('   ✅ updated_at added');
  } else {
    console.log('\n📋 Step 4: updated_at already exists — skipping');
  }

  // ── 5. Add updated_by column ───────────────────────────────────────────────
  if (!existingColNames.includes('updated_by')) {
    console.log('\n📋 Step 5: Adding updated_by column...');
    await db.query(`ALTER TABLE dictionary ADD updated_by NVARCHAR(255) NULL`);
    console.log('   ✅ updated_by added');
  } else {
    console.log('\n📋 Step 5: updated_by already exists — skipping');
  }

  // ── 6. Backfill timestamps on existing rows ────────────────────────────────
  console.log('\n📋 Step 6: Backfilling timestamps on existing rows...');
  const [backfillResult] = await db.query(
    `UPDATE dictionary SET created_at = GETDATE(), updated_at = GETDATE(), updated_by = 'SYSTEM_MIGRATION' WHERE created_at IS NULL`
  );
  console.log(`   ✅ Backfilled timestamps`);

  // ── 7. Mark system default finish options ──────────────────────────────────
  console.log('\n📋 Step 7: Marking system default finish_option rows...');
  const [markResult] = await db.query(
    `UPDATE dictionary
     SET is_system_default = 1
     WHERE category = 'finish_option'
       AND admin_owner_id IS NULL
       AND value IN ('PRIMER', 'PAINTED', 'GALVANIZED', 'GALV+PAINTED', 'POWDER COATED', 'POWDER_COATED')`
  );
  console.log(`   ✅ System default finishes marked`);

  // Verify the marking
  const [defaultFinishes] = await db.query(
    `SELECT id, label, value, is_system_default FROM dictionary
     WHERE category = 'finish_option' AND admin_owner_id IS NULL`
  );
  console.log('   Finish options (global):');
  defaultFinishes.forEach(f => console.log(`     • [${f.is_system_default ? '🔒 LOCKED' : '  OPEN  '}] ${f.label} (${f.value})`));

  // ── 8. Add index on is_system_default ─────────────────────────────────────
  console.log('\n📋 Step 8: Adding index on is_system_default...');
  try {
    await db.query(`CREATE INDEX idx_dict_system_default ON dictionary(is_system_default)`);
    console.log('   ✅ Index created');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log('   ℹ️  Index already exists — skipping');
    } else throw e;
  }

  // ── 9. Create library_audit_log table ─────────────────────────────────────
  console.log('\n📋 Step 9: Creating library_audit_log table...');
  const [tables] = await db.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'library_audit_log'`
  );

  if (tables.length === 0) {
    await db.query(`
      CREATE TABLE library_audit_log (
        audit_id    INT PRIMARY KEY IDENTITY(1,1),
        module_name NVARCHAR(100) NOT NULL,
        action      NVARCHAR(50)  NOT NULL,
        imported_filename NVARCHAR(255) NULL,
        rows_affected INT DEFAULT 0,
        rows_added    INT DEFAULT 0,
        rows_updated  INT DEFAULT 0,
        rows_skipped  INT DEFAULT 0,
        details       NVARCHAR(MAX) NULL,
        created_at    DATETIME DEFAULT GETDATE(),
        created_by    NVARCHAR(255) NOT NULL
      )
    `);
    await db.query(
      `CREATE INDEX idx_audit_module_date ON library_audit_log(module_name, created_at)`
    );
    console.log('   ✅ library_audit_log created + indexed');
  } else {
    console.log('   ℹ️  library_audit_log already exists — skipping');
  }

  // ── 10. Final verification ─────────────────────────────────────────────────
  console.log('\n📋 Step 10: Verification...');
  const [dictCount] = await db.query(`SELECT COUNT(*) as total FROM dictionary`);
  const [lockedCount] = await db.query(`SELECT COUNT(*) as locked FROM dictionary WHERE is_system_default = 1`);
  const [auditCount] = await db.query(`SELECT COUNT(*) as total FROM library_audit_log`);

  console.log(`   dictionary rows:        ${dictCount[0].total}`);
  console.log(`   is_system_default = 1:  ${lockedCount[0].locked}`);
  console.log(`   audit_log rows:         ${auditCount[0].total}`);

  console.log('\n✅ Migration completed successfully!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
