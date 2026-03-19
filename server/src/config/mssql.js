const sql = require('mssql');

const config = {
    user: (process.env.MSSQL_USER || 'sa').trim(),
    password: (process.env.MSSQL_PASSWORD || '').trim(),
    server: (process.env.MSSQL_SERVER || 'localhost').trim(),
    database: (process.env.MSSQL_DATABASE || 'MISC_DB').trim(),
    port: parseInt(process.env.MSSQL_PORT) || 1433,
    options: {
        encrypt: true, // For Azure
        trustServerCertificate: (process.env.MSSQL_TRUST_SERVER_CERTIFICATE || 'true').trim() === 'true', // For Localhost
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to MSSQL -', config.database);
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
  sql,
  poolPromise,
  query: async (text, params = []) => {
    const pool = await poolPromise;
    const request = pool.request();
    
    let sqlText = text;
    if (params && params.length > 0) {
      params.forEach((val, i) => {
        const paramName = `p${i}`;
        request.input(paramName, val);
        sqlText = sqlText.replace('?', `@${paramName}`);
      });
    }
    
    const result = await request.query(sqlText);
    
    // Return format [rows, result] to mimic mysql2's [rows, fields]
    return [result.recordset, result];
  }
};
