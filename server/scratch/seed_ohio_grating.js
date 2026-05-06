require('dotenv').config();
const db = require('../src/config/mssql');

const NEW_GRATING_TYPES = [
  { label: `1 1/8" X 3'-6" 19W4`, price: 75.00 },
  { label: `1 1/8" X 4' 19W4`, price: 84.00 },
  { label: `1 1/8" X 4'-6" 19W4`, price: 93.00 },
  { label: `1 1/8" X 5' 19W4`, price: 102.00 }
];

async function run() {
  try {
    console.log('Adding Ohio Grating types...');
    const category = 'grating_type';
    
    for (const item of NEW_GRATING_TYPES) {
      const autoValue = item.label.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .substring(0, 50)
        .replace(/\s+/g, '-');
        
      const [existing] = await db.query(
        'SELECT id FROM dictionary WHERE category = ? AND label = ?',
        [category, item.label]
      );
      
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO dictionary (category, label, value, [order], price, isActive) VALUES (?, ?, ?, 99, ?, 1)',
          [category, item.label, autoValue, item.price]
        );
        console.log(`Added: ${item.label}`);
      } else {
        await db.query(
          'UPDATE dictionary SET price = ? WHERE id = ?',
          [item.price, existing[0].id]
        );
        console.log(`Updated: ${item.label}`);
      }
    }
    console.log('✅ Success');
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    process.exit();
  }
}

run();
