require('dotenv').config();
const { query } = require('./src/config/mssql.js');

async function checkRails() {
    try {
        const [caneRows] = await query("SELECT label, steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary WHERE category = 'caneRail_type'");
        console.log('--- Cane Rails in DB ---');
        caneRows.forEach(r => console.log(`${r.label}: ${r.steelLbsLf} | ${r.shopLaborMhLf} | ${r.fieldLaborMhLf}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRails();
