// server/src/utils/auditLogger.js
// Append-only audit log writer. Strips sensitive fields before persisting.

const db = require('../config/mssql');

// Fields that must NEVER appear in audit logs
const SENSITIVE_KEYS = [
  'password', 'password_hash', 'token', 'auth_token', 'refresh_token',
  'secret', 'jwt_secret', 'license_key', 'otp', 'otp_code',
  'session_token', 'encryption_key', 'api_key'
];

/**
 * Deep-clones an object and redacts all sensitive keys.
 * @param {any} obj
 * @returns {any} sanitized clone
 */
function sanitizeForLog(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog);
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeForLog(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Writes a single audit record. Never throws — logs errors to console instead.
 * @param {object} req     - Express request (for userId, ip, user-agent)
 * @param {string} action  - CREATE | UPDATE | DELETE | LOGIN | LOGOUT | LOGIN_FAIL
 * @param {string} resource - Table/module name, e.g. 'projects', 'users'
 * @param {string|number} recordId - Affected record ID (null for global actions)
 * @param {object} before  - State before change (null for CREATE/LOGIN)
 * @param {object} after   - State after change (null for DELETE/LOGOUT)
 */
async function auditLog(req, action, resource, recordId = null, before = null, after = null) {
  try {
    const userId = req?.userId || null;
    const ip = req?.ip || null;
    const ua = req?.get?.('User-Agent') || null;

    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource, record_id, before_val, after_val, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        resource,
        recordId ? String(recordId) : null,
        before ? JSON.stringify(sanitizeForLog(before)) : null,
        after  ? JSON.stringify(sanitizeForLog(after))  : null,
        ip,
        ua,
      ]
    );
  } catch (err) {
    // Audit failure must NEVER break the main request flow
    console.error('[AuditLog] Failed to write audit record:', err.message);
  }
}

module.exports = { auditLog, sanitizeForLog };
