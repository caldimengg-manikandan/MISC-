// server/src/middleware/auth.js
// Authenticates JWT + validates session_token (single-session enforcement)
// I3: Session check applies to ALL roles — superadmin is NOT exempt
// I6: Always fetches user fresh from DB so admin_owner_id is always up-to-date

const jwt = require('jsonwebtoken');
const db = require('../config/mssql');

module.exports = async (req, res, next) => {
  try {
    let token = '';
    // 1. Read from HttpOnly cookie (preferred — not accessible to JS)
    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    // 2. Fall back to Authorization header (API clients, backward compat during migration)
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.replace('Bearer ', '').trim();
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    // Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always fetch fresh from DB — ensures admin_owner_id is never stale (I6 fix)
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // ── Single Session Enforcement (I3: applies to ALL roles including superadmin) ──
    // If a session_token is set in DB and the JWT carries a sessionToken, they must match.
    // Old JWTs without sessionToken are allowed through (backward compat) until next login.
    if (decoded.sessionToken && user.session_token && decoded.sessionToken !== user.session_token) {
      return res.status(401).json({
        sessionKicked: true,
        message: 'You were signed out because you logged in on another device.'
      });
    }

    // Attach user to request (strip password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword; // includes admin_owner_id from DB (I6 fix)
    
    // Fix: Propagate JWT cache variables so licenseCheck.js 1-hour cache works!
    if (decoded.tokenIssuedAt) req.user.tokenIssuedAt = decoded.tokenIssuedAt;
    if (decoded.licenseValid !== undefined) req.user.licenseValid = decoded.licenseValid;

    req.userId = user.id;
    req.userRole = user.role;
    req.companyId = user.company_id || decoded.companyId || null;

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};
