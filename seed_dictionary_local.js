require('dotenv').config({ path: './server/.env' });
const { query } = require('./server/src/config/mssql');

const initialData = [
  ['stair_type', 'PAN PLATE CONC. FILLED', 'pan-concrete', 1],
  ['stair_type', 'GRATING TREAD', 'grating-tread', 2],
  ['stair_type', 'NON METAL STAIR', 'non-metal', 3],

  ['grating_type', '1 1/4" Bar grating/Welded', '1 1/4" Bar grating/Welded', 1],
  ['grating_type', '1 1/4" Bar grating/Bolted', '1 1/4" Bar grating/Bolted', 2],
  ['grating_type', '1" Bar grating/Welded', '1" Bar grating/Welded', 3],
  ['grating_type', '1" Bar grating/Bolted', '1" Bar grating/Bolted', 4],
  ['grating_type', 'McNichols treads', 'McNichols treads', 5],
  ['grating_type', 'Other Pre-fabricated Treads', 'Other Pre-fabricated Treads', 6],

  ['steel_grade_stair', 'A992', 'A992', 1],
  ['steel_grade_stair', 'A572-50', 'A572-50', 2],
  ['steel_grade_stair', 'A36', 'A36', 3],
  ['steel_grade_stair', 'SS316', 'SS316', 4],
  ['steel_grade_stair', 'SS 304', 'SS 304', 5],

  ['steel_grade_rail', 'A53', 'A53', 1],
  ['steel_grade_rail', 'A500C', 'A500C', 2],
  ['steel_grade_rail', 'A500B', 'A500B', 3],
  ['steel_grade_rail', 'SS316', 'SS316', 4],
  ['steel_grade_rail', 'SS 304', 'SS 304', 5],

  ['finish_option', 'Primer', 'Primer', 1],
  ['finish_option', 'Painted', 'Painted', 2],
  ['finish_option', 'Galvanized', 'Galvanized', 3],
  ['finish_option', 'Galv+Painted', 'Galv+Painted', 4],
  ['finish_option', 'Powder Coated', 'Powder Coated', 5],

  ['connection_type', 'Welded', 'Welded', 1],
  ['connection_type', 'Bolted', 'Bolted', 2],

  ['mounting_type', 'Bolted to Stringer', 'Bolted to Stringer', 1],
  ['mounting_type', 'Welded to Stringer', 'Welded to Stringer', 2],
  ['mounting_type', 'Side Mounted Bolted', 'Side Mounted Bolted', 3],
  ['mounting_type', 'Side Mounted Welded', 'Side Mounted Welded', 4],
  ['mounting_type', 'Embedded', 'Embedded', 5],
  ['mounting_type', 'Anchored', 'Anchored', 6],

  ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', 1],
  ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', 2],
  ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', 3],
  ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', 4],
  ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', 5],
  ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', 6],
  ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', 7],
  ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', 8],
  ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 9],
  ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 10],
  ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH. 80 Posts', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH. 80 Posts', 11],
  ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', 12],
  ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 13],
  ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 14],
  ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', 15],
  ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', 16],
  ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 17],
  ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 18],
  ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', 19],
  ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', 20],
  ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 21],
  ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 22],
  ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', 23],
  ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', 24],
  ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', 25],
  ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', 26],
  ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', 27],
  ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', 28],
  ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', 29],
  ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', 30],
  ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST', 31],
  ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST', 32],
  ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST', 33],
  ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND SCH 80 POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND SCH 80 POST', 34],

  ['stringer_size', 'W8x31', 'W8x31', 1],
  ['stringer_size', 'W10x33', 'W10x33', 2],
  ['stringer_size', 'W12x35', 'W12x35', 3],
  ['stringer_size', 'W12x40', 'W12x40', 4],
  ['stringer_size', 'W12x50', 'W12x50', 5],
  ['stringer_size', 'W14x43', 'W14x43', 6],
  ['stringer_size', 'MC12x10.6', 'MC12x10.6', 7],
  ['stringer_size', 'C12x20.7', 'C12x20.7', 8],
  ['stringer_size', 'C15x33.9', 'C15x33.9', 9],
];

async function seed() {
  try {
    console.log('Seeding dictionary (MSSQL)...');
    // Clear old data
    await query('DELETE FROM dictionary');
    
    for (const item of initialData) {
      await query(
        'INSERT INTO dictionary (category, label, value, [order], isActive) VALUES (?, ?, ?, ?, 1)',
        [item[0], item[1], item[2], item[3]]
      );
    }
    console.log('Dictionary seeded successfully (MSSQL)');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
