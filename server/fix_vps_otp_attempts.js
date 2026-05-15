require('dotenv').config();
const { poolPromise } = require('./src/config/mssql');

async function fix() {
    try {
        const pool = await poolPromise;
        const r = pool.request();
        console.log('🔧 Fixing users table constraints on VPS...');

        // 1. Ensure otp_attempts has a DEFAULT 0 and is NOT NULL
        await r.query(`
            IF NOT EXISTS (
                SELECT 1 FROM sys.default_constraints 
                WHERE parent_object_id = OBJECT_ID('users') 
                AND col_name(parent_object_id, parent_column_id) = 'otp_attempts'
            )
            BEGIN
                -- First make sure existing NULLs are 0 (if any, though column is NOT NULL)
                UPDATE users SET otp_attempts = 0 WHERE otp_attempts IS NULL;
                
                -- Add the default constraint
                ALTER TABLE users ADD CONSTRAINT DF_users_otp_attempts DEFAULT 0 FOR otp_attempts;
                PRINT '✅ Added DEFAULT 0 to otp_attempts';
            END
            ELSE
            BEGIN
                PRINT 'ℹ️ DEFAULT constraint already exists for otp_attempts';
            END
        `);

        // 2. Double check if it needs to be made NOT NULL (just in case it was created as NULLable)
        await r.query(`
            ALTER TABLE users ALTER COLUMN otp_attempts INT NOT NULL;
            PRINT '✅ Ensured otp_attempts is NOT NULL';
        `);

        console.log('🚀 VPS database fix completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fix Error:', err.message);
        process.exit(1);
    }
}

fix();
