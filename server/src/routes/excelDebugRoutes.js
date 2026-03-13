const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const router = express.Router();

// Fix: Change from authMiddleware.js to auth.js
const authenticateToken = require('../middleware/auth');

// Debug endpoint to read all sheets from Excel
router.get('/excel/all-sheets', authenticateToken, async (req, res) => {
  // ... rest of your code remains the same
  try {
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.warn('Excel file not found for debug', { filePath });
      return res.status(404).json({
        success: false,
        error: 'Excel file not found. Please upload the file first.',
        suggestion: 'Use /api/secure/excel/upload to upload the Excel file'
      });
    }

    logger.info('Reading Excel file for debug', { filePath, userId: req.user.id });

    // Read the Excel file
    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // Get all sheet names
    const sheetNames = workbook.SheetNames;

    // Prepare response data
    const allSheetsData = {};

    // Read each sheet
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      allSheetsData[sheetName] = {
        rawData: data,
        jsonData: XLSX.utils.sheet_to_json(worksheet),
        sheetInfo: {
          name: sheetName,
          index: workbook.SheetNames.indexOf(sheetName),
          range: worksheet['!ref'],
          cellCount: Object.keys(worksheet).length - 1 // Exclude the !ref
        }
      };
    });

    logger.info('Excel file read successfully', {
      sheetCount: sheetNames.length,
      sheetNames: sheetNames.join(', ')
    });

    res.json({
      success: true,
      message: 'Excel file read successfully',
      fileInfo: {
        name: 'separate MISC sheets.xlsx',
        sheetCount: sheetNames.length,
        sheetNames: sheetNames,
        lastModified: fs.statSync(filePath).mtime,
        size: fs.statSync(filePath).size
      },
      sheets: allSheetsData
    });

  } catch (error) {
    logger.error('Excel debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read Excel file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint to get specific sheet data
router.get('/excel/sheet/:sheetName', authenticateToken, async (req, res) => {
  try {
    const { sheetName } = req.params;
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found'
      });
    }

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // Check if sheet exists
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(404).json({
        success: false,
        error: `Sheet '${sheetName}' not found`,
        availableSheets: workbook.SheetNames
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with different formats
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Clean data for structured format
    const nonEmptyRows = rawData.filter(row => row.some(cell => cell !== ''));
    const headers = nonEmptyRows[0] || [];

    const processedData = nonEmptyRows.slice(1).map((row, index) => {
      const item = { _row: index + 2 }; // Excel rows are 1-indexed, add 2 for header
      headers.forEach((header, colIndex) => {
        if (header && header.trim() !== '') {
          item[header.trim()] = row[colIndex] || '';
        }
      });
      return item;
    });

    res.json({
      success: true,
      sheetName: sheetName,
      sheetIndex: workbook.SheetNames.indexOf(sheetName),
      headers: headers.filter(h => h),
      rowCount: processedData.length,
      columnCount: headers.filter(h => h).length,
      rawData: rawData,
      jsonData: jsonData,
      processedData: processedData,
      worksheetInfo: {
        range: worksheet['!ref'],
        cellCount: Object.keys(worksheet).length - 1
      }
    });

  } catch (error) {
    logger.error('Sheet debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read sheet data'
    });
  }
});

// Endpoint to get Handrail sheet data specifically
// Endpoint to get categorized handrail data
router.get('/categorized-rails', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found'
      });
    }

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // Find the Handrail sheet
    const sheetName = 'Handrail';
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(404).json({
        success: false,
        error: `Sheet '${sheetName}' not found`
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    // Clean data
    const nonEmptyRows = rawData.filter(row => row.some(cell => cell !== ''));
    const headers = nonEmptyRows[0] || [];

    // Process data rows
    const processedData = nonEmptyRows.slice(1).map((row, index) => {
      const item = {};
      headers.forEach((header, colIndex) => {
        if (header && header.trim() !== '') {
          const value = row[colIndex];
          item[header.trim()] = value !== undefined ? value : '';
        }
      });
      return {
        ...item,
        excelRow: index + 2, // Excel rows are 1-indexed
        id: (item.Description || '').replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')
      };
    }).filter(item => item.Description && item.Description.trim() !== '');

    // Map all processed data to standardized rail items
    const allRailItems = processedData.map((item, index) => ({
      id: item.id,
      description: item.Description,
      steelLbsPerLF: parseFloat(item['STEEL LBS/LF']) || 0,
      shopMHPerLF: parseFloat(item['SHOP LABOR MH/LF']) || 0,
      fieldMHPerLF: parseFloat(item['FIELD LABOR MH/LF']) || 0,
      panRiserLbPerFt: parseFloat(item['PAN RISERLB/FT']) || 0,
      excelRow: index + 2,
      rawData: item
    }));

    // Categorize based on your requirements
    // User requested "all description items should come in the handrail dropdown"
    // To ensure flexibility, we will provide the full list to all categories
    // This allows the user to select any item from the sheet in any dropdown
    const categorizedData = {
      wallRail: allRailItems,
      grabRail: allRailItems,
      guardRail: allRailItems
    };

    logger.info('Categorized rail data', {
      wallRailCount: categorizedData.wallRail.length,
      grabRailCount: categorizedData.grabRail.length,
      guardRailCount: categorizedData.guardRail.length,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: categorizedData,
      metadata: {
        totalItems: processedData.length,
        categorizationMethod: 'description-keywords',
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Categorized rails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize rail data'
    });
  }
});
// Endpoint to list all sheet names and info
router.get('/sheets/list', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found'
      });
    }

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    const sheetInfo = workbook.SheetNames.map((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const nonEmptyRows = data.filter(row => row.some(cell => cell !== ''));

      return {
        name: sheetName,
        index: index,
        rowCount: nonEmptyRows.length - 1, // Exclude header
        columnCount: nonEmptyRows[0] ? nonEmptyRows[0].length : 0,
        hasData: nonEmptyRows.length > 1
      };
    });

    res.json({
      success: true,
      sheets: sheetInfo,
      totalSheets: workbook.SheetNames.length,
      fileInfo: {
        name: 'separate MISC sheets.xlsx',
        lastModified: fs.statSync(filePath).mtime,
        size: fs.statSync(filePath).size
      }
    });

  } catch (error) {
    logger.error('Sheets list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list sheets'
    });
  }
});

// Endpoint to validate Excel structure
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Excel file not found',
        isValid: false
      });
    }

    const validation = {
      isValid: true,
      issues: [],
      warnings: [],
      sheetValidation: {}
    };

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // Check for required sheets
    const requiredSheets = ['Handrail', 'Galvanizing Labor', 'Std', 'Galvanize', 'Post'];
    const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));

    if (missingSheets.length > 0) {
      validation.isValid = false;
      validation.issues.push(`Missing required sheets: ${missingSheets.join(', ')}`);
    }

    // Validate each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const nonEmptyRows = data.filter(row => row.some(cell => cell !== ''));

      validation.sheetValidation[sheetName] = {
        rowCount: nonEmptyRows.length,
        columnCount: nonEmptyRows[0] ? nonEmptyRows[0].length : 0,
        isEmpty: nonEmptyRows.length === 0
      };

      if (nonEmptyRows.length === 0) {
        validation.warnings.push(`Sheet '${sheetName}' is empty`);
      }
    });

    // Check Handrail sheet specifically
    if (workbook.SheetNames.includes('Handrail')) {
      const handrailSheet = workbook.Sheets['Handrail'];
      const handrailData = XLSX.utils.sheet_to_json(handrailSheet, { header: 1 });
      const handrailRows = handrailData.filter(row => row.some(cell => cell !== ''));

      if (handrailRows.length < 10) {
        validation.warnings.push('Handrail sheet has very few rows');
      }
    }

    res.json({
      success: true,
      validation: validation,
      fileInfo: {
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
      }
    });

  } catch (error) {
    logger.error('Excel validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate Excel file',
      isValid: false
    });
  }
});

module.exports = router;