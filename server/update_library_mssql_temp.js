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

async function updateLibrary() {
  try {
    let pool = await sql.connect(config);
    console.log('Connected to MSSQL database.');

    // 1. Update material_type
    const materialTypes = [
      { label: 'W-shape', value: 'A992', price: 0.75 },
      { label: 'C/MC', value: 'A36', price: 0.75 },
      { label: 'Angles', value: 'A36/A572', price: 0.75 },
      { label: 'Plates', value: 'A36/A572', price: 0.65 },
      { label: 'HSS/TS', value: 'A500B', price: 0.90 },
      { label: 'Pipe', value: 'A53', price: 0.85 },
      { label: 'Round HSS', value: 'A500B', price: 0.85 },
      { label: 'SS304', value: 'SS304', price: 2.50 },
      { label: 'SS316', value: 'SS316', price: 4.00 }
    ];

    for (const mt of materialTypes) {
      await pool.request()
        .input('category', sql.NVarChar, 'material_type')
        .input('label', sql.NVarChar, mt.label)
        .input('value', sql.NVarChar, mt.value)
        .input('price', sql.Decimal(18, 4), mt.price)
        .query(`
          IF EXISTS (SELECT 1 FROM dictionary WHERE category = @category AND label = @label)
          BEGIN
            UPDATE dictionary SET price = @price, value = @value, isActive = 1 WHERE category = @category AND label = @label
          END
          ELSE
          BEGIN
            INSERT INTO dictionary (category, label, [value], price, isActive) VALUES (@category, @label, @value, @price, 1)
          END
        `);
      console.log(`Updated material_type: ${mt.label}`);
    }

    // 2. Update gauge_plate_spec
    const gaugeSpecs = [
      { label: '7 ga', value: '0.1793', weight: 7.32 },
      { label: '10 ga', value: '0.1345', weight: 5.49 },
      { label: '11 ga', value: '0.1196', weight: 4.88 },
      { label: '12 ga', value: '0.1046', weight: 4.27 },
      { label: '14 ga', value: '0.0747', weight: 3.05 },
      { label: '16 ga', value: '0.0598', weight: 2.44 },
      { label: '18 ga', value: '0.0478', weight: 1.95 },
      { label: '20 ga', value: '0.0359', weight: 1.46 },
      { label: '22 ga', value: '0.0299', weight: 1.22 },
      { label: '24 ga', value: '0.0239', weight: 0.97 }
    ];

    for (const gs of gaugeSpecs) {
      await pool.request()
        .input('category', sql.NVarChar, 'gauge_plate_spec')
        .input('label', sql.NVarChar, gs.label)
        .input('value', sql.NVarChar, gs.value)
        .input('weight', sql.Decimal(18, 4), gs.weight)
        .query(`
          IF EXISTS (SELECT 1 FROM dictionary WHERE category = @category AND label = @label)
          BEGIN
            UPDATE dictionary SET steelLbsLf = @weight, [value] = @value, isActive = 1 WHERE category = @category AND label = @label
          END
          ELSE
          BEGIN
            INSERT INTO dictionary (category, label, [value], steelLbsLf, isActive) VALUES (@category, @label, @value, @weight, 1)
          END
        `);
      console.log(`Updated gauge_plate_spec: ${gs.label}`);
    }

    // 3. Update stringer_size
    const stringers = [
      { label: 'C12x20.7', value: 'A36', weight: 20.7, shop: 1.0, field: 1.0, price: 0.75 }
    ];

    for (const s of stringers) {
      await pool.request()
        .input('category', sql.NVarChar, 'stringer_size')
        .input('label', sql.NVarChar, s.label)
        .input('value', sql.NVarChar, s.value)
        .input('weight', sql.Decimal(18, 4), s.weight)
        .input('shop', sql.Decimal(18, 4), s.shop)
        .input('field', sql.Decimal(18, 4), s.field)
        .input('price', sql.Decimal(18, 4), s.price)
        .query(`
          IF EXISTS (SELECT 1 FROM dictionary WHERE category = @category AND label = @label)
          BEGIN
            UPDATE dictionary SET steelLbsLf = @weight, shopLaborMhLf = @shop, fieldLaborMhLf = @field, price = @price, isActive = 1 
            WHERE category = @category AND label = @label
          END
          ELSE
          BEGIN
            INSERT INTO dictionary (category, label, [value], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, price, isActive) 
            VALUES (@category, @label, @value, @weight, @shop, @field, @price, 1)
          END
        `);
      console.log(`Updated stringer_size: ${s.label}`);
    }

    // 4. Update stair_type (Pan Plate types)
    const stairTypes = [
      { label: 'TYPE-1(Z shape)', value: 'PAN_TYPE_1', shop: 1.2, field: 1.0, price: 0.75 },
      { label: 'TYPE-2(Z-shape)', value: 'PAN_TYPE_2', shop: 1.25, field: 1.0, price: 0.75 }
    ];

    for (const st of stairTypes) {
      await pool.request()
        .input('category', sql.NVarChar, 'stair_type')
        .input('label', sql.NVarChar, st.label)
        .input('value', sql.NVarChar, st.value)
        .input('shop', sql.Decimal(18, 4), st.shop)
        .input('field', sql.Decimal(18, 4), st.field)
        .input('price', sql.Decimal(18, 4), st.price)
        .query(`
          IF EXISTS (SELECT 1 FROM dictionary WHERE category = @category AND label = @label)
          BEGIN
            UPDATE dictionary SET shopLaborMhLf = @shop, fieldLaborMhLf = @field, price = @price, [value] = @value, isActive = 1 
            WHERE category = @category AND label = @label
          END
          ELSE
          BEGIN
            INSERT INTO dictionary (category, label, [value], shopLaborMhLf, fieldLaborMhLf, price, isActive) 
            VALUES (@category, @label, @value, @shop, @field, @price, 1)
          END
        `);
      console.log(`Updated stair_type: ${st.label}`);
    }

    await sql.close();
    console.log('Library update completed successfully.');
  } catch (err) {
    console.error('Error updating library:', err);
    process.exit(1);
  }
}

updateLibrary();
