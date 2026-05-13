/**
 * PanPlateWeightCalculationService.js (Backend)
 *
 * Engineering-formula pan plate weight calculation for use in StairCalculationService.
 * Uses the same T × W × L × 0.283 × numTreads formula as the client-side service
 * to ensure frontend/backend parity.
 *
 * Formula:
 *   W (plate width, in) = riserHeight + 1 + treadWidth + 1 + 2     [TYPE-1]
 *                       = (riserHeight × 2) + (1 × 2) + treadWidth  [TYPE-2]
 *   rawWeightPerTread   = T × W × L × DENSITY
 *   totalRawWeight      = rawWeightPerTread × numberOfTreads
 */

const DENSITY = 0.283; // lbs/in³ for carbon steel
const SCRAP_FACTOR = 0.11;

// Gauge label → thickness lookup (inches)
const GAUGE_THICKNESS = {
  '7ga':  0.1793,
  '10ga': 0.1345,
  '11ga': 0.1196,
  '12ga': 0.1046,
  '14ga': 0.0747,
  '16ga': 0.0598,
  '18ga': 0.0478,
  '20ga': 0.0359,
  '22ga': 0.0299,
  '24ga': 0.0239,
};

/**
 * Resolve plate width from pan type string.
 * @param {string} panType  - pan_type value from dictionary (e.g. "TYPE-1(Z)", "TYPE-2")
 * @param {number} riserIn  - riser height in inches
 * @param {number} treadIn  - tread width in inches
 * @returns {number} plate blank width in inches
 */
function calcPlateWidth(panType, riserIn, treadIn) {
  const p = (panType || '').toUpperCase();
  if (p.includes('TYPE-2')) {
    return (riserIn * 2) + (1 * 2) + treadIn;
  }
  // TYPE-1 / Bent Plate / fallback
  return riserIn + 1 + treadIn + 1 + 2;
}

/**
 * Calculate pan plate weight using the engineering formula.
 *
 * @param {number} thicknessInches    - Plate thickness in inches (from gauge lookup or manual)
 * @param {number} riserHeightInches  - Rise per step, inches
 * @param {number} treadWidthInches   - Tread width (run) per step, inches
 * @param {number} stairWidthFeet     - Overall stair width, feet
 * @param {number} numberOfTreads     - Number of treads (risers - 1)
 * @param {string} panType            - Pan type string for width formula selection
 * @param {number} costPerLb          - Steel cost $/lb
 * @returns {Object|null} result object, or null if inputs are invalid
 */
function calculatePanPlateWeight(
  thicknessInches,
  riserHeightInches,
  treadWidthInches,
  stairWidthFeet,
  numberOfTreads,
  panType = 'TYPE-1',
  costPerLb = 0.75
) {
  const T = parseFloat(thicknessInches);
  const rise = parseFloat(riserHeightInches);
  const tread = parseFloat(treadWidthInches);
  const width = parseFloat(stairWidthFeet);
  const treads = parseInt(numberOfTreads);

  if (!T || T <= 0 || !rise || !tread || !width || !treads || treads <= 0) {
    return null;
  }

  const W = calcPlateWidth(panType, rise, tread); // inches
  const L = width * 12;                           // inches (stair width → plate length per tread)
  const rawWeightPerTread = T * W * L * DENSITY;
  const totalRawWeight = rawWeightPerTread * treads;
  const scrapLbs = totalRawWeight * SCRAP_FACTOR;
  const totalWithScrap = totalRawWeight + scrapLbs;
  const materialCost = totalRawWeight * costPerLb;
  const scrapCost = materialCost * SCRAP_FACTOR;

  return {
    panPlateWeight: parseFloat(totalRawWeight.toFixed(3)),
    panPlateWeightWithScrap: parseFloat(totalWithScrap.toFixed(3)),
    scrapLbs: parseFloat(scrapLbs.toFixed(3)),
    materialCost: parseFloat(materialCost.toFixed(2)),
    scrapCost: parseFloat(scrapCost.toFixed(2)),
    totalCost: parseFloat((materialCost + scrapCost).toFixed(2)),
    // Breakdown for audit trail
    calculation: {
      thicknessInches: T,
      plateWidthInches: parseFloat(W.toFixed(3)),
      plateLengthInches: parseFloat(L.toFixed(3)),
      rawWeightPerTread: parseFloat(rawWeightPerTread.toFixed(3)),
      numberOfTreads: treads,
      panType,
      formula: `${T}" × ${W.toFixed(2)}" × ${L.toFixed(2)}" × ${DENSITY} × ${treads} treads`
    }
  };
}

/**
 * Resolve thickness from a gauge label.
 * @param {string} gaugeLabel  e.g. "10ga", "12ga"
 * @returns {number|null} thickness in inches, or null
 */
function getThicknessFromGaugeLabel(gaugeLabel) {
  if (!gaugeLabel) return null;
  const key = (gaugeLabel || '').toLowerCase().trim();
  return GAUGE_THICKNESS[key] || null;
}

module.exports = { calculatePanPlateWeight, getThicknessFromGaugeLabel, GAUGE_THICKNESS };
