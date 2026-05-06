require('dotenv').config();
const db = require('../src/config/mssql');

async function run() {
  try {
    await db.query('UPDATE dictionary SET steelLbsLf = 20.7 WHERE category = ? AND label LIKE ?', ['stringer_size', '%C12 X 20.7%']);
    console.log('Fixed C12 X 20.7');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
