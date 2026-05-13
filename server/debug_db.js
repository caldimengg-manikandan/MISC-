require('dotenv').config();
const db = require('./src/config/mssql');
db.query("SELECT label, description, value, custom_fields FROM dictionary WHERE category = 'pan_plate_config'")
  .then(r => {
    console.log(r);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
