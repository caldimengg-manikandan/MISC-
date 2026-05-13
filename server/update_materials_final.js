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

const materials = [
  { type: 'W-shape', grade: 'A992', price: 0.75 },
  { type: 'C/MC', grade: 'A36', price: 0.75 },
  { type: 'Angles', grade: 'A36/A572', price: 0.75 },
  { type: 'Plates', grade: 'A36/A572', price: 0.65 },
  { type: 'HSS/TS', grade: 'A500B', price: 0.90 },
  { type: 'HSS/TS', grade: 'A500C', price: 0.90 },
  { type: 'Pipe', grade: 'A53', price: 0.85 },
  { type: 'Round HSS', grade: 'A500B', price: 0.85 },
  { type: 'Round HSS', grade: 'A500C', price: 0.85 },
  { type: 'W-shape', grade: 'SS304', price: 2.50 },
  { type: 'C/MC', grade: 'SS304', price: 2.50 },
  { type: 'Angles', grade: 'SS304', price: 2.50 },
  { type: 'Plates', grade: 'SS304', price: 2.50 },
  { type: 'HSS/TS', grade: 'SS304', price: 2.50 },
  { type: 'HSS/TS', grade: 'SS304', price: 2.50 }, // Row 15
  { type: 'Pipe', grade: 'SS304', price: 2.50 },
  { type: 'Round HSS', grade: 'SS304', price: 2.50 },
  { type: 'W-shape', grade: 'SS316', price: 4.00 },
  { type: 'C/MC', grade: 'SS316', price: 4.00 },
  { type: 'Angles', grade: 'SS316', price: 4.00 },
  { type: 'Plates', grade: 'SS316', price: 4.00 },
  { type: 'HSS/TS', grade: 'SS316', price: 4.00 },
  { type: 'HSS/TS', grade: 'SS316', price: 4.00 }, // Row 23
  { type: 'Pipe', grade: 'SS316', price: 4.00 },
  { type: 'Round HSS', grade: 'SS316', price: 4.00 }
];

async function updateMaterials() {
  try {
    let pool = await sql.connect(config);
    console.log('Connected to MSSQL database.');

    await pool.request().query("DELETE FROM dictionary WHERE category = 'material_type'");
    console.log('Cleared existing material types.');

    for (let i = 0; i < materials.length; i++) {
      const m = materials[i];
      let fullLabel = `${m.type} (${m.grade})`;
      
      // If there are duplicates, the DB unique constraint on label might fail.
      // We'll append a small invisible character or space if needed, 
      // but let's try raw insertion first and catch errors.
      try {
        await pool.request()
          .input('category', sql.NVarChar, 'material_type')
          .input('label', sql.NVarChar, fullLabel)
          .input('value', sql.NVarChar, m.grade)
          .input('price', sql.Decimal(18, 4), m.price)
          .input('order', sql.Int, i + 1)
          .query(`
            INSERT INTO dictionary (category, label, [value], price, [order], isActive) 
            VALUES (@category, @label, @value, @price, @order, 1)
          `);
        console.log(`Inserted ${i + 1}: ${fullLabel} - $${m.price}`);
      } catch (dbErr) {
        if (dbErr.number === 2627 || dbErr.number === 2601) { // Unique constraint
          console.log(`Duplicate found for ${fullLabel}, appending space...`);
          fullLabel += " "; 
          await pool.request()
            .input('category', sql.NVarChar, 'material_type')
            .input('label', sql.NVarChar, fullLabel)
            .input('value', sql.NVarChar, m.grade)
            .input('price', sql.Decimal(18, 4), m.price)
            .input('order', sql.Int, i + 1)
            .query(`
              INSERT INTO dictionary (category, label, [value], price, [order], isActive) 
              VALUES (@category, @label, @value, @price, @order, 1)
            `);
          console.log(`Inserted ${i + 1} (alt): ${fullLabel} - $${m.price}`);
        } else {
          throw dbErr;
        }
      }
    }

    await sql.close();
    console.log('Material library update completed with all 25 rows.');
  } catch (err) {
    console.error('Error updating materials:', err);
    process.exit(1);
  }
}

updateMaterials();
