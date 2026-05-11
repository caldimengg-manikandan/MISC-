require('dotenv').config();
const db = require('../src/config/mssql');

async function checkUser() {
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE id = 5");
        console.log('User 5:', JSON.stringify(rows[0], null, 2));

        const [allUsers] = await db.query("SELECT id, name, full_name, email FROM users");
        console.log('All Users:', JSON.stringify(allUsers, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
