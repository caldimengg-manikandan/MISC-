/**
 * stairEstimation.js
 * 
 * CORE REQUIREMENT: This module replicates Excel-based engineering formulas EXACTLY.
 * It is the SINGLE source of truth for stair estimation logic.
 * 
 * FINAL PRODUCTION HARDENING:
 * - Strict input validation (no trusting frontend)
 * - Type safety (numeric casting)
 * - Edge case handling (invalid or negative dimensions)
 * - Formula integrity (no double-counting)
 */

/**
 * Calculates stair estimation based on Excel engineering formulas.
 * Throws an error if inputs are invalid.
 * 
 * @param {Object} input - Inputs from the frontend.
 * @param {number|string} input.riseIn - Rise per step in inches.
 * @param {number|string} input.runIn - Run per step in inches.
 * @param {number|string} input.totalHeightFt - Total floor-to-floor height in feet.
 * @param {number|string} input.widthFt - Stair width in feet.
 * @param {number|string} input.extBotNS - Bottom extent (Near Side) in inches.
 * @param {number|string} input.extBotFS - Bottom extent (Far Side) in inches.
 * @param {number|string} input.extTopNS - Top extent (Near Side) in inches.
 * @param {number|string} input.extTopFS - Top extent (Far Side) in inches.
 * 
 * @returns {Object} Calculated estimation values.
 */
function calculateStairEstimate(input) {
  console.log('--- START PRODUCTION AUDIT CALCULATION ---');
  console.log('Raw Input:', input);

  // 1. INPUT VALIDATION & TYPE SAFETY
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: Input must be a non-null object.');
  }

  const riseIn = Number(input.riseIn);
  const runIn = Number(input.runIn);
  const totalHeightFt = Number(input.totalHeightFt);
  const widthFt = Number(input.widthFt);
  
  const extBotNS = Number(input.extBotNS || 0);
  const extBotFS = Number(input.extBotFS || 0);
  const extTopNS = Number(input.extTopNS || 0);
  const extTopFS = Number(input.extTopFS || 0);

  // Check for NaN
  if ([riseIn, runIn, totalHeightFt, widthFt, extBotNS, extBotFS, extTopNS, extTopFS].some(isNaN)) {
    throw new Error('Invalid input: All parameters must be valid numbers.');
  }

  // Strict engineering constraints
  if (riseIn <= 0) throw new Error('riseIn must be greater than zero.');
  if (runIn <= 0) throw new Error('runIn must be greater than zero.');
  if (totalHeightFt <= 0) throw new Error('totalHeightFt must be greater than zero.');
  if (widthFt <= 0) throw new Error('widthFt must be greater than zero.');
  if (extBotNS < 0 || extBotFS < 0 || extTopNS < 0 || extTopFS < 0) {
    throw new Error('Extents cannot be negative.');
  }

  // 2. UNIT CONVERSION
  const totalHeightIn = totalHeightFt * 12;
  console.log('LOG: [totalHeightIn]:', totalHeightIn);

  // 3. GEOMETRY
  // numRisers = ceil(totalHeightIn / riseIn)
  const numRisers = Math.ceil(totalHeightIn / riseIn);
  // slope = sqrt(riseIn^2 + runIn^2) (Internal high-precision)
  const slope = Math.sqrt(Math.pow(riseIn, 2) + Math.pow(runIn, 2));
  // angleDeg (Optional audit value)
  const angleDeg = Math.atan(riseIn / runIn) * (180 / Math.PI);

  console.log('LOG: [numRisers]:', numRisers);
  console.log('LOG: [slope]:', slope);

  // 4. STRINGER LENGTH
  // baseRun = slope * numRisers (Length for one side)
  const baseRun = slope * numRisers;
  // totalExtents = Sum of all 4 unique engineering extents
  const totalExtents = extBotNS + extBotFS + extTopNS + extTopFS;
  
  // Formula for TWO SIDE stringers without double-counting extents:
  // (2 sides of hypotenuse run) + (sum of all individual top/bot extents)
  const totalLengthIn = (baseRun * 2) + totalExtents;
  const totalStringerLengthFt = totalLengthIn / 12;

  console.log('LOG: [totalExtents]:', totalExtents);
  console.log('LOG: [totalLengthFt]:', totalStringerLengthFt);

  // 5. STRINGER WEIGHT
  // steel = W8x31 -> 31 lb/ft
  const stringerWeight = totalStringerLengthFt * 31;
  console.log('LOG: [stringerWeight]:', stringerWeight);

  // 6. PAN PLATES
  // area = widthFt * (runIn / 12) * numRisers
  const area = widthFt * (runIn / 12) * numRisers;
  // panWeight = area * 12.5 lb/sqft
  const panWeight = area * 12.5;
  console.log('LOG: [panWeight]:', panWeight);

  // 7. SCRAP FACTOR (Applied ONLY at final aggregation)
  // totalWeight = (stringerWeight + panWeight) * 1.11
  const totalWeight = (stringerWeight + panWeight) * 1.11;
  console.log('LOG: [totalWeight]:', totalWeight);

  // 8. OUTPUT CONTRACT
  const result = {
    numRisers,
    slopeIn: slope,
    angleDeg,
    totalStringerLengthFt,
    stringerWeight,
    panWeight,
    totalWeight
  };

  console.log('Audit Success. Result:', result);
  console.log('--- END PRODUCTION AUDIT CALCULATION ---');

  return result;
}

module.exports = {
  calculateStairEstimate
};
