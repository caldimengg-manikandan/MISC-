const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const calcService = require('../services/StairCalculationService');
const flightCalcService = require('../services/StairFlightCalculationService');

/**
 * POST /api/calculate/stair-flight
 *
 * Full stair flight + stringer calculation engine.
 * Replicates legacy Excel workbook formulas exactly.
 *
 * Body (example):
 * {
 *   "stairWidthFt": 3.5,
 *   "riseIn": 7,
 *   "runIn": 11,
 *   "numRisers": 14,
 *   "stringerProfileId": "W12x35",
 *   "extentBotNSIn": 6,
 *   "extentBotFSIn": 6,
 *   "extentTopNSIn": 6,
 *   "extentTopFSIn": 6,
 *   "connectionTypeBot": "Welded",
 *   "connectionTypeTop": "Bolted",
 *   "finish": "Galvanized"
 * }
 */
/**
 * POST /api/calculate/stair-flight
 * POST /api/calculate/stair-flight-full  (alias)
 *
 * Full stair-flight calculation engine.
 * ─────────────────────────────────────────────────────────────────────────────
 * ALL lookup data is fetched live from MSSQL (stringer_types, platform_types,
 * labor_rates, system_config). No hard-coded numbers.
 *
 * Body (all dimensions in INCHES unless noted):
 * {
 *   "stairWidthFt":     3.5,          ← ft
 *   "riseIn":           7,            ← in
 *   "runIn":            11,           ← in
 *   "numRisers":        14,
 *   "stringerProfileId":"W8x31",
 *   "stairType":        "pan-concrete",  ← "pan-concrete"|"grating-tread"|"non-metal"
 *   "extentBotNSIn":    10,           ← in
 *   "extentBotFSIn":    10,           ← in
 *   "extentTopNSIn":    10,           ← in
 *   "extentTopFSIn":    10,           ← in
 *   "connectionTypeBot":"WELDED",
 *   "connectionTypeTop":"WELDED",
 *   "finish":           "PRIMER",
 *   "estimateId":       null          ← optional: saves row to takeoff_items
 * }
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

// Alias — same logic, explicit name for clarity in the UI
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
 * API Endpoint for professional estimation calculation
 * 100% EXCEL MATCH LOGIC
 */
router.post('/calculate', async (req, res) => {
  try {
    const { 
      rails = [], 
      platforms = [], 
      stairs = [], 
      stringers = [], 
      finish_rate_per_lb = 0,
      pricing_map = {}, // { 'steel': 0.85, ... }
      labor_rates = {}  // { 'shop': 75, 'field': 85 }
    } = req.body;

    // FETCH CONFIG FROM DB
    const [configs] = await db.query('SELECT config_key, config_value FROM system_config');
    const markup = parseFloat(configs.find(c => c.config_key === 'material_markup')?.config_value || 0.11);
    const tax_rate = parseFloat(configs.find(c => c.config_key === 'tax_rate')?.config_value || 0.06);

    let totalSteel = 0;
    let totalShopLabor = 0;
    let totalFieldLabor = 0;

    const breakdown = {
      rail: { steel: 0, shopLabor: 0, fieldLabor: 0, items: [] },
      platform: { steel: 0, shopLabor: 0, fieldLabor: 0, items: [] },
      stairGeometry: [],
      stringer: { steel: 0, items: [] },
      finish: 0
    };

    // 1. Process Rails
    for (const rail of rails) {
      const [rows] = await db.query('SELECT * FROM rail_types WHERE id = ?', [rail.rail_type_id]);
      if (rows && rows.length > 0) {
        const typeData = rows[0];
        const result = calcService.calculateRail(rail, typeData, markup);
        
        breakdown.rail.steel += result.steelWeight;
        breakdown.rail.shopLabor += result.shopLabor;
        breakdown.rail.fieldLabor += result.fieldLabor;
        breakdown.rail.items.push({ ...rail, ...result });

        totalSteel += result.steelWeight;
        totalShopLabor += result.shopLabor;
        totalFieldLabor += result.fieldLabor;
      }
    }

    // 2. Process Platforms
    for (const platform of platforms) {
      const [rows] = await db.query('SELECT * FROM platform_types WHERE id = ?', [platform.platform_type_id]);
      if (rows && rows.length > 0) {
        const typeData = rows[0];
        const result = calcService.calculatePlatform(platform, typeData, markup);
        
        breakdown.platform.steel += result.steelWeight;
        breakdown.platform.shopLabor += result.shopLabor;
        breakdown.platform.fieldLabor += result.fieldLabor;
        breakdown.platform.items.push({ ...platform, ...result });

        totalSteel += result.steelWeight;
        totalShopLabor += result.shopLabor;
        totalFieldLabor += result.fieldLabor;
      }
    }

    // 3. Process Stair Geometry
    for (const stair of stairs) {
      const result = calcService.calculateStairGeometry(stair);
      breakdown.stairGeometry.push({ ...stair, ...result });
    }

    // 4. Process Stringers
    for (const stringer of stringers) {
      const [rows] = await db.query('SELECT * FROM stringer_types WHERE id = ?', [stringer.stringer_type_id]);
      if (rows && rows.length > 0) {
        const typeData = rows[0];
        const result = calcService.calculateStringer(stringer, typeData, markup);
        
        breakdown.stringer.steel += result.steelWeight;
        breakdown.stringer.items.push({ ...stringer, ...result });

        totalSteel += result.steelWeight;
      }
    }

    // 5. Process Finish
    breakdown.finish = calcService.calculateFinish(totalSteel, finish_rate_per_lb);

    // 6. Final Aggregation
    const totals = calcService.aggregateTotals({
      railSteel: breakdown.rail.steel,
      platformSteel: breakdown.platform.steel,
      stringerSteel: breakdown.stringer.steel,
      shopLaborHours: totalShopLabor,
      fieldLaborHours: totalFieldLabor,
      materialRates: pricing_map,
      laborRates: labor_rates,
      finishCost: breakdown.finish,
      taxRate: tax_rate
    });

    res.json({
      success: true,
      totalSteel: totals.totalSteel,
      totalLaborHours: totals.totalLaborHours,
      totalLaborCost: totals.totalLaborCost,
      totalSteelCost: totals.totalSteelCost,
      finishCost: breakdown.finish,
      subtotal: totals.subtotal,
      tax: totals.taxAmount,
      totalEstimatedCost: totals.totalEstimatedCost,
      breakdown
    });

  } catch (error) {
    console.error('Calculation FIX Engine Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server computation error: ' + error.message
    });
  }
});

module.exports = router;
