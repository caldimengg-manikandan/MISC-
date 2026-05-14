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
        
        // Create table using standard SQL (no special chars that might trip up logs)
        const createSql = "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dictionary_columns]') AND type in (N'U')) " +
                         "BEGIN " +
                         "CREATE TABLE [dbo].[dictionary_columns]( " +
                         "  id int IDENTITY(1,1) PRIMARY KEY, " +
                         "  category nvarchar(100) NOT NULL, " +
                         "  field_name nvarchar(100) NOT NULL, " +
                         "  display_name nvarchar(100) NOT NULL, " +
                         "  data_type nvarchar(50) DEFAULT 'string', " +
                         "  is_visible bit DEFAULT 1, " +
                         "  sort_order int DEFAULT 0 " +
                         "); " +
                         "END";
                         
        await pool.request().query(createSql);
        console.log('🔧 Table checked/created');

        const cols = [
            ['pan_plate_config', 'label', 'Display Name'],
            ['pan_plate_config', 'value', 'Plate Thk (in)'],
            ['pan_plate_config', 'description', 'Pan Type'],
            ['pan_plate_config', 'custom_fields', 'Support Type'],
            ['pan_plate_config', 'steelLbsLf', 'Weight (lbs)'],
            ['pan_plate_config', 'shopLaborMhLf', 'Shop Hrs'],
            ['pan_plate_config', 'fieldLaborMhLf', 'Field Hrs'],
            ['pan_plate_config', 'shopEfficiency', 'Shop Efficiency %'],
            ['pan_plate_config', 'fieldEfficiency', 'Field Efficiency %']
        ];

        for (const [cat, field, name] of cols) {
            await pool.request()
                .input('cat', cat)
                .input('field', field)
                .input('name', name)
                .query("IF NOT EXISTS (SELECT 1 FROM dictionary_columns WHERE category = @cat AND field_name = @field) " +
                       "INSERT INTO dictionary_columns (category, field_name, display_name) VALUES (@cat, @field, @name)");
        }
        
        console.log('✅ All Pan Plate columns registered!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}
run();
