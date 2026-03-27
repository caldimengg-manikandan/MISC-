
require('dotenv').config();
const db = require('./src/config/mssql');

const verifyUser = async () => {
    const email = 'vigneshgovardhan5163@gmail.com';
    try {
        const [rows] = await db.query('SELECT email, [role], [plan], isPaid FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length > 0) {
            console.log('User found:', JSON.stringify(rows[0], null, 2));
        } else {
            console.log('User NOT found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

verifyUser();
