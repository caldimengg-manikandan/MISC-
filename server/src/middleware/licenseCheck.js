// server/src/middleware/licenseCheck.js
// Validates license status on every authenticated request.
// Uses a 1-hour JWT cache to avoid hitting DB on every call.
//
// C2: Superadmin skips the LICENSE check only.
//     The SESSION check in auth.js STILL applies to superadmin. These are separate.
//
// I4: License check runs on every request, not just login.

const db = require('../config/mssql');

async function getLicenseForUser(userId, role, adminOwnerId) {
  let adminId;
  if (role === 'admin' || role === 'superadmin') {
    adminId = userId;
  } else {
    // estimator — look up via their admin
    adminId = adminOwnerId;
  }

  if (!adminId) return null;

  const [rows] = await db.query(
    `SELECT l.is_active, l.valid_until, l.max_estimators
     FROM licenses l
     WHERE l.admin_user_id = ? AND l.is_active = 1`,
    [adminId]
  );
  return rows[0] || null;
}

module.exports = async (req, res, next) => {
  try {
    // C2: Superadmin has no license — skip license check.
    // Note: session_token check in auth.js STILL applies to superadmin.
    if (req.userRole === 'superadmin') return next();

    // Check JWT cache (1-hour TTL)
    const tokenAge = req.user.tokenIssuedAt
      ? Date.now() - new Date(req.user.tokenIssuedAt).getTime()
      : Infinity;

    if (tokenAge < 3_600_000 && req.user.licenseValid === true) {
      // Cache hit — trust the JWT's cached license state
      return next();
    }

    // Cache expired or missing — re-verify from DB
    const license = await getLicenseForUser(
      req.userId,
      req.userRole,
      req.user.admin_owner_id
    );

    if (!license) {
      return res.status(403).json({
        licenseInactive: true,
        message: 'No active license found. Contact your administrator.'
      });
    }

    if (new Date(license.valid_until) < new Date()) {
      return res.status(403).json({
        licenseExpired: true,
        message: 'Your license has expired. Contact your administrator.'
      });
    }

    if (!license.is_active) {
      return res.status(403).json({
        licenseInactive: true,
        message: 'Your license has been deactivated. Contact your administrator.'
      });
    }

    next();
  } catch (err) {
    console.error('License check error:', err.message);
    next(); // fail open to avoid locking out users on DB errors
  }
};

module.exports.getLicenseForUser = getLicenseForUser;
