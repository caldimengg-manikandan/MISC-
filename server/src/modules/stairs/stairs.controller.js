/**
 * stairs.controller.js
 * 
 * API HANDLING LAYER
 */

const service = require('./stairs.service');
const validator = require('./stairs.validation');

async function createEstimate(req, res) {
  try {
    const input = req.body;

    // 1. Validate
    validator.validateStairInput(input);

    // 2. Execute Service
    const result = await service.getStairEstimation(input);

    // 3. Respond
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createEstimate
};
