require('dotenv').config();
const db = require('../src/config/mssql');

async function checkLicense() {
  try {
    const email = 'admin@caldim.com';
    console.log(`Checking license for: ${email}`);
    
    const [userRows] = await db.query('SELECT id, email, role, admin_owner_id FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      console.log('User not found.');
      return; 
    }
    const user = userRows[0];
    console.log('User found:', user);

    const [licenseRows] = await db.query('SELECT * FROM licenses WHERE admin_user_id = ?', [user.id]);
    if (licenseRows.length === 0) {
      console.log('No license found for this user ID.');
      
      // Check if there's a license for this email but not yet linked to ID
      const [inviteRows] = await db.query('SELECT * FROM licenses WHERE invite_email = ?', [email]);
      if (inviteRows.length > 0) {
        console.log('Found license invite for this email:', inviteRows[0]);
      } else {
        console.log('No license invite found for this email either.');
      }
    } else {
      console.log('License found:', licenseRows[0]);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkLicense();
