const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
};

async function initializeDatabase() {
    let connection;
    const dbName = process.env.MYSQL_DATABASE || 'MISC_DB';

    try {
        console.log(`Starting MySQL initialization for ${dbName}...`);
        
        // Connect without database to create it
        connection = await mysql.createConnection(config);

        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);

        console.log('--- 🚨 PERFORMING TOTAL RESET (CLEAN WIPE) 🚨 ---');
        
        // Disable foreign key checks to drop tables easily
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const [tables] = await connection.query('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`Dropping table ${tableName}...`);
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }
        
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('--- Implementing Final Integrated Production Schema ---');

        // 0. Users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                phone VARCHAR(50),
                role VARCHAR(50) DEFAULT 'user',
                \`plan\` VARCHAR(50) DEFAULT 'trial',
                isPaid TINYINT(1) DEFAULT 0,
                subscriptionStatus VARCHAR(50) DEFAULT 'active',
                trialStart DATETIME DEFAULT CURRENT_TIMESTAMP,
                trialEnd DATETIME DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
                lastLogin DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 1. PROJECTS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                userId BIGINT NOT NULL,
                project_number VARCHAR(100),
                projectName VARCHAR(255) NOT NULL,
                projectNumber VARCHAR(100),
                customer_name VARCHAR(255),
                project_location VARCHAR(255),
                architect VARCHAR(255),
                engineer VARCHAR(255),
                eor VARCHAR(255),
                gc_name VARCHAR(255),
                detailer VARCHAR(255),
                vendor_name VARCHAR(255),
                aisc_certified VARCHAR(50) DEFAULT 'Yes',
                units VARCHAR(20) DEFAULT 'IMPERIAL',
                notes TEXT,
                stairs TEXT,
                guardRails TEXT,
                customRailValues TEXT,
                status VARCHAR(50) DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_project_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 2. ESTIMATES
        await connection.query(`
            CREATE TABLE IF NOT EXISTS estimates (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                project_id BIGINT NOT NULL,
                version INT DEFAULT 1,
                status VARCHAR(20) DEFAULT 'DRAFT',
                total_steel_weight DECIMAL(15,6) DEFAULT 0,
                total_shop_labor_hours DECIMAL(15,6) DEFAULT 0,
                total_field_labor_hours DECIMAL(15,6) DEFAULT 0,
                total_material_cost DECIMAL(15,6) DEFAULT 0,
                total_labor_cost DECIMAL(15,6) DEFAULT 0,
                total_estimated_cost DECIMAL(15,6) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_estimate_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);

        // 3. TAKEOFF ITEMS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS takeoff_items (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                estimate_id BIGINT NOT NULL,
                category_id INT NOT NULL,
                item_type_id BIGINT,
                description VARCHAR(500),
                length DECIMAL(15,6),
                width DECIMAL(15,6),
                height DECIMAL(15,6),
                quantity INT DEFAULT 1,
                spacing DECIMAL(15,6),
                rise DECIMAL(15,6),
                run DECIMAL(15,6),
                raw_input TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_takeoff_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
            )
        `);

        // 4. ESTIMATE RESULTS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS estimate_results (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                estimate_id BIGINT NOT NULL,
                takeoff_item_id BIGINT,
                steel_weight DECIMAL(15,6),
                shop_labor_hours DECIMAL(15,6),
                field_labor_hours DECIMAL(15,6),
                material_cost DECIMAL(15,6),
                labor_cost DECIMAL(15,6),
                total_cost DECIMAL(15,6),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_result_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
                CONSTRAINT fk_result_takeoff FOREIGN KEY (takeoff_item_id) REFERENCES takeoff_items(id)
            )
        `);

        // 5. LOOKUPS & CONFIG
        await connection.query(`CREATE TABLE IF NOT EXISTS rail_types (id BIGINT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(20), name VARCHAR(255), steel_lbs_per_lf DECIMAL(15,6), shop_labor_rate DECIMAL(15,6), field_labor_rate DECIMAL(15,6), is_active TINYINT(1) DEFAULT 1)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS platform_types (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), steel_lbs_per_sqft DECIMAL(15,6), shop_labor_rate DECIMAL(15,6), field_labor_rate DECIMAL(15,6), is_active TINYINT(1) DEFAULT 1)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS stringer_types (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), steel_lbs_per_ft DECIMAL(15,6), is_active TINYINT(1) DEFAULT 1)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS labor_rates (id BIGINT AUTO_INCREMENT PRIMARY KEY, labor_type VARCHAR(20), rate DECIMAL(15,6))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS system_config (config_key VARCHAR(100) PRIMARY KEY, config_value DECIMAL(15,6))`);
        await connection.query(`CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) UNIQUE)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS dictionary (id BIGINT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(100), label VARCHAR(255), value VARCHAR(255), description TEXT, \`order\` INT DEFAULT 0, isActive TINYINT(1) DEFAULT 1)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS pricing (id BIGINT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(255), description TEXT, steelPerLF DECIMAL(15,6), shopMHPerLF DECIMAL(15,6), fieldMHPerLF DECIMAL(15,6), company VARCHAR(255), uploadedBy BIGINT, sourceFile VARCHAR(255), lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP, isActive TINYINT(1) DEFAULT 1)`);

        console.log('Seeding default values...');
        await connection.query("INSERT IGNORE INTO system_config VALUES ('material_markup', 0.11), ('tax_rate', 0.06)");
        await connection.query("INSERT IGNORE INTO categories (name) VALUES ('RAIL'), ('PLATFORM'), ('STRINGER'), ('STAIR')");

        console.log('✅ COMPLETE RESET SUCCESSFUL.');
        await connection.end();

    } catch (err) {
        console.error('❌ Reset Failed:', err.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

initializeDatabase();
