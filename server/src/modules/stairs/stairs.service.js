/**
 * stairs.service.js
 * 
 * ORCHESTRATION LAYER
 * Coordinates between Calculator and (future) Database.
 */

const calculator = require('./stairs.calculator');

async function getStairEstimation(input) {
  // 1. Logic Execution (Pure Math)
  const result = calculator.calculateStair(input);

  // 2. (Future) Database Persistence could happen here
  // const saved = await db.estimates.create({ ...input, ...result });

  return result;
}

module.exports = {
  getStairEstimation
};
