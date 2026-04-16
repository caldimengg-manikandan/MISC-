const mssql = require('mssql');
require('dotenv').config();
const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE || 'MISC_DB',
    options: { encrypt: true, trustServerCertificate: true },
    port: parseInt(process.env.MSSQL_PORT) || 1433
};
async function run() {
    try {
        const pool = await mssql.connect(config);
        console.log('--- FIXING PROJECT OWNERSHIP ---');
        
        // Find the admin user ID on this VPS
        const userRes = await pool.request()
            .input('email', 'admin@caldim.com')
            .query("SELECT id FROM users WHERE email = @email");
        
        if (userRes.recordset.length === 0) {
            console.log('❌ Could not find user admin@caldim.com');
            return;
        }
        
        const adminId = userRes.recordset[0].id;
        console.log('Admin ID on this VPS is:', adminId);
        
        // Link all projects to this admin ID
        const linkRes = await pool.request()
            .query(`UPDATE projects SET userId = ${adminId}`);
            
        console.log(`✅ Successfully linked ${linkRes.rowsAffected[0]} projects to admin.`);
        
        await pool.close();
    } catch (err) { console.error('❌ Error:', err.message); }
}
run();
