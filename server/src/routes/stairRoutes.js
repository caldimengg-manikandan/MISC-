const express = require('express');
const router = express.Router();
const stairController = require('../controllers/stairController');

/**
 * STAIR ESTIMATION ROUTES
 * Base Path: /api/stairs
 */

/**
 * @route   POST /api/stairs/calculate
 * @desc    Calculate stair stringer and pan weights based on Excel engineering formulas
 * @access  Public (or Protected depending on auth middleware in server.js)
 */
router.post('/calculate', stairController.createEstimate);

module.exports = router;
