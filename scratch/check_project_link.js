
const db = require('../server/src/config/mssql');

async function checkProject(id) {
    try {
        const [rows] = await db.query('SELECT id, projectName, customer_name, customer_id FROM projects WHERE id = ?', [id]);
        console.log('Project Data:', JSON.stringify(rows[0], null, 2));
        
        if (rows[0] && rows[0].customer_id) {
            const [cust] = await db.query('SELECT * FROM customers WHERE id = ?', [rows[0].customer_id]);
            console.log('Linked Customer Data:', JSON.stringify(cust[0], null, 2));
        } else {
            console.log('No customer_id linked to this project.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

// Check for latest project if no ID provided
async function checkLatest() {
     try {
        const [rows] = await db.query('SELECT TOP 1 id, projectName, customer_name, customer_id FROM projects ORDER BY updatedAt DESC');
        if (rows[0]) {
            console.log('Latest Updated Project:', rows[0].id, rows[0].projectName);
            await checkProject(rows[0].id);
        } else {
            console.log('No projects found');
            process.exit();
        }
    } catch (err) {
        console.error('Error:', err);
        process.exit();
    }
}

checkLatest();
