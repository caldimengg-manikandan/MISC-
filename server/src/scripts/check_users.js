require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/mssql');

async function check() {
  // Check what company the recent signup user got
  const [rows] = await db.query(
    "SELECT id, email, role, company_id, company_id FROM users ORDER BY id DESC"
  );
  console.log('\nUsers:');
  rows.forEach(u => console.log(` id=${u.id}  email=${u.email}  role=${u.role}  company_id=${u.company_id}`));
  process.exit(0);
}

check().catch(e => { console.error(e.message); process.exit(1); });
