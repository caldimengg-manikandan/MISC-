/**
 * stairGeometry.service.js
 * Deterministic Stair Geometry Calculation Engine (Tekla/Excel Standard)
 */

/**
 * Normalizes any input (object, string, number) to decimal FEET.
 * The core engine strict requirement: ALL inputs must be converted to FEET before calculation.
 */
/**
 * Normalizes any input (object, string, number) to decimal FEET.
 * Allows specifying a fallback unit if none is explicitly provided.
 */
const parseToFeet = (input, defaultUnit = 'FT') => {
  if (input === null || input === undefined) return 0;
  
  // Case 1: Object { value, unit }
  if (typeof input === 'object') {
    const val = parseFloat(input.value);
    const unit = (input.unit || defaultUnit).toUpperCase();
    if (isNaN(val)) return 0;
    return unit === 'IN' ? val / 12 : val;
  }
  
  // Case 2: String with units (e.g., "10'", "120\"", "10 ft")
  if (typeof input === 'string') {
    const clean = input.toLowerCase().trim();
    if (clean.endsWith('ft') || clean.endsWith("'")) {
      return parseFloat(clean) || 0;
    }
    if (clean.endsWith('in') || clean.endsWith('"')) {
      return parseFloat(clean) / 12 || 0;
    }
    // Fallback if no unit present
    const val = parseFloat(clean);
    if (isNaN(val)) return 0;
    return defaultUnit === 'IN' ? val / 12 : val;
  }
  
  // Case 3: Raw Number
  if (typeof input === 'number') {
    return defaultUnit === 'IN' ? input / 12 : input;
  }
  
  return 0;
};

const roundTo = (num, decimals) => Number(Math.round(num + "e" + decimals) + "e-" + decimals);

/**
 * Main engine for stair geometry calculation - Tekla Grade Strict Logic.
 * @param {Object} input - { totalHeight, tread, risers (optional) }
 */
const calculateStairGeometry = (input) => {
  const { totalHeight, tread, rise } = input;
  
  // RULE 1: SINGLE UNIT SYSTEM (Convert everything to FEET)
  const totalHeightFt = parseToFeet(totalHeight, 'IN');
  const runFt = parseToFeet(tread, 'IN');
  const targetRiseFt = parseToFeet(rise, 'IN');

  // RULE 7: VALIDATION RULES
  if (!totalHeightFt || !runFt) {
    throw new Error("Invalid stair geometry inputs. Total Height and Run must be greater than 0.");
  }

  // RULE 2: RISER CALCULATION 
  // Priority: 1. User Target Rise (Dynamic), 2. Explicit Risers Count (Manual), 3. Standard Fallback (7")
  let risers = parseInt(input.risers);
  
  if (targetRiseFt > 0) {
    // If user provides a target rise, we recalculate the count to match it
    risers = Math.max(2, Math.round(totalHeightFt / targetRiseFt));
  } else if (isNaN(risers) || risers <= 0) {
    const STANDARD_RISER = 7 / 12; // 7 inches in ft
    risers = Math.max(2, Math.round(totalHeightFt / STANDARD_RISER));
  } else {
    // Enforce minimum 2 risers if passed manually to prevent calculation crashes
    risers = Math.max(2, risers);
  }

  // Recalculate actual rise
  const actualRise = totalHeightFt / risers;

  // RULE 3: TREAD CALCULATION
  const treads = risers - 1;

  // RULE 4: TOTAL RUN
  const totalRun = treads * runFt;

  if (totalRun === 0) {
    throw new Error("Invalid stair geometry calculation: totalRun cannot be 0.");
  }

  // RULE 5: STRINGER LENGTH & PITCH LINE W/ EXACT GEOMETRY
  // The stringer pitch ALWAYS follows strictly the hypotenuse of a single step.
  // Because Treads = Risers - 1, taking Total Height / Total Run physically breaks the slope line.
  
  // Angle is exclusively determined by the exact step relationship (user input) to prevent precision drift
  const angleRise = targetRiseFt > 0 ? targetRiseFt : actualRise;
  const angle = Math.atan(angleRise / runFt) * (180 / Math.PI);

  // Stringer length theoretically stretches along the pitch line spanning exactly 'Risers' number of triangles from floor intersection to floor intersection. 
  const stringerLength = risers * Math.sqrt(
    Math.pow(actualRise, 2) + Math.pow(runFt, 2)
  );

  // RULE 10: DEBUG MODE
  console.table({
    totalHeight: totalHeightFt,
    runFt,
    risers,
    treads,
    totalRun,
    length: stringerLength,
    angle
  });

  // RULE 9: OUTPUT FORMAT (STRICT)
  return {
    risers,
    treads,
    actualRise: roundTo(actualRise, 3),
    totalRun: roundTo(totalRun, 3),
    stringerLength: roundTo(stringerLength, 3),
    angle: roundTo(angle, 2)
  };
};

module.exports = {
  calculateStairGeometry,
  parseToFeet
};
