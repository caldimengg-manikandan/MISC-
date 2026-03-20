const { calculateStairEstimate } = require('../utils/stairEstimation');

/**
 * Stair Controller
 * Handles incoming stair estimation requests.
 * Ensures strict separation between request handling and business logic.
 */

/**
 * POST /api/stairs/calculate
 * Extracts raw inputs and calls the hardened calculation utility.
 */
async function createEstimate(req, res) {
  try {
    console.log('--- STAIR CONTROLLER: Incoming Request ---');
    console.log('Payload:', req.body);

    const {
      riseIn,
      runIn,
      totalHeightFt,
      widthFt,
      extBotNS,
      extBotFS,
      extTopNS,
      extTopFS
    } = req.body;

    // 1. STRICT INPUT VALIDATION
    // Ensure all required fields for geometry exist
    if (riseIn === undefined || runIn === undefined || totalHeightFt === undefined || widthFt === undefined) {
      throw new Error("Missing required inputs: riseIn, runIn, totalHeightFt, and widthFt are required.");
    }

    // 2. PREPARE CLEAN INPUT OBJECT (Ignoring any computed values from frontend)
    const calculationInput = {
      riseIn,
      runIn,
      totalHeightFt,
      widthFt,
      extBotNS,
      extBotFS,
      extTopNS,
      extTopFS
    };

    // 3. CALL CALCULATION UTILITY (Single source of truth)
    const result = calculateStairEstimate(calculationInput);

    console.log('--- STAIR CONTROLLER: Calculation Success ---');

    // 4. RETURN STANDARDIZED RESPONSE
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('--- STAIR CONTROLLER: Error ---');
    console.error(error.message);

    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createEstimate
};
