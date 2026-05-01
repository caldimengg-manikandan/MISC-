/**
 * recover_project.js
 * Emergency script to check project data and verify if it's missing or just hidden.
 */

process.env.MSSQL_TRUST_SERVER_CERTIFICATE = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/mssql');

async function checkProject() {
  const searchTerm = 'NW2 BCR HUB';
  console.log(`🔍 Searching for project: "${searchTerm}"...`);

  try {
    const [rows] = await db.query(
      "SELECT id, projectName, projectNumber, owner_admin_id, company_id, userId, CAST(stairs AS NVARCHAR(MAX)) as stairs_raw FROM projects WHERE projectName LIKE ?",
      [`%${searchTerm}%`]
    );

    if (rows.length === 0) {
      console.log('❌ No project found with that name.');
      return;
    }

    console.log(`✅ Found ${rows.length} matching project(s):`);
    
    rows.forEach((p, i) => {
      console.log(`\n--- Project ${i + 1} ---`);
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.projectName}`);
      console.log(`Number: ${p.projectNumber}`);
      console.log(`Owner Admin ID: ${p.owner_admin_id}`);
      console.log(`Company ID: ${p.company_id}`);
      console.log(`Created By (User ID): ${p.userId}`);
      
      const stairs = p.stairs_raw;
      if (!stairs || stairs === '[]' || stairs === 'null') {
        console.log('⚠️  STAIRS DATA IS EMPTY ([])');
      } else {
        console.log(`✅ STAIRS DATA FOUND (${stairs.length} characters)`);
        console.log(`Preview: ${stairs.substring(0, 200)}...`);
      }
    });

  } catch (err) {
    console.error('❌ Error querying database:', err.message);
  } finally {
    process.exit(0);
  }
}

checkProject();
