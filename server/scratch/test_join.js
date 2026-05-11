require('dotenv').config();
const db = require('../src/config/mssql');

async function testJoin() {
    try {
        const query = `
            SELECT TOP 5 p.id, p.createdBy, p.assigned_engineer_id,
                   u_creator.name as CreatorName, u_creator.full_name as CreatorFullName,
                   u_engineer.name as EngineerName, u_engineer.full_name as EngineerFullName
            FROM projects p
            LEFT JOIN users u_creator ON p.createdBy = u_creator.id
            LEFT JOIN users u_engineer ON p.assigned_engineer_id = u_engineer.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(query);
        console.log('Join Results:', JSON.stringify(rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testJoin();
