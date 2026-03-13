const crypto = require('crypto');

class SecurityUtils {
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashData(data, salt = process.env.HASH_SALT) {
    const hash = crypto.createHmac('sha256', salt);
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  static encrypt(text, key = process.env.ENCRYPTION_KEY) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  static decrypt(encryptedData, key = process.env.ENCRYPTION_KEY) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }

  static validateExcelHeaders(headers) {
    const required = ['type', 'steel_lbs_per_lf', 'shop_mh_per_lf', 'field_mh_per_lf'];
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    
    return required.every(h => lowerHeaders.includes(h));
  }
}

module.exports = SecurityUtils;