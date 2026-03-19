const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: 'master', 
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function initializeDatabase() {
    let pool;
    const dbName = process.env.MSSQL_DATABASE || 'MISC_DB';

    try {
        console.log(`Starting MSSQL initialization for ${dbName}...`);
        pool = await mssql.connect(config);

        await pool.request().query(`IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}') CREATE DATABASE [${dbName}]`);
        await pool.close();

        const dbConfig = { ...config, database: dbName };
        pool = await mssql.connect(dbConfig);

        console.log('--- 🚨 PERFORMING TOTAL RESET (CLEAN WIPE) 🚨 ---');
        
        // Comprehensive Drop Script
        const dropAllSql = `
            WHILE(EXISTS(SELECT 1 FROM sys.foreign_keys))
            BEGIN
                DECLARE @sql NVARCHAR(MAX);
                SELECT TOP 1 @sql = 'ALTER TABLE ' + QUOTENAME(schema_name(schema_id)) + '.' + QUOTENAME(object_name(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name)
                FROM sys.foreign_keys;
                EXEC sp_executesql @sql;
            END

            DECLARE @dropTables NVARCHAR(MAX) = '';
            SELECT @dropTables += 'DROP TABLE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + '; '
            FROM sys.tables;
            EXEC sp_executesql @dropTables;
        `;
        await pool.request().query(dropAllSql);

        console.log('--- Implementing Final Integrated Production Schema ---');

        // 0. Users
        await pool.request().query(`
            CREATE TABLE [users] (
                [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                [email] NVARCHAR(255) UNIQUE NOT NULL,
                [password] NVARCHAR(255) NOT NULL,
                [company] NVARCHAR(255),
                [phone] NVARCHAR(50),
                [role] NVARCHAR(50) DEFAULT 'user',
                [plan] NVARCHAR(50) DEFAULT 'trial',
                [isPaid] BIT DEFAULT 0,
                [subscriptionStatus] NVARCHAR(50) DEFAULT 'active',
                [trialStart] DATETIME DEFAULT GETDATE(),
                [trialEnd] DATETIME DEFAULT DATEADD(day, 30, GETDATE()),
                [lastLogin] DATETIME,
                [createdAt] DATETIME DEFAULT GETDATE()
            )
        `);

        // 1. PROJECTS (PRODUCTION + APPLICATION FIELDS)
        await pool.request().query(`
            CREATE TABLE [projects] (
                [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                [userId] BIGINT NOT NULL,
                [project_number] NVARCHAR(100),
                [projectName] NVARCHAR(255) NOT NULL,
                [projectNumber] NVARCHAR(100),
                [customer_name] NVARCHAR(255),
                [project_location] NVARCHAR(255),
                [architect] NVARCHAR(255),
                [engineer] NVARCHAR(255),
                [eor] NVARCHAR(255),
                [gc_name] NVARCHAR(255),
                [detailer] NVARCHAR(255),
                [vendor_name] NVARCHAR(255),
                [aisc_certified] NVARCHAR(50) DEFAULT 'Yes',
                [units] NVARCHAR(20) DEFAULT 'IMPERIAL',
                [notes] NVARCHAR(MAX),
                [stairs] NVARCHAR(MAX),
                [guardRails] NVARCHAR(MAX),
                [customRailValues] NVARCHAR(MAX),
                [status] NVARCHAR(50) DEFAULT 'draft',
                [created_at] DATETIME DEFAULT GETDATE(),
                [updatedAt] DATETIME DEFAULT GETDATE(),
                CONSTRAINT [fk_project_user] FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE
            )
        `);

        // 2. ESTIMATES
        await pool.request().query(`
            CREATE TABLE [estimates] (
                [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                [project_id] BIGINT NOT NULL,
                [version] INT DEFAULT 1,
                [status] NVARCHAR(20) DEFAULT 'DRAFT',
                [total_steel_weight] DECIMAL(15,6) DEFAULT 0,
                [total_shop_labor_hours] DECIMAL(15,6) DEFAULT 0,
                [total_field_labor_hours] DECIMAL(15,6) DEFAULT 0,
                [total_material_cost] DECIMAL(15,6) DEFAULT 0,
                [total_labor_cost] DECIMAL(15,6) DEFAULT 0,
                [total_estimated_cost] DECIMAL(15,6) DEFAULT 0,
                [created_at] DATETIME DEFAULT GETDATE(),
                [updated_at] DATETIME DEFAULT GETDATE(),
                CONSTRAINT [fk_estimate_project] FOREIGN KEY ([project_id]) REFERENCES [projects]([id]) ON DELETE CASCADE
            )
        `);

        // 3. TAKEOFF ITEMS
        await pool.request().query(`
            CREATE TABLE [takeoff_items] (
                [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                [estimate_id] BIGINT NOT NULL,
                [category_id] INT NOT NULL,
                [item_type_id] BIGINT,
                [description] NVARCHAR(500),
                [length] DECIMAL(15,6),
                [width] DECIMAL(15,6),
                [height] DECIMAL(15,6),
                [quantity] INT DEFAULT 1,
                [spacing] DECIMAL(15,6),
                [rise] DECIMAL(15,6),
                [run] DECIMAL(15,6),
                [raw_input] NVARCHAR(MAX),
                [created_at] DATETIME DEFAULT GETDATE(),
                CONSTRAINT [fk_takeoff_estimate] FOREIGN KEY ([estimate_id]) REFERENCES [estimates]([id]) ON DELETE CASCADE
            )
        `);

        // 4. ESTIMATE RESULTS
        await pool.request().query(`
            CREATE TABLE [estimate_results] (
                [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                [estimate_id] BIGINT NOT NULL,
                [takeoff_item_id] BIGINT,
                [steel_weight] DECIMAL(15,6),
                [shop_labor_hours] DECIMAL(15,6),
                [field_labor_hours] DECIMAL(15,6),
                [material_cost] DECIMAL(15,6),
                [labor_cost] DECIMAL(15,6),
                [total_cost] DECIMAL(15,6),
                [created_at] DATETIME DEFAULT GETDATE(),
                CONSTRAINT [fk_result_estimate] FOREIGN KEY ([estimate_id]) REFERENCES [estimates]([id]) ON DELETE CASCADE,
                CONSTRAINT [fk_result_takeoff] FOREIGN KEY ([takeoff_item_id]) REFERENCES [takeoff_items]([id])
            )
        `);

        // 5. LOOKUPS & CONFIG
        await pool.request().query(`CREATE TABLE [rail_types] ([id] BIGINT IDENTITY(1,1) PRIMARY KEY, [type] NVARCHAR(20), [name] NVARCHAR(255), [steel_lbs_per_lf] DECIMAL(15,6), [shop_labor_rate] DECIMAL(15,6), [field_labor_rate] DECIMAL(15,6), [is_active] BIT DEFAULT 1)`);
        await pool.request().query(`CREATE TABLE [platform_types] ([id] BIGINT IDENTITY(1,1) PRIMARY KEY, [name] NVARCHAR(255), [steel_lbs_per_sqft] DECIMAL(15,6), [shop_labor_rate] DECIMAL(15,6), [field_labor_rate] DECIMAL(15,6), [is_active] BIT DEFAULT 1)`);
        await pool.request().query(`CREATE TABLE [stringer_types] ([id] BIGINT IDENTITY(1,1) PRIMARY KEY, [name] NVARCHAR(255), [steel_lbs_per_ft] DECIMAL(15,6), [is_active] BIT DEFAULT 1)`);
        await pool.request().query(`CREATE TABLE [labor_rates] ([id] BIGINT IDENTITY(1,1) PRIMARY KEY, [labor_type] NVARCHAR(20), [rate] DECIMAL(15,6))`);
        await pool.request().query(`CREATE TABLE [system_config] ([config_key] NVARCHAR(100) PRIMARY KEY, [config_value] DECIMAL(15,6))`);
        await pool.request().query(`CREATE TABLE [categories] ([id] INT IDENTITY(1,1) PRIMARY KEY, [name] NVARCHAR(100) UNIQUE)`);
        await pool.request().query(`CREATE TABLE [dictionary] ([id] BIGINT IDENTITY(1,1) PRIMARY KEY, [category] NVARCHAR(100), [label] NVARCHAR(255), [value] NVARCHAR(255), [sort_order] INT DEFAULT 0, [is_active] BIT DEFAULT 1)`);

        console.log('Seeding default values...');
        await pool.request().query("INSERT INTO system_config VALUES ('material_markup', 0.11), ('tax_rate', 0.06)");
        await pool.request().query("INSERT INTO categories (name) VALUES ('RAIL'), ('PLATFORM'), ('STRINGER'), ('STAIR')");

        console.log('✅ COMPLETE RESET SUCCESSFUL.');
        await pool.close();

    } catch (err) {
        console.error('❌ Reset Failed:', err.message);
        if (pool) await pool.close();
        process.exit(1);
    }
}

initializeDatabase();
