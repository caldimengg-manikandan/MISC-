const express = require('express');
const router = express.Router();
const { upload, scanFile } = require('../middleware/upload');
const excelService = require('../services/excelService');
const db = require('../config/mssql');
const logger = require('../utils/logger');

// Upload Excel file with prices
router.post('/upload', upload.single('excelFile'), scanFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No Excel file uploaded'
      });
    }
    
    // Process Excel file securely
    const result = await excelService.processExcelFile(req.file.path, req.userId);
    
    // Save prices to database
    const savedPrices = [];
    const errors = [];
    
    for (const [type, data] of Object.entries(result.data)) {
      try {
        const typeKey = type.toLowerCase().trim();
        const company = req.user.company;
        
        // Check if exists
        const [existing] = await db.query(
          'SELECT id FROM pricing WHERE type = ? AND company = ?',
          [typeKey, company]
        );

        if (existing.length > 0) {
          // Update
          await db.query(
            'UPDATE pricing SET steelPerLF = ?, shopMHPerLF = ?, fieldMHPerLF = ?, description = ?, sourceFile = ?, lastUpdated = GETDATE(), uploadedBy = ? WHERE type = ? AND company = ?',
            [data.steelPerLF, data.shopMHPerLF, data.fieldMHPerLF, data.description || '', req.file.originalname, req.userId, typeKey, company]
          );
        } else {
          // Insert
          await db.query(
            'INSERT INTO pricing (type, description, steelPerLF, shopMHPerLF, fieldMHPerLF, company, uploadedBy, sourceFile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [typeKey, data.description || '', data.steelPerLF, data.shopMHPerLF, data.fieldMHPerLF, company, req.userId, req.file.originalname]
          );
        }
        
        savedPrices.push(typeKey);
      } catch (error) {
        errors.push({
          type,
          error: error.message
        });
      }
    }
    
    // Send response
    res.json({
      success: true,
      message: 'Excel file processed successfully',
      summary: result.summary,
      savedPrices: {
        count: savedPrices.length,
        types: savedPrices
      },
      errors: errors.length > 0 ? errors : undefined,
      warning: errors.length > 0 ? 'Some prices could not be saved' : undefined
    });
    
    // Log successful import
    logger.info('Excel import completed', {
      userId: req.userId,
      company: req.user.company,
      file: req.file.originalname,
      savedCount: savedPrices.length,
      errorCount: errors.length
    });
    
  } catch (error) {
    logger.error('Excel import failed', {
      error: error.message,
      userId: req.userId,
      filename: req.file?.originalname
    });
    
    // Clean up file if it exists
    if (req.file?.path) {
      try { require('fs').unlinkSync(req.file.path); } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process Excel file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Download price template
router.get('/template', (req, res) => {
  try {
    const template = [
      ['Type', 'Steel_Lbs_per_LF', 'Shop_MH_per_LF', 'Field_MH_per_LF', 'Description'],
      ['wallRail_fline_hand_railing', '3.300', '0.300', '0.250', 'F-Line Hand Railing'],
      ['grabRail_fline_handrailing_guardrail', '2.850', '0.300', '0.280', 'Grab Rail'],
      ['guardRail_type_1', '21.000', '0.875', '0.450', 'Guard Rail Type 1'],
      ['guardRail_type_2', '25.000', '1.000', '0.550', 'Guard Rail Type 2']
    ];
    
    let csvContent = '';
    template.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=steel_prices_template.csv');
    res.send(csvContent);
    
  } catch (error) {
    logger.error('Template download failed', {
      error: error.message,
      userId: req.userId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate template'
    });
  }
});

module.exports = router;