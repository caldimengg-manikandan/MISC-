/**
 * library.utils.js
 * Shared helper functions for the Library Management Module.
 */

const db = require('../config/mssql');
const { LIBRARY_CATEGORIES, LIBRARY_ADMIN_ROLES } = require('../config/library.config');

// ── Role Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns true if the user has library access (admin/owner/superadmin).
 */
function hasLibraryAccess(user) {
  return LIBRARY_ADMIN_ROLES.includes(user?.role);
}

/**
 * Resolves the admin_owner_id for the current user (mirrors dictionary.js pattern).
 * - admin/superadmin → their own userId
 * - owner → their userId
 * - estimator → their admin_owner_id (if they somehow bypass the guard)
 */
function resolveAdminOwnerId(req) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'superadmin' || role === 'owner') {
    return req.user?.id || req.userId;
  }
  return req.user?.admin_owner_id || null;
}

/**
 * Builds the WHERE clause + params for tenant-scoped queries.
 * - superadmin: sees all rows (no filter)
 * - admin/owner: sees global (admin_owner_id IS NULL) + their own rows
 */
function buildTenantFilter(user, adminOwnerId) {
  if (user.role === 'superadmin') {
    return { clause: '', params: [] };
  }
  return {
    clause: 'AND (admin_owner_id IS NULL OR admin_owner_id = ?)',
    params: [adminOwnerId],
  };
}

// ── Category Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the category schema, or throws 404 if unknown.
 */
function getCategorySchema(category) {
  const schema = LIBRARY_CATEGORIES[category];
  if (!schema) {
    const err = new Error(`Unknown library category: "${category}"`);
    err.status = 404;
    throw err;
  }
  return schema;
}

/**
 * Checks if a given category is valid.
 */
function isValidCategory(category) {
  return Boolean(LIBRARY_CATEGORIES[category]);
}

// ── Row Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true if the row is locked (cannot be deleted).
 */
function isRowLocked(row) {
  // Always return false to allow user full control over all rows
  return false;
}

/**
 * Returns true if the row is a global default (visible to all tenants).
 */
function isGlobalDefault(row) {
  return row.admin_owner_id === null || row.admin_owner_id === undefined;
}

/**
 * Normalizes a raw DB dictionary row to a clean API response object,
 * including only the fields relevant to the given category schema.
 */
function normalizeRow(row, categorySchema) {
  const result = {
    id: row.id,
    category: row.category,
    label: row.label,
    value: row.value,
    description: row.description || '',
    order: row.order || 0,
    isActive: row.isActive,
    isSystemDefault: row.is_system_default === 1 || row.is_system_default === true,
    isGlobalDefault: row.admin_owner_id === null,
    admin_owner_id: row.admin_owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
  };

  // Add numeric fields based on category schema
  if (categorySchema) {
    categorySchema.fields.forEach(field => {
      if (field.dbCol && field.dbCol !== 'label' && field.dbCol !== 'value') {
        const rawVal = row[field.dbCol];
        if (field.type === 'number') {
          result[field.key] = rawVal != null ? parseFloat(rawVal) : null;
        } else {
          result[field.key] = rawVal != null ? rawVal : null;
        }
      }
    });
  } else {
    // Fallback: include all standard numeric fields
    ['steelLbsLf', 'shopLaborMhLf', 'fieldLaborMhLf', 'widthMax', 'spanMin', 'spanMax', 'price'].forEach(col => {
      if (row[col] != null) result[col] = parseFloat(row[col]);
    });
  }

  return { ...result, ...result.customFields };
}

// ── Audit Log Helpers ─────────────────────────────────────────────────────────

/**
 * Writes an entry to library_audit_log.
 * @param {Object} params
 * @param {string} params.moduleName   - category name (e.g. 'finish_option')
 * @param {string} params.action       - 'MANUAL_EDIT' | 'DELETE' | 'IMPORT'
 * @param {string} [params.filename]   - original filename (for imports)
 * @param {number} [params.rowsAdded]
 * @param {number} [params.rowsUpdated]
 * @param {number} [params.rowsSkipped]
 * @param {Object} [params.details]    - JSON-serializable object for extra info
 * @param {string} params.createdBy    - user email or id
 */
async function writeAuditLog({
  moduleName,
  action,
  filename = null,
  rowsAdded = 0,
  rowsUpdated = 0,
  rowsSkipped = 0,
  details = null,
  createdBy,
}) {
  const rowsAffected = rowsAdded + rowsUpdated + rowsSkipped;
  const detailsJson = details ? JSON.stringify(details) : null;

  try {
    await db.query(
      `INSERT INTO library_audit_log
         (module_name, action, imported_filename, rows_affected, rows_added, rows_updated, rows_skipped, details, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [moduleName, action, filename, rowsAffected, rowsAdded, rowsUpdated, rowsSkipped, detailsJson, createdBy]
    );
  } catch (err) {
    // Never let audit log failure break the main operation
    console.error('[Library Audit] Failed to write audit log:', err.message);
  }
}

// ── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Validates a single row against the category schema rules.
 * Returns an array of error strings (empty = valid).
 */
function validateRowData(rowData, categorySchema) {
  const errors = [];

  for (const field of categorySchema.fields) {
    const value = rowData[field.key];

    // Required check
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`${field.header} is required`);
      continue;
    }

    // Skip optional empty fields
    if (value === null || value === undefined || value === '') continue;

    // Type check for numeric fields
    if (field.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push(`${field.header} must be a number`);
        continue;
      }
      if (field.min !== undefined && num < field.min) {
        errors.push(`${field.header} must be ≥ ${field.min}`);
      }
      if (field.max !== undefined && num > field.max) {
        errors.push(`${field.header} must be ≤ ${field.max}`);
      }
    }

    // Text length check
    if (field.type === 'text' && typeof value === 'string' && value.length > 255) {
      errors.push(`${field.header} must be ≤ 255 characters`);
    }
  }

  return errors;
}

/**
 * Builds the DB column values from validated row data.
 * Maps from schema field keys to actual DB columns.
 */
function buildDbValues(rowData, categorySchema) {
  const values = {
    label: rowData.label || rowData.description || '',
    value: rowData.value || '',
    description: rowData.description || '',
  };

  for (const field of categorySchema.fields) {
    if (!field.dbCol || field.dbCol === 'label' || field.dbCol === 'value') continue;
    const raw = rowData[field.key];
    if (raw !== null && raw !== undefined && raw !== '') {
      values[field.dbCol] = parseFloat(raw);
    } else {
      values[field.dbCol] = null;
    }
  }

  // Collect any fields not in schema into customFields
  const standardFields = ['label', 'value', 'description', 'order', 'isActive', 'id', 'category', 'isSystemDefault', 'isGlobalDefault', 'admin_owner_id', 'createdAt', 'updatedAt', 'updatedBy', 'customFields'];
  const schemaKeys = categorySchema.fields.map(f => f.key);
  const knownKeys = [...standardFields, ...schemaKeys];

  const customFields = { ...(rowData.customFields || {}) };
  Object.keys(rowData).forEach(key => {
    if (!knownKeys.includes(key) && rowData[key] !== undefined) {
      customFields[key] = rowData[key];
    }
  });

  if (Object.keys(customFields).length > 0) {
    values.custom_fields = JSON.stringify(customFields);
  }

  return values;
}

module.exports = {
  hasLibraryAccess,
  resolveAdminOwnerId,
  buildTenantFilter,
  getCategorySchema,
  isValidCategory,
  isRowLocked,
  isGlobalDefault,
  normalizeRow,
  writeAuditLog,
  validateRowData,
  buildDbValues,
};
