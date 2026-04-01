const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const calcService = require('../services/calculation/StairCalculationService');
const flightCalcService = require('../services/calculation/StairFlightCalculationService');

/**
 * POST /api/calculate/stair-flight
 */
router.post('/stair-flight', async (req, res) => {
  try {
    const result = await flightCalcService.calculateFlightAndStringers(req.body);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('StairFlightCalc error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/stair-flight-full', async (req, res) => {
  try {
    const result = await flightCalcService.calculateFlightAndStringers(req.body);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('StairFlightCalcFull error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/calculate/full
 */
router.post('/full', async (req, res) => {
  try {
    const { debug = false } = req.query;
    const result = await calcService.calculateFull(req.body, debug === 'true');
    
    if (!result) {
      return res.status(400).json({ success: false, message: 'Invalid or empty payload' });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Calculation Engine Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Root route /api/calculate
 */
router.post('/', async (req, res) => {
  try {
    const result = await calcService.calculateFull(req.body, false);
    if (!result) return res.status(400).json({ success: false });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/calculate/calculate (Legacy Support)
 */
router.post('/calculate', async (req, res) => {
  try {
    const result = await calcService.calculateFull(req.body, false);
    if (!result) return res.status(400).json({ success: false });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
