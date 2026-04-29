require('dotenv').config();
process.env.MSSQL_TRUST_SERVER_CERTIFICATE = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = require('../src/config/mssql');
const { generateLicenseSignature } = require('../src/utils/cryptoUtils');

async function fix() {
    try {
        console.log("Checking admin@caldim.com license...");
        const [users] = await db.query("SELECT * FROM users WHERE email = 'admin@caldim.com'");
        if (!users.length) {
            console.log("admin@caldim.com not found!");
        } else {
            const user = users[0];
            const [licenses] = await db.query('SELECT * FROM licenses WHERE admin_user_id = ?', [user.id]);
            
            if (!licenses.length) {
                console.log("No license found for admin@caldim.com. Creating one...");
                const licenseKey = 'ADMIN-FIX-' + Date.now();
                const validUntil = new Date();
                validUntil.setFullYear(validUntil.getFullYear() + 10);
                
                const signature = generateLicenseSignature({
                    license_key: licenseKey,
                    admin_user_id: user.id,
                    license_type: 'premium',
                    max_estimators: 100,
                    valid_until: validUntil,
                    is_active: 1
                });
                
                await db.query(`
                    INSERT INTO licenses (
                        license_key, admin_user_id, license_type, max_estimators, 
                        valid_until, is_active, signature, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, 1, ?, GETDATE(), GETDATE())
                `, [licenseKey, user.id, 'premium', 100, validUntil, signature]);
                
                console.log("License created successfully for admin@caldim.com!");
            } else {
                console.log("License found for admin@caldim.com.");
            }
        }
        
        console.log("\nRe-calculating signatures for ALL licenses to fix any Tamper Detection issues...");
        const [allLicenses] = await db.query('SELECT * FROM licenses');
        let fixedCount = 0;
        
        for (let l of allLicenses) {
            const correctSignature = generateLicenseSignature({
                license_key: l.license_key,
                admin_user_id: l.admin_user_id,
                license_type: l.license_type,
                max_estimators: l.max_estimators,
                valid_until: l.valid_until,
                is_active: l.is_active
            });
            
            if (correctSignature !== l.signature) {
                await db.query('UPDATE licenses SET signature = ? WHERE id = ?', [correctSignature, l.id]);
                fixedCount++;
                console.log(`Updated signature for license ID: ${l.id} (Key: ${l.license_key})`);
            }
        }
        
        console.log(`\nDone! Fixed ${fixedCount} invalid signatures.`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

fix();
