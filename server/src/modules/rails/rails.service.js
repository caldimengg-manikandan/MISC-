/**
 * rails.service.js
 */

const calculator = require('./rails.calculator');

async function getRailEstimation(input) {
  return calculator.calculateRail(input);
}

module.exports = {
  getRailEstimation
};
