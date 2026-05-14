const db = require('../server/src/config/mssql');

(async () => {
  try {
    const [rows] = await db.query(
      "SELECT label, steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary WHERE category = 'stringer_size' ORDER BY label OFFSET 0 ROWS FETCH NEXT 15 ROWS ONLY"
    );
    rows.forEach(r => {
      const lbl = (r.label || '').substring(0, 55).padEnd(55);
      console.log(`${lbl} | lbs: ${r.steelLbsLf} | shop: ${r.shopLaborMhLf} | field: ${r.fieldLaborMhLf}`);
    });
  } catch (e) {
    console.error('DB ERROR:', e.message);
  }
  process.exit(0);
})();
