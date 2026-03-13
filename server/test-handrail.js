// server/test-handrail.js
const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'secure_uploads/separate MISC sheets.xlsx');

console.log('Reading Excel file...');
const workbook = XLSX.readFile(excelPath);

// Get the exact sheet with space
const sheetName = 'Handrail ';
console.log(`\nReading sheet: "${sheetName}"`);

const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`\nTotal rows: ${jsonData.length}`);

console.log('\n=== FIRST 20 ROWS ===');
for (let i = 0; i < Math.min(20, jsonData.length); i++) {
  const row = jsonData[i];
  console.log(`\nRow ${i}:`);
  row.forEach((cell, colIndex) => {
    if (cell !== undefined && cell !== null && cell !== '') {
      console.log(`  Col ${colIndex}: "${cell}" (type: ${typeof cell})`);
    }
  });
}

console.log('\n=== ANALYZING COLUMNS ===');
// Try to understand column structure
const sampleRow = jsonData[1] || jsonData[0] || [];
console.log('Sample data row:', sampleRow);

// Show all unique values in first column
console.log('\n=== FIRST COLUMN VALUES ===');
const firstColValues = new Set();
for (let i = 0; i < Math.min(50, jsonData.length); i++) {
  const row = jsonData[i];
  if (row && row[0]) {
    firstColValues.add(String(row[0]).trim());
  }
}
console.log('Unique values in column 0:', Array.from(firstColValues));

// Show all unique values in second column
console.log('\n=== SECOND COLUMN VALUES ===');
const secondColValues = new Set();
for (let i = 0; i < Math.min(50, jsonData.length); i++) {
  const row = jsonData[i];
  if (row && row[1]) {
    secondColValues.add(String(row[1]).trim());
  }
}
console.log('Unique values in column 1:', Array.from(secondColValues));