const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Price = require('../models/Price');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// GET all prices (only for authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const prices = await Price.find({ company: req.user.company })
      .select('type steelPerLF shopMHPerLF fieldMHPerLF lastUpdated')
      .lean();
    
    // Sanitize output (remove internal fields)
    const sanitized = prices.map(price => ({
      type: price.type,
      steelPerLF: price.steelPerLF,
      shopMHPerLF: price.shopMHPerLF,
      fieldMHPerLF: price.fieldMHPerLF,
      lastUpdated: price.lastUpdated
    }));
    
    res.json({
      success: true,
      data: sanitized,
      count: sanitized.length,
      company: req.user.company
    });
    
  } catch (error) {
    logger.error('Failed to fetch prices', {
      error: error.message,
      userId: req.user._id
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data'
    });
  }
});

// GET specific price
router.get('/:type', auth, async (req, res) => {
  try {
    const price = await Price.findOne({
      type: req.params.type,
      company: req.user.company
    }).select('-__v -_id -createdAt');
    
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
      userId: req.user._id,
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
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check if user has permission to update prices
    if (!req.user.isAdmin && req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to update prices'
      });
    }
    
    const { steelPerLF, shopMHPerLF, fieldMHPerLF } = req.body;
    
    // Update or create price
    const price = await Price.findOneAndUpdate(
      { type: req.params.type, company: req.user.company },
      {
        steelPerLF,
        shopMHPerLF,
        fieldMHPerLF,
        lastUpdated: new Date(),
        updatedBy: req.user._id
      },
      { new: true, upsert: true, runValidators: true }
    ).select('-__v');
    
    // Log the update
    logger.info('Price updated', {
      userId: req.user._id,
      type: req.params.type,
      oldValues: req.body,
      newValues: { steelPerLF, shopMHPerLF, fieldMHPerLF }
    });
    
    res.json({
      success: true,
      message: 'Price updated successfully',
      data: price
    });
    
  } catch (error) {
    logger.error('Failed to update price', {
      error: error.message,
      userId: req.user._id,
      type: req.params.type
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update price'
    });
  }
});

module.exports = router;