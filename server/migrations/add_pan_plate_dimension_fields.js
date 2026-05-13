/**
 * Migration: add_pan_plate_dimension_fields.js
 * Run ONCE to add dimension constraint columns for auto-recommendation of Pan Plate configs.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function run() {
  console.log('🚀 Starting Pan Plate Auto-Recommendation Migration...\n');

  console.log('📋 Step 1: Auditing dictionary table schema...');
  const [cols] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'dictionary'`
  );
  
  const existingColNames = cols.map(c => c.COLUMN_NAME.toLowerCase());
  
  const newColumns = [
    { name: 'min_stair_width_ft', type: 'DECIMAL(5,2) NULL' },
    { name: 'max_stair_width_ft', type: 'DECIMAL(5,2) NULL' },
    { name: 'min_stair_length_ft', type: 'DECIMAL(5,2) NULL' },
    { name: 'max_stair_length_ft', type: 'DECIMAL(5,2) NULL' },
    { name: 'recommendation_order', type: 'INT DEFAULT 99' },
    { name: 'recommended_for_stair_type', type: 'NVARCHAR(50) NULL' }
  ];

  for (const col of newColumns) {
    if (!existingColNames.includes(col.name)) {
      console.log(`\n📋 Adding ${col.name} column...`);
      await db.query(`ALTER TABLE dictionary ADD ${col.name} ${col.type}`);
      console.log(`   ✅ ${col.name} added`);
    } else {
      console.log(`\n📋 ${col.name} already exists — skipping`);
    }
  }

  console.log('\n📋 Step 2: Creating Index for performance...');
  try {
    await db.query(`
      CREATE INDEX idx_pan_config_dimensions ON dictionary(
        min_stair_width_ft, max_stair_width_ft,
        min_stair_length_ft, max_stair_length_ft
      )
    `);
    console.log('   ✅ Index created');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log('   ℹ️  Index already exists — skipping');
    } else {
      console.log('   ℹ️  Index could not be created (maybe unsupported in this syntax) — skipping', e.message);
    }
  }

  console.log('\n✅ Migration completed successfully!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
