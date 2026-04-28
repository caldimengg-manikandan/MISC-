// server/src/utils/passwordPolicy.js
// Enforces minimum password complexity before any hash operation.

const COMMON_PASSWORDS = ['password123', '12345678901', 'qwerty12345', 'admin12345'];

/**
 * Validates a password against the security policy.
 * @param {string} password
 * @returns {string[]} Array of error messages. Empty = valid.
 */
function validatePassword(password) {
  if (typeof password !== 'string') return ['Password must be a string'];
  const errors = [];
  if (password.length < 12)              errors.push('Minimum 12 characters required');
  if (!/[A-Z]/.test(password))           errors.push('At least one uppercase letter required');
  if (!/[a-z]/.test(password))           errors.push('At least one lowercase letter required');
  if (!/[0-9]/.test(password))           errors.push('At least one number required');
  if (!/[!@#$%^&*\-_=+]/.test(password)) errors.push('At least one special character required (!@#$%^&*-_=+)');
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) errors.push('Password is too common');
  return errors;
}

/**
 * Throws a 400 response if the password fails policy. Use in route handlers.
 */
function enforcePasswordPolicy(password, res) {
  const errors = validatePassword(password);
  if (errors.length > 0) {
    res.status(400).json({ success: false, error: 'Password does not meet requirements', details: errors });
    return false;
  }
  return true;
}

module.exports = { validatePassword, enforcePasswordPolicy };
