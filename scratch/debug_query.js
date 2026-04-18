require('dotenv').config({ path: './server/.env' });
const db = require('../server/src/config/mssql');

async function testQuery() {
    try {
        const [rows] = await db.query(`
            SELECT id, projectNumber, projectName, customer_name as customerName, customer_id as customerId, 
                   project_location as projectLocation, architect, eor, gc_name as gcName, 
                   detailer, vendor_name as vendorName, aisc_certified as aiscCertified, 
                   units, status, updatedAt, createdAt
            FROM projects 
            WHERE company_id = ? 
            AND (projectName = ? OR projectNumber = ?)
        `, [1, 'misc', '#12']);
        console.log('Query success:', rows);
    } catch (err) {
        console.error('Query failed:', err.message);
        if (err.precedingErrors) console.error('Preceding errors:', err.precedingErrors);
    }
}

testQuery();
