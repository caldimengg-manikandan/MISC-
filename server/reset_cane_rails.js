require('dotenv').config();
const { query } = require('./src/config/mssql.js');

async function resetCaneRails() {
    console.log('--- PERFORMING HARD RESET ON CANE RAIL DICTIONARY ---');
    const rails = [
        ["3-Line Steel Pipe Guardrail 1 1/4\" SCH. 40 Pipe Rails and Posts", 0.0566, 0.750, 0.350],
        ["2-Line Steel Pipe Guardrail 1 1/4\" Sch. 40 Pipe Rails and Post", 0.00435, 0.500, 0.350],
        ["2-Line Steel Pipe Guardrail 1 1/2\" Sch. 40 Pipe Rails and Post", 0.0457, 0.600, 0.375],
        ["3-Line Steel Pipe Guardrail 1 1/2\" SCH. 40 Pipe Rails and Posts", 0.0588, 0.775, 0.375],
        ["3-Line Steel Pipe Guardrail 1 1/2\" SCH. 40 Pipe Rails and SCH. 80 Posts", 0.0637, 0.800, 0.385],
        ["2-Line Steel Pipe Guardrail 1 1/2\" Sch. 40 Pipe Rails and SCH. 80 Post", 0.0506, 0.650, 0.375],
        ["3-Line Steel Pipe Guardrail 1 1/4\" Sch. 40 Pipe Rails and SCH. 80 Post", 0.0538, 0.775, 0.350],
        ["2-Line Steel Pipe Guardrail 1 1/4\" SCH. 40 Pipe Rails and SCH 80 Posts", 0.0428, 0.750, 0.350],
        ["2-Line Steel Pipe Guardrail 1 1/4\" SCH. 40 Pipe Rails and SCH 80 Posts w/1/2 sq pickets", 0.0711, 0.900, 0.400],
        ["2-Line Steel Pipe Guardrail 1 1/2\" Sch. 40 Pipe Rails and SCH. 80 Post w/ 1/2 sq pickets", 0.0764, 0.875, 0.400],
        ["2 line picket 1 1/2 scho w/ 1/2 sq picket", 0.0715, 0, 0],
        ["2 line picket 1 1/4 scho w/ 1/2 sq picket", 0.06714, 0, 0],
        ["2 line 1 1/4 scho w/ 3/4 sq picket", 0.053, 0, 0],
        ["2 line 1 1/2 scho w/ 3/4 sq picket", 0.102, 0, 0],
        ["2 line 1 1/4 scho rail and scho 1 1/4 post w/ 3/4", 0.099, 0, 0],
        ["2 line 1 1/2 scho rail and scho 1 1/2 post w/ 3/4", 0.106, 0, 0]
    ];

    try {
        console.log('Step 1: Clearing existing Cane Rail entries...');
        await query("DELETE FROM dictionary WHERE category = 'caneRail_type'");
        
        console.log('Step 2: Inserting 16 fresh benchmarks...');
        for (const [label, lbs, shop, field] of rails) {
            console.log(`   + Adding: ${label}`);
            await query('INSERT INTO dictionary (label, value, category, steelLbsLf, shopLaborMhLf, fieldLaborMhLf) VALUES (?, ?, ?, ?, ?, ?)', 
                [label, label, 'caneRail_type', lbs, shop, field]);
        }
        
        console.log('--- HARD RESET COMPLETE. SFE PARITY MATCHED ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetCaneRails();
