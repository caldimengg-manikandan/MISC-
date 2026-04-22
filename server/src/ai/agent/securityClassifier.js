/**
 * securityClassifier.js
 * Runs BEFORE vector search or tool execution to protect the agent from 
 * leaking credentials, system internals, or handling malicious prompts.
 */

const db = require('../../config/mssql');
const { onSecurityAlert } = require('../../services/NotificationService');

const BLOCKED_PATTERNS = [
  { p: /password/i, cat: 'Passwords' },
  { p: /credentials?/i, cat: 'Passwords' },
  { p: /passwd/i, cat: 'Passwords' },
  
  { p: /login\s+as/i, cat: 'Credential access' },
  { p: /log\s+me\s+in/i, cat: 'Credential access' },
  { p: /bypass.{0,20}login/i, cat: 'Credential access' },
  { p: /access.{0,20}(another|other).{0,20}(user|account)/i, cat: 'Credential access' },
  { p: /(give|show).{0,20}(another|other).{0,10}(user|login)/i, cat: 'Credential access' },

  { p: /list\s+all\s+users/i, cat: 'User enumeration' },
  { p: /all\s+(admin|user)\s+emails/i, cat: 'User enumeration' },
  { p: /who\s+has\s+access/i, cat: 'User enumeration' },
  { p: /who\s+are\s+(the\s+)?(admins|administrators|admin\s+users)/i, cat: 'User enumeration' },
  { p: /(give|show|list).{0,20}all.{0,20}(user|account)/i, cat: 'User enumeration' },
  { p: /what\s+users\s+exist/i, cat: 'User enumeration' },
  { p: /how\s+many\s+users\s+(does|do|are\s+in|exist)/i, cat: 'User enumeration' },

  { p: /access.{0,20}(another|other).{0,20}company/i, cat: 'Other company data' },
  { p: /company.{0,10}(id|ID).{0,10}\d+/i, cat: 'Other company data' },
  { p: /(switch|access|move).{0,20}different\s+company/i, cat: 'Other company data' },
  { p: /switch.{0,20}(company|account)/i, cat: 'Other company data' },
  { p: /show me .{0,40}(co\.|corp|inc|llc|ltd|company|co,|test).{0,20}projects/i, cat: 'Other company data' },
  { p: /(show|get|list|access).{0,20}[A-Z][a-zA-Z\s]+\s+(co\.|corp|inc|llc|projects)/i, cat: 'Other company data' },

  { p: /\.env/i, cat: 'System internals' },
  { p: /api\s+key/i, cat: 'System internals' },
  { p: /jwt\s+secret/i, cat: 'System internals' },
  { p: /connection\s+string/i, cat: 'System internals' },
  { p: /database\s+(password|credentials)/i, cat: 'System internals' },

  { p: /ignore\s+(previous|your|all)\s+instructions/i, cat: 'Prompt injection' },
  { p: /disregard/i, cat: 'Prompt injection' },
  { p: /pretend\s+(you\s+are|to\s+be)/i, cat: 'Prompt injection' },
  { p: /your\s+new\s+instructions/i, cat: 'Prompt injection' },
  { p: /forget.{0,20}(what|your|the|instructions)/i, cat: 'Prompt injection' },

  { p: /i\s+am\s+(the\s+)?(admin|ceo|owner)/i, cat: 'Social engineering' },
  { p: /emergency\s+(access|override)/i, cat: 'Social engineering' },
  { p: /bypass.{0,20}restrictions/i, cat: 'Social engineering' },
  { p: /i\s+am\s+from.{0,30}(support|team|anthropic)/i, cat: 'Social engineering' },
];

function classifySecurity(query) {
  for (const item of BLOCKED_PATTERNS) {
    if (item.p.test(query)) {
      return { blocked: true, category: item.cat };
    }
  }
  return { blocked: false };
}

function getRefusalMessage(category) {
  if (category === 'Passwords') {
    return "I can't help with passwords or credentials. To reset a password, use the Forgot Password option on the login page. For account access issues, contact your company admin.";
  }
  if (category === 'Credential access') {
    return "I can't assist with accessing other accounts. Each user must log in with their own credentials. Contact your admin if you need role changes.";
  }
  if (category === 'User enumeration') {
    return "I'm not able to share user account information. User management is available in Settings → User Management for admin users only.";
  }
  if (category === 'System internals') {
    return "I don't have access to system configuration, API keys, or infrastructure details. Please contact your system administrator for technical support.";
  }
  if (category === 'Prompt injection') {
    return "I'm here to help with MISC Pro estimation questions only. I can't change my operating instructions.";
  }
  if (category === 'Social engineering') {
    return "I can't verify identity claims through chat, and I'm not able to bypass security for any reason. Please use the official account recovery process or contact your admin directly.";
  }
  // Data fallback
  return "I only have access to your company's data. Data from other companies is completely isolated and inaccessible.";
}

async function logSecurityAttempt(userId, companyId, query, category, ipAddress) {
  try {
    // Insert into security log
    await db.query(
      `INSERT INTO ai_security_log (user_id, company_id, query, category, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, companyId, query, category, ipAddress || 'unknown']
    );

    // Check for 3+ incidents in the last 24 hours
    const [[{ incident_count }]] = await db.query(
      `SELECT COUNT(*) as incident_count 
       FROM ai_security_log 
       WHERE user_id = ? 
         AND company_id = ?
         AND created_at >= DATEADD(day, -1, GETDATE())`,
      [userId, companyId]
    );

    if (incident_count >= 3) {
      await onSecurityAlert(companyId, userId, incident_count);
    }

  } catch (err) {
    console.error('[SecurityClassifier] Failed to log security attempt:', err.message);
  }
}

module.exports = {
  classifySecurity,
  logSecurityAttempt,
  getRefusalMessage
};
