require('dotenv').config({ path: './.env' });
const db = require('../src/config/mssql');

async function syncGrades() {
  try {
    const [stairGrades] = await db.query("SELECT label, value, description FROM dictionary WHERE category = 'steel_grade_stair'");
    console.log('Stair Grades:', stairGrades);

    const [railGrades] = await db.query("SELECT label, value, description FROM dictionary WHERE category = 'steel_grade_rail'");
    console.log('Rail Grades (Before):', railGrades);

    // Enforce strict parity: Delete existing rail grades first
    await db.query("DELETE FROM dictionary WHERE category = 'steel_grade_rail'");
    console.log('Cleared existing rail grades for strict parity.');

    for (const grade of stairGrades) {
      console.log(`Adding ${grade.label} to steel_grade_rail...`);
      await db.query(
        "INSERT INTO dictionary (category, label, value, description) VALUES ('steel_grade_rail', ?, ?, ?)",
        [grade.label, grade.value, grade.description]
      );
    }

    const [finalRail] = await db.query("SELECT label, value, description FROM dictionary WHERE category = 'steel_grade_rail'");
    console.log('Rail Grades (After):', finalRail);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncGrades();
