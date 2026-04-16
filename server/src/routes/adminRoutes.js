const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const configManager = require('../utils/configManager');
const path = require('path');
const fs = require('fs');

// GET all system configurations
router.get('/config', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT config_key, config_value FROM system_config');
    const config = {};
    rows.forEach(row => {
      config[row.config_key] = row.config_value;
    });
    
    // Add default fallbacks if missing in DB
    const results = {
      steel_price_per_lb:     parseFloat(config.steel_price_per_lb)     || 0.75,
      shop_hourly_rate:       parseFloat(config.shop_hourly_rate)       || 70.00,
      field_hourly_rate:      parseFloat(config.field_hourly_rate)      || 70.00,
      tax_rate:               parseFloat(config.tax_rate)               || 0.06,
      galvanize_rate:         parseFloat(config.galvanize_rate)         || 0.75,
      powder_coat_rate:       parseFloat(config.powder_coat_rate)       || 1.7587,
      mounting_embedded_rate: parseFloat(config.mounting_embedded_rate) || 5.00,
      mounting_anchored_rate: parseFloat(config.mounting_anchored_rate) || 6.00,
      anchor_bolt_rate:       parseFloat(config.anchor_bolt_rate)       || 0.025,
      por_rok_anchor_rate:    parseFloat(config.por_rok_anchor_rate)    || 0.00,
      company_logo:           config.company_logo                       || '',
      scrap_factor_pct:       parseFloat(config.scrap_factor_pct)       || 10,
      galvanize_markup_pct:   parseFloat(config.galvanize_markup_pct)   || 10,
      stair_pan_rate:         parseFloat(config.stair_pan_rate)         || 1.00,
      welded_shop_mh:         parseFloat(config.welded_shop_mh)         || 0.5,
      welded_field_mh:        parseFloat(config.welded_field_mh)        || 0.25,
      bolted_shop_mh:         parseFloat(config.bolted_shop_mh)         || 1.0,
      bolted_field_mh:        parseFloat(config.bolted_field_mh)        || 0.5,
      grating_factor_bar_125_welded: parseFloat(config.grating_factor_bar_125_welded) || 1.00,
      grating_factor_bar_125_bolted: parseFloat(config.grating_factor_bar_125_bolted) || 1.00,
      grating_factor_bar_100_welded: parseFloat(config.grating_factor_bar_100_welded) || 1.00,
      grating_factor_bar_100_bolted: parseFloat(config.grating_factor_bar_100_bolted) || 1.00,
      grating_factor_mcnichols:      parseFloat(config.grating_factor_mcnichols)      || 1.00,
      grating_factor_prefab:         parseFloat(config.grating_factor_prefab)         || 1.00
    };

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE system configurations
router.put('/config', async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    
    for (const [key, value] of Object.entries(updates)) {
      // Check if key exists
      const [existing] = await db.query('SELECT config_key FROM system_config WHERE config_key = ?', [key]);
      
      if (existing.length > 0) {
        await db.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [value.toString(), key]);
      } else {
        await db.query('INSERT INTO system_config (config_key, config_value) VALUES (?, ?)', [key, value.toString()]);
      }
    }

    // Reload ConfigManager
    await configManager.loadConfigs();

    res.json({
      success: true,
      message: 'Configurations updated and reloaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const stairCalculationService = require('../services/calculation/StairCalculationService');

// BATCH OPERATION: Recalculate ALL projects
router.post('/recalculate-all', async (req, res) => {
  try {
    console.log('--- [ADMIN BATCH OPERATION] Recalculating All Projects ---');
    
    // 1. Fetch all projects
    const [projects] = await db.query('SELECT id, stairs, guardRails, customRailValues FROM projects');
    
    let updatedCount = 0;

    for (const project of projects) {
      try {
        const tryParse = (val) => {
          if (typeof val !== 'string') return val;
          try { return JSON.parse(val); } catch { return val; }
        };

        const stairs = tryParse(project.stairs) || [];
        const platforms = []; 
        const rails = tryParse(project.guardRails) || [];
        const config = tryParse(project.customRailValues) || {};

        // 2. Perform fresh calculation with currently loaded system config
        const result = await stairCalculationService.calculateFull({
          stairs,
          platforms, 
          rails,
          config
        });

        if (result.success) {
          // 3. Update project totals and results
          await db.query(
            'UPDATE projects SET totalWeight = ?, totalCost = ?, estimationResult = ?, updatedAt = GETDATE() WHERE id = ?',
            [result.totalWeight, result.totalCost, JSON.stringify(result), project.id]
          );
          updatedCount++;
        }
      } catch (innerError) {
        console.error(`Failed to recalculate project ${project.id}:`, innerError.message);
      }
    }

    res.json({
      success: true,
      message: `Batch recalculation complete. ${updatedCount} projects updated.`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Batch Recalculate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEMPLATE DOWNLOAD: Get Master Fabrication Excel
router.get('/templates/download', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Template file not found on server' });
    }

    res.download(filePath, 'Master_Fabrication_Template.xlsx', (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Template Download Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Basic admin routes placeholder
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard',
    user: req.user
  });
});

module.exports = router;