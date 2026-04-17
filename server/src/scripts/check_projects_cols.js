require('dotenv').config();
const db = require('../config/mssql');
db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'projects'").then(([r]) => {
  console.log(r.map(c => c.COLUMN_NAME).join(', '));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
