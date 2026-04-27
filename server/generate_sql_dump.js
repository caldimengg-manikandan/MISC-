const mssql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { 
        encrypt: true, 
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function generateFullSyncSQL() {
    try {
        const pool = await mssql.connect(config);
        console.log('Connected to Local DB. Generating Full Schema + Data dump...');

        const tableQuery = await pool.request().query(`
            SELECT name, object_id FROM sys.tables 
            WHERE is_ms_shipped = 0 AND name != 'sysdiagrams'
        `);
        const tables = tableQuery.recordset;

        let sqlDump = "/**************************************************\n";
        sqlDump += " * MISC FULL DATABASE SYNC (SCHEMA + DATA)\n";
        sqlDump += " * Generated at: " + new Date().toLocaleString() + "\n";
        sqlDump += " **************************************************/\n\n";

        sqlDump += "EXEC sp_MSforeachtable \"ALTER TABLE ? NOCHECK CONSTRAINT ALL\";\n\n";

        for (const tableObj of tables) {
            const table = tableObj.name;
            const objId = tableObj.object_id;
            console.log(`Processing ${table}...`);

            // 1. Generate Drop and Create Table
            sqlDump += `-- [${table}] Structure\n`;
            sqlDump += `IF OBJECT_ID('[${table}]', 'U') IS NOT NULL DROP TABLE [${table}];\n`;
            sqlDump += `CREATE TABLE [${table}] (\n`;

            const colQuery = await pool.request().query(`
                SELECT 
                    c.name, 
                    type_name(user_type_id) as type,
                    max_length, precision, scale, is_nullable, is_identity
                FROM sys.columns c 
                WHERE object_id = ${objId}
                ORDER BY column_id
            `);

            const colDefs = colQuery.recordset.map(c => {
                let def = `  [${c.name}] ${c.type.toUpperCase()}`;
                if (['VARCHAR', 'NVARCHAR', 'VARBINARY', 'CHAR'].includes(c.type.toUpperCase())) {
                    def += `(${c.max_length === -1 ? 'MAX' : c.max_length})`;
                } else if (['DECIMAL', 'NUMERIC'].includes(c.type.toUpperCase())) {
                    def += `(${c.precision},${c.scale})`;
                }
                if (c.is_identity) def += " IDENTITY(1,1)";
                def += c.is_nullable ? " NULL" : " NOT NULL";
                return def;
            });
            sqlDump += colDefs.join(",\n") + "\n);\n";

            // 2. Export Data
            const dataResult = await pool.request().query(`SELECT * FROM [${table}]`);
            const rows = dataResult.recordset;
            sqlDump += `-- [${table}] Data (${rows.length} rows)\n`;

            if (rows.length > 0) {
                if (colQuery.recordset.some(c => c.is_identity)) {
                    sqlDump += `SET IDENTITY_INSERT [${table}] ON;\n`;
                }

                const columns = Object.keys(rows[0]);
                const colList = columns.map(c => `[${c}]`).join(", ");

                for (const row of rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return "NULL";
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        if (Buffer.isBuffer(val)) return `0x${val.toString('hex')}`;
                        return val;
                    }).join(", ");
                    sqlDump += `INSERT INTO [${table}] (${colList}) VALUES (${values});\n`;
                }

                if (colQuery.recordset.some(c => c.is_identity)) {
                    sqlDump += `SET IDENTITY_INSERT [${table}] OFF;\n`;
                }
            }
            sqlDump += "GO\n\n";
        }

        sqlDump += "EXEC sp_MSforeachtable \"ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL\";\n";

        fs.writeFileSync('vps_migration.sql', sqlDump);
        console.log('\n🌟 SUCCESS: Full Sync SQL generated!');
        await pool.close();
    } catch (err) {
        console.error('❌ SYNC GENERATION FAILED:', err.message);
    } finally {
        process.exit(0);
    }
}

generateFullSyncSQL();
