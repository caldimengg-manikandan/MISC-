// server/src/middleware/requireRole.js
// Role-based access control middleware

/**
 * Require superadmin role only.
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin privileges required.'
    });
  }
  next();
};

/**
 * Require admin role (or superadmin — superadmin can do everything admin can).
 */
const requireAdmin = (req, res, next) => {
  if (!['admin', 'superadmin', 'owner'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Require at least estimator access (any authenticated role).
 */
const requireEstimator = (req, res, next) => {
  if (!['estimator', 'admin', 'superadmin', 'owner'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }
  next();
};

module.exports = { requireSuperAdmin, requireAdmin, requireEstimator };
