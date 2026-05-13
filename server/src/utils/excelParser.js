/**
 * excelParser.js
 * Parses uploaded Library Excel files and validates them against category schema.
 * Uses xlsx (SheetJS) — already installed on server.
 *
 * Returns:
 *   { isValid, rows, errors, warnings, conflicts }
 */

const XLSX = require('xlsx');
const { LIBRARY_CATEGORIES, SHEET_NAMES } = require('../config/library.config');
const { validateRowData } = require('./library.utils');

/**
 * Parses a multer file buffer and validates it against the given category schema.
 *
 * @param {Buffer} buffer       - file buffer from multer
 * @param {string} category     - library category key
 * @param {Array}  existingRows - current DB rows (for conflict detection)
 * @returns {{ isValid, rows, errors, warnings, conflicts }}
 */
function parseLibraryExcel(buffer, category, existingRows = []) {
  const schema = LIBRARY_CATEGORIES[category];
  if (!schema) throw new Error(`Unknown category: "${category}"`);

  // ── 1. Load Workbook ──────────────────────────────────────────────────────
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellNF: true, cellDates: true });
  } catch (e) {
    return { isValid: false, rows: [], errors: [{ row: 0, message: `Invalid Excel file: ${e.message}` }], warnings: [], conflicts: [] };
  }

  // ── 2. Validate Sheet Names ───────────────────────────────────────────────
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.includes(SHEET_NAMES.data)) {
    return {
      isValid: false,
      rows: [],
      errors: [{ row: 0, message: `Missing required sheet "${SHEET_NAMES.data}". Found sheets: ${sheetNames.join(', ')}` }],
      warnings: [],
      conflicts: [],
    };
  }

  // ── 3. Parse "Data" Sheet ─────────────────────────────────────────────────
  const ws = workbook.Sheets[SHEET_NAMES.data];
  // Start from row 3 (row 1 = category banner, row 2 = column headers)
  const rawRows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    range: 1,           // skip first row (banner)
    defval: '',
  });

  if (rawRows.length < 1) {
    return { isValid: false, rows: [], errors: [{ row: 0, message: 'Data sheet is empty or has no header row.' }], warnings: [], conflicts: [] };
  }

  // ── 4. Map Headers to Fields ──────────────────────────────────────────────
  const headerRow = rawRows[0].map(h => String(h || '').replace(' *', '').trim());
  const fieldMap = buildFieldMap(headerRow, schema);

  if (fieldMap.errors.length > 0) {
    return { isValid: false, rows: [], errors: fieldMap.errors, warnings: [], conflicts: [] };
  }

  // ── 5. Parse Data Rows ────────────────────────────────────────────────────
  const errors = [];
  const warnings = [];
  const conflicts = [];
  const parsedRows = [];

  // Build lookup of existing labels/IDs for conflict detection
  const existingById = new Map(existingRows.map(r => [String(r.id), r]));
  const existingByLabel = new Map(existingRows.map(r => [r.label?.toLowerCase().trim(), r]));

  const dataRows = rawRows.slice(1); // skip header row

  dataRows.forEach((rawRow, i) => {
    const excelRowNum = i + 3; // 1-indexed, offset by 2 header rows

    // Skip completely empty rows
    if (rawRow.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      return;
    }

    // Map raw values to field keys
    const rowData = {};
    fieldMap.columns.forEach(({ colIdx, fieldKey }) => {
      const raw = rawRow[colIdx];
      rowData[fieldKey] = raw !== undefined && raw !== '' ? raw : null;
    });

    // Get ID (first column)
    const idColIdx = headerRow.indexOf('ID');
    const rawId = idColIdx !== -1 ? rawRow[idColIdx] : null;
    const id = rawId != null && rawId !== '' ? String(rawId).trim() : null;

    // Skip blank template rows (no label and no id)
    const label = String(rowData.label || '').trim();
    if (!label && !id) return;

    // ── Validate ────────────────────────────────────────────────────────────
    const rowErrors = validateRowData(rowData, schema);
    rowErrors.forEach(msg => errors.push({ row: excelRowNum, field: msg.split(' ')[0], message: msg }));

    // ── Conflict Detection ──────────────────────────────────────────────────
    let conflictType = null;
    let conflictTarget = null;

    if (id) {
      const existing = existingById.get(id);
      if (existing) {
        if (existing.isSystemDefault) {
          if (existing.label !== label) {
            // Cannot rename system defaults
            errors.push({
              row: excelRowNum,
              field: 'label',
              message: `Row ${excelRowNum}: System default "${existing.label}" cannot be renamed to "${label}"`,
            });
          }
          conflictType = 'update_locked';
          conflictTarget = existing;
        } else {
          conflictType = 'update';
          conflictTarget = existing;
        }
      }
    } else if (label) {
      // Check label collision for new rows
      const existingByLabelMatch = existingByLabel.get(label.toLowerCase());
      if (existingByLabelMatch) {
        conflictType = 'duplicate_label';
        conflictTarget = existingByLabelMatch;
      }
    }

    const parsedRow = {
      excelRow: excelRowNum,
      id,
      ...rowData,
      label,
      _conflictType: conflictType,
      _conflictTarget: conflictTarget ? { id: conflictTarget.id, label: conflictTarget.label } : null,
      _hasErrors: rowErrors.length > 0,
    };

    if (conflictType) {
      conflicts.push(parsedRow);
    } else {
      parsedRows.push(parsedRow);
    }
  });

  // Warn about System Default rows in conflict list
  const lockedConflicts = conflicts.filter(r => r._conflictType === 'update_locked');
  if (lockedConflicts.length > 0) {
    lockedConflicts.forEach(r => {
      warnings.push({
        row: r.excelRow,
        message: `Row ${r.excelRow}: "${r.label}" is a system default — only numeric values can be updated, not the name`,
      });
    });
  }

  return {
    isValid: errors.length === 0,
    rows: parsedRows,
    conflicts,
    errors,
    warnings,
    summary: {
      totalParsed: parsedRows.length + conflicts.length,
      newRows: parsedRows.filter(r => !r.id).length,
      updateRows: parsedRows.filter(r => r.id).length + conflicts.filter(r => r._conflictType === 'update').length,
      conflictCount: conflicts.length,
      errorCount: errors.length,
    },
  };
}

// ── Field Map Builder ─────────────────────────────────────────────────────────
function buildFieldMap(headerRow, schema) {
  const errors = [];
  const columns = [];

  schema.fields.forEach(field => {
    const colIdx = headerRow.findIndex(h => h.toLowerCase() === field.header.toLowerCase());
    if (colIdx === -1) {
      if (field.required) {
        errors.push({ row: 2, message: `Missing required column: "${field.header}"` });
      }
    } else {
      columns.push({ colIdx, fieldKey: field.key, field });
    }
  });

  return { columns, errors };
}

module.exports = { parseLibraryExcel };
