const mssql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: { 
        encrypt: true, 
        trustServerCertificate: true
    },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};

async function verifySchema() {
    try {
        const pool = await mssql.connect(config);
        console.log(`Connected to database: ${config.database} on ${config.server}\n`);

        const result = await pool.request().query(`
            SELECT 
                t.name AS table_name,
                c.name AS column_name,
                type_name(c.user_type_id) AS data_type,
                c.max_length,
                c.precision,
                c.scale,
                c.is_nullable,
                c.is_identity
            FROM sys.tables t
            INNER JOIN sys.columns c ON t.object_id = c.object_id
            WHERE t.is_ms_shipped = 0 AND t.name != 'sysdiagrams'
            ORDER BY t.name, c.column_id;
        `);

        const schema = {};
        for (const row of result.recordset) {
            if (!schema[row.table_name]) {
                schema[row.table_name] = [];
            }
            let typeStr = row.data_type.toUpperCase();
            if (['VARCHAR', 'NVARCHAR', 'VARBINARY', 'CHAR'].includes(typeStr)) {
                typeStr += `(${row.max_length === -1 ? 'MAX' : row.max_length})`;
            } else if (['DECIMAL', 'NUMERIC'].includes(typeStr)) {
                typeStr += `(${row.precision},${row.scale})`;
            }
            schema[row.table_name].push({
                column: row.column_name,
                type: typeStr,
                nullable: row.is_nullable ? 'YES' : 'NO',
                identity: row.is_identity ? 'YES' : 'NO'
            });
        }

        // Print tables and their columns
        console.log('==================================================');
        console.log('DATABASE SCHEMA SUMMARY');
        console.log('==================================================');
        
        for (const [table, columns] of Object.entries(schema)) {
            console.log(`\nTable: ${table} (${columns.length} columns)`);
            console.log('-'.repeat(table.length + 20));
            // Print columns in a nice text format
            columns.forEach(col => {
                console.log(`  * ${col.column.padEnd(25)} | ${col.type.padEnd(15)} | Nullable: ${col.nullable.padEnd(3)} | Identity: ${col.identity}`);
            });
        }
        console.log('\n==================================================');

        await pool.close();
    } catch (err) {
        console.error('❌ Failed to verify database schema:', err.message);
    } finally {
        process.exit(0);
    }
}

verifySchema();
