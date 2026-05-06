/**
 * migrate_dictionary_tenant.js
 * Safely migrates dictionary (dropdown) data from local to VPS without deleting user data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/mssql');
const fs = require('fs');

async function migrate() {
    console.log('🔧 Starting dictionary tenant migration...');
    
    try {
        const filePath = require('path').join(__dirname, '../dictionary_data.json');
        if (!fs.existsSync(filePath)) {
            console.error('❌ Error: dictionary_data.json not found! Export it locally first.');
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`📦 Loaded ${data.length} dictionary entries.`);

        for (const entry of data) {
            // We use category + value + admin_owner_id as the unique key
            // admin_owner_id IS NULL means it's a global default.
            const { category, label, value, description, order: orderVal, isActive, admin_owner_id, 
                    steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMax, spanMin, spanMax, price } = entry;

            const [existing] = await db.query(
                `SELECT id FROM dictionary 
                 WHERE category = ? AND value = ? AND (admin_owner_id = ? OR (admin_owner_id IS NULL AND ? IS NULL))`,
                [category, value, admin_owner_id, admin_owner_id]
            );

            if (existing.length > 0) {
                // Update existing
                await db.query(
                    `UPDATE dictionary 
                     SET label = ?, description = ?, [order] = ?, isActive = ?, 
                         steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?, 
                         widthMax = ?, spanMin = ?, spanMax = ?, price = ?
                     WHERE id = ?`,
                    [label, description, orderVal || 0, isActive === false ? 0 : 1, 
                     steelLbsLf, shopLaborMhLf, fieldLaborMhLf, 
                     widthMax, spanMin, spanMax, price, existing[0].id]
                );
            } else {
                // Insert new
                await db.query(
                    `INSERT INTO dictionary 
                     (category, label, value, description, [order], isActive, admin_owner_id,
                      steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMax, spanMin, spanMax, price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [category, label, value, description, orderVal || 0, isActive === false ? 0 : 1, admin_owner_id,
                     steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMax, spanMin, spanMax, price]
                );
            }
        }

        console.log('✨ SUCCESS: Dictionary synchronized safely.');
    } catch (err) {
        console.error('❌ Migration Error:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
