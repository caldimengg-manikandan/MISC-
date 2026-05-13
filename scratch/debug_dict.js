
require('dotenv').config({ path: 'd:/Claude Cowork/MISC--main/MISC--main/MISC--main/MISC--main/MISC--main/server/.env' });
const db = require('d:/Claude Cowork/MISC--main/MISC--main/MISC--main/MISC--main/MISC--main/server/src/config/mssql');

async function dumpDictionary() {
  try {
    const pool = await db.poolPromise;
    const result = await pool.request().query("SELECT id, description, price, category FROM dictionary WHERE category IN ('stringer_size', 'pan_plate_config')");
    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpDictionary();
