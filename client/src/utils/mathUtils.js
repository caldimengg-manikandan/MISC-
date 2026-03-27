/**
 * Parses an architectural input string (e.g. 6'-5" 1/4 or 1/8) into a decimal value
 * and identifies the appropriate unit.
 * 
 * @param {string} inputStr - The raw string input from the user.
 * @param {string} currentToggleUnit - The current UI toggle state ('FT' or 'IN').
 * @returns {Object} - { value: number, unit: 'FT' | 'IN' }
 */
export const parseArchitecturalInput = (inputStr, currentToggleUnit) => {
  if (!inputStr || typeof inputStr !== 'string' || inputStr.trim() === '') {
    return { value: 0, unit: currentToggleUnit };
  }

  // Normalize input: fix quotes and replace hyphen with space to avoid subtraction logic
  const clean = inputStr.trim().replace(/’/g, "'").replace(/”/g, '"').replace(/-/, ' ');
  const hasFeet = clean.includes("'");
  const hasInches = clean.includes('"');
  const hasFraction = clean.includes('/');

  // Step 1: Detect Explicit Symbols (' and ") or Fractions with context
  if (hasFeet || hasInches) {
    let feet = 0;
    let inches = 0;
    let fraction = 0;

    // 1. Extract Feet: integer before '
    const fMatch = clean.match(/(-?\d+)\s*'/);
    if (fMatch) {
      feet = parseInt(fMatch[1], 10);
    }

    // 2. Extract Fraction: numbers separated by /
    const fracMatch = clean.match(/(\d+)\/(\d+)/);
    if (fracMatch) {
      const num = parseInt(fracMatch[1], 10);
      const den = parseInt(fracMatch[2], 10);
      if (den !== 0) fraction = num / den;
    }

    // 3. Extract Inches: Find the integer that is NOT the feet and NOT the fraction
    let temp = clean;
    if (fMatch) temp = temp.replace(fMatch[0], ' ');
    if (fracMatch) temp = temp.replace(fracMatch[0], ' ');
    
    // Look for remaining digits (inches)
    const iMatch = temp.match(/(\d+)/);
    if (iMatch) {
      inches = parseInt(iMatch[1], 10);
    }

    return { value: (feet * 12) + inches + fraction, unit: 'IN' };
  }

  // Step 2: Handle Pure Fractions (No Symbols)
  if (hasFraction) {
    let val = 0;
    const mixedMatch = clean.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixedMatch) {
      val = parseInt(mixedMatch[1], 10) + (parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10));
    } else {
      const simpleMatch = clean.match(/(\d+)\/(\d+)/);
      if (simpleMatch) {
        val = parseInt(simpleMatch[1], 10) / parseInt(simpleMatch[2], 10);
      }
    }
    return { value: val, unit: currentToggleUnit };
  }

  // Step 3: Handle Standard Decimals
  return { value: parseFloat(clean) || 0, unit: currentToggleUnit };
};

/**
 * Normalizes a value to Decimal Inches.
 */
export const normalizeToInches = (value, unit) => {
  const val = parseFloat(value) || 0;
  if (unit === 'FT') return val * 12;
  return val; 
};

/**
 * Normalizes a value to Decimal Feet.
 */
export const normalizeToFeet = (value, unit) => {
  const val = parseFloat(value) || 0;
  if (unit === 'IN') return val / 12;
  return val;
};

/**
 * Calculates Stair Geometry using normalized values.
 */
export const calculateGeometry = ({ rise, run, totalHeight }) => {
  const riseIn = normalizeToInches(rise.value, rise.unit);
  const runIn = normalizeToInches(run.value, run.unit);
  const heightIn = normalizeToInches(totalHeight.value, totalHeight.unit);

  if (!riseIn || !runIn) return { numRisers: 0, slope: 0, angle: 0 };

  const numRisers = heightIn > 0 ? heightIn / riseIn : 0;
  const slope = Math.sqrt(Math.pow(riseIn, 2) + Math.pow(runIn, 2));
  const angle = Math.atan(riseIn / runIn) * (180 / Math.PI);

  return {
    numRisers: numRisers.toFixed(2),
    slope: slope.toFixed(2),
    angle: angle.toFixed(1)
  };
};

/**
 * Formats decimal feet into architectural Ft-In format (e.g., 5'-2 1/4")
 * Rounds to nearest 1/8".
 */
export const formatFeetToFtIn = (decimalFeet) => {
  if (!decimalFeet || isNaN(decimalFeet)) return '0"';
  
  const totalInches = Math.round(decimalFeet * 12 * 8) / 8; 
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches % 12;
  const wholeInches = Math.floor(remainingInches);
  const fractionValue = remainingInches % 1;
  
  let fractionString = '';
  if (fractionValue > 0) {
    const eighths = Math.round(fractionValue * 8);
    if (eighths === 8) {
      return formatFeetToFtIn(decimalFeet + 1/8/12); // Carry over
    }
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const common = gcd(eighths, 8);
    if (eighths > 0) {
      fractionString = ` ${eighths/common}/${8/common}`;
    }
  }

  const ftPart = feet > 0 ? `${feet}'-` : '';
  const inPart = (wholeInches > 0 || fractionString) ? `${wholeInches}${fractionString}"` : (feet === 0 ? '0"' : '');
  
  return ftPart + inPart;
};

/**
 * Robust parser that converts any mixed architectural input into decimal feet.
 * Handles: 
 * - String ("5'-2 1/4")
 * - Number (5.2)
 * - Object ({ value: "5'-2 1/4", unit: "IN" })
 */
export const parseToFeet = (input, currentToggleUnit = 'FT') => {
  if (!input) return 0;
  
  let val = input;
  let unit = currentToggleUnit;

  if (typeof input === 'object' && input !== null) {
    val = input.value;
    unit = input.unit || currentToggleUnit;
  }

  if (typeof val === 'number') return normalizeToFeet(val, unit);
  
  const parsed = parseArchitecturalInput(val, unit);
  return normalizeToFeet(parsed.value, parsed.unit);
};
