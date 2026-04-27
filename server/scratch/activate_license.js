
require('dotenv').config();
const db = require('../src/config/mssql');
const crypto = require('crypto');

async function activateLicense() {
  try {
    const adminUserId = 5;
    const superadminId = 15;
    const licenseKey = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    console.log(`Creating license for admin user ID ${adminUserId}...`);
    
    await db.query(`
      INSERT INTO licenses (
        license_key, admin_user_id, license_type, max_estimators, 
        valid_from, valid_until, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, GETDATE())
    `, [
      licenseKey,
      adminUserId,
      'standard',
      10,
      validFrom.toISOString().split('T')[0],
      validUntil.toISOString().split('T')[0],
      superadminId
    ]);

    console.log('✅ License created successfully!');
    console.log(`License Key: ${licenseKey}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

activateLicense();
