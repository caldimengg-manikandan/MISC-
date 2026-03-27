require('dotenv').config();
const db = require('./src/config/mssql');

const USER_RAIL_DATA = [
  { label: '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe', lbs: 2.750, shop: 0.300, field: 0.280 },
  { label: '1-Line Handrailing on Guardrail - 1 1/2" SCH 40 pipe', lbs: 3.200, shop: 0.320, field: 0.280 },
  { label: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe', lbs: 2.280, shop: 0.250, field: 0.250 },
  { label: '1-Line Hand Railing wall bolted - 1 1/2" SCH 40 pipe', lbs: 2.720, shop: 0.270, field: 0.250 },
  { label: '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', lbs: 4.560, shop: 0.375, field: 0.350 },
  { label: '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', lbs: 5.440, shop: 0.400, field: 0.350 },
  { label: '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', lbs: 5.280, shop: 0.425, field: 0.350 },
  { label: '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', lbs: 6.350, shop: 0.450, field: 0.350 },
  { label: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', lbs: 6.840, shop: 0.500, field: 0.350 },
  { label: '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', lbs: 8.160, shop: 0.600, field: 0.375 },
  { label: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', lbs: 7.560, shop: 0.550, field: 0.350 },
  { label: '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', lbs: 9.070, shop: 0.650, field: 0.375 },
  { label: '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', lbs: 9.120, shop: 0.750, field: 0.350 },
  { label: '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', lbs: 10.880, shop: 0.775, field: 0.375 },
  { label: '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH 80 Posts', lbs: 9.840, shop: 0.775, field: 0.350 },
  { label: '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', lbs: 11.750, shop: 0.800, field: 0.385 },
  { label: '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', lbs: 20.520, shop: 2.000, field: 0.550 },
  { label: '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', lbs: 24.480, shop: 2.250, field: 0.600 },
  { label: '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', lbs: 17.040, shop: 0.875, field: 0.400 },
  { label: '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', lbs: 18.360, shop: 0.900, field: 0.400 },
  { label: '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', lbs: 17.760, shop: 0.900, field: 0.400 },
  { label: '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', lbs: 19.270, shop: 0.925, field: 0.400 },
  { label: '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', lbs: 26.890, shop: 0.950, field: 0.425 },
  { label: '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', lbs: 28.210, shop: 1.000, field: 0.450 },
  { label: '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', lbs: 27.610, shop: 0.975, field: 0.425 },
  { label: '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', lbs: 29.120, shop: 1.000, field: 0.450 },
  { label: '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', lbs: 16.780, shop: 1.125, field: 0.400 },
  { label: '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', lbs: 18.570, shop: 1.150, field: 0.400 },
  { label: '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', lbs: 17.510, shop: 1.150, field: 0.400 },
  { label: '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', lbs: 19.480, shop: 1.175, field: 0.400 },
  { label: '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', lbs: 26.470, shop: 1.200, field: 0.425 },
  { label: '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', lbs: 28.230, shop: 1.250, field: 0.450 },
  { label: '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH. 80 Post', lbs: 27.190, shop: 1.200, field: 0.425 },
  { label: '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH. 80 Post', lbs: 29.140, shop: 1.250, field: 0.450 },
  { label: '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS', lbs: 6.840, shop: 0.875, field: 0.400 },
  { label: '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS', lbs: 8.160, shop: 0.900, field: 0.400 },
  { label: '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS', lbs: 7.560, shop: 0.900, field: 0.400 }, // Matches above? Let's assume user wanted both or there is a typo.
  { label: '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2" SCH 40 RAILS', lbs: 9.070, shop: 0.925, field: 0.400 },
  { label: 'Optional Kick Plate 4\'x4\'', lbs: 3.400, shop: 0.125, field: 0.050 }
];

async function run() {
  try {
    console.log('Starting exact migration...');
    const [dbEntries] = await db.query('SELECT id, label, category FROM dictionary');
    let updatedCount = 0;
    
    for (const item of USER_RAIL_DATA) {
      // Find matching item in dictionary properly
      const match = dbEntries.find(e => 
        e.label.toUpperCase().trim() === item.label.toUpperCase().trim() ||
        e.label.toUpperCase().trim().includes(item.label.toUpperCase().trim())
      );
      
      if (match) {
        await db.query(`UPDATE dictionary SET steelLbsLf = ${item.lbs}, shopLaborMhLf = ${item.shop}, fieldLaborMhLf = ${item.field} WHERE id = ${match.id}`);
        console.log(`Updated: ${match.label} -> ${item.lbs} lbs`);
        updatedCount++;
      } else {
        // Add new if not found in guardRail_type
        const autoValue = item.label.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
        await db.query(`INSERT INTO dictionary (category, label, value, [order], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, isActive) 
                        VALUES ('guardRail_type', '${item.label.replace(/'/g, "''")}', '${autoValue}', 0, ${item.lbs}, ${item.shop}, ${item.field || 0}, 1)`);
        console.log(`Added missing: ${item.label}`);
        updatedCount++;
      }
    }
    
    console.log(`Migration complete. Processed ${updatedCount} entries.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

run();
