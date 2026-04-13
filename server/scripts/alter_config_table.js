const db = require('./src/config/mssql');

async function run() {
  try {
    await db.query("ALTER TABLE system_config ALTER COLUMN config_value NVARCHAR(MAX)");
    console.log("Success");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
