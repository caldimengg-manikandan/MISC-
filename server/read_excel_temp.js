const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:\\Claude Cowork\\MISC--main\\MISC--main\\MISC--main\\MISC--main\\MISC--main\\Misc est-new version.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('--- SHEETS ---');
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- SHEET: ${sheetName} ---`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Print first 20 rows of each sheet to get an idea of the structure
  data.slice(0, 30).forEach((row, i) => {
    console.log(`${i}: ${JSON.stringify(row)}`);
  });
});
