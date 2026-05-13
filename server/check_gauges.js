require('dotenv').config();
const db = require('./src/config/mssql');

(async () => {
  const [rows] = await db.query(
    "SELECT id, label, value, steelLbsLf FROM dictionary WHERE category = 'gauge_plate_spec' ORDER BY label"
  );
  console.log(`Found ${rows.length} gauges:`);
  rows.forEach(r => console.log(JSON.stringify(r)));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
