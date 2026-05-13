/**
 * libraryRoutes.js
 * API routes for the Centralized Library Management Module.
 * 
 * Base path: /api/v1/library  (registered in server.js)
 * Auth:      All routes require authMiddleware + licenseCheck (set in server.js)
 * Access:    Admin/owner/superadmin only (estimators blocked by libraryAdminOnly middleware)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/mssql');
const logger = require('../utils/logger');
const { generateLibraryTemplate } = require('../utils/excelGenerator');
const { parseLibraryExcel } = require('../utils/excelParser');
const {
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
} = require('../utils/library.utils');
const {
  LIBRARY_CATEGORIES,
  CATEGORY_ORDER,
} = require('../config/library.config');

// Multer: memory storage, .xlsx only, 20 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are accepted'), false);
    }
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Restrict library write/admin actions to admin/owner/superadmin.
 * Estimators are completely blocked (Option A).
 */
const libraryAdminOnly = (req, res, next) => {
  if (!hasLibraryAccess(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Library Hub is restricted to administrators.',
    });
  }
  next();
};

// Apply admin-only guard to ALL library routes
router.use(libraryAdminOnly);

// ── Custom Column Management ──────────────────────────────────────────────────

// ── POST /api/v1/library/:category/columns ───────────────────────────────────
// Add a new custom column definition for a category
router.post('/:category/columns', async (req, res) => {
  try {
    const { category } = req.params;
    const { header, type } = req.body;
    const adminOwnerId = resolveAdminOwnerId(req);

    if (!header || !type) {
      return res.status(400).json({ success: false, message: 'Header and type are required' });
    }

    // Generate a unique field key
    const fieldKey = `custom_${header.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    await db.query(
      'INSERT INTO dictionary_columns (category, field_key, header, field_type, admin_owner_id) VALUES (?, ?, ?, ?, ?)',
      [category, fieldKey, header, type, adminOwnerId]
    );

    res.json({ success: true, message: 'Column added successfully', field: { key: fieldKey, header, type } });
  } catch (err) {
    logger.error('[Library] Error adding column:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/v1/library/:category/columns/:key ──────────────────────────────
// Update an existing custom column definition
router.patch('/:category/columns/:key', async (req, res) => {
  try {
    const { category, key } = req.params;
    const { header, type } = req.body;
    const adminOwnerId = resolveAdminOwnerId(req);

    if (!header || !type) {
      return res.status(400).json({ success: false, message: 'Header and type are required' });
    }

    // Only allow updating columns owned by this tenant (or global if superadmin)
    const [existing] = await db.query(
      'SELECT * FROM dictionary_columns WHERE category = ? AND field_key = ? AND (admin_owner_id = ? OR admin_owner_id IS NULL)',
      [category, key, adminOwnerId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Column definition not found or access denied' });
    }

    // Block updating global columns by non-superadmins
    if (existing[0].admin_owner_id === null && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot modify system-level column definitions' });
    }

    await db.query(
      'UPDATE dictionary_columns SET header = ?, field_type = ? WHERE category = ? AND field_key = ?',
      [header, type, category, key]
    );

    res.json({ success: true, message: 'Column updated successfully' });
  } catch (err) {
    logger.error('[Library] Error updating column:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/v1/library/:category/columns/:key ─────────────────────────────
// Remove a custom column definition
router.delete('/:category/columns/:key', async (req, res) => {
  try {
    const { category, key } = req.params;
    const adminOwnerId = resolveAdminOwnerId(req);

    // Only allow deleting columns owned by this tenant
    const [existing] = await db.query(
      'SELECT * FROM dictionary_columns WHERE category = ? AND field_key = ? AND (admin_owner_id = ? OR admin_owner_id IS NULL)',
      [category, key, adminOwnerId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Column definition not found or access denied' });
    }

    if (existing[0].admin_owner_id === null && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete system-level column definitions' });
    }

    await db.query(
      'DELETE FROM dictionary_columns WHERE category = ? AND field_key = ?',
      [category, key]
    );

    res.json({ success: true, message: 'Column removed successfully' });
  } catch (err) {
    logger.error('[Library] Error deleting column:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/library/all/summary ──────────────────────────────────────────
// Returns sidebar summary: count per category (scoped to tenant)
router.get('/all/summary', async (req, res) => {
  try {
    const adminOwnerId = resolveAdminOwnerId(req);
    const { clause, params } = buildTenantFilter(req.user, adminOwnerId);

    const [rows] = await db.query(
      `SELECT category,
              COUNT(*) as total,
              SUM(CASE WHEN is_system_default = 1 THEN 1 ELSE 0 END) as locked,
              MAX(updated_at) as lastUpdated
       FROM dictionary
       WHERE (isActive = 1 OR isActive IS NULL)
         ${clause}
       GROUP BY category`,
      params
    );

    const summary = {};
    rows.forEach(r => {
      summary[r.category] = {
        total: r.total,
        locked: r.locked,
        lastUpdated: r.lastUpdated,
      };
    });

    res.json({ success: true, summary });
  } catch (err) {
    logger.error('[Library] Error fetching summary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/library/audit-log ────────────────────────────────────────────
// Returns paginated audit log with optional filters
router.get('/audit-log', async (req, res) => {
  try {
    const { module, action, limit = 20, offset = 0, dateFrom, dateTo } = req.query;

    const conditions = [];
    const params = [];

    if (module) {
      conditions.push('module_name = ?');
      params.push(module);
    }
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (dateFrom) {
      conditions.push('created_at >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('created_at <= ?');
      params.push(dateTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [logs] = await db.query(
      `SELECT audit_id, module_name, action, imported_filename,
              rows_affected, rows_added, rows_updated, rows_skipped,
              details, created_at, created_by
       FROM library_audit_log
       ${where}
       ORDER BY created_at DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [...params, parseInt(offset), parseInt(limit)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM library_audit_log ${where}`,
      params
    );

    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    res.json({
      success: true,
      logs: parsedLogs,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    logger.error('[Library] Error fetching audit log:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/library/:category/columns ────────────────────────────────────
// Get dictionary columns for a specific category (tenant-scoped)
router.get('/:category/columns', async (req, res) => {
  try {
    const { category } = req.params;
    const adminOwnerId = resolveAdminOwnerId(req);
    
    // Fetch custom columns specific to this category
    // Using simple query with guaranteed columns to avoid 500 errors
    const [columns] = await db.query(
      'SELECT field_key as [key], header, field_type as [type] FROM dictionary_columns WHERE category = ? AND (admin_owner_id = ? OR admin_owner_id IS NULL)',
      [category, adminOwnerId]
    );

    res.json({ 
      success: true, 
      columns: columns || [] 
    });
  } catch (err) {
    logger.error(`[Library] Error fetching columns for ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/v1/library/:category ────────────────────────────────────────────
// List all rows for a category (tenant-scoped)
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const showAll = req.query.all === 'true'; // include inactive rows

    // Validate category
    if (!isValidCategory(category)) {
      return res.status(404).json({ success: false, message: `Unknown category: ${category}` });
    }

    const categorySchema = getCategorySchema(category);
    const adminOwnerId = resolveAdminOwnerId(req);
    const { clause, params } = buildTenantFilter(req.user, adminOwnerId);

    const activeClause = showAll ? '' : "AND (isActive = 1 OR isActive IS NULL)";

    const [rows] = await db.query(
      `SELECT id, category, label, value, description, [order],
              steelLbsLf, shopLaborMhLf, fieldLaborMhLf,
              widthMin, widthMax, spanMin, spanMax,
              shopEfficiency, fieldEfficiency, price,
              isActive, admin_owner_id, custom_fields,
              is_system_default, created_at, updated_at, updated_by
       FROM dictionary
       WHERE category = ?
         ${activeClause}
         ${clause}
       ORDER BY
         CASE WHEN admin_owner_id IS NULL THEN 0 ELSE 1 END,
         [order] ASC,
         label ASC`,
      [category, ...params]
    );

    // Fetch custom column definitions
    const [customCols] = await db.query(
      'SELECT field_key as [key], header, field_type as [type] FROM dictionary_columns WHERE category = ? AND (admin_owner_id IS NULL OR admin_owner_id = ?)',
      [category, adminOwnerId]
    );

    const normalized = rows.map(row => normalizeRow(row, categorySchema));
    const mergedFields = [...(categorySchema.fields || []), ...customCols];

    const lastUpdated = rows.reduce((max, row) => {
      const t = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      return t > max ? t : max;
    }, 0);

    res.json({
      success: true,
      data: normalized,
      metadata: {
        category,
        label: categorySchema.label,
        total: normalized.length,
        lockedRows: normalized.filter(r => r.isSystemDefault).length,
        globalRows: normalized.filter(r => r.isGlobalDefault).length,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        fields: mergedFields,
      },
    });
  } catch (err) {
    logger.error(`[Library] Error fetching ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CRUD for Library Categories ───────────────────────────────────────────────

// ── POST /api/v1/library/:category ───────────────────────────────────────────
// Create a new row in the category (always scoped to this tenant)
router.post('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const categorySchema = getCategorySchema(category);
    const adminOwnerId = resolveAdminOwnerId(req);

    // Validate input
    const errors = validateRowData(req.body, categorySchema);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const vals = buildDbValues(req.body, categorySchema);
    const now = new Date();
    const userEmail = req.user?.email || String(req.user?.id);

    // Check for duplicate label in this tenant
    const [existing] = await db.query(
      `SELECT id, isActive FROM dictionary
       WHERE category = ? AND label = ? AND (admin_owner_id IS NULL OR admin_owner_id = ?)`,
      [category, vals.label, adminOwnerId]
    );

    if (existing.length > 0) {
      const dup = existing[0];
      // Reactivate if it was soft-deleted
      if (dup.isActive === 0 || dup.isActive === null) {
        await db.query(
          `UPDATE dictionary
           SET isActive = 1, is_active = 1,
               steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?,
               widthMax = ?, spanMin = ?, spanMax = ?, price = ?,
               custom_fields = ?, updated_at = ?, updated_by = ?
           WHERE id = ?`,
          [
            vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
            vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null, vals.price ?? null,
            vals.custom_fields ?? null, now, userEmail, dup.id,
          ]
        );
        const [reactivated] = await db.query('SELECT * FROM dictionary WHERE id = ?', [dup.id]);
        await writeAuditLog({ moduleName: category, action: 'MANUAL_EDIT', rowsUpdated: 1, createdBy: userEmail, details: { action: 'reactivated', id: dup.id } });
        return res.status(200).json({ success: true, data: normalizeRow(reactivated[0], categorySchema), message: 'Reactivated existing entry' });
      }
      return res.status(400).json({ success: false, message: `A row with label "${vals.label}" already exists in this category` });
    }

    // Insert new row
    const [result] = await db.query(
      `INSERT INTO dictionary
         (category, label, value, description, [order], isActive, is_active,
          steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax,
          shopEfficiency, fieldEfficiency, price,
          custom_fields, admin_owner_id, is_system_default, created_at, updated_at, updated_by)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        category, vals.label, vals.value || vals.label, vals.description || '',
        req.body.order || 0,
        vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
        vals.widthMin ?? null, vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null,
        vals.shopEfficiency ?? null, vals.fieldEfficiency ?? null, vals.price ?? null,
        vals.custom_fields ?? null, adminOwnerId,
        now, now, userEmail,
      ]
    );

    const newId = result[0].id;
    const [newRow] = await db.query('SELECT * FROM dictionary WHERE id = ?', [newId]);

    await writeAuditLog({ moduleName: category, action: 'MANUAL_EDIT', rowsAdded: 1, createdBy: userEmail, details: { action: 'created', id: newId, label: vals.label } });
    logger.info(`[Library] Created row id=${newId} in ${category} by ${userEmail}`);

    res.status(201).json({ success: true, data: normalizeRow(newRow[0], categorySchema) });
  } catch (err) {
    logger.error(`[Library] Error creating row in ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/v1/library/:category/:id ──────────────────────────────────────
// Update a row (tenant-scoped; can edit global defaults' numeric fields)
router.patch('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    const categorySchema = getCategorySchema(category);
    const adminOwnerId = resolveAdminOwnerId(req);
    const userEmail = req.user?.email || String(req.user?.id);

    // Fetch existing row
    const [existing] = await db.query('SELECT * FROM dictionary WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Row not found' });
    }
    const row = existing[0];

    // Tenant security: cannot edit another tenant's rows
    if (row.admin_owner_id !== null && row.admin_owner_id != adminOwnerId && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: "Cannot edit another tenant's library entry" });
    }

    // System defaults: allow numeric field edits, but NOT label/value rename
    if (isRowLocked(row)) {
      const forbidden = ['label', 'value'];
      const attemptedForbidden = forbidden.filter(f => req.body[f] !== undefined && req.body[f] !== row[f]);
      if (attemptedForbidden.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot rename system default entries (${attemptedForbidden.join(', ')} is locked)`,
        });
      }
    }

    // Validate input
    const mergedData = { ...normalizeRow(row, categorySchema), ...req.body };
    const errors = validateRowData(mergedData, categorySchema);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const vals = buildDbValues(mergedData, categorySchema);
    const now = new Date();

    await db.query(
      `UPDATE dictionary
       SET label = ?, value = ?, description = ?,
           steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?,
           widthMin = ?, widthMax = ?, spanMin = ?, spanMax = ?,
           shopEfficiency = ?, fieldEfficiency = ?, price = ?,
           custom_fields = ?, updated_at = ?, updated_by = ?
       WHERE id = ?`,
      [
        vals.label, vals.value || vals.label, vals.description || '',
        vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
        vals.widthMin ?? null, vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null,
        vals.shopEfficiency ?? null, vals.fieldEfficiency ?? null, vals.price ?? null,
        vals.custom_fields ?? null, now, userEmail,
        id,
      ]
    );

    const [updated] = await db.query('SELECT * FROM dictionary WHERE id = ?', [id]);
    await writeAuditLog({ moduleName: category, action: 'MANUAL_EDIT', rowsUpdated: 1, createdBy: userEmail, details: { action: 'updated', id, changes: req.body } });
    logger.info(`[Library] Updated row id=${id} in ${category} by ${userEmail}`);

    res.json({ success: true, data: normalizeRow(updated[0], categorySchema) });
  } catch (err) {
    logger.error(`[Library] Error updating row ${req.params.id} in ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/v1/library/:category/:id ─────────────────────────────────────
// Delete a row; blocked for system defaults
router.delete('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    getCategorySchema(category); // validate category
    const adminOwnerId = resolveAdminOwnerId(req);
    const userEmail = req.user?.email || String(req.user?.id);

    const [existing] = await db.query('SELECT * FROM dictionary WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Row not found' });
    }
    const row = existing[0];

    // Block deletion of system defaults
    if (isRowLocked(row)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete a system default entry. System defaults are locked.',
      });
    }

    // Tenant security: cannot delete another tenant's rows
    if (!isGlobalDefault(row) && row.admin_owner_id != adminOwnerId && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: "Cannot delete another tenant's library entry" });
    }

    await db.query('DELETE FROM dictionary WHERE id = ?', [id]);
    await writeAuditLog({ moduleName: category, action: 'DELETE', rowsAffected: 1, createdBy: userEmail, details: { action: 'deleted', id, label: row.label } });
    logger.info(`[Library] Deleted row id=${id} (${row.label}) in ${category} by ${userEmail}`);

    res.json({ success: true, message: 'Row deleted successfully' });
  } catch (err) {
    logger.error(`[Library] Error deleting row ${req.params.id} in ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET /api/v1/library/:category/download ───────────────────────────────────
// Generate and stream an Excel template for the category
router.get('/:category/download', async (req, res) => {
  try {
    const { category } = req.params;
    const categorySchema = getCategorySchema(category);
    const adminOwnerId = resolveAdminOwnerId(req);
    const { clause, params } = buildTenantFilter(req.user, adminOwnerId);

    // Fetch current rows to populate the Data sheet
    const [rows] = await db.query(
      `SELECT id, category, label, value, description, [order],
              steelLbsLf, shopLaborMhLf, fieldLaborMhLf,
              widthMin, widthMax, spanMin, spanMax,
              shopEfficiency, fieldEfficiency, price,
              isActive, admin_owner_id,
              is_system_default, created_at, updated_at, updated_by
       FROM dictionary
       WHERE category = ?
         AND (isActive = 1 OR isActive IS NULL)
         ${clause}
       ORDER BY CASE WHEN admin_owner_id IS NULL THEN 0 ELSE 1 END, [order] ASC, label ASC`,
      [category, ...params]
    );

    const normalizedRows = rows.map(r => normalizeRow(r, categorySchema));
    const workbook = await generateLibraryTemplate(category, normalizedRows);

    const filename = `Library_${categorySchema.excelFilename || category}_${new Date().toISOString().slice(0,10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    logger.info(`[Library] Excel downloaded: ${category} by ${req.user?.email}`);
    await writeAuditLog({
      moduleName: category,
      action: 'DOWNLOAD',
      rowsAffected: normalizedRows.length,
      createdBy: req.user?.email || String(req.user?.id),
      details: { rows: normalizedRows.length },
    });
  } catch (err) {
    logger.error(`[Library] Download error for ${req.params.category}:`, err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({ success: false, message: err.message });
    }
  }
});

// ── POST /api/v1/library/:category/validate ──────────────────────────────────
// Validate an uploaded Excel file; returns parsed rows + conflicts (no DB writes)
router.post('/:category/validate', upload.single('file'), async (req, res) => {
  try {
    const { category } = req.params;
    getCategorySchema(category);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please attach an .xlsx file.' });
    }

    // Fetch existing rows for conflict detection
    const adminOwnerId = resolveAdminOwnerId(req);
    const { clause, params } = buildTenantFilter(req.user, adminOwnerId);
    const [existingRows] = await db.query(
      `SELECT id, label, is_system_default, admin_owner_id FROM dictionary
       WHERE category = ? ${clause}`,
      [category, ...params]
    );

    const existing = existingRows.map(r => ({
      id: r.id,
      label: r.label,
      isSystemDefault: r.is_system_default === 1,
      isGlobalDefault: r.admin_owner_id === null,
    }));

    const result = parseLibraryExcel(req.file.buffer, category, existing);

    res.json({
      success: true,
      isValid: result.isValid,
      rows: result.rows,
      conflicts: result.conflicts,
      errors: result.errors,
      warnings: result.warnings,
      summary: result.summary,
      filename: req.file.originalname,
    });
  } catch (err) {
    logger.error(`[Library] Validate error for ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/v1/library/:category/import ────────────────────────────────────
// Commit import: INSERT new rows, UPDATE existing, skip/rename based on resolutions
router.post('/:category/import', upload.single('file'), async (req, res) => {
  try {
    const { category } = req.params;
    const categorySchema = getCategorySchema(category);
    const adminOwnerId = resolveAdminOwnerId(req);
    const userEmail = req.user?.email || String(req.user?.id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Parse conflict resolution decisions from body
    let resolutions = [];
    try {
      resolutions = JSON.parse(req.body.conflictResolution || '[]');
    } catch (e) {
      resolutions = [];
    }
    // Map: excelRow -> action ('merge' | 'skip' | 'rename')
    const resolutionMap = new Map(resolutions.map(r => [r.excelRow, r]));

    // Fetch existing rows for conflict detection
    const { clause, params } = buildTenantFilter(req.user, adminOwnerId);
    const [existingRows] = await db.query(
      `SELECT id, label, is_system_default, admin_owner_id FROM dictionary WHERE category = ? ${clause}`,
      [category, ...params]
    );
    const existing = existingRows.map(r => ({
      id: r.id, label: r.label,
      isSystemDefault: r.is_system_default === 1,
      isGlobalDefault: r.admin_owner_id === null,
    }));

    const parsed = parseLibraryExcel(req.file.buffer, category, existing);
    if (parsed.errors.length > 0 && parsed.rows.length === 0 && parsed.conflicts.length === 0) {
      return res.status(422).json({
        success: false, message: 'File has validation errors — please fix and re-upload.',
        errors: parsed.errors,
      });
    }

    const now = new Date();
    let rowsAdded = 0, rowsUpdated = 0, rowsSkipped = 0;
    const importLog = [];

    // Process clean new/update rows
    for (const row of parsed.rows) {
      const vals = buildDbValues(row, categorySchema);
      if (!row.id) {
        // INSERT new row
        try {
          await db.query(
            `INSERT INTO dictionary
               (category, label, value, description, [order], isActive, is_active,
                steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax,
                shopEfficiency, fieldEfficiency, price,
                admin_owner_id, is_system_default, created_at, updated_at, updated_by)
             VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [
              category, vals.label, vals.value || vals.label, vals.description || '',
              0,
              vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
              vals.widthMin ?? null, vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null,
              vals.shopEfficiency ?? null, vals.fieldEfficiency ?? null, vals.price ?? null,
              adminOwnerId, now, now, userEmail,
            ]
          );
          rowsAdded++;
          importLog.push({ action: 'added', label: vals.label });
        } catch (e) {
          logger.error(`[Library] Import insert failed for row ${row.excelRow}:`, e);
          rowsSkipped++;
        }
      } else {
        // UPDATE existing row
        try {
          await db.query(
            `UPDATE dictionary
             SET label = ?, value = ?, description = ?,
                 steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?,
                 widthMin = ?, widthMax = ?, spanMin = ?, spanMax = ?,
                 shopEfficiency = ?, fieldEfficiency = ?, price = ?,
                 updated_at = ?, updated_by = ?
             WHERE id = ?`,
            [
              vals.label, vals.value || vals.label, vals.description || '',
              vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
              vals.widthMin ?? null, vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null,
              vals.shopEfficiency ?? null, vals.fieldEfficiency ?? null, vals.price ?? null,
              now, userEmail, row.id,
            ]
          );
          rowsUpdated++;
          importLog.push({ action: 'updated', id: row.id, label: vals.label });
        } catch (e) {
          logger.error(`[Library] Import update failed for row ${row.excelRow}:`, e);
          rowsSkipped++;
        }
      }
    }

    // Process conflict rows based on resolutions
    for (const conflict of parsed.conflicts) {
      const resolution = resolutionMap.get(conflict.excelRow) || { action: 'skip' };
      const vals = buildDbValues(conflict, categorySchema);

      if (resolution.action === 'skip') {
        rowsSkipped++;
        importLog.push({ action: 'skipped', label: conflict.label, reason: 'conflict-skip' });
        continue;
      }

      if (resolution.action === 'merge' && conflict.id) {
        // For locked system defaults: only update numeric fields, never label
        const isLocked = conflict._conflictType === 'update_locked';
        try {
          await db.query(
            `UPDATE dictionary
             SET ${isLocked ? '' : 'label = ?, value = ?,'}
                 steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?,
                 widthMin = ?, widthMax = ?, spanMin = ?, spanMax = ?,
                 shopEfficiency = ?, fieldEfficiency = ?, price = ?,
                 updated_at = ?, updated_by = ?
             WHERE id = ?`,
            [
              ...(isLocked ? [] : [vals.label, vals.value || vals.label]),
              vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
              vals.widthMin ?? null, vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null,
              vals.shopEfficiency ?? null, vals.fieldEfficiency ?? null, vals.price ?? null,
              now, userEmail, conflict.id,
            ]
          );
          rowsUpdated++;
          importLog.push({ action: 'merged', id: conflict.id, label: vals.label });
        } catch (e) {
          logger.error(`[Library] Import merge failed for row ${conflict.excelRow}:`, e);
          rowsSkipped++;
        }
      }

      if (resolution.action === 'rename') {
        // Add as new row with a modified label
        const renamedLabel = `${vals.label} (Imported ${new Date().toLocaleDateString()})`;
        try {
          await db.query(
            `INSERT INTO dictionary
               (category, label, value, description, [order], isActive, is_active,
                steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMax, spanMin, spanMax, price,
                admin_owner_id, is_system_default, created_at, updated_at, updated_by)
             VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [
              category, renamedLabel, vals.value || renamedLabel, vals.description || '',
              0,
              vals.steelLbsLf ?? null, vals.shopLaborMhLf ?? null, vals.fieldLaborMhLf ?? null,
              vals.widthMax ?? null, vals.spanMin ?? null, vals.spanMax ?? null, vals.price ?? null,
              adminOwnerId, now, now, userEmail,
            ]
          );
          rowsAdded++;
          importLog.push({ action: 'renamed', original: conflict.label, newLabel: renamedLabel });
        } catch (e) {
          logger.error(`[Library] Import rename failed for row ${conflict.excelRow}:`, e);
          rowsSkipped++;
        }
      }
    }

    // Write audit log
    await writeAuditLog({
      moduleName: category,
      action: 'IMPORT',
      filename: req.file.originalname,
      rowsAdded,
      rowsUpdated,
      rowsSkipped,
      createdBy: userEmail,
      details: { importLog, filename: req.file.originalname },
    });

    logger.info(`[Library] Import complete: ${category} — added=${rowsAdded}, updated=${rowsUpdated}, skipped=${rowsSkipped} by ${userEmail}`);

    res.json({
      success: true,
      message: `Import complete: ${rowsAdded} added, ${rowsUpdated} updated, ${rowsSkipped} skipped`,
      rowsAdded, rowsUpdated, rowsSkipped,
    });
  } catch (err) {
    logger.error(`[Library] Import error for ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
