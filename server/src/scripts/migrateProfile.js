const mssql = require('mssql');
require('dotenv').config({ path: './server/.env' });

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function migrate() {
    let pool;
    try {
        pool = await mssql.connect(config);
        console.log('Connected to MSSQL to extend users table...');

        const checkColumn = async (col) => {
            const res = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = '${col}'`);
            return res.recordset.length > 0;
        };

        const addCol = async (col, type) => {
            if (!(await checkColumn(col))) {
                console.log(`Adding column ${col}...`);
                await pool.request().query(`ALTER TABLE users ADD ${col} ${type}`);
            } else {
                console.log(`Column ${col} already exists.`);
            }
        };

        await addCol('name', 'NVARCHAR(255)');
        await addCol('bio', 'NVARCHAR(MAX)');
        await addCol('region', 'NVARCHAR(100)');
        await addCol('avatar', 'NVARCHAR(MAX)'); // Base64 or URL

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (pool) pool.close();
    }
}

migrate();
