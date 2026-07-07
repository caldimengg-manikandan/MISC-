const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { 
        encrypt: true, 
        trustServerCertificate: true
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function syncSchema() {
    try {
        console.log(`🚀 Starting production schema alignment on ${config.server}...`);
        const pool = await mssql.connect(config);
        console.log('✅ Connected to database');

        // ── 1. Update Dictionary Columns ─────────────────────────────────────────
        console.log('\n--- 1. Aligning dictionary table columns ---');
        const dictColumns = [
            { name: 'admin_owner_id', type: 'BIGINT NULL' },
            { name: 'custom_fields', type: 'NVARCHAR(MAX) NULL' },
            { name: 'is_system_default', type: 'BIT NOT NULL DEFAULT 0' },
            { name: 'created_at', type: 'DATETIME NULL DEFAULT GETDATE()' },
            { name: 'updated_at', type: 'DATETIME NULL DEFAULT GETDATE()' },
            { name: 'updated_by', type: 'NVARCHAR(255) NULL' },
            { name: 'cost_per_lb', type: 'DECIMAL(10,4) NULL' },
            { name: 'widthMin', type: 'FLOAT NULL' },
            { name: 'shopEfficiency', type: 'FLOAT NULL' },
            { name: 'fieldEfficiency', type: 'FLOAT NULL' },
            { name: 'min_stair_width_ft', type: 'DECIMAL(5,2) NULL' },
            { name: 'max_stair_width_ft', type: 'DECIMAL(5,2) NULL' },
            { name: 'min_stair_length_ft', type: 'DECIMAL(5,2) NULL' },
            { name: 'max_stair_length_ft', type: 'DECIMAL(5,2) NULL' },
            { name: 'recommendation_order', type: 'INT NULL' },
            { name: 'recommended_for_stair_type', type: 'NVARCHAR(100) NULL' },
            { name: 'recommended_application_type', type: 'NVARCHAR(510) NULL' }
        ];

        for (const col of dictColumns) {
            const checkQuery = `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dictionary') AND name = '${col.name}'`;
            const checkResult = await pool.request().query(checkQuery);
            if (checkResult.recordset.length === 0) {
                console.log(`   Adding column ${col.name}...`);
                await pool.request().query(`ALTER TABLE dictionary ADD [${col.name}] ${col.type}`);
                console.log(`   ✅ Column ${col.name} added`);
            } else {
                console.log(`   ℹ️ Column ${col.name} already exists`);
            }
        }

        // ── 2. Create dictionary_columns table ──────────────────────────────────
        console.log('\n--- 2. Checking dictionary_columns table ---');
        const dictColsTableResult = await pool.request().query(
            "SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dictionary_columns]') AND type in (N'U')"
        );

        if (dictColsTableResult.recordset.length === 0) {
            console.log('   Creating dictionary_columns table...');
            await pool.request().query(`
                CREATE TABLE [dbo].[dictionary_columns](
                    id int IDENTITY(1,1) PRIMARY KEY,
                    category nvarchar(100) NOT NULL,
                    field_key nvarchar(100) NOT NULL,
                    header nvarchar(100) NOT NULL,
                    field_type nvarchar(50) DEFAULT 'string',
                    admin_owner_id bigint NULL
                );
            `);
            console.log('   ✅ Table dictionary_columns created');
        } else {
            console.log('   ℹ️ Table dictionary_columns already exists');
        }

        // ── 3. Seed dictionary_columns ───────────────────────────────────────────
        console.log('\n--- 3. Seeding dictionary_columns if empty ---');
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
            const check = await pool.request()
                .input('cat', cat)
                .input('key', key)
                .query("SELECT 1 FROM dictionary_columns WHERE category = @cat AND field_key = @key");
            if (check.recordset.length === 0) {
                await pool.request()
                    .input('cat', cat)
                    .input('key', key)
                    .input('header', header)
                    .input('type', type)
                    .query("INSERT INTO dictionary_columns (category, field_key, header, field_type) VALUES (@cat, @key, @header, @type)");
                console.log(`   ✅ Seeded dictionary_column: ${cat} -> ${key}`);
            }
        }

        // ── 4. Create library_audit_log table ────────────────────────────────────
        console.log('\n--- 4. Checking library_audit_log table ---');
        const auditTableResult = await pool.request().query(
            "SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[library_audit_log]') AND type in (N'U')"
        );

        if (auditTableResult.recordset.length === 0) {
            console.log('   Creating library_audit_log table...');
            await pool.request().query(`
                CREATE TABLE library_audit_log (
                    audit_id    INT PRIMARY KEY IDENTITY(1,1),
                    module_name NVARCHAR(100) NOT NULL,
                    action      NVARCHAR(50)  NOT NULL,
                    imported_filename NVARCHAR(255) NULL,
                    rows_affected INT DEFAULT 0,
                    rows_added    INT DEFAULT 0,
                    rows_updated  INT DEFAULT 0,
                    rows_skipped  INT DEFAULT 0,
                    details       NVARCHAR(MAX) NULL,
                    created_at    DATETIME DEFAULT GETDATE(),
                    created_by    NVARCHAR(255) NOT NULL
                );
            `);
            await pool.request().query(
                "CREATE INDEX idx_audit_module_date ON library_audit_log(module_name, created_at)"
            );
            console.log('   ✅ Table library_audit_log created');
        } else {
            console.log('   ℹ️ Table library_audit_log already exists');
        }

        console.log('\n✨ Production schema alignment completed successfully!');
        await pool.close();
    } catch (err) {
        console.error('❌ Schema alignment failed:', err.message);
    } finally {
        process.exit(0);
    }
}

syncSchema();
