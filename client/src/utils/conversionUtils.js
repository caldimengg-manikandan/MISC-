// conversionUtils.js

// AISC Standards configuration
export const AISC_STANDARDS = {
  minRiserHeight: 6.0,
  maxRiserHeight: 7.0,
  idealRiserHeight: 7.0
};
// Enhanced inches to feet-inches-fraction conversion
export const inchesToFeetInchesFraction = (
  inches,
  { allowDecimal = false } = {}
) => {
  if (inches == null || isNaN(inches)) return "";

  // ✅ Decimal mode (for riser height, etc.)
  if (allowDecimal) {
    return `${inches.toFixed(2)}"`; // e.g. 8.40"
  }

  // ✅ Fraction mode (for vertical, tread depth, etc.)
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  const wholeInches = Math.floor(remainingInches);
  const fraction = remainingInches - wholeInches;

  if (fraction === 0) {
    if (feet > 0 && wholeInches === 0) return `${feet}'-0"`;
    if (feet > 0) return `${feet}'-${wholeInches}"`;
    return `${wholeInches}"`;
  }

  // Convert fraction to nearest 16th
  const sixteenths = Math.round(fraction * 16);
  const fractionMap = {
    1: "1/16", 2: "1/8", 3: "3/16", 4: "1/4",
    5: "5/16", 6: "3/8", 7: "7/16", 8: "1/2",
    9: "9/16", 10: "5/8", 11: "11/16", 12: "3/4",
    13: "13/16", 14: "7/8", 15: "15/16"
  };
  const fractionStr = fractionMap[sixteenths] || `${sixteenths}/16`;

  let result = "";
  if (feet > 0) result += `${feet}'-`;
  if (wholeInches > 0) result += `${wholeInches}`;
  if (fractionStr) {
    if (wholeInches > 0) result += " ";
    result += fractionStr;
  }
  if (!result.includes('"')) result += '"';

  return result;
};

// Convert to spelled-out format (11 feet – 2 1/2 inches)
export const inchesToSpelledOut = (inches) => {
  if (inches === null || inches === undefined || isNaN(inches) || inches === 0) return '0 inches';
  
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  const wholeInches = Math.floor(remainingInches);
  const fraction = remainingInches - wholeInches;
  
  let fractionStr = '';
  if (fraction > 0) {
    const sixteenths = Math.round(fraction * 16);
    const fractionMap = {
      1: '1/16', 2: '1/8', 3: '3/16', 4: '1/4',
      5: '5/16', 6: '3/8', 7: '7/16', 8: '1/2',
      9: '9/16', 10: '5/8', 11: '11/16', 12: '3/4',
      13: '13/16', 14: '7/8', 15: '15/16'
    };
    fractionStr = fractionMap[sixteenths] || '';
  }

  let parts = [];
  if (feet > 0) {
    parts.push(`${feet} foot${feet !== 1 ? 's' : ''}`);
  }
  if (wholeInches > 0) {
    parts.push(`${wholeInches} inch${wholeInches !== 1 ? 'es' : ''}`);
  }
  if (fractionStr) {
    if (wholeInches === 0 && feet === 0) { // If only fraction, just show fraction
      parts.push(`${fractionStr} inch${fractionStr !== '1/2' ? 'es' : ''}`);
    } else if (wholeInches > 0) { // If whole inches and fraction, combine
      parts[parts.length - 1] = `${wholeInches} ${fractionStr} inches`;
    } else { // If feet and fraction, but no whole inches
      parts.push(`${fractionStr} inch${fractionStr !== '1/2' ? 'es' : ''}`);
    }
  }

  if (parts.length === 0) return '0 inches';
  if (parts.length === 1) return parts[0];
  return parts.join(' – ');
};

// SUPER-ROBUST ARCHITECTURAL INPUT PARSER
export const parseArchitecturalInput = (input) => {
  if (typeof input === 'number') {
    return input;
  }
  
  if (!input || typeof input !== "string") return "";

  let str = input
    .trim()
    .replace(/’/g, "'")      // convert smart quotes
    .replace(/"/g, '')      // REMOVE double quotes for parsing
    .replace(/-/g, "-")
    .replace(/\s+/g, " ");   // collapse multiple spaces

  // PURE NUMBER or DECIMAL — DO NOT assume inches here.
if (/^\d+(\.\d+)?$/.test(str)) {
  return parseFloat(str);
}

  let feet = 0;
  let inches = 0;
  let fraction = 0;

  // CASE 1: FEET MARK PRESENT (7' something)
  const feetMarkMatch = str.match(/^(\d+(\.\d+)?)\s*'(.*)$/);
  if (feetMarkMatch) {
    feet = parseFloat(feetMarkMatch[1]) || 0;
    str = feetMarkMatch[3].trim(); // parse the remaining inches & fraction
  } else {
    // CASE 2: DASH NOTATION (7-2.25 OR 7-2 1/4) - only if no feet mark was present
    // Allow optional space after dash
    const dashNotationMatch = str.match(/^(\d+)-\s*(\d.*)$/);
    if (dashNotationMatch) {
      feet = parseFloat(dashNotationMatch[1]) || 0;
      str = dashNotationMatch[2].trim();
    }
  }

  // Now parse the remaining `str` as inches or fraction
  if (str) {
    // Try to match whole inches and fraction (e.g., "2 1/4" or "2-1/4")
    const fullMatch = str.match(/^(\d+)[\s-]+(\d+\/\d+)$/);
    if (fullMatch) {
      inches = parseFloat(fullMatch[1]) || 0;
      const [num, den] = fullMatch[2].split("/").map(Number);
      fraction = num / den;
    } else {
      // Try to match only fraction (e.g., "1/4")
      const fracMatch = str.match(/^(\d+\/\d+)$/);
      if (fracMatch) {
        const [num, den] = fracMatch[1].split("/").map(Number);
        fraction = num / den;
      } else {
        // Try to match decimal inches or whole inches (e.g., "2.5", "2")
        const decimalOrWholeInchMatch = str.match(/^(\d+(\.\d+)?)$/);
        if (decimalOrWholeInchMatch) {
          inches = parseFloat(decimalOrWholeInchMatch[1]) || 0;
        }
      }
    }
  }

  const totalInches = feet * 12 + inches + fraction;

  // If the input was something like "11-" or "11'", it might parse to a valid number
  // but if the original input was just a partial string that doesn't form a complete number,
  // return empty string to indicate invalid/incomplete.
  if (totalInches === 0 && input.trim() !== '0' && input.trim() !== '0"' && input.trim() !== "0'") {
    // Check if it's a partially typed architectural string, e.g., "11-" or "11' "
    const incompletePatterns = [
      /^\d+'\s*$/,        // ends with ' and optional space
      /^\d+-\s*$/,        // ends with - and optional space
      /^\d+\s+\d+\/\s*$/, // like "2 1/"
      // /^\d+(\.\d+)?\s*$/ // like "11.5 "
    ];
    if (incompletePatterns.some(p => p.test(input.trim()))) {
      return ""; // Indicate incomplete, not 0
    }
  }
  
  return isNaN(totalInches) ? "" : totalInches;
};

// Stair type configurations
export const stairTypeConfigs = {
  'residential': {
    description: 'Common Residential Stair',
    defaultRiserHeight: 7.0, // Changed from 7.5 to 7.0 to make it AISC compliant
    defaultTreadDepth: 10,
    typicalRisers: 12,
    typicalVertical: 84, // 7" × 12 = 84" (updated to match 7.0 riser height)
    aiscCompliant: true // Now compliant since riser height is 7.0
  },
  'commercial': {
    description: 'Commercial Stair (Taller Floor Height)',
    defaultRiserHeight: 7.0,
    defaultTreadDepth: 11,
    typicalRisers: 15,
    typicalVertical: 105, // 7" × 15 = 105"
    aiscCompliant: true // Compliant - 7.0 is within AISC range 
  },
  'steeper': {
    description: 'Steeper Stair',
    defaultRiserHeight: 8.2,
    defaultTreadDepth: 9,
    typicalRisers: 11,
    typicalVertical: 90.2, // 8.2" × 11 = 90.2"
    aiscCompliant: false // Non-compliant - 8.2 exceeds AISC max of 7.0
  },
  'low-short': {
    description: 'Low, Short Stair (Small Rise)',
    defaultRiserHeight: 5.0,
    defaultTreadDepth: 12,
    typicalRisers: 7,
    typicalVertical: 35, // 5" × 7 = 35"
    aiscCompliant: false // Non-compliant - 5.0 below AISC min of 6.0
  },
  'code-compliant': {
    description: 'Perfect Code-Compliant Ratio',
    defaultRiserHeight: 6.0,
    defaultTreadDepth: 11.08,
    typicalRisers: 14,
    typicalVertical: 84, // 6" × 14 = 84"
    aiscCompliant: true // Compliant - 6.0 is within AISC range (6.0-7.0)
  }
};

// Quick preset buttons for testing
export const quickPresets = [
  { name: 'Residential', type: 'residential' },
  { name: 'Commercial', type: 'commercial' },
  { name: 'Steeper', type: 'steeper' },
  { name: 'Low Rise', type: 'low-short' },
  { name: 'Code Perfect', type: 'code-compliant' }
];

// Constants for calculations
export const CALCULATION_CONSTANTS = {
  idealRiserHeight: 7, // inches
  minRiserHeight: 6.0,
  maxRiserHeight: 7.0,   // AISC preferred maximum
  minTreadDepth: 10,
  scale: 1.0,
  vizWidth: 320,
  vizHeight: 200
};

