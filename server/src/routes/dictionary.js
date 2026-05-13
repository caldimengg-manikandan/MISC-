const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (!['admin', 'owner', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

/**
 * Resolve the "admin owner ID" for the current user.
 * - If admin/superadmin → their own userId
 * - If estimator → their admin_owner_id from the JWT
 * This is the tenant boundary key for dictionary isolation.
 */
function resolveAdminOwnerId(req) {
  const role = req.user?.role || req.userRole;
  if (role === 'admin' || role === 'superadmin') {
    return req.userId || req.user?.id;
  }
  // Estimators belong to their admin owner
  return req.user?.admin_owner_id || null;
}

// @route   GET /api/dictionary/:category
// @desc    Get dictionary entries for a category.
//          Returns: global system defaults (admin_owner_id IS NULL) + tenant-specific entries.
//          ?all=true also includes inactive entries (for management UI).
router.get('/:category', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const adminOwnerId = resolveAdminOwnerId(req);
    console.log(`[Dictionary] Fetching category: ${req.params.category} (showAll: ${showAll}, tenant: ${adminOwnerId})`);

    let query;
    let params;

    if (showAll) {
      // Management view: global defaults + this tenant's entries (all active states)
      query = `SELECT id, category, label, value, description, [order], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price, isActive, admin_owner_id, is_system_default, created_at, updated_at, updated_by
               FROM dictionary
               WHERE category = ? AND (admin_owner_id IS NULL OR admin_owner_id = ?)
               ORDER BY CASE WHEN admin_owner_id IS NULL THEN 0 ELSE 1 END, [order] ASC, label ASC`;
      params = [req.params.category, adminOwnerId];
    } else {
      // Normal dropdown view: global defaults + active tenant entries
      query = `SELECT id, category, label, value, description, [order], steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price, isActive, admin_owner_id, is_system_default, created_at, updated_at, updated_by
               FROM dictionary
               WHERE category = ?
                 AND (isActive = 1 OR isActive IS NULL)
                 AND (admin_owner_id IS NULL OR admin_owner_id = ?)
               ORDER BY CASE WHEN admin_owner_id IS NULL THEN 0 ELSE 1 END, [order] ASC, label ASC`;
      params = [req.params.category, adminOwnerId];
    }

    const [entries] = await db.query(query, params);
    console.log(`[Dictionary] Found ${entries.length} entries for ${req.params.category} (tenant: ${adminOwnerId})`);

    const normalized = entries.map(e => ({
      ...e,
      isGlobalDefault: e.admin_owner_id === null,
      isSystemDefault: e.is_system_default === 1 || e.is_system_default === true,
      steelLbsLf: e.steelLbsLf != null ? parseFloat(e.steelLbsLf) : null,
      shopLaborMhLf: e.shopLaborMhLf != null ? parseFloat(e.shopLaborMhLf) : null,
      fieldLaborMhLf: e.fieldLaborMhLf != null ? parseFloat(e.fieldLaborMhLf) : null,
      widthMin: e.widthMin != null ? parseFloat(e.widthMin) : null,
      widthMax: e.widthMax != null ? parseFloat(e.widthMax) : null,
      spanMin: e.spanMin != null ? parseFloat(e.spanMin) : null,
      spanMax: e.spanMax != null ? parseFloat(e.spanMax) : null,
      shopEfficiency: e.shopEfficiency != null ? parseFloat(e.shopEfficiency) : null,
      fieldEfficiency: e.fieldEfficiency != null ? parseFloat(e.fieldEfficiency) : null,
      price: e.price != null ? parseFloat(e.price) : null,
    }));

    res.json({ success: true, data: normalized });
  } catch (err) {
    console.error(`[Dictionary] Error fetching ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/dictionary/all/categories
// @desc    Get all dictionary entries grouped by category (admin view - tenant scoped)
router.get('/all/categories', auth, adminOnly, async (req, res) => {
  try {
    const adminOwnerId = resolveAdminOwnerId(req);
    const [entries] = await db.query(
      `SELECT id, category, label, value, description, [order], isActive, steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price, admin_owner_id
       FROM dictionary
       WHERE admin_owner_id IS NULL OR admin_owner_id = ?
       ORDER BY category ASC, [order] ASC`,
      [adminOwnerId]
    );
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/dictionary
// @desc    Add or Reactivate a dictionary entry (scoped to this tenant)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { category, label, value, description, order, steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price } = req.body;
    const adminOwnerId = resolveAdminOwnerId(req);

    console.log(`[Dictionary] Attempting to add/reactivate: ${category} -> ${label} (${value}) for tenant: ${adminOwnerId}`);

    // Check if exists for THIS TENANT only (not global defaults)
    const [existing] = await db.query(
      'SELECT id, isActive FROM dictionary WHERE category = ? AND value = ? AND admin_owner_id = ?',
      [category, value, adminOwnerId]
    );

    if (existing.length > 0) {
      if (existing[0].isActive == 0 || existing[0].isActive === null || existing[0].is_active == 0) {
        console.log(`[Dictionary] Reactivating existing inactive entry: ${existing[0].id}`);
        await db.query(
          'UPDATE dictionary SET label = ?, [order] = ?, isActive = 1, is_active = 1, steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?, widthMin = ?, widthMax = ?, spanMin = ?, spanMax = ?, shopEfficiency = ?, fieldEfficiency = ?, price = ? WHERE id = ? AND admin_owner_id = ?',
          [label, order || 0, steelLbsLf || null, shopLaborMhLf || null, fieldLaborMhLf || null, widthMin || null, widthMax || null, spanMin || null, spanMax || null, shopEfficiency || null, fieldEfficiency || null, price || null, existing[0].id, adminOwnerId]
        );
        const [updatedEntry] = await db.query('SELECT * FROM dictionary WHERE id = ?', [existing[0].id]);
        return res.status(200).json({ success: true, data: updatedEntry[0], message: 'Reactivated existing entry' });
      }
      console.log(`[Dictionary] Conflict: Active value already exists for this tenant: ${value}`);
      return res.status(400).json({ success: false, message: 'Value already exists in this category' });
    }

    const [rows] = await db.query(
      'INSERT INTO dictionary (category, label, value, description, [order], isActive, is_active, steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price, admin_owner_id) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [category, label, value, description || '', order || 0, steelLbsLf || null, shopLaborMhLf || null, fieldLaborMhLf || null, widthMin || null, widthMax || null, spanMin || null, spanMax || null, shopEfficiency || null, fieldEfficiency || null, price || null, adminOwnerId]
    );

    const [newEntry] = await db.query('SELECT * FROM dictionary WHERE id = ?', [rows[0].id]);
    console.log(`[Dictionary] Successfully added entry with ID: ${rows[0].id} for tenant: ${adminOwnerId}`);
    res.status(201).json({ success: true, data: newEntry[0] });
  } catch (err) {
    console.error(`[Dictionary] Error adding entry to ${req.body.category}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/dictionary/:id
// @desc    Update a dictionary entry (tenant-scoped - cannot edit global defaults)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const adminOwnerId = resolveAdminOwnerId(req);
    const { category, label, value, description, order, isActive, steelLbsLf, shopLaborMhLf, fieldLaborMhLf, widthMin, widthMax, spanMin, spanMax, shopEfficiency, fieldEfficiency, price } = req.body;

    // Security: ensure the entry belongs to this tenant
    const [check] = await db.query('SELECT id, admin_owner_id FROM dictionary WHERE id = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Entry not found' });
    if (check[0].admin_owner_id !== null && check[0].admin_owner_id != adminOwnerId) {
      return res.status(403).json({ success: false, message: 'Cannot edit another tenant\'s dictionary entry' });
    }

    await db.query(
      'UPDATE dictionary SET category = ?, label = ?, value = ?, description = ?, [order] = ?, isActive = ?, steelLbsLf = ?, shopLaborMhLf = ?, fieldLaborMhLf = ?, widthMin = ?, widthMax = ?, spanMin = ?, spanMax = ?, shopEfficiency = ?, fieldEfficiency = ?, price = ?, updated_at = GETDATE(), updated_by = ? WHERE id = ?',
      [
        category,
        label,
        value,
        description || '',
        order || 0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        steelLbsLf || null,
        shopLaborMhLf || null,
        fieldLaborMhLf || null,
        widthMin || null,
        widthMax || null,
        spanMin || null,
        spanMax || null,
        shopEfficiency || null,
        fieldEfficiency || null,
        price || null,
        req.user?.email || String(req.user?.id),
        req.params.id
      ]
    );

    const [updated] = await db.query('SELECT * FROM dictionary WHERE id = ?', [req.params.id]);
    if (updated.length === 0) return res.status(404).json({ success: false, message: 'Entry not found' });

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/dictionary/:id
// @desc    Delete a dictionary entry (tenant-scoped - cannot delete global defaults)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const adminOwnerId = resolveAdminOwnerId(req);

    // Security: only allow deleting own entries, or global defaults if user is admin/superadmin
    const [check] = await db.query('SELECT id, admin_owner_id, is_system_default FROM dictionary WHERE id = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Entry not found' });

    // Block deletion of system defaults regardless of who is asking
    if (check[0].is_system_default === 1 || check[0].is_system_default === true) {
      return res.status(403).json({ success: false, message: 'Cannot delete a system default entry. System defaults are protected.' });
    }

    const isGlobalDefault = check[0].admin_owner_id === null;
    const isOwner = check[0].admin_owner_id == adminOwnerId;
    const isSuperAdmin = req.user.role === 'superadmin';
    const isAdmin = req.user.role === 'admin' || req.user.role === 'owner';

    if (isGlobalDefault) {
      // Allow admin or superadmin to delete global defaults
      if (!isAdmin && !isSuperAdmin) {
        return res.status(403).json({ success: false, message: 'Only admins can delete system default entries' });
      }
      await db.query('DELETE FROM dictionary WHERE id = ? AND admin_owner_id IS NULL', [req.params.id]);
    } else {
      // Tenant-specific. Only the owner or a superadmin can delete.
      if (!isOwner && !isSuperAdmin) {
        return res.status(403).json({ success: false, message: 'Cannot delete another tenant\'s dictionary entry' });
      }
      await db.query('DELETE FROM dictionary WHERE id = ?', [req.params.id]);
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/dictionary/seed/initial
// @desc    Seed initial dictionary data (global defaults - no tenant)
router.post('/seed/initial', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM dictionary WHERE admin_owner_id IS NULL', []);
    const count = rows[0].count;
    if (count > 0 && !req.body.force) {
      return res.json({ success: true, message: 'Dictionary already seeded', count });
    }

    const initialData = [
      ['stair_type', 'Pan Plate — Concrete Filled', 'pan-concrete', 1],
      ['stair_type', 'Grating Tread', 'grating-tread', 2],
      ['stair_type', 'Non-Metal Stair', 'non-metal', 3],

      ['grating_type', '1 1/4" Bar grating / Welded', '1 1/4" Bar grating / Welded', 1],
      ['grating_type', '1 1/4" Bar grating / Bolted', '1 1/4" Bar grating / Bolted', 2],
      ['grating_type', '1" Bar grating / Welded', '1" Bar grating / Welded', 3],
      ['grating_type', '1" Bar grating / Bolted', '1" Bar grating / Bolted', 4],
      ['grating_type', 'McNichols Treads', 'McNichols Treads', 5],
      ['grating_type', 'Other Pre-fabricated Treads', 'Other Pre-fabricated Treads', 6],

      ['steel_grade_stair', 'A992', 'A992', 1],
      ['steel_grade_stair', 'A572-50', 'A572-50', 2],
      ['steel_grade_stair', 'A36', 'A36', 3],
      ['steel_grade_stair', 'SS316', 'SS316', 4],
      ['steel_grade_stair', 'SS304', 'SS304', 5],

      ['steel_grade_rail', 'A53', 'A53', 1],
      ['steel_grade_rail', 'A500C', 'A500C', 2],
      ['steel_grade_rail', 'A500B', 'A500B', 3],
      ['steel_grade_rail', 'SS316', 'SS316', 4],
      ['steel_grade_rail', 'SS306', 'SS306', 5],

      ['finish_option', 'PRIMER', 'PRIMER', 1],
      ['finish_option', 'PAINTED', 'PAINTED', 2],
      ['finish_option', 'GALVANIZED', 'GALVANIZED', 3],
      ['finish_option', 'GALV+PAINTED', 'GALV+PAINTED', 4],
      ['finish_option', 'POWDER COATED', 'POWDER COATED', 5],

      ['connection_type', 'WELDED', 'WELDED', 1],
      ['connection_type', 'BOLTED', 'BOLTED', 2],

      ['mounting_type', 'Bolted to Stringer', 'Bolted to Stringer', 1],
      ['mounting_type', 'Welded to Stringer', 'Welded to Stringer', 2],
      ['mounting_type', 'Side Mounted Bolted', 'Side Mounted Bolted', 3],
      ['mounting_type', 'Side Mounted Welded', 'Side Mounted Welded', 4],
      ['mounting_type', 'Embedded', 'Embedded', 5],
      ['mounting_type', 'Anchored', 'Anchored', 6],
    ];

    if (req.body.force) await db.query('DELETE FROM dictionary WHERE admin_owner_id IS NULL', []);

    for (const item of initialData) {
      // admin_owner_id = NULL means "global default visible to all"
      await db.query(
        'INSERT INTO dictionary (category, label, value, [order], isActive, admin_owner_id) VALUES (?, ?, ?, ?, 1, NULL)',
        item
      );
    }

    const [finalCount] = await db.query('SELECT COUNT(*) as count FROM dictionary WHERE admin_owner_id IS NULL', []);
    res.json({ success: true, count: finalCount[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
