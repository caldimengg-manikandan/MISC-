// server/src/utils/resolveOwnerAdminId.js
// Resolves the correct owner_admin_id for data scoping queries.
//
// I6 fix: auth.js always fetches user fresh from DB, so req.user.admin_owner_id
//         is always populated for estimators after migration. The DB fallback
//         below handles the edge case of stale deployments.

const db = require('../config/mssql');

/**
 * Returns the admin ID that owns the data for the current user.
 * - superadmin → null (no filter — sees everything)
 * - admin      → req.userId (their own data)
 * - estimator  → their admin's ID (from DB, fresh)
 *
 * Usage:
 *   const ownerAdminId = await resolveOwnerAdminId(req);
 *   if (ownerAdminId !== null) query += ' AND owner_admin_id = ?';
 */
async function resolveOwnerAdminId(req) {
  if (req.userRole === 'superadmin') return null; // no filter

  if (req.userRole === 'admin') return req.userId;

  // Estimator: use fresh DB value from req.user
  if (req.user && req.user.admin_owner_id) {
    return req.user.admin_owner_id;
  }

  // Fallback for estimators: check DB directly
  const [rows] = await db.query(
    'SELECT role, admin_owner_id FROM users WHERE id = ?',
    [req.userId]
  );
  
  if (!rows.length) return req.userId;
  
  const user = rows[0];
  if (user.role === 'admin') return req.userId;
  if (user.role === 'superadmin') return null;
  
  return user.admin_owner_id || req.userId; // Default to self if no owner found
}

module.exports = resolveOwnerAdminId;
