const ExcelJS = require('exceljs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class SecureExcelService {
  constructor() {
    this.salt = process.env.EXCEL_SALT || 'default_salt_change_in_production';
  }

  // Process Excel file securely
  async processExcelFile(filePath, userId) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Load workbook with security options
      await workbook.xlsx.readFile(filePath, {
        ignoreNodes: ['macros', 'activeX'], // Ignore potentially dangerous elements
      });
      
      // Get first worksheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheets found in Excel file');
      }
      
      // Validate worksheet structure
      this.validateWorksheet(worksheet);
      
      // Extract price data with validation
      const priceData = this.extractPriceData(worksheet);
      
      // Validate price data
      this.validatePriceData(priceData);
      
      // Encrypt sensitive data
      const encryptedData = this.encryptData(priceData);
      
      // Generate audit log
      this.logExcelProcessing(userId, priceData, filePath);
      
      // Delete the temporary file after processing
      this.cleanupFile(filePath);
      
      return {
        success: true,
        data: encryptedData,
        summary: {
          recordsProcessed: Object.keys(priceData).length,
          timestamp: new Date().toISOString(),
          processedBy: userId
        }
      };
      
    } catch (error) {
      // Clean up file on error
      this.cleanupFile(filePath);
      
      logger.error('Excel processing failed', {
        error: error.message,
        userId,
        filePath
      });
      
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  validateWorksheet(worksheet) {
    // Check for minimum required columns
    const headerRow = worksheet.getRow(1);
    const headers = [];
    
    headerRow.eachCell((cell) => {
      headers.push(cell.value?.toString().toLowerCase().trim());
    });
    
    const requiredHeaders = ['type', 'steel_lbs_per_lf', 'shop_mh_per_lf', 'field_mh_per_lf'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }
    
    // Check row count (reasonable limit)
    const rowCount = worksheet.rowCount;
    if (rowCount > 10000) {
      throw new Error('Excel file too large. Maximum 10,000 rows allowed.');
    }
  }

  extractPriceData(worksheet) {
    const priceData = {};
    const errors = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      try {
        const type = row.getCell(1).value?.toString().trim();
        const steelPerLF = this.parseNumber(row.getCell(2).value);
        const shopMHPerLF = this.parseNumber(row.getCell(3).value);
        const fieldMHPerLF = this.parseNumber(row.getCell(4).value);
        
        // Validate each row
        if (!type) {
          errors.push(`Row ${rowNumber}: Missing type`);
          return;
        }
        
        if (steelPerLF === null || shopMHPerLF === null || fieldMHPerLF === null) {
          errors.push(`Row ${rowNumber}: Invalid numeric values`);
          return;
        }
        
        // Range validation
        if (steelPerLF < 0 || steelPerLF > 1000) {
          errors.push(`Row ${rowNumber}: Steel lbs/LF out of range (0-1000)`);
          return;
        }
        
        if (shopMHPerLF < 0 || shopMHPerLF > 10) {
          errors.push(`Row ${rowNumber}: Shop MH/LF out of range (0-10)`);
          return;
        }
        
        if (fieldMHPerLF < 0 || fieldMHPerLF > 10) {
          errors.push(`Row ${rowNumber}: Field MH/LF out of range (0-10)`);
          return;
        }
        
        // Store validated data
        priceData[type] = {
          steelPerLF,
          shopMHPerLF,
          fieldMHPerLF,
          lastUpdated: new Date().toISOString(),
          source: 'excel_import'
        };
        
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });
    
    if (errors.length > 0) {
      logger.warn('Excel import validation errors', { errors });
    }
    
    if (Object.keys(priceData).length === 0) {
      throw new Error('No valid price data found in Excel file');
    }
    
    return priceData;
  }

  validatePriceData(priceData) {
    const types = Object.keys(priceData);
    
    // Check for duplicate types (case-insensitive)
    const lowerCaseTypes = types.map(t => t.toLowerCase());
    const duplicates = lowerCaseTypes.filter((t, i) => lowerCaseTypes.indexOf(t) !== i);
    
    if (duplicates.length > 0) {
      throw new Error(`Duplicate rail types found: ${duplicates.join(', ')}`);
    }
    
    // Validate each price entry
    for (const [type, data] of Object.entries(priceData)) {
      if (!type.match(/^[a-zA-Z0-9_-]+$/)) {
        throw new Error(`Invalid type name: ${type}. Use only letters, numbers, hyphens and underscores.`);
      }
      
      // Additional business logic validation
      if (data.steelPerLF <= 0) {
        throw new Error(`Invalid steel price for ${type}: Must be greater than 0`);
      }
    }
  }

  parseNumber(value) {
    if (value === null || value === undefined) return null;
    
    const num = Number(value);
    if (isNaN(num)) return null;
    
    return parseFloat(num.toFixed(3)); // Round to 3 decimal places
  }

  encryptData(data) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    
    // Simple XOR encryption for demonstration (use AES in production)
    const jsonString = JSON.stringify(data);
    let encrypted = '';
    
    for (let i = 0; i < jsonString.length; i++) {
      encrypted += String.fromCharCode(
        jsonString.charCodeAt(i) ^ 
        encryptionKey.charCodeAt(i % encryptionKey.length)
      );
    }
    
    return Buffer.from(encrypted).toString('base64');
  }

  decryptData(encryptedBase64) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    
    const encrypted = Buffer.from(encryptedBase64, 'base64').toString();
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ 
        encryptionKey.charCodeAt(i % encryptionKey.length)
      );
    }
    
    return JSON.parse(decrypted);
  }

  logExcelProcessing(userId, data, filePath) {
    const logEntry = {
      userId,
      action: 'excel_import',
      timestamp: new Date().toISOString(),
      recordsProcessed: Object.keys(data).length,
      fileHash: this.calculateFileHash(filePath),
      ip: '127.0.0.1' // In real app, get from request
    };
    
    logger.info('Excel import processed', logEntry);
    
    // Save to database (optional)
    // await AuditLog.create(logEntry);
  }

  calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');
  }

  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.error('Failed to cleanup file', {
        error: error.message,
        filePath
      });
    }
  }
}

module.exports = new SecureExcelService();