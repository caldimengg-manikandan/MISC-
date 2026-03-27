/**
 * validator.js
 * Sanitization and validation layer for calculation inputs.
 */

class Validator {
  sanitizeInput(data) {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null; // Empty payload guard
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [] : {};
      for (const key in data) {
        sanitized[key] = this.sanitizeInput(data[key]);
      }
      return sanitized;
    }
    
    if (typeof data === 'number') {
      if (isNaN(data)) return 0;
      return data; // Allow negative if needed (for offsets), but usually 0+
    }
    
    if (data === null || data === undefined) return 0;
    
    return data;
  }

  normalizeUnits(data) {
    // Placeholder for unit normalization logic if UI sends mixed units
    // For now, ensures we are working with standard numbers
    return data;
  }

  safeDivide(a, b) {
    if (!b || b === 0) return 0;
    return a / b;
  }

  validateCalculationPayload(payload) {
    const { rails, platforms, stairs } = payload;
    
    if (rails && !Array.isArray(rails)) throw new Error('rails must be an array');
    if (platforms && !Array.isArray(platforms)) throw new Error('platforms must be an array');
    if (stairs && !Array.isArray(stairs)) throw new Error('stairs must be an array');
    
    return true;
  }
}

module.exports = new Validator();
