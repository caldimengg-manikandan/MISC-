const lookup = require('./src/utils/excelLookup');

const target = "2-Line Steel Pipe Guardrail 1 1/2\" Sch. 40 Pipe Rails and Post";
const result = lookup.lookup('Table Data', target, 'Column3');
console.log('Lookup Result for Rail:', result);

const table = lookup.getTable('Table Data');
console.log('Total rows in Table Data:', table.length);

const allMatches = table.filter(row => row && row.picture && String(row.picture).toLowerCase().trim() === target.toLowerCase().trim());
console.log(`Found ${allMatches.length} matches for target.`);
allMatches.forEach((m, idx) => {
  console.log(`Match ${idx}: Column3 = ${m.Column3}`);
});

if (allMatches.length === 0) {
  console.log('No match found for target.');
}
