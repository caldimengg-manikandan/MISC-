const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:\\Claude Cowork\\MISC--main\\MISC--main\\MISC--main\\MISC--main\\MISC--main\\Misc est-new version.xlsx';
const workbook = XLSX.readFile(filePath);

const sheetName = 'Material Cost'; // Maybe it's here?
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('--- Material Cost ---');
data.forEach(row => console.log(JSON.stringify(row)));

const summarySheet = workbook.Sheets['Summary'];
const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
console.log('--- Summary ---');
summaryData.forEach(row => console.log(JSON.stringify(row)));
