require('dotenv').config();
const { poolPromise } = require('./src/config/mssql');
const fs = require('fs');
const path = require('path');

async function sync() {
    try {
        const pool = await poolPromise;
        const filePath = path.join(__dirname, 'pan_plate_data.json');
        if (!fs.existsSync(filePath)) {
            console.error('❌ pan_plate_data.json not found!');
            process.exit(1);
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`📊 Found ${data.length} local pan plate entries.`);
        
        for (const entry of data) {
            const r = pool.request();
            // Input all relevant columns for pan_plate_config
            const fields = [
                'category', 'label', 'value', 'description', 'steelLbsLf', 'shopLaborMhLf', 
                'fieldLaborMhLf', 'price', 'sort_order', 'order', 'isActive',
                'shopEfficiency', 'fieldEfficiency', 'widthMin', 'widthMax', 'spanMin', 'spanMax',
                'custom_fields'
            ];
            
            let updateSql = "UPDATE dictionary SET ";
            let insertCols = "INSERT INTO dictionary (";
            let insertVals = "VALUES (";
            
            fields.forEach((f, i) => {
                r.input(f, entry[f] !== undefined ? entry[f] : null);
                updateSql += `[${f}] = @${f}${i < fields.length - 1 ? ',' : ''} `;
                insertCols += `[${f}]${i < fields.length - 1 ? ',' : ''} `;
                insertVals += `@${f}${i < fields.length - 1 ? ',' : ''} `;
            });

            const check = await pool.request()
                .input('c', entry.category)
                .input('l', entry.label)
                .query("SELECT id FROM dictionary WHERE category = @c AND label = @l");
            
            if (check.recordset.length > 0) {
                await r.query(updateSql + " WHERE category = @category AND label = @label");
            } else {
                await r.query(insertCols + ") " + insertVals + ")");
            }
        }
        console.log('✅ Pan Plate Library Synced successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Sync Error:', err.message);
        process.exit(1);
    }
}
sync();
