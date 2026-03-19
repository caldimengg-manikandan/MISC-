const XLSX = require('xlsx');
const path = require('path');
const db = require('../config/mysql');

const migrate = async () => {
  try {
    const excelPath = path.join('..', 'Misc Worksheet  reworked KDF 11-12-25 (1).xlsx');
    console.log('Reading Excel from:', excelPath);
    
    const workbook = XLSX.readFile(excelPath);
    const tableDataSheet = workbook.Sheets['Table Data'];
    if (!tableDataSheet) {
      throw new Error('Could not find Table Data sheet');
    }

    // Read raw data
    const rows = XLSX.utils.sheet_to_json(tableDataSheet, { header: 1 });
    
    console.log('Processing Table Data...');

    // Clear existing data (optional, but good for fresh migration)
    await db.query('DELETE FROM rail_types');
    await db.query('DELETE FROM platform_types');
    await db.query('DELETE FROM stringer_types');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const description = row[0];
        const val1 = parseFloat(row[1]); // steel weight factor
        const val2 = parseFloat(row[2]); // shop labor
        const val3 = parseFloat(row[3]); // field labor

        // Simple heuristic to categorize data based on description
        const descLower = String(description).toLowerCase();

        if (descLower.includes('rail') || descLower.includes('guard')) {
            await db.query(
                'INSERT INTO rail_types (description, category, steel_lbs_per_lf, shop_labor_rate, field_labor_rate) VALUES (?, ?, ?, ?, ?)',
                [description, 'RAIL', val1 || 0, val2 || 0, val3 || 0]
            );
        } else if (descLower.includes('platform')) {
            await db.query(
                'INSERT INTO platform_types (description, steel_lbs_per_sqft, shop_labor_rate, field_labor_rate) VALUES (?, ?, ?, ?, ?)',
                [description, val1 || 0, val2 || 0, val3 || 0]
            );
        } else if (descLower.includes('stringer') || descLower.includes('channel') || descLower.includes('ts ')) {
            await db.query(
                'INSERT INTO stringer_types (description, steel_lbs_per_ft) VALUES (?, ?)',
                [description, val1 || 0]
            );
        }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
