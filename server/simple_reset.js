
require('dotenv').config();
const db = require('./src/config/mssql');
const bcrypt = require('bcryptjs');

const reset = async () => {
    try {
        const password = '12345678';
        const hash = await bcrypt.hash(password, 10);
        console.log('Target Hash:', hash);
        
        const emails = ['admin@caldim.com', 'estimator@caldim.com'];
        for (const email of emails) {
            await db.query('UPDATE users SET [password] = ?, isPaid = 1, isVerified = 1 WHERE email = ?', [hash, email]);
            console.log(`Updated ${email}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
reset();
