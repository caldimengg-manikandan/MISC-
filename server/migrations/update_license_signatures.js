require('dotenv').config({ path: '../.env' });
const db = require('../src/config/mssql');
const { generateLicenseSignature } = require('../src/utils/cryptoUtils');

async function run() {
  try {
    console.log('Signing existing licenses...');
    const [licenses] = await db.query('SELECT * FROM licenses');
    
    for (const license of licenses) {
      const signature = generateLicenseSignature({
        license_key: license.license_key,
        admin_user_id: license.admin_user_id,
        license_type: license.license_type,
        max_estimators: license.max_estimators,
        valid_until: license.valid_until,
        is_active: license.is_active
      });
      
      await db.query('UPDATE licenses SET signature = ? WHERE id = ?', [signature, license.id]);
      console.log(`Signed license ID: ${license.id}`);
    }
    
    console.log('✅ All licenses signed successfully.');
  } catch (error) {
    console.error('Signing failed:', error);
  } finally {
    process.exit(0);
  }
}

run();
