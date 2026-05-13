require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  console.log('🚀 Starting Pan Plate Constraints Seeding...\n');

  try {
    // 1/4" Plate configs: Good for typical 4-6ft wide, 10-14ft stairs
    await db.query(`
      UPDATE dictionary SET
        min_stair_width_ft = 4.0,
        max_stair_width_ft = 6.0,
        min_stair_length_ft = 10.0,
        max_stair_length_ft = 14.0,
        recommendation_order = 1,
        recommended_for_stair_type = 'pan-concrete'
      WHERE category = 'pan_plate_config' 
      AND label LIKE '1/4" Plate%'
    `);
    console.log('✅ Updated 1/4" Plate configs');

    // 10ga Plate configs: Good for smaller stairs (3-4ft wide, 8-12ft long)
    await db.query(`
      UPDATE dictionary SET
        min_stair_width_ft = 3.0,
        max_stair_width_ft = 4.5,
        min_stair_length_ft = 8.0,
        max_stair_length_ft = 12.0,
        recommendation_order = 2,
        recommended_for_stair_type = 'pan-concrete'
      WHERE category = 'pan_plate_config' 
      AND label LIKE '10ga%'
    `);
    console.log('✅ Updated 10ga Plate configs');

    // 7ga Plate configs: Used generally for 4-5ft wide, 10-12ft long (added custom logic here)
    await db.query(`
      UPDATE dictionary SET
        min_stair_width_ft = 4.0,
        max_stair_width_ft = 5.0,
        min_stair_length_ft = 10.0,
        max_stair_length_ft = 12.0,
        recommendation_order = 1,
        recommended_for_stair_type = 'pan-concrete'
      WHERE category = 'pan_plate_config' 
      AND label LIKE '7ga%'
    `);
    console.log('✅ Updated 7ga Plate configs');

    // 12ga Plate configs: Used for very small, light duty stairs (added custom logic here)
    await db.query(`
      UPDATE dictionary SET
        min_stair_width_ft = 2.0,
        max_stair_width_ft = 3.5,
        min_stair_length_ft = 6.0,
        max_stair_length_ft = 10.0,
        recommendation_order = 3,
        recommended_for_stair_type = 'pan-concrete'
      WHERE category = 'pan_plate_config' 
      AND label LIKE '12ga%'
    `);
    console.log('✅ Updated 12ga Plate configs');

    // Fallback: Every config should have broad constraints as fallback
    await db.query(`
      UPDATE dictionary SET
        min_stair_width_ft = CASE WHEN min_stair_width_ft IS NULL THEN 3.0 ELSE min_stair_width_ft END,
        max_stair_width_ft = CASE WHEN max_stair_width_ft IS NULL THEN 10.0 ELSE max_stair_width_ft END,
        min_stair_length_ft = CASE WHEN min_stair_length_ft IS NULL THEN 8.0 ELSE min_stair_length_ft END,
        max_stair_length_ft = CASE WHEN max_stair_length_ft IS NULL THEN 20.0 ELSE max_stair_length_ft END,
        recommendation_order = CASE WHEN recommendation_order IS NULL THEN 99 ELSE recommendation_order END
      WHERE category = 'pan_plate_config' AND min_stair_width_ft IS NULL
    `);
    console.log('✅ Updated Fallback constraints');

    console.log('\n✅ Seeding completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

run();
