
require('dotenv').config();
const db = require('./src/config/mssql');
const bcrypt = require('bcryptjs');

const resetPasswords = async () => {
    const users = [
        { email: 'admin@caldim.com', role: 'admin' },
        { email: 'estimator@caldim.com', role: 'estimator' }
    ];
    
    try {
        const password = '12345678';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        console.log('--- RESETTING PASSWORDS ---');
        for (const user of users) {
            console.log(`Processing: ${user.email}`);
            
            // First check if user exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [user.email.toLowerCase()]);
            
            if (existing.length > 0) {
                console.log(`   User exists (ID: ${existing[0].id}). Updating password and role...`);
                await db.query(
                    'UPDATE users SET [password] = ?, [role] = ?, isPaid = 1, isVerified = 1 WHERE email = ?',
                    [hashedPassword, user.role, user.email.toLowerCase()]
                );
                console.log('   ✅ Password reset successful.');
            } else {
                console.log('   ❌ User NOT found. Creating new user...');
                const trialEnd = new Date();
                trialEnd.setFullYear(trialEnd.getFullYear() + 1); // 1 year trial
                
                await db.query(
                    'INSERT INTO users (email, [password], [role], [plan], isPaid, isVerified, trialStart, trialEnd, company) VALUES (?, ?, ?, ?, ?, ?, GETDATE(), ?, ?)',
                    [user.email.toLowerCase(), hashedPassword, user.role, 'professional', 1, 1, trialEnd, 'CalDim']
                );
                console.log('   ✅ User created successfully.');
            }
            console.log('--------------------------');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error resetting passwords:', error);
        process.exit(1);
    }
};

resetPasswords();
