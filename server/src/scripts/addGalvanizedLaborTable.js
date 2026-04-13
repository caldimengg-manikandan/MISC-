require('dotenv').config();
const db = require('../config/mssql');

async function run() {
  try {
    console.log('[migration] Checking galvanized_labor table...');
    
    // 1. CREATE TABLE IF NOT EXISTS
    await db.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'galvanized_labor')
      BEGIN
        CREATE TABLE [dbo].[galvanized_labor](
          [id]              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          [category]        NVARCHAR(50)  NOT NULL,
          [label]           NVARCHAR(255) NOT NULL,
          [shop_mh_per_lf]  DECIMAL(10,4) NULL,
          [field_mh_per_lf] DECIMAL(10,4) NULL
        )
        console.log('[migration] Table galvanized_labor created.');
      END
    `);

    // 2. Only seed if COUNT(*) = 0
    const countResult = await db.query('SELECT COUNT(*) AS cnt FROM galvanized_labor');
    const rowCount = countResult[0]?.cnt || 0;

    if (rowCount > 0) {
      console.log(`[migration] galvanized_labor already seeded with ${rowCount} rows, skipping.`);
      return;
    }

    console.log('[migration] Seeding galvanized_labor table...');
    
    // Initial benchmark data (extracted from StairCalculationService.js)
    const seedData = [
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', 0.035, 0.05],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', 0.035, 0.05],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', 0.035, 0.05],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', 0.035, 0.05],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', 0.04, 0.065],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', 0.04, 0.065],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', 0.04, 0.065],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', 0.04, 0.065],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 0.045, 0.07],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 0.045, 0.07],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH 80 Posts', 0.045, 0.07],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', 0.045, 0.07],
      ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 0.15, 0.25],
      ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 0.15, 0.25],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 0.050, 0.075],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 0.050, 0.075],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH. 80 Post', 0.060, 0.085],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH. 80 Post', 0.060, 0.085],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST', 0.045, 0.07],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST', 0.045, 0.07],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST', 0.045, 0.07],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2" SCH 40 RAILS AND SCH 80 POST', 0.045, 0.07]
    ];

    for (const row of seedData) {
      await db.query(`
        INSERT INTO galvanized_labor (category, label, shop_mh_per_lf, field_mh_per_lf)
        VALUES (?, ?, ?, ?)
      `, row);
    }

    console.log(`[migration] Successfully seeded ${seedData.length} rows.`);
  } catch (err) {
    console.error('[migration] Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
