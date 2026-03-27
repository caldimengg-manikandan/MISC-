require('dotenv').config();
const db = require('./src/config/mssql');

const PLATFORM_DATA = [
  { label: 'Metal pan stair platform 8\'-0" wide', lbs: 12.0, shop: 0.200, field: 0.250, riserLb: 5.0 },
  { label: 'Metal pan stair platform 10\'-0" wide', lbs: 12.5, shop: 0.200, field: 0.250, riserLb: 5.0 },
  { label: 'Metal pan stair platform 12\'-0" wide', lbs: 13.0, shop: 0.200, field: 0.250, riserLb: 5.0 },
  { label: 'Grating pan stair platform 8\'-0" wide', lbs: 12.0, shop: 0.200, field: 0.250, riserLb: 0 },
  { label: 'Grating pan stair platform 10\'-0" wide', lbs: 12.5, shop: 0.200, field: 0.250, riserLb: 0 }
];

async function run() {
  try {
    console.log('Seeding platform_type dictionary category...');
    
    const category = 'platform_type';
    // Clear existing to match user's requested list exactly
    await db.query(`DELETE FROM dictionary WHERE category = '${category}'`);
    
    let addedCount = 0;
    for (const item of PLATFORM_DATA) {
      const autoValue = item.label.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .substring(0, 50)
        .replace(/\s+/g, '-');
        
      // We store the riserLb in the description field for now if no dedicated column exists
      await db.query(`INSERT INTO dictionary (category, label, value, [order], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, description, isActive) 
                      VALUES ('${category}', '${item.label.replace(/'/g, "''")}', '${autoValue}', ${addedCount + 1}, ${item.lbs}, ${item.shop}, ${item.field}, '${item.riserLb}', 1)`);
      addedCount++;
    }
    
    console.log(`Reset complete. Seeded ${addedCount} platform types.`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    process.exit();
  }
}

run();
