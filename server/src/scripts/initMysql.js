const mysql = require('mysql2');
require('dotenv').config();

const initDb = async () => {
  try {
    console.log('Starting MySQL initialization for Steel Estimation System...');

    // Standard connection to MySQL (without DB selected)
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    }).promise();

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'steel_estimation'}`);
    await connection.end();
    console.log('Database checked/created');

    // Connection with DB selected
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'steel_estimation'
    }).promise();

    // 1. Projects
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_number VARCHAR(100) UNIQUE,
        name VARCHAR(255),
        customer_name VARCHAR(255),
        location VARCHAR(255),
        units ENUM('imperial', 'metric') DEFAULT 'imperial',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Rail Types
    await db.query(`
      CREATE TABLE IF NOT EXISTS rail_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255),
        category VARCHAR(50),
        steel_lbs_per_lf DECIMAL(15,6),
        shop_labor_rate DECIMAL(15,6),
        field_labor_rate DECIMAL(15,6)
      )
    `);

    // 3. Platform Types
    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255),
        steel_lbs_per_sqft DECIMAL(15,6),
        shop_labor_rate DECIMAL(15,6),
        field_labor_rate DECIMAL(15,6)
      )
    `);

    // 4. Stringers
    await db.query(`
      CREATE TABLE IF NOT EXISTS stringer_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255),
        steel_lbs_per_ft DECIMAL(15,6)
      )
    `);

    // 5. Pricing
    await db.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_key VARCHAR(50) UNIQUE,
        description VARCHAR(255),
        rate DECIMAL(15,6),
        unit VARCHAR(20)
      )
    `);

    // 6. Labor Rates
    await db.query(`
      CREATE TABLE IF NOT EXISTS labor_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        labor_key VARCHAR(50) UNIQUE,
        description VARCHAR(255),
        rate DECIMAL(10,2)
      )
    `);

    // 7. Estimates (Header)
    await db.query(`
      CREATE TABLE IF NOT EXISTS estimates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        total_steel_weight DECIMAL(15,2),
        total_shop_labor_hours DECIMAL(15,2),
        total_field_labor_hours DECIMAL(15,2),
        total_material_cost DECIMAL(15,2),
        total_labor_cost DECIMAL(15,2),
        total_estimated_cost DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // 8. Takeoff Data (Storage for user inputs)
    await db.query(`
      CREATE TABLE IF NOT EXISTS takeoff_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        estimate_id INT,
        category VARCHAR(50), -- Stair, Rail, Platform
        item_id INT, -- Ref to specific type table if applicable
        raw_input JSON, -- Storing original form state for persistence
        FOREIGN KEY (estimate_id) REFERENCES estimates(id)
      )
    `);

    console.log('MySQL schema initialized successfully');
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    process.exit(1);
  }
};

initDb();
