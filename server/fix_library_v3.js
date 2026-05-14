const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function run() {
    let pool;
    try {
        pool = await mssql.connect(config);
        console.log('✅ Connected to DB');
        
        // 1. Drop the table if it has the wrong schema (we just created it, so no data lost)
        // Check if field_type exists. If not, drop and recreate.
        const checkSql = "IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dictionary_columns]') AND type in (N'U')) " +
                         "AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dictionary_columns' AND COLUMN_NAME = 'field_type') " +
                         "BEGIN DROP TABLE [dbo].[dictionary_columns]; END";
        await pool.request().query(checkSql);

        // 2. Create table with the EXACT names from libraryRoutes.js
        const createSql = "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dictionary_columns]') AND type in (N'U')) " +
                         "BEGIN " +
                         "CREATE TABLE [dbo].[dictionary_columns]( " +
                         "  id int IDENTITY(1,1) PRIMARY KEY, " +
                         "  category nvarchar(100) NOT NULL, " +
                         "  field_key nvarchar(100) NOT NULL, " +
                         "  header nvarchar(100) NOT NULL, " +
                         "  field_type nvarchar(50) DEFAULT 'string', " +
                         "  admin_owner_id bigint NULL " +
                         "); " +
                         "END";
                         
        await pool.request().query(createSql);
        console.log('🔧 Table dictionary_columns is ready with correct schema.');

        // 3. Seed Pan Plate columns
        const panCols = [
            ['pan_plate_config', 'label', 'Display Name', 'string'],
            ['pan_plate_config', 'value', 'Plate Thk (in)', 'number'],
            ['pan_plate_config', 'description', 'Pan Type', 'string'],
            ['pan_plate_config', 'custom_fields', 'Support Type', 'string'],
            ['pan_plate_config', 'steelLbsLf', 'Weight (lbs)', 'number'],
            ['pan_plate_config', 'shopLaborMhLf', 'Shop Hrs', 'number'],
            ['pan_plate_config', 'fieldLaborMhLf', 'Field Hrs', 'number'],
            ['pan_plate_config', 'shopEfficiency', 'Shop Efficiency %', 'number'],
            ['pan_plate_config', 'fieldEfficiency', 'Field Efficiency %', 'number']
        ];

        for (const [cat, key, header, type] of panCols) {
            await pool.request()
                .input('cat', cat)
                .input('key', key)
                .input('header', header)
                .input('type', type)
                .query("IF NOT EXISTS (SELECT 1 FROM dictionary_columns WHERE category = @cat AND field_key = @key) " +
                       "INSERT INTO dictionary_columns (category, field_key, header, field_type) VALUES (@cat, @key, @header, @type)");
        }
        
        console.log('✅ All Pan Plate columns registered with correct keys!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}
run();
