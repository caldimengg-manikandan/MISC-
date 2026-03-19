const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/mssql');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// GET all prices (only for authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT type, steelPerLF, shopMHPerLF, fieldMHPerLF, lastUpdated FROM pricing WHERE company = ? AND isActive = 1',
      [req.user.company]
    );
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      company: req.user.company
    });
    
  } catch (error) {
    logger.error('Failed to fetch prices', {
      error: error.message,
      userId: req.userId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data: ' + error.message
    });
  }
});

// GET specific price
router.get('/:type', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT type, description, steelPerLF, shopMHPerLF, fieldMHPerLF, lastUpdated FROM pricing WHERE type = ? AND company = ?',
      [req.params.type, req.user.company]
    );
    
    const price = rows[0];
    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }
    
    res.json({
      success: true,
      data: price
    });
    
  } catch (error) {
    logger.error('Failed to fetch specific price', {
      error: error.message,
      userId: req.userId,
      type: req.params.type
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price'
    });
  }
});

// UPDATE price (admin only)
router.put('/:type', [
  auth,
  body('steelPerLF').isFloat({ min: 0, max: 1000 }),
  body('shopMHPerLF').isFloat({ min: 0, max: 10 }),
  body('fieldMHPerLF').isFloat({ min: 0, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to update prices'
      });
    }
    
    const { steelPerLF, shopMHPerLF, fieldMHPerLF, description } = req.body;
    const type = req.params.type.toLowerCase();
    const company = req.user.company;
    
    // Check if exists
    const [existing] = await db.query(
      'SELECT id FROM pricing WHERE type = ? AND company = ?',
      [type, company]
    );

    if (existing.length > 0) {
      // Update
      await db.query(
        'UPDATE pricing SET steelPerLF = ?, shopMHPerLF = ?, fieldMHPerLF = ?, description = ?, lastUpdated = GETDATE(), uploadedBy = ? WHERE type = ? AND company = ?',
        [steelPerLF, shopMHPerLF, fieldMHPerLF, description || '', req.userId, type, company]
      );
    } else {
      // Insert
      await db.query(
        'INSERT INTO pricing (type, description, steelPerLF, shopMHPerLF, fieldMHPerLF, company, uploadedBy) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [type, description || '', steelPerLF, shopMHPerLF, fieldMHPerLF, company, req.userId]
      );
    }
    
    const [updated] = await db.query(
      'SELECT * FROM pricing WHERE type = ? AND company = ?',
      [type, company]
    );
    
    res.json({
      success: true,
      message: 'Price updated successfully',
      data: updated[0]
    });
    
  } catch (error) {
    logger.error('Failed to update price', {
      error: error.message,
      userId: req.userId,
      type: req.params.type
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update price: ' + error.message
    });
  }
});

module.exports = router;