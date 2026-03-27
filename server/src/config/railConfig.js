/**
 * Tekla-Grade Rail Calculation Configuration (Locked Spec)
 * Centralized business rules for fabrication-level railing estimation.
 */
const RAIL_CONFIG = {
  GUARD_1_LINE: {
    label: '1-Line Guard',
    maxSpacing: 4,         // ft
    hasPosts: true,
    hasBrackets: false,
    totalRails: 1
  },
  GUARD_2_LINE: {
    label: '2-Line Guard',
    maxSpacing: 4,
    hasPosts: true,
    hasBrackets: false,
    totalRails: 2
  },
  GUARD_3_LINE: {
    label: '3-Line Guard',
    maxSpacing: 4,
    hasPosts: true,
    hasBrackets: false,
    totalRails: 3
  },
  GUARD_8_LINE: {
    label: '8-Line Guard',
    maxSpacing: 4,
    hasPosts: true,
    hasBrackets: false,
    totalRails: 8
  },
  WALL_RAIL: {
    label: 'Wall Rail',
    maxSpacing: 4,
    hasPosts: false,
    hasBrackets: true,
    totalRails: 1,
    lbsPerFt: 2.72,
    shopMH: 0.27,
    fieldMH: 0.25
  },
  GRAB_RAIL: {
    label: 'Grab Rail',
    maxSpacing: 4,
    hasPosts: false,
    hasBrackets: true,
    totalRails: 1,
    lbsPerFt: 3.20,
    shopMH: 0.32,
    fieldMH: 0.28
  },
  CANE_RAIL: {
    label: 'Cane Rail',
    maxSpacing: 6,
    hasPosts: true,
    hasBrackets: false,
    totalRails: 1,
    lbsPerFt: 2.72,
    shopMH: 0.32,
    fieldMH: 0.28
  }
};

/**
 * Normalization helper to map verbose rail type strings to config keys.
 * Matches common dropdown labels and prefixes.
 */
function getTypeCode(verboseType) {
  const typeStr = (verboseType || '').toLowerCase();
  
  if (typeStr.includes('cane')) return 'CANE_RAIL';
  
  // 🛡️ GUARD TYPES (FLOOR MOUNTED / PICKET / MESH)
  // These must have posts, so they use the GUARD config
  if (typeStr.includes('floor mounted') || typeStr.includes('picket') || typeStr.includes('mesh panel')) {
    const lineMatch = typeStr.match(/(\d+)-line/);
    if (lineMatch) {
      const lines = parseInt(lineMatch[1]);
      if (lines === 1) return 'GUARD_1_LINE';
      if (lines === 8) return 'GUARD_8_LINE';
      if (lines === 3) return 'GUARD_3_LINE';
    }
    return 'GUARD_2_LINE';
  }

  // 🛡️ STANDARD GUARDRAIL STRINGS
  if (typeStr.includes('guardrail') && !typeStr.includes('on guardrail')) {
    const lineMatch = typeStr.match(/(\d+)-line/);
    if (lineMatch) {
      const lines = parseInt(lineMatch[1]);
      if (lines === 1) return 'GUARD_1_LINE';
      if (lines === 2) return 'GUARD_2_LINE';
      if (lines === 3) return 'GUARD_3_LINE';
      if (lines === 8) return 'GUARD_8_LINE';
    }
    return 'GUARD_2_LINE';
  }

  // 🔘 HANDRAIL / WALL TYPES (BRACKET MOUNTED)
  if (typeStr.includes('wall bolted')) return 'WALL_RAIL';
  if (typeStr.includes('grab')) return 'GRAB_RAIL';
  if (typeStr.includes('hand railing') || typeStr.includes('handrailing')) {
    if (typeStr.includes('on guardrail')) return 'GRAB_RAIL';
    if (typeStr.includes('bolted')) return 'WALL_RAIL';
    return 'GRAB_RAIL';
  }

  return 'GUARD_2_LINE'; // Fallback
}

module.exports = {
  RAIL_CONFIG,
  getTypeCode
};
