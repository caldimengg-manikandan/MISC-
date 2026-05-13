const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_PORT),
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

async function updateLibraryExtended() {
  try {
    let pool = await sql.connect(config);
    console.log('Connected to MSSQL database.');

    // 1. Connection Types (Bottom Support)
    const connectionTypes = [
      { label: 'TYPE-1 Support', value: 'L3x3x3/8x0-6 w/1/2" exp', weight: 3.65, shop: 0.2, field: 0.3 },
      { label: 'TYPE-2 Support', value: 'L3x3x3/8x0-6 w/5/8" exp', weight: 4.75, shop: 0.2, field: 0.3 },
      { label: 'TYPE-3 Support', value: 'L3x3x3/8x0-6 w/3/4" exp', weight: 4.75, shop: 0.2, field: 0.3 },
      { label: 'TYPE-4 Support', value: 'L4x4x1/4x0-6 w/3/4" A325', weight: 4.75, shop: 0.2, field: 0.3 }
    ];

    for (const ct of connectionTypes) {
      await pool.request()
        .input('category', sql.NVarChar, 'connection_type')
        .input('label', sql.NVarChar, ct.label)
        .input('value', sql.NVarChar, ct.value)
        .input('weight', sql.Decimal(18, 4), ct.weight)
        .input('shop', sql.Decimal(18, 4), ct.shop)
        .input('field', sql.Decimal(18, 4), ct.field)
        .query(`
          IF EXISTS (SELECT 1 FROM dictionary WHERE category = @category AND label = @label)
          BEGIN
            UPDATE dictionary SET steelLbsLf = @weight, shopLaborMhLf = @shop, fieldLaborMhLf = @field, [value] = @value, isActive = 1 
            WHERE category = @category AND label = @label
          END
          ELSE
          BEGIN
            INSERT INTO dictionary (category, label, [value], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, isActive) 
            VALUES (@category, @label, @value, @weight, @shop, @field, 1)
          END
        `);
      console.log(`Updated connection_type: ${ct.label}`);
    }

    await sql.close();
    console.log('Extended library update completed.');
  } catch (err) {
    console.error('Error updating library extended:', err);
    process.exit(1);
  }
}

updateLibraryExtended();
