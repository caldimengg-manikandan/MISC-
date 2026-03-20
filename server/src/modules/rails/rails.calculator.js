/**
 * rails.calculator.js
 * 
 * PURE ENGINEERING LOGIC LAYER
 */

function calculateRail(input) {
  const { length, railType } = input;
  
  // Dummy logic for the skeleton
  const weightPerFt = railType === 'guard' ? 15 : 10;
  const totalWeight = length * weightPerFt;

  return {
    length,
    railType,
    totalWeight
  };
}

module.exports = {
  calculateRail
};
