require('dotenv').config();
const db = require('./src/config/mssql');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
    const email = 'superadmin@miscpro.com';
    const password = 'MISC@SuperAdmin2026!';
    const fullName = 'MISC SuperAdmin';
    const role = 'superadmin';

    try {
        console.log(`🚀 Checking for SuperAdmin: ${email}`);
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setFullYear(trialEnd.getFullYear() + 99); // Lifetime for superadmin

        if (existing.length > 0) {
            console.log('User already exists. Elevating to SuperAdmin role...');
            await db.query(
                'UPDATE users SET [password] = ?, [role] = ?, isPaid = 1, [plan] = ?, company_id = NULL, admin_owner_id = NULL WHERE id = ?',
                [hashedPassword, role, 'lifetime', existing[0].id]
            );
            console.log('✅ User updated to SuperAdmin successfully.');
        } else {
            console.log('Creating brand new SuperAdmin user...');
            await db.query(
                `INSERT INTO users 
                (email, [password], full_name, name, company, [role], [plan], isPaid, isVerified, trialStart, trialEnd, createdAt, company_id, admin_owner_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, GETUTCDATE(), NULL, NULL)`,
                [email.toLowerCase(), hashedPassword, fullName, fullName, 'MISC Global', role, 'lifetime', trialStart, trialEnd]
            );
            console.log('✅ SuperAdmin user created successfully.');
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating SuperAdmin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
