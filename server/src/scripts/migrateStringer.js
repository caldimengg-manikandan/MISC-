const mssql = require('mssql');
require('dotenv').config();

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

async function runMigration() {
    let pool;
    try {
        console.log('Connecting to MSSQL...');
        pool = await mssql.connect(config);

        console.log('Altering dictionary table...');
        // 1. ALTER TABLE
        await pool.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns 
                          WHERE Name = N'widthMax' AND Object_ID = Object_ID(N'dictionary'))
            BEGIN
                ALTER TABLE dictionary
                  ADD widthMax DECIMAL(5,2) DEFAULT NULL,
                      spanMin DECIMAL(5,2) DEFAULT NULL,
                      spanMax DECIMAL(5,2) DEFAULT NULL;
            END
        `);

        console.log('Updating built-in rows stringer sizes...');
        const updates = [
            // widthMax=4, spanMin=0, spanMax=14 -> "Std.3'-8" to 4'-0" wide < 14'-0" Stingers/MC 12 X 10.6"
            { wm: 4, smin: 0, smax: 14, val: 'std3-8-to-4-0-wide-14-0-stingersmc-12-x-106' },
            // widthMax=4, spanMin=14, spanMax=19 -> "Std. 4'-0" wide 14'-0 - 19'-0" Long Stringer/MC 12 X 14.3"
            { wm: 4, smin: 14, smax: 19, val: 'std-4-0-wide-14-0---19-0-long-stringermc-12-x-143' },
            // widthMax=4, spanMin=19, spanMax=999 -> "Std. 4'-0" wide > 19'-0" Long Stringer/C 12 X 20.7"
            { wm: 4, smin: 19, smax: 999, val: 'std-4-0-wide-19-0-long-stringerc-12-x-207' },
            // widthMax=4, spanMin=14, spanMax=999 -> "Std. 4'-0" wide > 14'-0" Long Stringer/TS 12 X 2 x 3/16"
            { wm: 4, smin: 14, smax: 999, val: 'std-4-0-wide-14-0-long-stringerts-12-x-2-x-316' },
            // widthMax=4, spanMin=14, spanMax=19 -> "Std. 4'-0" wide > 14'-0" to 19'-0" Long Stringer/TS 12 X 2 x 1/4""
            { wm: 4, smin: 14, smax: 19, val: 'std-4-0-wide-14-0-to-19-0-long-stringerts-12-x-2-' },
            
            // widthMax=5, spanMin=0, spanMax=14 -> "Std. 5'-0" wide < 14'-0" Long Stringers /MC 12 X 10.6"
            { wm: 5, smin: 0, smax: 14, val: 'std-5-0-wide-14-0-long-stringers-mc-12-x-106' },
            // widthMax=5, spanMin=14, spanMax=14 -> "Std. 5'-0" wide 14'-0 Long Stringers/TS 12 X 2 X 3/16"
            { wm: 5, smin: 14, smax: 14, val: 'std-5-0-wide-14-0-long-stringersts-12-x-2-x-316' },
            // widthMax=5, spanMin=14, spanMax=19 -> "Std. 5'-0" wide 14'-0 UP TO 19'-0" Long Stringers/TS 12 X 2 X 1/4""
            { wm: 5, smin: 14, smax: 19, val: 'std-5-0-wide-14-0-up-to-19-0-long-stringers-ts-12-' },
            // widthMax=5, spanMin=19, spanMax=999 -> "Std. 5'-0" wide 14'-0 over 19'-0" Long Stringers/C12 X 20.7"
            { wm: 5, smin: 19, smax: 999, val: 'std-5-0-wide-14-0-over-19-0-long-stringers-c12-x-2' },
            
            // widthMax=6, spanMin=0, spanMax=14 -> "Std. 6'-0" wide < 14'-0" span metal pan stairs/MC 12 X 10.6"
            { wm: 6, smin: 0, smax: 14, val: 'std-6-0-wide-14-0-span-metal-pan-stairsmc-12-x-10' },
            // widthMax=6, spanMin=14, spanMax=19 -> "Std. 6'-0" wide 14'-0 - 19'-0" span metal pan stairs/MC 12 X 14.3"
            { wm: 6, smin: 14, smax: 19, val: 'std-6-0-wide-14-0---19-0-span-metal-pan-stairsmc-1' },
            // widthMax=6, spanMin=19, spanMax=999 -> "Std. 6'-0" wide > 19'-0" span metal pan stairs"
            { wm: 6, smin: 19, smax: 999, val: 'std-6-0-wide-19-0-span-metal-pan-stairs' },

            // Grating Tread
            // widthMax=4, spanMin=0, spanMax=14 -> "Std. 4'-0" wide < 14'-0" span grating tread stairs/MC 12 X 10.6"
            { wm: 4, smin: 0, smax: 14, val: 'std-4-0-wide-14-0-span-grating-tread-stairsmc-12-' },
            // widthMax=4, spanMin=14, spanMax=19 -> "Std. 4'-0" wide 14'-0 - 19'-0" span grating tread stairs/MC 12 X 14.3"
            { wm: 4, smin: 14, smax: 19, val: 'std-4-0-wide-14-0---19-0-span-grating-tread-stairs' },
            // widthMax=4, spanMin=19, spanMax=999 -> "Std. 4'-0" wide > 19'-0" span grating tread stairs"
            { wm: 4, smin: 19, smax: 999, val: 'std-4-0-wide-19-0-span-grating-tread-stairs' },
            
            // widthMax=5, spanMin=0, spanMax=14 -> "Std. 5'-0" wide < 14'-0" span grating tread stairs/MC 12 X 10.6"
            { wm: 5, smin: 0, smax: 14, val: 'std-5-0-wide-14-0-span-grating-tread-stairsmc-12-' },
            // widthMax=5, spanMin=14, spanMax=19 -> "Std. 5'-0" wide 14'-0 - 19'-0" span grating tread stairs/MC 12 X 14.3"
            { wm: 5, smin: 14, smax: 19, val: 'std-5-0-wide-14-0---19-0-span-grating-tread-stairs' },
            // widthMax=5, spanMin=19, spanMax=999 -> "Std. 5'-0" wide > 19'-0" span grating tread stairs"
            { wm: 5, smin: 19, smax: 999, val: 'std-5-0-wide-19-0-span-grating-tread-stairs' },
        ];

        for (const u of updates) {
            await pool.request().query(`
                UPDATE dictionary
                SET widthMax=${u.wm}, spanMin=${u.smin}, spanMax=${u.smax}
                WHERE category='stringer_size' AND value = '${u.val}'
            `);
        }

        console.log('✅ Migration COMPLETE');
        await pool.close();
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        if (pool) await pool.close();
        process.exit(1);
    }
}

runMigration();
