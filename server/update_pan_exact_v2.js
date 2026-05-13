require('dotenv').config();
const db = require('./src/config/mssql');

const entries = [
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-1(Single support)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.2, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-2(Z-shape)', value: 'Type-2(Dual support)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.25, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-3(bent plate)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.3, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-(Welded)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.1, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-1(Single support)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.2, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-2(C-shape)', value: 'Type-2(Dual support)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.25, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-3(bent plate)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.3, fieldLaborMhLf: 0 },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-(Welded)', spanMin: 0, spanMax: 8, steelLbsLf: 0, shopLaborMhLf: 1.1, fieldLaborMhLf: 0 }
];

async function update() {
  try {
    // 1. Delete existing entries for this category to avoid duplicates/mess
    await db.query(`DELETE FROM dictionary WHERE category = 'pan_plate_config'`);
    console.log('Cleared existing pan_plate_config entries.');

    // 2. Insert new entries
    for (const entry of entries) {
      await db.query(`
        INSERT INTO dictionary (
          category, label, description, value, 
          spanMin, spanMax, steelLbsLf, 
          shopLaborMhLf, fieldLaborMhLf, 
          shopEfficiency, fieldEfficiency,
          [order]
        ) VALUES (
          'pan_plate_config', 
          @label, @description, @value,
          @spanMin, @spanMax, @steelLbsLf,
          @shopLaborMhLf, @fieldLaborMhLf,
          100, 100, 1
        )
      `, {
        label: entry.label,
        description: entry.description,
        value: entry.value,
        spanMin: entry.spanMin,
        spanMax: entry.spanMax,
        steelLbsLf: entry.steelLbsLf,
        shopLaborMhLf: entry.shopLaborMhLf,
        fieldLaborMhLf: entry.fieldLaborMhLf
      });
      console.log(`Inserted: ${entry.description} - ${entry.value}`);
    }

    console.log('✅ Successfully fed exact details into Pan Plate Configurations.');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

update();
