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
            
            // 1. Drop existing default constraint if it exists (so we can ALTER COLUMN)
            await r.query(`
                DECLARE @ConstraintName nvarchar(200)
                SELECT @ConstraintName = Name FROM sys.default_constraints
                WHERE parent_object_id = OBJECT_ID('users')
                AND col_name(parent_object_id, parent_column_id) = '${col}'
                
                IF @ConstraintName IS NOT NULL
                EXEC('ALTER TABLE users DROP CONSTRAINT ' + @ConstraintName)
            `);

            // 2. Make sure existing NULLs are 0
            await r.query(`UPDATE users SET ${col} = 0 WHERE ${col} IS NULL`);

            // 3. Re-add the DEFAULT constraint and make NOT NULL
            await r.query(`
                ALTER TABLE users ALTER COLUMN ${col} INT NOT NULL;
                ALTER TABLE users ADD CONSTRAINT DF_users_${col} DEFAULT 0 FOR ${col};
                PRINT '✅ Fixed ${col}';
            `);
        }

        // Special case for BIT columns (re-verify types and ensure NOT NULL)
        const bitCols = ['is_locked', 'mfa_enabled', 'isPaid'];
        for (const col of bitCols) {
             await r.query(`
                IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = '${col}' AND DATA_TYPE = 'bit')
                BEGIN
                    -- Drop constraint to allow change
                    DECLARE @CName nvarchar(200)
                    SELECT @CName = Name FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('users') AND col_name(parent_object_id, parent_column_id) = '${col}'
                    IF @CName IS NOT NULL EXEC('ALTER TABLE users DROP CONSTRAINT ' + @CName)
                    
                    ALTER TABLE users ALTER COLUMN ${col} BIT NOT NULL;
                    ALTER TABLE users ADD CONSTRAINT DF_users_${col}_bit DEFAULT 0 FOR ${col};
                    PRINT '✅ Fixed BIT column ${col}';
                END
             `);
        }

        // 3. Fix licenses table created_at
        console.log('🛠️ Checking licenses table...');
        await r.query(`
            IF NOT EXISTS (
                SELECT 1 FROM sys.default_constraints 
                WHERE parent_object_id = OBJECT_ID('licenses') 
                AND col_name(parent_object_id, parent_column_id) = 'created_at'
            )
            BEGIN
                UPDATE licenses SET created_at = GETDATE() WHERE created_at IS NULL;
                ALTER TABLE licenses ADD CONSTRAINT DF_licenses_created_at DEFAULT GETDATE() FOR created_at;
                PRINT '✅ Added DEFAULT GETDATE() to licenses.created_at';
            END
            
            ALTER TABLE licenses ALTER COLUMN created_at DATETIME NOT NULL;
            PRINT '✅ Ensured licenses.created_at is NOT NULL';
        `);

        console.log('🚀 VPS database fix completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fix Error:', err.message);
        process.exit(1);
    }
}

fix();
