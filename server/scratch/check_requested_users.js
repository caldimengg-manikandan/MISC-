
require('dotenv').config();
const db = require('./src/config/mssql');

const checkUsers = async () => {
    const emails = ['admin@caldim.com', 'estimator@caldim.com'];
    
    try {
        console.log('--- USER ACCOUNT CHECK ---');
        for (const email of emails) {
            console.log(`Checking: ${email}`);
            const [rows] = await db.query('SELECT id, email, role, plan, isPaid, isVerified, trialEnd FROM users WHERE email = ?', [email.toLowerCase()]);
            
            if (rows.length > 0) {
                const user = rows[0];
                console.log('✅ User Found:');
                console.log(`   ID: ${user.id}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Plan: ${user.plan}`);
                console.log(`   IsPaid: ${user.isPaid}`);
                console.log(`   TrialEnd: ${user.trialEnd}`);
                
                const now = new Date();
                const trialEnd = new Date(user.trialEnd);
                if (now > trialEnd && !user.isPaid) {
                  console.log('   ⚠️ WARNING: Trial has expired and isPaid is 0.');
                }
            } else {
                console.log('❌ User NOT found in database.');
            }
            console.log('--------------------------');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
