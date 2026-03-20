/**
 * rails.controller.js
 */

const service = require('./rails.service');

async function createEstimate(req, res) {
  try {
    const result = await service.getRailEstimation(req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

module.exports = {
  createEstimate
};
