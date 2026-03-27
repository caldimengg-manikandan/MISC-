require('dotenv').config();
const db = require('./src/config/mssql');

const STRINGER_DATA = [
  { label: "Std.3'-8\" to 4'-0\" wide < 14'-0\" Stingers/MC 12 X 10.6", lbs: 25.320, shop: 1.500, field: 1.000 },
  { label: "Std. 4'-0\" wide 14'-0 - 19'-0\" Long Stringer/MC 12 X 14.3", lbs: 71.800, shop: 1.500, field: 1.000 },
  { label: "Std. 4'-0\" wide > 19'-0\" Long Stringer/C 12 X 20.7", lbs: 45.520, shop: 1.750, field: 1.000 },
  { label: "Std. 4'-0\" wide > 14'-0\" Long Stringer/TS 12 X 2 X 3/16", lbs: 39.000, shop: 1.650, field: 1.000 },
  { label: "Std. 4'-0\" wide > 14'-0\" to 19'-0\" Long Stringer/TS 12 X 2 X 1/4\"", lbs: 50.000, shop: 1.750, field: 1.000 },
  { label: "Std. 5'-0\" wide < 14'-0\" Long Stringers /MC 12 X 10.6", lbs: 25.320, shop: 1.500, field: 1.000 },
  { label: "Std. 5'-0\" wide 14'-0 Long Stringers/TS 12 X 2 X 3/16", lbs: 39.000, shop: 1.650, field: 1.000 },
  { label: "Std. 5'-0\" wide 14'-0 UP TO 19'-0\" Long Stringers/ TS 12 X 2 X 1/4\"", lbs: 50.000, shop: 1.750, field: 1.000 },
  { label: "Std. 5'-0\" wide 14'-0 over 19'-0\" Long Stringers/ C12 X 20.7", lbs: 45.520, shop: 1.750, field: 1.000 },
  { label: "Std. 6'-0\" wide < 14'-0\" span metal pan stairs/MC 12 X 10.6", lbs: 85.800, shop: 1.500, field: 1.000 },
  { label: "Std. 6'-0\" wide 14'-0 - 19'-0\" span metal pan stairs/MC 12 X 14.3", lbs: 89.200, shop: 1.500, field: 1.000 },
  { label: "Std. 6'-0\" wide > 19'-0\" span metal pan stairs", lbs: 106.000, shop: 1.500, field: 1.000 },
  { label: "Std. 4'-0\" wide < 14'-0\" span grating tread stairs/MC 12 X 10.6", lbs: 23.200, shop: 1.500, field: 0.750 },
  { label: "Std. 4'-0\" wide 14'-0 - 19'-0\" span grating tread stairs/MC 12 X 14.3", lbs: 30.600, shop: 1.500, field: 0.750 },
  { label: "Std. 4'-0\" wide > 19'-0\" span grating tread stairs", lbs: 43.400, shop: 1.500, field: 0.750 },
  { label: "Std. 5'-0\" wide < 14'-0\" span grating tread stairs/MC 12 X 10.6", lbs: 23.200, shop: 1.500, field: 0.750 },
  { label: "Std. 5'-0\" wide 14'-0 - 19'-0\" span grating tread stairs/MC 12 X 14.3", lbs: 30.600, shop: 1.500, field: 0.750 },
  { label: "Std. 5'-0\" wide > 19'-0\" span grating tread stairs", lbs: 23.200, shop: 1.500, field: 0.750 }
];

async function run() {
  try {
    console.log('Seeding stringer_size dictionary category...');
    
    const category = 'stringer_size';
    // Clear existing to match user's requested list exactly
    await db.query(`DELETE FROM dictionary WHERE category = '${category}'`);
    
    let addedCount = 0;
    for (const item of STRINGER_DATA) {
      const autoValue = item.label.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .substring(0, 50)
        .replace(/\s+/g, '-');
        
      await db.query(`INSERT INTO dictionary (category, label, value, [order], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, isActive) 
                      VALUES ('${category}', '${item.label.replace(/'/g, "''")}', '${autoValue}', ${addedCount + 3}, ${item.lbs}, ${item.shop}, ${item.field}, 1)`);
      addedCount++;
    }
    
    console.log(`Reset complete. Seeded ${addedCount} stringer sizes.`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    process.exit();
  }
}

run();
