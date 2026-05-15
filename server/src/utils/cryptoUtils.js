// server/src/utils/cryptoUtils.js
const crypto = require('crypto');

function generateLicenseSignature(licenseData) {
  // We compute an HMAC of the critical fields using a secret key
  const secret = process.env.LICENSE_SECRET || process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';
  
  // Create a deterministic string out of the critical fields
  // It's important to use a consistent format.
  const payload = [
    licenseData.license_key,
    licenseData.admin_user_id,
    licenseData.license_type,
    licenseData.max_estimators,
    // Convert dates to a consistent ISO string or timestamp format if they exist
    (() => {
      if (!licenseData.valid_until) return 'null';
      try {
        const d = new Date(licenseData.valid_until);
        if (isNaN(d.getTime())) return 'invalid';
        return d.toISOString().split('T')[0];
      } catch (e) {
        return 'error';
      }
    })(),
    licenseData.is_active !== undefined ? (licenseData.is_active ? '1' : '0') : '1'
  ].join('|');

  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyLicenseSignature(licenseData, storedSignature) {
  if (!storedSignature) return false;
  const expectedSignature = generateLicenseSignature(licenseData);
  return crypto.timingSafeEqual(Buffer.from(storedSignature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
}

module.exports = {
  generateLicenseSignature,
  verifyLicenseSignature
};
