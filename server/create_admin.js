
require('dotenv').config();
const db = require('./src/config/mssql');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    const email = 'vigneshgovardhan5163@gmail.com';
    const password = '12345678';
    const company = 'Admin Corp';
    const role = 'admin';

    try {
        console.log(`Checking if user ${email} exists...`);
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        
        if (existing.length > 0) {
            console.log('User already exists. Updating to admin...');
            const hashedPassword = await bcrypt.hash(password, 12);
            await db.query(
                'UPDATE users SET [password] = ?, [role] = ?, isPaid = 1, [plan] = ? WHERE id = ?',
                [hashedPassword, role, 'admin', existing[0].id]
            );
            console.log('User updated successfully.');
        } else {
            console.log('Creating new admin user...');
            const hashedPassword = await bcrypt.hash(password, 12);
            const trialStart = new Date();
            const trialEnd = new Date();
            trialEnd.setFullYear(trialEnd.getFullYear() + 10); // Long trial for admin

            await db.query(
                'INSERT INTO users (email, [password], company, phone, [role], [plan], isPaid, trialStart, trialEnd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [email.toLowerCase(), hashedPassword, company, '0000000000', role, 'admin', 1, trialStart, trialEnd]
            );
            console.log('Admin user created successfully.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
