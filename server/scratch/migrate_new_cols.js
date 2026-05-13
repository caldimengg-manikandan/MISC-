require('dotenv').config({ path: 'server/.env' });
const db = require('../src/config/mssql');

async function migrate() {
    try {
        console.log('Adding columns to dictionary table...');
        
        // Add widthMin
        try {
            await db.query("ALTER TABLE dictionary ADD widthMin FLOAT NULL");
            console.log('✅ Added widthMin');
        } catch (e) {
            console.log('⚠️ widthMin might already exist or error:', e.message);
        }

        // Add shopEfficiency
        try {
            await db.query("ALTER TABLE dictionary ADD shopEfficiency FLOAT NULL");
            console.log('✅ Added shopEfficiency');
        } catch (e) {
            console.log('⚠️ shopEfficiency might already exist or error:', e.message);
        }

        // Add fieldEfficiency
        try {
            await db.query("ALTER TABLE dictionary ADD fieldEfficiency FLOAT NULL");
            console.log('✅ Added fieldEfficiency');
        } catch (e) {
            console.log('⚠️ fieldEfficiency might already exist or error:', e.message);
        }

        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
    process.exit();
}

migrate();
