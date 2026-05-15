require('dotenv').config();
const { poolPromise } = require('./src/config/mssql');

async function fix() {
    try {
        const pool = await poolPromise;
        const r = pool.request();
        console.log('🔧 Fixing users table constraints on VPS...');

        // List of columns that need DEFAULT 0 and NOT NULL
        const columns = [
            'otp_attempts',
            'otp_resend_count',
            'failed_attempts',
            'is_locked',
            'mfa_enabled',
            'isPaid'
        ];

        for (const col of columns) {
            console.log(`🛠️ Checking ${col}...`);
            await r.query(`
                IF NOT EXISTS (
                    SELECT 1 FROM sys.default_constraints 
                    WHERE parent_object_id = OBJECT_ID('users') 
                    AND col_name(parent_object_id, parent_column_id) = '${col}'
                )
                BEGIN
                    UPDATE users SET ${col} = 0 WHERE ${col} IS NULL;
                    ALTER TABLE users ADD CONSTRAINT DF_users_${col} DEFAULT 0 FOR ${col};
                    PRINT '✅ Added DEFAULT 0 to ${col}';
                END
                
                -- Ensure NOT NULL
                ALTER TABLE users ALTER COLUMN ${col} INT NOT NULL;
                PRINT '✅ Ensured ${col} is NOT NULL';
            `);
        }

        // Special case for BIT columns (is_locked, mfa_enabled, isPaid might be BIT)
        await r.query(`
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_locked' AND DATA_TYPE = 'bit')
            ALTER TABLE users ALTER COLUMN is_locked BIT NOT NULL;
            
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'mfa_enabled' AND DATA_TYPE = 'bit')
            ALTER TABLE users ALTER COLUMN mfa_enabled BIT NOT NULL;
            
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'isPaid' AND DATA_TYPE = 'bit')
            ALTER TABLE users ALTER COLUMN isPaid BIT NOT NULL;
        `);

        console.log('🚀 VPS database fix completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fix Error:', err.message);
        process.exit(1);
    }
}

fix();
