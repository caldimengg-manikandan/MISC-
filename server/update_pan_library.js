require('dotenv').config();
const db = require('./src/config/mssql');

const GAUGE_THICKNESS = {
  '12ga': 0.1046,
  '11ga': 0.1196
};

const newConfigs = [
  // 11ga Rows (ordered as per first screenshot)
  { label: '11ga TYPE-1(Z shape) [3-1 to 4-0]', gauge: '11ga', type: 'TYPE-1(Z shape)', min: null, max: 4.0, shop: 0.6, field: 0, cost: 80.00 },
  { label: '11ga TYPE-1(Z shape) [4-1 to 5-0]', gauge: '11ga', type: 'TYPE-1(Z shape)', min: null, max: 5.0, shop: 0.6, field: 0, cost: 100.00 },
  { label: '11ga TYPE-1(Z shape) [5-1 to 6-0]', gauge: '11ga', type: 'TYPE-1(Z shape)', min: null, max: 6.0, shop: 0.6, field: 0, cost: 120.00 },
  { label: '11ga TYPE-1(Z shape) [Up to 3-0]',  gauge: '11ga', type: 'TYPE-1(Z shape)', min: null, max: 3.0, shop: 0.6, field: 0, cost: 65.00 },
  
  // 12ga Rows (ordered as per first screenshot)
  { label: '12ga TYPE-1(Z shape) [3-1 to 4-0]', gauge: '12ga', type: 'TYPE-1(Z shape)', min: null, max: 4.0, shop: 0.6, field: 0, cost: 70.00 },
  { label: '12ga TYPE-1(Z shape) [4-1 to 5-0]', gauge: '12ga', type: 'TYPE-1(Z shape)', min: null, max: 5.0, shop: 0.6, field: 0, cost: 90.00 },
  { label: '12ga TYPE-1(Z shape) [5-1 to 6-0]', gauge: '12ga', type: 'TYPE-1(Z shape)', min: null, max: 6.0, shop: 0.6, field: 0, cost: 110.00 },
  { label: '12ga TYPE-1(Z shape) [Up to 3-0]',  gauge: '12ga', type: 'TYPE-1(Z shape)', min: null, max: 3.0, shop: 0.6, field: 0, cost: 55.00 }
];

async function updateLibrary() {
  try {
    console.log('🗑️ Deleting old pan_plate_config entries...');
    await db.query("DELETE FROM dictionary WHERE category = 'pan_plate_config'");

    let order = 1;
    for (const c of newConfigs) {
      const thickness = GAUGE_THICKNESS[c.gauge];
      const customFields = JSON.stringify({ pl_thk: c.gauge });

      console.log(`➕ Inserting: ${c.label}`);
      
      const sqlText = `
        INSERT INTO dictionary (
          category, label, description, value,
          min_stair_width_ft, max_stair_width_ft, 
          shopLaborMhLf, fieldLaborMhLf, 
          price, widthMin, spanMax, spanMin,
          steelLbsLf,
          custom_fields, is_active, isActive, 
          recommendation_order, sort_order, [order]
        ) VALUES (
          'pan_plate_config', @label, @description, @value,
          @min, @max,
          @shop, @field,
          @price, @thickness, @spanMax, @min,
          0,
          @custom, 1, 1,
          @order, @order, @order
        )
      `;

      await db.query(sqlText, {
        label: c.label,
        description: c.type,
        value: c.label, // Matches first screenshot "PAN SUPPORT TYPE"
        min: c.min, 
        max: c.max,
        shop: c.shop,
        field: c.field,
        price: c.cost,
        thickness: thickness,
        spanMax: c.max,
        custom: customFields,
        order: order++
      });
    }

    console.log('✅ Library updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating library:', err);
    process.exit(1);
  }
}

updateLibrary();
