/**
 * excelGenerator.js
 * Generates a 3-sheet Excel workbook for any library category.
 * Uses ExcelJS (already installed on server).
 *
 * Sheets:
 *   1. "Instructions" — frozen, styled usage guide
 *   2. "Data"         — current DB rows + blank template rows
 *   3. "Validation Rules" — field-level min/max reference
 */

const ExcelJS = require('exceljs');
const {
  LIBRARY_CATEGORIES,
  SHEET_NAMES,
  EXCEL_TEMPLATE_BLANK_ROWS,
  SYSTEM_DEFAULT_FINISHES,
} = require('../config/library.config');

// ── Design Tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  headerBg:    '10a37f', // Accent green
  headerFg:    'FFFFFF',
  lockedBg:    'FEF9C3', // Yellow – system defaults
  globalBg:    'F0F4FF', // Light blue – global defaults
  tenantBg:    'F8FAFC', // Near-white – tenant rows
  blankBg:     'FAFAFA', // Template blank rows
  borderColor: 'D1D5DB',
  errorBg:     'FEE2E2',
  titleBg:     '1A1D27',
  titleFg:     'E2E8F0',
  sectionBg:   'F0FDF4',
  sectionFg:   '065F46',
  ruleBg:      'EFF6FF',
  ruleFg:      '1E40AF',
};

const FONTS = {
  header: { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.headerFg } },
  title:  { name: 'Calibri', bold: true, size: 12 },
  body:   { name: 'Calibri', size: 10 },
  mono:   { name: 'Courier New', size: 10 },
  muted:  { name: 'Calibri', size: 9, italic: true, color: { argb: '64748B' } },
};

function border(style = 'thin') {
  const s = { style, color: { argb: COLORS.borderColor } };
  return { top: s, left: s, bottom: s, right: s };
}

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

// ── Main Generator ────────────────────────────────────────────────────────────
/**
 * @param {string} category — e.g. 'finish_option'
 * @param {Array}  rows     — normalized DB rows (from library API)
 * @returns {ExcelJS.Workbook}
 */
async function generateLibraryTemplate(category, rows = []) {
  const schema = LIBRARY_CATEGORIES[category];
  if (!schema) throw new Error(`Unknown library category: "${category}"`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CAL MISC Library Hub';
  workbook.created = new Date();
  workbook.modified = new Date();

  addInstructionsSheet(workbook, category, schema);
  addDataSheet(workbook, category, schema, rows);
  addValidationSheet(workbook, category, schema);

  return workbook;
}

// ── Sheet 1: Instructions ─────────────────────────────────────────────────────
function addInstructionsSheet(workbook, category, schema) {
  const ws = workbook.addWorksheet(SHEET_NAMES.instructions, {
    properties: { tabColor: { argb: COLORS.headerBg } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { key: 'A', width: 28 },
    { key: 'B', width: 64 },
  ];

  // Title
  ws.addRow(['CAL MISC Library Hub — Excel Template']);
  ws.mergeCells('A1:B1');
  ws.getCell('A1').font = { name: 'Calibri', bold: true, size: 14, color: { argb: COLORS.titleFg } };
  ws.getCell('A1').fill = fill(COLORS.titleBg);
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  const addSection = (label) => {
    ws.addRow([]);
    const row = ws.addRow([label, '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).font = { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionFg } };
    row.getCell(1).fill = fill(COLORS.sectionBg);
    row.getCell(1).border = border();
    row.height = 18;
  };

  const addItem = (label, value) => {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = { ...FONTS.body, bold: true };
    row.getCell(1).fill = fill('F8FAFC');
    row.getCell(2).font = FONTS.body;
    row.getCell(2).fill = fill('FFFFFF');
    [1, 2].forEach(c => {
      row.getCell(c).border = border();
      row.getCell(c).alignment = { wrapText: true, vertical: 'top' };
    });
    row.height = 20;
  };

  addSection(`📋 Category: ${schema.label}`);
  addItem('Description', schema.description);
  addItem('Excel File', `Library_${category}_template.xlsx`);
  addItem('Generated', new Date().toLocaleDateString('en-US', { dateStyle: 'long' }));

  addSection('📖 How to Use This Template');
  addItem('Step 1 — Open "Data" sheet', 'Navigate to the "Data" tab to see all current library entries');
  addItem('Step 2 — Edit or Add', 'Modify existing rows or add new ones in the blank rows at the bottom');
  addItem('Step 3 — Leave ID blank for new rows', 'The ID column must be empty for new entries. Existing IDs will be updated.');
  addItem('Step 4 — Save the file', 'Save as .xlsx format (do not rename the sheets)');
  addItem('Step 5 — Upload', 'Return to Library Hub → Upload, and select this file');
  addItem('Step 6 — Review conflicts', 'Resolve any detected conflicts before confirming import');

  addSection('⚠️ Important Rules');
  addItem('🔒 System Default rows', 'Rows marked SYSTEM DEFAULT cannot be deleted. You may update their numeric values, but not rename them.');
  addItem('🌐 Global rows', 'Rows marked GLOBAL are shared across all tenants. Do not delete these.');
  addItem('Required fields', schema.fields.filter(f => f.required).map(f => f.header).join(', ') || 'None');
  addItem('Do NOT rename sheets', `Sheets must remain named: "${SHEET_NAMES.instructions}", "${SHEET_NAMES.data}", "${SHEET_NAMES.rules}"`);
  addItem('Do NOT add/remove columns', 'The column order and headers must match exactly for the import to succeed.');
  addItem('Number formats', 'Enter numeric values without currency symbols or commas. Example: 1.5 not $1.50');

  addSection('🎨 Color Legend (Data Sheet)');
  const colorLegend = [
    ['🟡 Yellow background', 'System Default — locked, cannot be deleted'],
    ['🔵 Blue background', 'Global Default — shared across all tenants'],
    ['⚪ White background', 'Tenant-specific row — can be edited/deleted'],
    ['🟩 Light green background', 'Blank template row — add your new entries here'],
  ];
  colorLegend.forEach(([k, v]) => addItem(k, v));

  addSection('📐 Field Reference');
  const headerRow = ws.addRow(['Field', 'Type', 'Required?', 'Notes']);
  headerRow.eachCell(cell => {
    cell.font = FONTS.header;
    cell.fill = fill(COLORS.headerBg);
    cell.border = border();
    cell.alignment = { horizontal: 'center' };
  });
  ws.getColumn('A').width = 22;
  ws.getColumn('B').width = 14;

  // Override columns for field reference
  ws.spliceColumns(3, 0, { key: 'C', width: 14 }, { key: 'D', width: 42 });

  schema.fields.forEach(f => {
    const row = ws.addRow([f.header, f.type, f.required ? 'Yes' : 'No', buildFieldNotes(f)]);
    row.eachCell(cell => { cell.border = border(); cell.font = FONTS.body; });
    row.getCell(1).font = { ...FONTS.body, bold: true };
  });
}

function buildFieldNotes(field) {
  const parts = [];
  if (field.min !== undefined) parts.push(`Min: ${field.min}`);
  if (field.max !== undefined) parts.push(`Max: ${field.max}`);
  if (field.decimals !== undefined) parts.push(`Up to ${field.decimals} decimal places`);
  if (field.key === 'value') parts.push('Uppercase code used internally by the system');
  return parts.join(' | ') || 'Free text';
}

// ── Sheet 2: Data ─────────────────────────────────────────────────────────────
function addDataSheet(workbook, category, schema, rows) {
  const ws = workbook.addWorksheet(SHEET_NAMES.data, {
    properties: { tabColor: { argb: '10a37f' } },
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  // Column definitions: ID first, then schema fields, then metadata
  const colDefs = [
    { key: 'id',              header: 'ID',             type: 'number', width: 10 },
    ...schema.fields.map(f => ({ key: f.key, header: f.header, type: f.type, width: Math.max(16, f.header.length + 4) })),
    { key: 'isSystemDefault', header: 'System Default', type: 'flag',   width: 16 },
    { key: 'isGlobalDefault', header: 'Global Default', type: 'flag',   width: 15 },
    { key: 'updatedBy',       header: 'Last Updated By', type: 'text',  width: 22 },
    { key: 'updatedAt',       header: 'Last Updated',    type: 'date',  width: 20 },
  ];

  ws.columns = colDefs.map(c => ({ key: c.key, width: c.width }));

  // Row 1: Category banner
  ws.addRow([`Library Category: ${schema.label} — ${rows.length} entries`]);
  ws.mergeCells(`A1:${colLetter(colDefs.length)}1`);
  ws.getCell('A1').font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFF' } };
  ws.getCell('A1').fill = fill(COLORS.titleBg);
  ws.getCell('A1').alignment = { horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 22;

  // Row 2: Column headers
  const headerRow = ws.addRow(colDefs.map(c => c.header));
  headerRow.eachCell((cell, colIdx) => {
    cell.font = FONTS.header;
    cell.fill = fill(COLORS.headerBg);
    cell.border = border();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Mark required fields with asterisk
    const colKey = colDefs[colIdx - 1]?.key;
    const schemaField = schema.fields.find(f => f.key === colKey);
    if (schemaField?.required) cell.value += ' *';
  });
  headerRow.height = 20;

  // Existing DB rows
  rows.forEach(row => {
    const values = colDefs.map(c => {
      if (c.key === 'isSystemDefault') return row.isSystemDefault ? 'YES' : 'NO';
      if (c.key === 'isGlobalDefault') return row.isGlobalDefault ? 'YES' : 'NO';
      if (c.key === 'updatedAt') return row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '';
      if (c.key === 'updatedBy') return row.updatedBy || '';
      const val = row[c.key];
      return val !== null && val !== undefined ? val : '';
    });

    const excelRow = ws.addRow(values);

    // Color coding
    let bgColor;
    if (row.isSystemDefault) bgColor = COLORS.lockedBg;
    else if (row.isGlobalDefault) bgColor = COLORS.globalBg;
    else bgColor = COLORS.tenantBg;

    excelRow.eachCell((cell, colIdx) => {
      cell.fill = fill(bgColor);
      cell.border = border();
      const colKey = colDefs[colIdx - 1]?.key;
      const schemaField = schema.fields.find(f => f.key === colKey);
      if (schemaField?.type === 'number') {
        cell.font = { name: 'Courier New', size: 10 };
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = `0.${'0'.repeat(schemaField.decimals || 2)}`;
      } else {
        cell.font = FONTS.body;
        cell.alignment = { horizontal: 'left', indent: 1 };
      }
    });

    // Lock indicator
    if (row.isSystemDefault) {
      excelRow.getCell(1).note = '🔒 System Default — cannot be deleted or renamed';
    }
    excelRow.height = 18;
  });

  // Blank template rows
  for (let i = 0; i < EXCEL_TEMPLATE_BLANK_ROWS; i++) {
    const blankRow = ws.addRow(Array(colDefs.length).fill(''));
    blankRow.eachCell(cell => {
      cell.fill = fill(COLORS.blankBg);
      cell.border = border('hair');
      cell.font = FONTS.body;
    });
    // Clear ID cell (must be empty for new rows)
    blankRow.getCell(1).value = '';
    blankRow.getCell(1).note = 'Leave ID empty for new rows. The system will assign an ID automatically.';
    blankRow.height = 18;
  }

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to:   { row: 2, column: colDefs.length },
  };
}

// ── Sheet 3: Validation Rules ─────────────────────────────────────────────────
function addValidationSheet(workbook, category, schema) {
  const ws = workbook.addWorksheet(SHEET_NAMES.rules, {
    properties: { tabColor: { argb: '6366F1' } },
  });

  ws.columns = [
    { key: 'field',    width: 22 },
    { key: 'type',     width: 12 },
    { key: 'required', width: 12 },
    { key: 'min',      width: 12 },
    { key: 'max',      width: 12 },
    { key: 'decimals', width: 12 },
    { key: 'notes',    width: 42 },
  ];

  // Title
  ws.addRow([`Validation Rules — ${schema.label}`]);
  ws.mergeCells('A1:G1');
  ws.getCell('A1').font = { name: 'Calibri', bold: true, size: 12, color: { argb: COLORS.ruleFg } };
  ws.getCell('A1').fill = fill(COLORS.ruleBg);
  ws.getRow(1).height = 24;

  // Header
  const headers = ['Field', 'Type', 'Required', 'Min Value', 'Max Value', 'Decimals', 'Notes'];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = FONTS.header;
    cell.fill = fill(COLORS.headerBg);
    cell.border = border();
    cell.alignment = { horizontal: 'center' };
  });

  // Rows
  schema.fields.forEach((f, i) => {
    const row = ws.addRow([
      f.header,
      f.type,
      f.required ? 'Yes' : 'No',
      f.min !== undefined ? f.min : '—',
      f.max !== undefined ? f.max : '—',
      f.decimals !== undefined ? f.decimals : '—',
      buildFieldNotes(f),
    ]);
    row.eachCell(cell => {
      cell.border = border();
      cell.font = FONTS.body;
      cell.fill = fill(i % 2 === 0 ? 'FFFFFF' : 'F8FAFC');
      cell.alignment = { horizontal: 'center' };
    });
    row.getCell(1).font = { ...FONTS.body, bold: true };
    row.getCell(1).alignment = { horizontal: 'left', indent: 1 };
    row.getCell(7).alignment = { horizontal: 'left', indent: 1 };
  });

  ws.addRow([]);
  const noteRow = ws.addRow(['', '* Required fields must not be empty in the Data sheet.']);
  ws.mergeCells(`B${noteRow.number}:G${noteRow.number}`);
  noteRow.getCell(2).font = FONTS.muted;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function colLetter(n) {
  // Convert column number (1-based) to Excel column letter (A, B, ..., Z, AA, ...)
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

module.exports = { generateLibraryTemplate };
