require('dotenv').config();
const { poolPromise } = require('./src/config/mssql');
const fs = require('fs');
const path = require('path');

async function syncFile(pool, filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`ℹ️ Skipping ${filename} (not found)`);
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📊 Syncing ${data.length} entries from ${filename}...`);
    
    for (const entry of data) {
        const r = pool.request();
        const fields = Object.keys(entry).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
        
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
    console.log(`✅ Finished ${filename}`);
}

async function run() {
    try {
        const pool = await poolPromise;
        await syncFile(pool, 'pan_plate_data.json');
        await syncFile(pool, 'material_type_data.json');
        await syncFile(pool, 'steel_grade_data.json');
        console.log('🚀 All library data synced successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Sync Error:', err.message);
        process.exit(1);
    }
}
run();
