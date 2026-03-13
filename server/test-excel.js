// server/test-excel.js
const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'secure_uploads/separate MISC sheets.xlsx');

console.log('Reading Excel file:', excelPath);
const workbook = XLSX.readFile(excelPath);

console.log('\n📋 All Sheet Names:');
workbook.SheetNames.forEach((name, index) => {
  console.log(`${index + 1}. "${name}" (length: ${name.length})`);
});

const handrailSheet = workbook.SheetNames.find(name => 
  name.toLowerCase().trim() === 'Handrail '
);

console.log('\n🔍 Looking for Handrail sheet...');
console.log('Found:', handrailSheet ? `"${handrailSheet}"` : 'Not found');

if (handrailSheet) {
  const worksheet = workbook.Sheets[handrailSheet];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n📊 Sheet "${handrailSheet}" has ${jsonData.length} rows`);
  
  console.log('\n📝 First 10 rows:');
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    console.log(`Row ${i}:`, jsonData[i]);
  }
  
  console.log('\n📝 Row with column headers (usually row 0):');
  console.log(jsonData[0]);
  
  console.log('\n🔍 Checking column structure:');
  const headers = jsonData[0] || [];
  headers.forEach((header, index) => {
    if (header) {
      console.log(`Column ${index}: "${header}"`);
    }
  });
}