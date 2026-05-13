require('dotenv').config();
const db = require('./src/config/mssql');

/**
 * Seed script: Assign recommended_application_type to pan plate configs.
 *
 * Mapping logic (from critical decisions document):
 *   12ga (lightest)                  → Residential / Light Duty
 *   10ga (single support)            → Commercial / Standard Duty
 *   10ga (dual/bent/welded support)  → Commercial / Standard Duty  (also Outdoor candidate)
 *   7ga  (single support)            → Commercial / Standard Duty
 *   7ga  (dual/bent/welded support)  → Industrial / Heavy Duty  +  Outdoor / Harsh Environment
 *   1/4" plate                       → Industrial / Heavy Duty
 *   All remaining (NULL)             → Commercial / Standard Duty (safe default)
 */
async function run() {
  try {
    console.log('🌱 Seeding application types for pan plate configs...');

    // Step 1: Default ALL pan plate configs to Commercial / Standard Duty first
    const defaultResult = await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Commercial / Standard Duty'
      WHERE category = 'pan_plate_config'
        AND (recommended_application_type IS NULL OR recommended_application_type = '')
    `);
    console.log(`✅ Set default 'Commercial / Standard Duty' for all un-typed configs.`);

    // Step 2: 12ga → Residential / Light Duty
    await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Residential / Light Duty'
      WHERE category = 'pan_plate_config'
        AND (label LIKE '%12ga%' OR value LIKE '%12ga%')
    `);
    console.log(`✅ Mapped 12ga configs → Residential / Light Duty`);

    // Step 3: 1/4" plate → Industrial / Heavy Duty
    await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Industrial / Heavy Duty'
      WHERE category = 'pan_plate_config'
        AND (label LIKE '%1/4%' OR label LIKE '%quarter%' OR value LIKE '%1_4%')
    `);
    console.log(`✅ Mapped 1/4" plate configs → Industrial / Heavy Duty`);

    // Step 4: 7ga with Dual/Bent/Welded support → Industrial / Heavy Duty
    await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Industrial / Heavy Duty'
      WHERE category = 'pan_plate_config'
        AND (label LIKE '%7ga%' OR value LIKE '%7ga%')
        AND (
          label LIKE '%Dual%'   OR label LIKE '%Type-2%' OR label LIKE '%Type2%' OR
          label LIKE '%Bent%'   OR label LIKE '%Type-3%' OR label LIKE '%Type3%' OR
          label LIKE '%Weld%'   OR label LIKE '%Type-4%' OR label LIKE '%Type4%'
        )
    `);
    console.log(`✅ Mapped 7ga (Dual/Bent/Welded) → Industrial / Heavy Duty`);

    // Step 5: 7ga with Dual/Bent/Welded → ALSO mark as Outdoor / Harsh Environment
    //         We use a separate column row approach: store comma-separated OR just use Outdoor as override
    //         Per decision: these are the outdoor candidates — store Outdoor for those specifically
    await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Outdoor / Harsh Environment'
      WHERE category = 'pan_plate_config'
        AND (label LIKE '%7ga%' OR value LIKE '%7ga%')
        AND (
          label LIKE '%Dual%'   OR label LIKE '%Type-2%' OR
          label LIKE '%Bent%'   OR label LIKE '%Type-3%' OR
          label LIKE '%Weld%'
        )
    `);
    console.log(`✅ Mapped 7ga (Dual/Bent/Welded) → Outdoor / Harsh Environment (overrides Heavy Duty for outdoor-capable configs)`);

    // Step 6: 10ga with Dual/Bent/Welded also suitable for Outdoor
    await db.query(`
      UPDATE dictionary
      SET recommended_application_type = 'Outdoor / Harsh Environment'
      WHERE category = 'pan_plate_config'
        AND (label LIKE '%10ga%' OR value LIKE '%10ga%')
        AND (
          label LIKE '%Dual%'   OR label LIKE '%Type-2%' OR
          label LIKE '%Bent%'   OR label LIKE '%Type-3%' OR
          label LIKE '%Weld%'
        )
    `);
    console.log(`✅ Mapped 10ga (Dual/Bent/Welded) → Outdoor / Harsh Environment`);

    // Step 7: Verify
    const verifyResult = await db.query(`
      SELECT recommended_application_type, COUNT(*) AS cnt
      FROM dictionary
      WHERE category = 'pan_plate_config'
      GROUP BY recommended_application_type
      ORDER BY cnt DESC
    `);

    console.log('\n📊 Verification — Application Type Distribution:');
    if (verifyResult[0]) {
      verifyResult[0].forEach(row => {
        console.log(`   ${row.recommended_application_type || 'NULL'}: ${row.cnt} configs`);
      });
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

run();
