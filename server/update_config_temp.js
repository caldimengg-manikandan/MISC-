const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_PORT),
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

async function updateSystemConfig() {
  try {
    let pool = await sql.connect(config);
    console.log('Connected to MSSQL database.');

    const settings = [
      { key: 'shop_hourly_rate',  value: '90'   },   // Was 70 — synced to match client-side expectations
      { key: 'field_hourly_rate', value: '125'  },   // Was 70 — synced to match client-side expectations
      { key: 'steel_price_per_lb', value: '0.75' },
      { key: 'scrap_factor_pct',  value: '11'   },   // Was 10 — aligned with engineering formula (11%)
    ];

    for (const s of settings) {
      await pool.request()
        .input('key', sql.NVarChar, s.key)
        .input('value', sql.NVarChar, s.value)
        .query(`
          IF EXISTS (SELECT 1 FROM system_config WHERE config_key = @key)
          BEGIN
            UPDATE system_config SET config_value = @value, last_updated = GETDATE() WHERE config_key = @key
          END
          ELSE
          BEGIN
            INSERT INTO system_config (config_key, config_value, last_updated) VALUES (@key, @value, GETDATE())
          END
        `);
      console.log(`Updated system_config: ${s.key} = ${s.value}`);
    }

    await sql.close();
    console.log('System configuration update completed.');
  } catch (err) {
    console.error('Error updating system config:', err);
    process.exit(1);
  }
}

updateSystemConfig();
