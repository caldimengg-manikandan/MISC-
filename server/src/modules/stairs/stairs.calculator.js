/**
 * stairs.calculator.js
 * 
 * PURE ENGINEERING LOGIC LAYER
 * Replicates Excel-based engineering formulas EXACTLY.
 * NO dependencies, NO side effects.
 */

function calculateStair(input) {
  const riseIn = Number(input.riseIn);
  const runIn = Number(input.runIn);
  const totalHeightFt = Number(input.totalHeightFt);
  const widthFt = Number(input.widthFt);
  
  const extBotNS = Number(input.extBotNS || 0);
  const extBotFS = Number(input.extBotFS || 0);
  const extTopNS = Number(input.extTopNS || 0);
  const extTopFS = Number(input.extTopFS || 0);

  // 1. UNIT CONVERSION
  const totalHeightIn = totalHeightFt * 12;

  // 2. GEOMETRY
  const numRisers = Math.ceil(totalHeightIn / riseIn);
  const slope = Math.sqrt(Math.pow(riseIn, 2) + Math.pow(runIn, 2));
  const angleDeg = Math.atan(riseIn / runIn) * (180 / Math.PI);

  // 3. STRINGER LENGTH
  const baseRun = slope * numRisers;
  const totalExtents = extBotNS + extBotFS + extTopNS + extTopFS;

  // PARITY FIX: Match Excel grouping ((baseRun + extents) * 2)
  const totalLengthIn = (baseRun + totalExtents) * 2;
  const totalStringerLengthFt = totalLengthIn / 12;

  // 4. STRINGER WEIGHT (W8x31)
  const stringerWeight = totalStringerLengthFt * 31;

  // 5. PAN PLATES
  const area = widthFt * (runIn / 12) * numRisers;
  const panWeight = area * 12.5;

  // 6. SCRAP FACTOR (1.11)
  const totalWeight = (stringerWeight + panWeight) * 1.11;

  // 7. SAFETY VALIDATION (ANGLE)
  const category = (input.stairCategory || 'Commercial').toLowerCase();
  const maxAngle = category === 'industrial' ? 50 : 38;
  const isAngleValid = angleDeg <= maxAngle;
  const angleWarning = isAngleValid ? null : `Warning: Angle (${angleDeg.toFixed(1)}°) exceeds ${category} limit of ${maxAngle}°.`;

  return {
    numRisers,
    slopeIn: slope,
    angleDeg,
    totalStringerLengthFt,
    stringerWeight,
    panWeight,
    totalWeight,
    angleWarning,
    isAngleValid
  };
}

module.exports = {
  calculateStair
};
