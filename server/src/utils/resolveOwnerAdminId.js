// server/src/utils/resolveOwnerAdminId.js
// Resolves the correct owner_admin_id for data scoping queries.
//
// Every license is a fresh account. 
// - SuperAdmins return null (global view).
// - Admins return their own ID (they are the "License Owner").
// - Sub-users (estimators) return their admin_owner_id.

async function resolveOwnerAdminId(req) {
  // If role is missing or not authenticated, deny all data
  if (!req.userRole) return -1;

  // 1. SuperAdmins see everything (Global view)
  if (req.userRole === 'superadmin') {
    return null;
  }

  // 2. Admins are the owners of their own data/license
  if (req.userRole === 'admin') {
    return req.userId;
  }

  // 3. Sub-users (Estimators, etc.) must use their parent Admin's ID
  // req.user is already populated by auth.js fresh from the DB
  if (req.user && req.user.admin_owner_id) {
    return req.user.admin_owner_id;
  }

  // Fallback: If no owner_admin_id found for a non-admin, restrict to self only
  return req.userId;
}

module.exports = resolveOwnerAdminId;
