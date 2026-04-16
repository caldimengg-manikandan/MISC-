// server/src/middleware/requireRole.js
// Role-based access control middleware for workflow endpoints

/**
 * Require the user to have admin role.
 * Returns 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Require the user to be an estimator or admin.
 * Returns 403 for unauthenticated or unknown roles.
 */
const requireEstimator = (req, res, next) => {
  if (!['estimator', 'admin', 'user', 'owner'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }
  next();
};

module.exports = { requireAdmin, requireEstimator };
