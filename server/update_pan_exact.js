require('dotenv').config();
const db = require('./src/config/mssql');

const updates = [
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-1(Single support)', shopLaborMhLf: 1.2, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-2(Z-shape)', value: 'Type-2(Dual support)',   shopLaborMhLf: 1.25, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-3(bent plate)',    shopLaborMhLf: 1.3, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-1(Z shape)', value: 'Type-(Welded)',         shopLaborMhLf: 1.1, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-1(Single support)', shopLaborMhLf: 1.2, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-2(C-shape)', value: 'Type-2(Dual support)',   shopLaborMhLf: 1.25, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-3(bent plate)',    shopLaborMhLf: 1.3, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
  { label: '7ga to 24ga', description: 'TYPE-1(C shape)', value: 'Type-(Welded)',         shopLaborMhLf: 1.1, steelLbsLf: 0, spanMin: 0, spanMax: 8, shopEfficiency: null, fieldEfficiency: null },
];

async function run() {
  try {
    // We update based on Pan Type and Support Type combo to find the right rows
    for (const row of updates) {
      // Find row with matching category and specific parts
      // Since labels might have been combo strings before, we search for entries containing the parts
      const query = `
        UPDATE dictionary 
        SET 
          widthMin = 0.1046, -- Keep numerical for logic
          description = @panType,
          value = @supportType,
          shopLaborMhLf = @shopLabor,
          fieldLaborMhLf = 0,
          spanMin = @spanMin,
          spanMax = @spanMax,
          steelLbsLf = 0,
          shopEfficiency = NULL,
          fieldEfficiency = NULL,
          label = @label -- Set label to "7ga to 24ga" to match spreadsheet column 1
        WHERE category = 'pan_plate_config'
        AND (
          (description = @panType AND value = @supportType)
          OR 
          (label LIKE '%' + @panType + '%' AND label LIKE '%' + @supportType + '%')
        )
      `;
      
      await db.query(query, { 
        panType: row.description, 
        supportType: row.value,
        shopLabor: row.shopLaborMhLf,
        spanMin: row.spanMin,
        spanMax: row.spanMax,
        label: row.label
      });
    }
    console.log('Successfully updated pan plate details to match spreadsheet exactly.');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
