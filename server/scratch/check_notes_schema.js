const db = require('../src/config/mssql');

async function checkSchema() {
  try {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'project_notes'
    `);
    console.log('Columns in project_notes:');
    columns.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    process.exit();
  }
}

checkSchema();
