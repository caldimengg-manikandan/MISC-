require('dotenv').config();
const db = require('./src/config/mssql');

(async () => {
  const [rows] = await db.query(
    "SELECT id, category, label, value, shopEfficiency, fieldEfficiency, admin_owner_id, isActive FROM dictionary WHERE category IN ('pan_plate_type', 'pan_support_type') ORDER BY category, id"
  );
  console.log(`Total rows found: ${rows.length}`);
  rows.forEach(r => console.log(JSON.stringify(r)));

  // Also check what the API endpoint would return for a sample admin owner
  const [admins] = await db.query("SELECT TOP 1 id FROM users WHERE role IN ('admin', 'owner', 'superadmin')");
  if (admins.length > 0) {
    const adminId = admins[0].id;
    console.log(`\nSample admin ID: ${adminId}`);
    const [filtered] = await db.query(
      "SELECT id, category, label, admin_owner_id FROM dictionary WHERE category IN ('pan_plate_type', 'pan_support_type') AND (admin_owner_id IS NULL OR admin_owner_id = ?)",
      [adminId]
    );
    console.log(`Rows visible to admin ${adminId}: ${filtered.length}`);
    filtered.forEach(r => console.log(JSON.stringify(r)));
  }

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
