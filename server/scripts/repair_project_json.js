/**
 * repair_project_json.js
 * EMERGENCY REPAIR: Unwraps multiple layers of stringified JSON in the projects table.
 */

process.env.MSSQL_TRUST_SERVER_CERTIFICATE = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function repair() {
  const searchTerm = 'NW2 BCR HUB';
  console.log(`🔧 Starting repair for project: "${searchTerm}"...`);

  try {
    const [rows] = await db.query(
      "SELECT id, CAST(stairs AS NVARCHAR(MAX)) as stairs_raw, CAST(guardRails AS NVARCHAR(MAX)) as rails_raw, CAST(estimationResult AS NVARCHAR(MAX)) as est_raw FROM projects WHERE projectName LIKE ?",
      [`%${searchTerm}%`]
    );

    if (rows.length === 0) {
      console.log('❌ Project not found.');
      return;
    }

    for (const p of rows) {
      console.log(`\nProcessing Project ID: ${p.id}`);

      const unwrap = (val) => {
        if (!val || typeof val !== 'string') return val;
        let current = val;
        let depth = 0;
        
        // Keep parsing until we get a real object/array or it stops being a valid JSON string
        while (typeof current === 'string' && (current.trim().startsWith('{') || current.trim().startsWith('[') || current.trim().startsWith('"'))) {
          try {
            const next = JSON.parse(current);
            if (next === current) break; // Safeguard
            current = next;
            depth++;
          } catch (e) {
            break; 
          }
        }
        if (depth > 1) console.log(`   - Unwrapped ${depth} layers of JSON nesting.`);
        return current;
      };

      const cleanStairs = unwrap(p.stairs_raw);
      const cleanRails = unwrap(p.rails_raw);
      const cleanEst = unwrap(p.est_raw);

      if (Array.isArray(cleanStairs)) {
        console.log(`   ✅ Valid Stairs Array found (${cleanStairs.length} items).`);
        
        await db.query(
          "UPDATE projects SET stairs = ?, guardRails = ?, estimationResult = ?, updatedAt = GETDATE() WHERE id = ?",
          [JSON.stringify(cleanStairs), JSON.stringify(cleanRails || []), JSON.stringify(cleanEst || {}), p.id]
        );
        console.log(`   ✨ Project ${p.id} successfully restored and flattened!`);
      } else {
        console.log(`   ⚠️  Could not resolve to a valid array. Result type: ${typeof cleanStairs}`);
      }
    }

  } catch (err) {
    console.error('❌ Repair failed:', err.message);
  } finally {
    console.log('\n✅ Operation finished.');
    process.exit(0);
  }
}

repair();
