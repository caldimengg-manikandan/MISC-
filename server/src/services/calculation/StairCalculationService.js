const { RAIL_CONFIG, getTypeCode } = require('../../config/railConfig');
const benchmarkLookup = require('../../utils/benchmarkLookup');
const configManager = require('../../utils/configManager');
const validator = require('../../utils/validator');
const db = require('../../config/mssql');
const { calculateStairGeometry, parseToFeet } = require('./stairGeometry.service');

// 📊 MASTER BENCHMARK TABLE (Excel Truth Source)
// 📊 GALVANIZED LABOR BENCHMARKS (Additional MH/LF)
const GALVANIZED_LABOR_MASTER = {
  // Standard Handrails & Pipe Guardrails
  '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe': { shop: 0.25, field: 0.25 },
  '1-Line Handrailing on Guardrail - 1 1/2" SCH 40 pipe': { shop: 0.25, field: 0.25 },
  '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe': { shop: 0.25, field: 0.25 },
  '1-Line Hand Railing wall bolted - 1 1/2" SCH 40 pipe': { shop: 0.25, field: 0.25 },
  '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe': { shop: 0.035, field: 0.05 },
  '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe': { shop: 0.035, field: 0.05 },
  '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post': { shop: 0.035, field: 0.05 },
  '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post': { shop: 0.035, field: 0.05 },
  '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post': { shop: 0.04, field: 0.065 },
  '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post': { shop: 0.04, field: 0.065 },
  '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post': { shop: 0.04, field: 0.065 },
  '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post': { shop: 0.04, field: 0.065 },
  '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts': { shop: 0.045, field: 0.07 },
  '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts': { shop: 0.045, field: 0.07 },
  '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH 80 Posts': { shop: 0.045, field: 0.07 },
  '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts': { shop: 0.045, field: 0.07 },
  '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts': { shop: 0.15, field: 0.25 },
  '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts': { shop: 0.15, field: 0.25 },

  // Picket Guardrails
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post': { shop: 0.050, field: 0.075 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post': { shop: 0.050, field: 0.075 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH. 80 Post': { shop: 0.060, field: 0.085 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH. 80 Post': { shop: 0.060, field: 0.085 },

  // Mesh Panel Guardrails
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST': { shop: 0.045, field: 0.07 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST': { shop: 0.045, field: 0.07 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST': { shop: 0.045, field: 0.07 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2" SCH 40 RAILS AND SCH 80 POST': { shop: 0.045, field: 0.07 },

  // Stair Platforms (Metal Pan & Grating)
  'Metal pan stair platform 8\'-0" wide': { shop: 0, field: 0.050 },
  'Metal pan stair platform 10\'-0" wide': { shop: 0, field: 0.050 },
  'Metal pan stair platform 12\'-0" wide': { shop: 0, field: 0.050 },
  'Grating pan stair platform 8\'-0" wide': { shop: 0, field: 0.050 },
  'Grating pan stair platform 12\'-0" wide': { shop: 0, field: 0.050 },

  // Stair Flights (Standard Labels from constants - Normalized)
  'PAN PLATE CONC FILLED': { shop: 2.50, field: 1.80 },
  'GRATING TREAD': { shop: 2.10, field: 1.50 },
  'NON METAL STAIR': { shop: 0, field: 0 },
  'PAN PLATE CONC. FILLED': { shop: 2.50, field: 1.80 },

  // Generic fallbacks
  'Metal Pan Stair': { shop: 2.50, field: 1.80 },
  'Industrial Stair': { shop: 2.10, field: 1.50 },
  'Stair Flight': { shop: 2.50, field: 1.80 },

  // Stringers & Stairs
  'Std.3\'-8" to 4\'-0" wide < 14\'-0" Stingers/MC 12 X 10.6': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide 14\'-0 - 19\'-0" Long Stringer/MC 12 X 14.3': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide > 19\'-0" Long Stringer/C 12 X 20.7': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide > 14\'-0" Long Stringer/TS 12 X 2 x 3/16': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide > 14\'-0" to 19\'-0" Long Stringer/TS 12 X 2 x 1/4"': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide < 14\'-0" Long Stringers /MC 12 X 10.6': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide 14\'-0 Long Stringers/TS 12 X 2 X 3/16': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide 14\'-0 UP TO 19\'-0" Long Stringers/ TS 12 X 2 X 1/4"': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide 14\'-0 over 19\'-0" Long Stringers/ C12 X 20.7': { shop: 0.150, field: 0.100 },
  'Std. 6\'-0" wide < 14\'-0" span metal pan stairs/MC 12 X 10.6': { shop: 0.150, field: 0.100 },
  'Std. 6\'-0" wide 14\'-0 - 19\'-0" span metal pan stairs/MC 12 X 14.3': { shop: 0.150, field: 0.100 },
  'Std. 6\'-0" wide > 19\'-0" span metal pan stairs': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide < 14\'-0" span grating tread stairs/MC 12 X 10.6': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide 14\'-0 - 19\'-0" span grating tread stairs/MC 12 X 14.3': { shop: 0.150, field: 0.100 },
  'Std. 4\'-0" wide > 19\'-0" span grating tread stairs': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide < 14\'-0" span grating tread stairs/MC 12 X 10.6': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide 14\'-0 - 19\'-0" span grating tread stairs/MC 12 X 14.3': { shop: 0.150, field: 0.100 },
  'Std. 5\'-0" wide > 19\'-0" span grating tread stairs': { shop: 0.150, field: 0.100 },
};

const RAIL_MASTER_DATA = {
  '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe': { lbs: 2.750, shop: 0.300, field: 0.280 },
  '1-Line Handrailing on Guardrail - 1 1/2" SCH 40 pipe': { lbs: 3.200, shop: 0.320, field: 0.280 },
  '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe': { lbs: 2.280, shop: 0.250, field: 0.250 },
  '1-Line Hand Railing wall bolted - 1 1/2" SCH 40 pipe': { lbs: 2.720, shop: 0.270, field: 0.250 },
  '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe': { lbs: 4.560, shop: 0.375, field: 0.350 },
  '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe': { lbs: 5.440, shop: 0.400, field: 0.350 },
  '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post': { lbs: 5.280, shop: 0.425, field: 0.350 },
  '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post': { lbs: 6.350, shop: 0.450, field: 0.350 },
  '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post': { lbs: 6.840, shop: 0.500, field: 0.350 },
  '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post': { lbs: 8.160, shop: 0.600, field: 0.375 },
  '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post': { lbs: 7.560, shop: 0.550, field: 0.350 },
  '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post': { lbs: 9.070, shop: 0.650, field: 0.375 },
  '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts': { lbs: 9.120, shop: 0.750, field: 0.350 },
  '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts': { lbs: 10.880, shop: 0.775, field: 0.375 },
  '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH 80 Posts': { lbs: 9.840, shop: 0.775, field: 0.350 },
  '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts': { lbs: 11.750, shop: 0.800, field: 0.385 },
  '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts': { lbs: 20.520, shop: 2.000, field: 0.550 },
  '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts': { lbs: 24.480, shop: 2.250, field: 0.600 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post': { lbs: 17.040, shop: 0.875, field: 0.400 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post': { lbs: 18.360, shop: 0.900, field: 0.400 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post': { lbs: 17.760, shop: 0.900, field: 0.400 },
  '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post': { lbs: 19.270, shop: 0.925, field: 0.400 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post': { lbs: 26.890, shop: 0.950, field: 0.425 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post': { lbs: 28.210, shop: 1.000, field: 0.450 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post': { lbs: 27.610, shop: 0.975, field: 0.425 },
  '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post': { lbs: 29.120, shop: 1.000, field: 0.450 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post': { lbs: 16.780, shop: 1.125, field: 0.400 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post': { lbs: 18.570, shop: 1.150, field: 0.400 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post': { lbs: 17.510, shop: 1.150, field: 0.400 },
  '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post': { lbs: 19.480, shop: 1.175, field: 0.400 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post': { lbs: 26.470, shop: 1.200, field: 0.425 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post': { lbs: 28.230, shop: 1.250, field: 0.450 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH. 80 Post': { lbs: 27.190, shop: 1.200, field: 0.425 },
  '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH. 80 Post': { lbs: 29.140, shop: 1.250, field: 0.450 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS': { lbs: 6.840, shop: 0.875, field: 0.400 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS': { lbs: 8.160, shop: 0.900, field: 0.400 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS ': { lbs: 7.560, shop: 0.900, field: 0.400 },
  '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2" SCH 40 RAILS': { lbs: 9.070, shop: 0.925, field: 0.400 },
  'Optional Kick Plate 4\'x4\'': { lbs: 3.400, shop: 0.125, field: 0.050 },

  // 🏗️ EXACT LABEL MATCHES (Simplified for PARITY)
  'Wall Rail': { lbs: 2.280, shop: 0.250, field: 0.250 },
  'Grab Rail': { lbs: 2.750, shop: 0.300, field: 0.280 },
  'Guard Rail': { lbs: 6.840, shop: 0.500, field: 0.350 }
};

const STRINGER_BENCHMARKS = {
  'MC12X106': { lbs: 10.600, shop: 0.150, field: 0.100 },
  'MC12X143': { lbs: 14.300, shop: 0.150, field: 0.100 },
  'C12X207': { lbs: 20.700, shop: 0.150, field: 0.100 },
  'C15X339': { lbs: 33.900, shop: 0.150, field: 0.100 },
  'TS12X2X316': { lbs: 16.580, shop: 0.250, field: 0.200 },
  'TS12X2X14': { lbs: 21.660, shop: 0.250, field: 0.200 },
  'W8X31': { lbs: 31.000, shop: 0.150, field: 0.100 },
  'W10X33': { lbs: 33.000, shop: 0.150, field: 0.100 },
  'W12X35': { lbs: 35.000, shop: 0.150, field: 0.100 },
  'W12X40': { lbs: 40.000, shop: 0.150, field: 0.100 },
  'W12X50': { lbs: 50.000, shop: 0.150, field: 0.100 },
  'W14X43': { lbs: 43.000, shop: 0.150, field: 0.100 }
};

class StairCalculationService {
  constructor() {
    this.roundExcel = (value, decimals) => {
      return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
    };
    this.formulaTrace = [];
    this.debug = false;
  }

  resetTrace() {
    this.formulaTrace = [];
  }

  addTrace(component, formula, input, output) {
    if (this.debug) {
      this.formulaTrace.push({ component, formula, input, output });
    }
  }

  /**
   * LAYER 1: TAKEOFF (Tekla Geometry Mode)
   * Pure geometry and quantity counts from user inputs.
   */
  async calculateTakeoff(input) {
    const { rails, platforms, stairs } = input;

    const takeoff = {
      rails: (rails || []).map(r => {
        const lengthFt = parseToFeet(r.railLength || r.length) || 0;

        // 🏗️ CONFIG RESOLUTION
        const typeCode = getTypeCode(r.railType || r.type);
        const config = RAIL_CONFIG[typeCode] || RAIL_CONFIG.GUARD_2_LINE;

        // 📐 KICK PLATE SPECIALIZED INPUTS
        const widthRaw = r.width?.value ?? r.width ?? r.widthIn ?? 4;
        const widthIn = typeCode === 'KICK_PLATE' ? parseFloat(widthRaw) : null;

        // 📏 POST SPACING (Respect User Input or Config Default)
        const rawSpacing = r.postSpacing?.value ?? r.postSpacing ?? r.maxSpacing ?? r.maxPostSpacing;
        let maxSpacing = 0;
        if (typeof rawSpacing === 'number' || (typeof rawSpacing === 'string' && rawSpacing !== '')) {
          const unit = r.postSpacing?.unit || 'FT';
          maxSpacing = unit === 'FT' ? parseFloat(rawSpacing) : (parseFloat(rawSpacing) / 12);
        } else if (rawSpacing && typeof rawSpacing === 'object' && rawSpacing.value) {
          const unit = rawSpacing.unit || 'FT';
          maxSpacing = unit === 'FT' ? parseFloat(rawSpacing.value) : (parseFloat(rawSpacing.value) / 12);
        }
        if (!maxSpacing || isNaN(maxSpacing)) maxSpacing = config.maxSpacing || 4;

        // 🔒 HARD CAP: Maximum allowable post spacing is 4 ft per code.
        // If the user enters a value > 4 ft, it is silently clamped to 4 ft.
        const MAX_ALLOWED_SPACING_FT = 4;
        if (maxSpacing > MAX_ALLOWED_SPACING_FT) {
          console.warn(`[RAIL ENGINE] ⚠️ Post spacing ${maxSpacing} ft exceeds 4 ft max — clamped to 4 ft.`);
          maxSpacing = MAX_ALLOWED_SPACING_FT;
        }

        // 📏 POST DISTRIBUTION
        // 🔄 FIX: Use Math.ceil (not Math.floor) so that actual spacing NEVER exceeds maxSpacing.
        // Math.floor reduces post count, causing actual spacing > max (e.g. 18ft/4 = 4 posts → 4.5 ft actual ❌).
        // Math.ceil always adds one more post if needed (e.g. 18ft/4 = 5 posts → 3.6 ft actual ✓).
        let postQty = 0;
        if (config.hasPosts && lengthFt > 0) {
          const numSpans = Math.ceil(lengthFt / maxSpacing);
          postQty = numSpans + 1;
          postQty = Math.max(postQty, 2);
        }

        const actualSpacing = (config.hasPosts && postQty > 1)
          ? (lengthFt / (postQty - 1))
          : 0;

        // 📏 BRACKET DISTRIBUTION (Wall/Grab Logic)
        let bracketQty = 0;
        if (config.hasBrackets && maxSpacing > 0) {
          const numSpans = Math.ceil(lengthFt / maxSpacing);
          bracketQty = numSpans + 1;
          bracketQty = Math.max(bracketQty, 2);
        }

        const bracketSpacing = (config.hasBrackets && bracketQty > 1)
          ? (lengthFt / (bracketQty - 1))
          : 0;

        // Unified Spacing for UI (prioritizes posts, then brackets)
        const unifiedSpacing = actualSpacing || bracketSpacing;

        // 📏 RAIL QUANTITIES
        const defaultRailsPerSide = config.totalRails || 2;
        const userIntermediate = r.intermediateRails;
        const intermediateRails = (userIntermediate !== undefined && userIntermediate !== null && userIntermediate !== '')
          ? parseInt(userIntermediate) || 0
          : Math.max(0, defaultRailsPerSide - 1);

        const railsPerSide = 1 + intermediateRails;
        const totalRailLength = lengthFt * railsPerSide;

        // 📏 TOE PLATE (Normalized to Feet)
        const isToeplateRequired = r.toePlateRequired === true || r.toeplateRequired === 'Yes';
        let toeWidthFt = 0;
        if (isToeplateRequired) {
          const toeWidthRaw = r.toeWidth?.value ?? r.toeWidth ?? 0;
          const toeWidthVal = (typeof toeWidthRaw === 'object') ? toeWidthRaw.value : toeWidthRaw;
          // If it's a number, it was likely processed by toFeet already. If object, parse.
          if (typeof toeWidthVal === 'number') {
            toeWidthFt = toeWidthVal;
          } else {
            toeWidthFt = r.toeWidth?.unit === 'FT' ? parseFloat(toeWidthVal) : (parseFloat(toeWidthVal) / 12);
          }
        }

        this.addTrace(`rail_${r.id}_takeoff`, 'Fabrication Takeoff',
          { typeCode, L: lengthFt, maxS: maxSpacing },
          { postQty, actualSpacing, bracketQty, totalRailLength });

        return {
          ...r,
          typeCode,
          lengthFt: this.roundExcel(lengthFt, 2),
          postQty,
          actualSpacing: this.roundExcel(unifiedSpacing, 3),
          bracketQty,
          bracketSpacing: this.roundExcel(bracketSpacing, 3),
          intermediateRails,
          totalRailLength: this.roundExcel(totalRailLength, 2),
          toeWidthFt,
          toePlateRequired: isToeplateRequired,
          hasPosts: config.hasPosts,
          hasBrackets: config.hasBrackets,
          widthIn: widthIn // Pass to estimate phase
        };
      }),

      platforms: (platforms || []).map(p => {
        const area = (parseFloat(p.length) || 0) * (parseFloat(p.width) || 0) * (p.quantity || 1);
        return { ...p, area: this.roundExcel(area, 2) };
      }),

      stairs: (stairs || []).map(s => {
        // 🏗️ STAIR GEOMETRY (FEET ONLY INTERNALLY)
        // 🏗️ STIR WIDTH NORMALIZATION: Ensure both width and stairWidth map to widthFt
        const width = s.stairWidth || s.width;
        const widthFt = parseToFeet(width);

        // 📐 GEOMETRY ENGINE INTEGRATION (Strict Tekla Logic)
        let geometry = null;
        try {
          geometry = calculateStairGeometry({
            totalHeight: s.totalHeight,
            tread: s.run,
            rise: s.rise,
            risers: s.numRisers || s.risers
          });
        } catch (e) {
          if (this.debug) console.warn(`[ENGINE OMIT] Invalid geometry for stair: ${e.message}`);
        }

        const risers = geometry ? geometry.risers : 0;
        const totalRunFt = geometry ? geometry.totalRun : 0;
        const diagonalFt = geometry ? geometry.stringerLength : 0;
        const slopeDeg = geometry ? geometry.angle : 0;
        const panArea = widthFt * totalRunFt;

        // Extents (summing normalized feet)
        const nsBot = parseToFeet(s.nsStringerBot);
        const fsBot = parseToFeet(s.fsStringerBot);
        const nsTop = parseToFeet(s.nsStringerTop);
        const fsTop = parseToFeet(s.fsStringerTop);

        const nsTrueLength = diagonalFt + nsBot + nsTop;
        const fsTrueLength = diagonalFt + fsBot + fsTop;
        const totalLFBothStringers = nsTrueLength + fsTrueLength;

        this.addTrace(`stair_${s.id}_takeoff`, 'Tekla Geometry (Feet)',
          { H: parseToFeet(s.totalHeight, 'IN'), Run: parseToFeet(s.run, 'IN') },
          { risers, totalRunFt, diagonalFt, slopeDeg, panArea });

        return {
          ...s,
          geometry, // Pass to estimating phase
          risers,
          widthFt: this.roundExcel(widthFt, 4), // ✅ Pass resolved width to estimate phase for panLbs
          heightFt: parseToFeet(s.totalHeight, 'IN'),
          totalRunFt: this.roundExcel(totalRunFt, 3),
          slope: this.roundExcel(slopeDeg, 2),
          stringerLength: this.roundExcel(Math.max(nsTrueLength, fsTrueLength), 2),
          nsTrueLength: this.roundExcel(nsTrueLength, 2),
          fsTrueLength: this.roundExcel(fsTrueLength, 2),
          totalLFBothStringers: this.roundExcel(totalLFBothStringers, 2),
          panArea: this.roundExcel(panArea, 2),
          isCompliant: slopeDeg >= 30 && slopeDeg <= 38
        };
      }),
      config: input.config || {}
    };

    return takeoff;
  }

  /**
   * LAYER 2: ESTIMATE
   * Convert takeoff units to weights and labor hours using lookups.
   */
  async calculateEstimate(takeoff) {
    // 🧠 PRICING HIERARCHY: Local Estimate `takeoff.config` Overrides > Global `configManager` > Fallback
    const getRate = (key, defaultVal) => {
      if (takeoff.config && typeof takeoff.config[key] === 'number') {
        return parseFloat(takeoff.config[key]);
      }
      return configManager.get(key, defaultVal);
    };

    const materialMarkup = getRate('material_markup', 0.11);
    const fabricationFactor = getRate('fabrication_factor', 1.00);

    const steelPrice = getRate('steel_price_per_lb', 0.75);
    const panRate = getRate('stair_pan_rate', 1.00);
    const scrapFactorPct = getRate('scrap_factor_pct', 10);
    const scrapMultiplier = 1 + (scrapFactorPct / 100);
    const scrapPortion = scrapFactorPct / 100;
    const shopRate = getRate('shop_hourly_rate', 70);
    const fieldRate = getRate('field_hourly_rate', 70);
    const galvanizeMarkup = getRate('galvanize_markup_pct', 10) / 100;

    const matchLabor = (label) => {
      if (!label) return { shop: 0, field: 0 };
      const norm = (s) => (s || '').toUpperCase().replace(/["']/g, '').replace(/\s+/g, '').replace(/\./g, '').trim();
      const target = norm(label);

      // 1. Direct normalized match
      let foundKey = Object.keys(GALVANIZED_LABOR_MASTER).find(k => norm(k) === target);
      if (foundKey) return GALVANIZED_LABOR_MASTER[foundKey];

      // 2. Profile-only match (part after /)
      const parts = label.split('/');
      if (parts.length > 1) {
        const profilePart = norm(parts[parts.length - 1]);
        foundKey = Object.keys(GALVANIZED_LABOR_MASTER).find(k => norm(k).endsWith(profilePart));
        if (foundKey) return GALVANIZED_LABOR_MASTER[foundKey];
      }

      return { shop: 0, field: 0 };
    };

    const estimate = {
      rails: await Promise.all((takeoff.rails || []).map(async rail => {
        const lengthFt = rail.lengthFt || 0;
        const config = RAIL_CONFIG[rail.typeCode] || RAIL_CONFIG.GUARD_2_LINE;
        const typeLabel = rail.railType || '';

        let lbsPerFt = null;
        let shopMHPerFt = null;
        let fieldMHPerFt = null;

        const [dbBenchmarks] = await db.query(
          'SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary WHERE label = ? AND (category LIKE ? OR category LIKE ? OR category LIKE ? OR category LIKE ?)',
          [typeLabel, 'guardRail_type', 'wallRail_type', 'grabRail_type', 'caneRail_type']
        );

        if (dbBenchmarks.length > 0 && dbBenchmarks[0].steelLbsLf !== null) {
          lbsPerFt = dbBenchmarks[0].steelLbsLf;
          shopMHPerFt = dbBenchmarks[0].shopLaborMhLf;
          fieldMHPerFt = dbBenchmarks[0].fieldLaborMhLf;
        } else {
          const masterEntry = RAIL_MASTER_DATA[typeLabel];
          if (masterEntry) {
            lbsPerFt = masterEntry.lbs;
            shopMHPerFt = masterEntry.shop;
            fieldMHPerFt = masterEntry.field;
          } else {
            const normalizeString = (s) => (s || '').toUpperCase().replace(/["']/g, '').replace(/\./g, '').replace(/\s+/g, ' ').trim();
            const targetNorm = normalizeString(typeLabel);
            const foundKey = Object.keys(RAIL_MASTER_DATA).find(k => normalizeString(k) === targetNorm);
            if (foundKey) {
              lbsPerFt = RAIL_MASTER_DATA[foundKey].lbs;
              shopMHPerFt = RAIL_MASTER_DATA[foundKey].shop;
              fieldMHPerFt = RAIL_MASTER_DATA[foundKey].field;
            } else {
              const lookupSheet = 'Table Data';
              lbsPerFt = benchmarkLookup.lookup(lookupSheet, rail.railType, 'Column3', null);
              shopMHPerFt = benchmarkLookup.lookup(lookupSheet, rail.railType, 'Column4', null);
              fieldMHPerFt = benchmarkLookup.lookup(lookupSheet, rail.railType, 'Column5', null);
            }
          }
        }

        // ── Intermediate Rail Adjustment (Guard Rail only) ──────────────────
        // Spec: steelLbsLf already includes standard int rails (lines-1).
        // If user overrides, adjust proportionally. Field labor stays unchanged.
        // Do NOT apply to WALL_RAIL, GRAB_RAIL, CANE_RAIL, KICK_PLATE.
        let intRailDelta = 0;
        const isGuardType = rail.typeCode && rail.typeCode.startsWith('GUARD_');
        if (isGuardType && lbsPerFt !== null && lbsPerFt !== 0) {
          const config_ = RAIL_CONFIG[rail.typeCode] || RAIL_CONFIG.GUARD_2_LINE;
          const lines = config_.totalRails || 2;
          const standardIntRails = lines - 1; 
          const userIntRails = (rail.intermediateRails !== undefined && rail.intermediateRails !== null && rail.intermediateRails !== '')
            ? parseInt(rail.intermediateRails)
            : standardIntRails;
          intRailDelta = userIntRails - standardIntRails;

          if (intRailDelta !== 0) {
            const baseLbs = parseFloat(lbsPerFt);
            const weightPerLine = baseLbs / lines;
            lbsPerFt = baseLbs + (intRailDelta * weightPerLine);
            shopMHPerFt = parseFloat(shopMHPerFt) + (intRailDelta * 0.05);
            // fieldMHPerFt stays unchanged per spec
            console.log(`[RAIL ENGINE] 🔧 Int rail adj: delta=${intRailDelta}, lbs/ft ${baseLbs} → ${lbsPerFt}, shopMH adj: +${intRailDelta * 0.05}`);
          }
        }

        let baseWeight = 0;
        let finalWeight = 0;
        let shopHours = 0;
        let fieldHours = 0;

        // 📏 KICK PLATE SPECIALIZED CALCULATION
        if (rail.typeCode === 'KICK_PLATE') {
          const widthIn = rail.widthIn || 4;
          lbsPerFt = (widthIn / 4.0) * 3.400;
          shopMHPerFt = 0.125;
          fieldMHPerFt = 0.050;
          
          baseWeight = lengthFt * lbsPerFt;
          shopHours = lengthFt * shopMHPerFt;
          fieldHours = lengthFt * fieldMHPerFt;
          finalWeight = baseWeight * scrapMultiplier;
        } else if (lbsPerFt !== null && lbsPerFt !== 0) {
          lbsPerFt = parseFloat(lbsPerFt);
          shopMHPerFt = parseFloat(shopMHPerFt);
          fieldMHPerFt = parseFloat(fieldMHPerFt);
          baseWeight = lengthFt * lbsPerFt;
          shopHours = lengthFt * shopMHPerFt;
          fieldHours = lengthFt * fieldMHPerFt;
          if (rail.toePlateRequired) {
            baseWeight += lengthFt * 3.400;
            shopHours += lengthFt * 0.125;
            fieldHours += lengthFt * 0.050;
          }
          finalWeight = baseWeight * scrapMultiplier;
        } else {
          lbsPerFt = 0;
          shopMHPerFt = 0;
          fieldMHPerFt = 0;
          baseWeight = 0;
          shopHours = 0;
          fieldHours = 0;
          finalWeight = 0;
        }

        const isGalv = (rail.finish || '').toUpperCase().includes('GALVANIZED') || (rail.finish || '').toUpperCase().includes('GALV');
        const isPowder = (rail.finish || '').toUpperCase().includes('POWDER');

        let finishShopHrs = 0;
        let finishFieldHrs = 0;
        let finishTotalCost = 0;

        if (isGalv || isPowder) {
          const finishRate = isGalv ? getRate('galvanize_charge', 0.75) : getRate('powder_coat_rate', 1.7587);
          finishTotalCost = baseWeight * finishRate;
          
          if (isGalv || isPowder) {
            let finishShopRate = 0;
            let finishFieldRate = 0;

            const [galvRows] = await db.query(
              'SELECT shop_mh_per_lf, field_mh_per_lf FROM galvanized_labor WHERE label = ? AND (category LIKE ? OR category LIKE ? OR category LIKE ? OR category LIKE ?)',
              [typeLabel, 'guardRail_type', 'wallRail_type', 'grabRail_type', 'caneRail_type']
            );
            const galvRow = galvRows?.[0];
            
            if (galvRow && galvRow.shop_mh_per_lf !== null && galvRow.shop_mh_per_lf !== undefined) {
              finishShopRate = parseFloat(galvRow.shop_mh_per_lf);
              finishFieldRate = parseFloat(galvRow.field_mh_per_lf);
            } else {
              const matched = matchLabor(typeLabel);
              finishShopRate = matched.shop;
              finishFieldRate = matched.field;
            }
            
            finishShopHrs = lengthFt * finishShopRate;
            finishFieldHrs = lengthFt * finishFieldRate;
          }
        }

        // ── Canonical Flow Steps (Benchmark Parity Handoff) ──
        // 1. steelCost = steelLbsTotal × steel_price_per_lb
        const steelPriceBase = baseWeight * steelPrice;

        // 2. scrapCost = scrapLbs × steel_price_per_lb
        const scrapLbs = baseWeight * scrapPortion;
        const scrapPriceOnly = scrapLbs * steelPrice;

        // 3. finishCost = finishRate × steelLbsTotal (never × scrap)
        // Calculated above as finishTotalCost.

        // 4. porRokCost = postQty × mountingRate (anchored=$6, embedded=$5, or specialized por_rok_rate)
        // 5. anchorBoltsCost = steelLbsTotal × anchor_bolt_rate
        const anchorBoltRate = getRate('anchor_bolt_rate', 0.025);
        const embeddedRate = configManager.get('mounting_embedded_rate', 5.00);
        const anchoredRate = configManager.get('mounting_anchored_rate', 6.00);
        const porRokRateOverride = configManager.get('por_rok_anchor_rate', 0.0);

        const mTypeVal = rail.config?.mountingType || rail.mountingType || '';
        const mType = (mTypeVal && typeof mTypeVal === 'string') ? mTypeVal.toLowerCase() : '';
        let porRokCost = 0;
        let anchorBoltsCost = baseWeight * anchorBoltRate;

        // 🛡️ SECURITY RULE: No mounting costs for Kick Plates
        const isValidMType = mType !== '' && mType !== '0' && !mType.includes('select');
        if (rail.typeCode !== 'KICK_PLATE' && isValidMType) {
          if (mType.includes('embedded')) {
            porRokCost = rail.postQty * embeddedRate;
          } else if (mType.includes('anchored')) {
            // 🔄 EXCEL PARITY: If a specific POR ROK Anchor Rate is set, it overrides the generic anchored rate.
            // This allows the user to differentiate between standard anchors and high-strength POR ROK anchors.
            porRokCost = rail.postQty * (porRokRateOverride > 0 ? porRokRateOverride : anchoredRate);
            trace[`stair_${rail.id}_mounting`] = `Anchored: ${rail.postQty} @ ${porRokRateOverride > 0 ? porRokRateOverride : anchoredRate}`;
          }
        }

        // 6. subTotalMaterial = steelCost + finishCost + porRokCost + anchorBoltsCost (NO scrap)
        const subTotalMaterial = steelPriceBase + finishTotalCost + porRokCost + anchorBoltsCost;

        // 7. subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapCost
        const shopLaborCost = (shopHours + finishShopHrs) * shopRate;
        const fieldLaborCost = (fieldHours + finishFieldHrs) * fieldRate;
        const subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapPriceOnly;

        // 8. tax = subTotalMaterial × tax_rate
        const taxRate = getRate('tax_rate', 0.06);
        const taxTotal = subTotalMaterial * taxRate;

        // 9. total = subTotalWithoutTax + tax
        const totalItemCost = subTotalWithoutTax + taxTotal;

        return {
          ...rail,
          baseWeight: this.roundExcel(baseWeight, 3),
          totalWeight: this.roundExcel(baseWeight + scrapLbs, 3),
          shopHours: this.roundExcel(shopHours + finishShopHrs, 3),
          fieldHours: this.roundExcel(fieldHours + finishFieldHrs, 3),
          totalCost: this.roundExcel(totalItemCost, 2),
          finishTotalCost: this.roundExcel(finishTotalCost, 2),
          systemCalc: {
            ...rail.systemCalc,
            steelLbsPerLF: this.roundExcel(lbsPerFt, 3),
            shopMH: this.roundExcel(shopMHPerFt, 3),
            fieldMH: this.roundExcel(fieldMHPerFt, 3),
            totalSteel: this.roundExcel(baseWeight, 3),
            scrapLbs: this.roundExcel(scrapLbs, 3),
            scrapFactorPct: scrapFactorPct,
            steelPriceBase: this.roundExcel(steelPriceBase, 2),
            scrapPriceOnly: this.roundExcel(scrapPriceOnly, 2),
            finishTotalCost: this.roundExcel(finishTotalCost, 2),
            porRokCost: this.roundExcel(porRokCost, 2),
            anchorBoltsCost: this.roundExcel(anchorBoltsCost, 2),
            subTotalMaterial: this.roundExcel(subTotalMaterial, 2),
            shopLaborPrice: this.roundExcel(shopLaborCost, 2),
            fieldLaborPrice: this.roundExcel(fieldLaborCost, 2),
            shopTotalHrs: this.roundExcel(shopHours + finishShopHrs, 3),
            fieldTotalHrs: this.roundExcel(fieldHours + finishFieldHrs, 3),
            galvShopTotalHrs: this.roundExcel(finishShopHrs, 3),
            galvFieldTotalHrs: this.roundExcel(finishFieldHrs, 3),
            subTotalWithoutTax: this.roundExcel(subTotalWithoutTax, 2),
            taxTotal: this.roundExcel(taxTotal, 2),
            taxRatePct: taxRate * 100,
            posts: rail.postQty,
            bracketQty: rail.bracketQty,
            actualSpacing: rail.actualSpacing,
            intRailDelta: intRailDelta
          }
        };
      })),


      platforms: await Promise.all((takeoff.platforms || []).map(async p => {
        const area = p.area || 0;
        const typeLabel = p.platformType || '';
        let lbsPerSF = 0;
        let shopMHPF = 0;
        let fieldMHPF = 0;
        const [dbBenchmarks] = await db.query(
          'SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary WHERE (label = ? OR value = ?) AND category = ?',
          [typeLabel, typeLabel, 'platform_type']
        );
        if (dbBenchmarks.length > 0 && dbBenchmarks[0].steelLbsLf !== null) {
          lbsPerSF = dbBenchmarks[0].steelLbsLf;
          shopMHPF = dbBenchmarks[0].shopLaborMhLf;
          fieldMHPF = dbBenchmarks[0].fieldLaborMhLf;
        }

        const baseWeight = area * lbsPerSF;
        // 🔄 EXCEL PARITY: Platform scrap uses LENGTH * lbsPerSF * 0.11 (NOT area-based)
        // Excel column formula: B (length) * D (rate) * 0.11 applied uniformly across all rows
        // e.g., 10 * 12.500 * 0.11 = 13.750 lbs scrap (cost $10.31)
        const platformLength = parseFloat(p.length) || 0;
        const platformQty = parseFloat(p.quantity) || 1;
        const scrapLbs = platformLength * platformQty * lbsPerSF * scrapPortion;
        const finalWeight = baseWeight + scrapLbs;
        const shopHoursInternal = area * shopMHPF;
        const fieldHoursInternal = area * fieldMHPF;

        const isGalv = (p.finish || '').toUpperCase().includes('GALVANIZED') || (p.finish || '').toUpperCase().includes('GALV');
        const isPowder = (p.finish || '').toUpperCase().includes('POWDER');

        const finishRate = isGalv ? getRate('galvanize_charge', 0.7500) : getRate('powder_coat_rate', 1.7587);
        let finishTotalCost = 0;
        let finishFieldHrs = 0;
        let finishShopHrs = 0;

        if (isGalv || isPowder) {
          finishTotalCost = baseWeight * finishRate;
          if (isGalv) {
            const galvMh = matchLabor(`${typeLabel} 10'-0" wide`);
            finishShopHrs = (area / 10) * galvMh.shop;
            finishFieldHrs = area * 0.05; // 🔄 EXCEL PARITY: Landings add exactly 0.05 MH/SF field finish labor
          } else if (isPowder) {
            finishFieldHrs = area * 0.05; // Powder coat also adds handling labor
          }
        }

        // ── Canonical Flow Steps (Benchmark Parity Handoff) ──
        // 1. steelCost = steelLbsTotal × steel_price_per_lb
        const steelPriceBase = baseWeight * steelPrice;

        // 2. scrapCost = scrapLbs × steel_price_per_lb
        const scrapPriceOnly = scrapLbs * steelPrice;

        // 3. finishCost = finishRate × steelLbsTotal (never × scrap)
        // Calculated above as finishTotalCost.

        // 4. porRokCost = postQty × mountingRate (anchored=$6, embedded=$5)
        // 5. anchorBoltsCost = steelLbsTotal × anchor_bolt_rate
        const anchorBoltRate = configManager.get('anchor_bolt_rate', 0.025);
        const embeddedRate = configManager.get('mounting_embedded_rate', 5.00);
        const anchoredRate = configManager.get('mounting_anchored_rate', 6.00);

        const mTypeVal = p.config?.mountingType || p.mountingType || '';
        const mType = (mTypeVal && typeof mTypeVal === 'string') ? mTypeVal.toLowerCase() : '';
        let porRokCost = 0;
        let anchorBoltsCost = baseWeight * anchorBoltRate;

        const isValidMType = mType !== '' && mType !== '0' && !mType.includes('select');
        if (isValidMType) {
          if (mType.includes('embedded')) {
            porRokCost = baseWeight * embeddedRate;
          }
        }

        // 6. subTotalMaterial = steelCost + finishCost + porRokCost + anchorBoltsCost (NO scrap)
        const subTotalMaterial = steelPriceBase + finishTotalCost + porRokCost + anchorBoltsCost;

        // 7. subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapCost
        const shopLaborCost = shopHoursInternal * shopRate;
        const fieldLaborCost = (fieldHoursInternal + finishFieldHrs) * fieldRate;
        const subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapPriceOnly;

        // 8. tax = subTotalMaterial × tax_rate
        const taxRate = configManager.get('tax_rate', 0.06);
        const taxTotal = subTotalMaterial * taxRate;

        // 9. total = subTotalWithoutTax + tax
        const totalItemCost = subTotalWithoutTax + taxTotal;

        return {
          ...p,
          baseWeight: this.roundExcel(baseWeight, 3),
          totalWeight: this.roundExcel(finalWeight, 3),
          shopHours: this.roundExcel(shopHoursInternal + finishShopHrs, 3),
          fieldHours: this.roundExcel(fieldHoursInternal + finishFieldHrs, 3),
          totalCost: this.roundExcel(totalItemCost, 2),
          finishTotalCost: this.roundExcel(finishTotalCost, 2),
          systemCalc: {
            ...p.systemCalc,
            area,
            steelLbsPerLF: this.roundExcel(lbsPerSF, 3),
            shopMH: this.roundExcel(shopMHPF, 3),
            fieldMH: this.roundExcel(fieldMHPF, 3),
            totalSteel: this.roundExcel(baseWeight, 3),
            scrapLbs: this.roundExcel(scrapLbs, 3),
            scrapFactorPct: scrapFactorPct,
            steelPriceBase: this.roundExcel(steelPriceBase, 2),
            scrapPriceOnly: this.roundExcel(scrapPriceOnly, 2),
            finishTotalCost: this.roundExcel(finishTotalCost, 2),
            porRokCost: this.roundExcel(porRokCost, 2),
            anchorBoltsCost: this.roundExcel(anchorBoltsCost, 2),
            subTotalMaterial: this.roundExcel(subTotalMaterial, 2),
            shopLaborPrice: this.roundExcel(shopLaborCost, 2),
            fieldLaborPrice: this.roundExcel(fieldLaborCost, 2),
            shopTotalHrs: this.roundExcel(shopHoursInternal + finishShopHrs, 3),
            fieldTotalHrs: this.roundExcel(fieldHoursInternal + finishFieldHrs, 3),
            galvShopTotalHrs: this.roundExcel(finishShopHrs, 3),
            galvFieldTotalHrs: this.roundExcel(finishFieldHrs, 3),
            subTotalWithoutTax: this.roundExcel(subTotalWithoutTax, 2),
            taxTotal: this.roundExcel(taxTotal, 2),
            taxRatePct: taxRate * 100
          }
        };
      })),


      stairs: await Promise.all((takeoff.stairs || []).map(async s => {
        const stairTypeLabel = (s.stairType || '').toUpperCase();
        const hasFlights = s.flights && s.flights.length > 0;

        // 📐 GEOMETRY ENGINE ALREADY RESOLVED IN TAKEOFF
        const geometry = s.geometry;
        const risers = s.risers || 0;
        const treads = geometry ? geometry.treads : (risers > 0 ? risers - 1 : 0);
        const actualRise = geometry ? geometry.actualRise : 0;

        const hasGeometry = (s.totalLFBothStringers > 0 && risers > 0) || (geometry !== null);

        let strLbs = 0;
        let panLbs = 0;
        let shopHrs = 0;
        let fieldHrs = 0;

        // 🔒 ENGINE RULE: No flights AND no local geometry = No weight. Period.
        if (!hasFlights && !hasGeometry) {
          return {
            ...s,
            totalWeight: 0, shopHours: 0, fieldHours: 0, totalCost: 0,
            systemCalc: { risers: 0, baseSteelLbs: 0, scrapLbs: 0, shopTotalHrs: 0, fieldTotalHrs: 0, mountingCharge: 0 }
          };
        }

        let baseRiserShopHrs = 0;
        let baseRiserFieldHrs = 0;

        // Use generic fallbacks ONLY if it's a known stair type that has contents but missing detailed data
        // 🏗️ STRENGTHENED METHODOLOGY: Extract width from label if not provided in geometry
        let resolvedWidth = s.widthFt || 5.0;
        if (!s.widthFt || s.widthFt === 5.0) {
           const labelWidthMatch = (s.stringerSize || '').match(/(\d+)'?-(\d*)"?\s+wide/i);
           if (labelWidthMatch) {
              const ft = parseFloat(labelWidthMatch[1]);
              const inc = parseFloat(labelWidthMatch[2] || 0);
              resolvedWidth = ft + (inc / 12);
              console.log(`[STAIR ENGINE] 📏 Extracted width from label: ${resolvedWidth} ft`);
           }
        }

        if (stairTypeLabel.includes('PAN')) {
          strLbs = 10.600;
          // 🔄 EXCEL PARITY MATCH: Engine calculates pan mass as (Width * 10 lbs/sqft) per riser.
          panLbs = resolvedWidth * 10.0;
          baseRiserShopHrs = 1.350;
          baseRiserFieldHrs = 0.900;
          shopHrs = 0.150;
          fieldHrs = 0.100;
        } else if (stairTypeLabel.includes('GRATING')) {
          strLbs = 10.600;
          // 🔄 EXCEL PARITY MATCH: Even in grating mode, pan mass (Width * 10 lbs/sqft) per riser 
          // must be calculated to ensure finish (galvanize/powder) lbs are accurate.
          panLbs = resolvedWidth * 10.0;
          baseRiserShopHrs = 1.250;
          baseRiserFieldHrs = 0.850;
          shopHrs = 0.150;
          fieldHrs = 0.100;
        }

        const src = s.stringerSize || '';

        // 🔍 Stage 1: Absolute Exact Match (Zero cleaning - literal check)
        const [exactMatch] = await db.query(
          `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
           WHERE (UPPER(TRIM(label)) = UPPER(TRIM(?)) OR UPPER(TRIM(value)) = UPPER(TRIM(?)))
           AND category = 'stringer_size'`,
          [src, src]
        );

        if (exactMatch.length > 0 && exactMatch[0].steelLbsLf !== null) {
          strLbs = parseFloat(exactMatch[0].steelLbsLf);
          shopHrs = parseFloat(exactMatch[0].shopLaborMhLf || shopHrs);
          fieldHrs = parseFloat(exactMatch[0].fieldLaborMhLf || fieldHrs);
          console.log(`[STAIR ENGINE] 🎯 Absolute Exact Match: "${src}" -> ${strLbs} lbs`);
        } else {
          const cleanFull = src.replace(/[^A-Z0-9]/gi, '').toUpperCase();

          // 🔍 Stage 2: Semi-Exact Match (Cleaned Alphanumeric only)
          const [fullMatch] = await db.query(
            `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
             WHERE (
               UPPER(REPLACE(REPLACE(REPLACE(label, ' ', ''), '.', ''), '-', '')) = ? 
               OR UPPER(REPLACE(REPLACE(REPLACE(value, ' ', ''), '.', ''), '-', '')) = ?
             ) 
             AND category = ?`,
            [cleanFull, cleanFull, 'stringer_size']
          );

          if (fullMatch.length > 0 && fullMatch[0].steelLbsLf !== null) {
            strLbs = parseFloat(fullMatch[0].steelLbsLf);
            shopHrs = parseFloat(fullMatch[0].shopLaborMhLf || shopHrs);
            fieldHrs = parseFloat(fullMatch[0].fieldLaborMhLf || fieldHrs);
            console.log(`[STAIR ENGINE] ✅ Cleaned Full Match: "${src}" -> ${strLbs} lbs`);
          } else {
            // 🔍 Stage 3: Fallback Search - Metal Profile Extraction
            let searchProfile = src;
            if (src.includes('/')) {
              searchProfile = src.split('/').pop().trim();
            } else if (src.includes('MC') || src.includes('C ') || src.includes('TS')) {
              const tokens = src.split(' ');
              if (tokens.length > 3) searchProfile = tokens.slice(-4).join(' ');
            }

            const cleanSearch = searchProfile.replace(/[^A-Z0-9]/gi, '').toUpperCase();

            // Try internal benchmarks first as a sensible fallback
            if (STRINGER_BENCHMARKS[cleanSearch]) {
              strLbs = STRINGER_BENCHMARKS[cleanSearch].lbs;
              shopHrs = STRINGER_BENCHMARKS[cleanSearch].shop;
              fieldHrs = STRINGER_BENCHMARKS[cleanSearch].field;
              console.log(`[STAIR ENGINE] 📍 Profile Match (Internal): "${cleanSearch}" -> ${strLbs} lbs`);
            } else {
              // Try regex weight extraction (e.g. MC 12 X 10.6)
              const weightMatch = src.match(/X\s*(\d+(\.\d+)?)/i);
              if (weightMatch) {
                strLbs = parseFloat(weightMatch[1]);
                shopHrs = 0.150;
                fieldHrs = 0.100;
                console.log(`[STAIR ENGINE] 🔍 Regex Weight Match: ${strLbs} lbs`);
              }
            }

            // Stage 4: DB Profile Match (Exclude recipes from matching profiles broad-ly)
            const [dictBenchmarks] = await db.query(
              `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
               WHERE (
                 UPPER(REPLACE(REPLACE(REPLACE(label, ' ', ''), '.', ''), '-', '')) = ? 
                 OR UPPER(REPLACE(REPLACE(REPLACE(value, ' ', ''), '.', ''), '-', '')) = ?
                 OR (label LIKE ? AND label NOT LIKE '%wide%' AND label NOT LIKE '%Std.%')
               ) 
               AND category = 'stringer_size'`,
              [cleanSearch, cleanSearch, '%' + searchProfile + '%']
            );

            if (dictBenchmarks.length > 0 && dictBenchmarks[0].steelLbsLf !== null && dictBenchmarks[0].steelLbsLf > 0) {
              strLbs = parseFloat(dictBenchmarks[0].steelLbsLf);
              shopHrs = parseFloat(dictBenchmarks[0].shopLaborMhLf || shopHrs);
              fieldHrs = parseFloat(dictBenchmarks[0].fieldLaborMhLf || fieldHrs);
              console.log(`[STAIR ENGINE] 📊 DB Profile Hit: ${strLbs} lbs`);
            }
          }
        }

        // 🔄 EXCEL PARITY MATCH: Master standard recipes evaluate Stringer & Pan properties strictly on a PER RISER basis.
        // Rule: Only identify as Recipe Mode if "Std." prefix is present. Avoid mass-threshold heuristics as they break heavy standard shapes.
        const isRecipeMode = (src || '').toLowerCase().includes('std.') || (src || '').toLowerCase().includes('std ');

        let stringerBaseWeight = 0;
        let shopHoursInternal = 0;
        let fieldHoursInternal = 0;

        if (isRecipeMode) {
          // Exactly matches Excel: Qty.Riser * Coefficient
          stringerBaseWeight = risers * strLbs;
          shopHoursInternal = risers * shopHrs;
          fieldHoursInternal = risers * fieldHrs;
        } else {
          // Standard geometric calculation for pure manual shapes
          stringerBaseWeight = s.totalLFBothStringers * strLbs;
          shopHoursInternal = (s.totalLFBothStringers * shopHrs) + (risers * baseRiserShopHrs);
          fieldHoursInternal = (s.totalLFBothStringers * fieldHrs) + (risers * baseRiserFieldHrs);
        }

        const panTotalWeight = risers * panLbs;

        // 🔄 EXCEL PARITY MATCH: Master standard recipes isolate Stringer from Pans in pricing.
        // Pan material is priced at a specific unit rate (typically $1.00/lb) while stringers use raw steel rate ($0.75/lb).
        let panPriceTotal = (stairTypeLabel.includes('PAN') || isRecipeMode) ? (panTotalWeight * panRate) : (panTotalWeight * steelPrice);

        const totalUnitWeight = stringerBaseWeight + panTotalWeight;
        const totalSteelWithScrap = stringerBaseWeight * scrapMultiplier;

        // 🔄 EXCEL PARITY MATCH: GRATING PRICING
        // Evaluated based on Stair Width tiers matching benchmark matrix (Scaling up to $80.15 for 5FT).
        let gratingTotalCost = 0;
        if (stairTypeLabel.includes('GRATING') || (s.config && s.config.stairGrating === true)) {
          const w = s.widthFt || 5;
          let gratingTreadRate = 80.15; // default <= 5
          if (w <= 3.5) gratingTreadRate = 56.10;
          else if (w <= 4.0) gratingTreadRate = 64.12;
          else if (w <= 4.5) gratingTreadRate = 72.15;
          
          const gratingKeyLookup = s.gratingTreadType || s.gratingType || '';
          
          const gratingFactorKey = {
            '1 1/4" Bar grating/Welded':      'grating_factor_bar_125_welded',
            '1 1/4" Bar grating/Bolted':      'grating_factor_bar_125_bolted',
            '1" Bar grating/Welded':          'grating_factor_bar_100_welded',
            '1" Bar grating/Bolted':          'grating_factor_bar_100_bolted',
            'McNichols treads':               'grating_factor_mcnichols',
            'Other Pre-fabricated Treads':    'grating_factor_prefab',
          }[gratingKeyLookup] ?? 'grating_factor_bar_125_welded';
          
          const treadFactor = configManager.get(gratingFactorKey, 1.00);

          gratingTotalCost = gratingTreadRate * treadFactor * risers;
          panPriceTotal = 0; // Grating replaces pans
        }

        // 🔄 EXCEL PARITY MATCH: FINISH PRICING (Galvanize / Powder Coat)
        // SUM($E$40,$C$44) = Stringer Base Lbs + Pans Total Lbs
        const finishBaseLbs = stringerBaseWeight + panTotalWeight;
        const isGalv = /GALV/i.test(s.finish || '');
        const isPowder = /POWDER/i.test(s.finish || '');

        let finishTotalCost = 0;
        let galvShopHrs = 0;
        let galvFieldHrs = 0;

        if (isGalv || isPowder) {
          // 🔄 EXCEL MATCH: Default finish rates configured to Standard Pricing (Galvanize: $0.75, Powder Coat: $1.7587). Pulled safely via getRate hierarchy.
          const finishRate = isGalv ? getRate('galvanize_charge', 0.7500) : getRate('powder_coat_rate', 1.7587);
          finishTotalCost = finishBaseLbs * finishRate;

          if (isGalv || isPowder) {
            // Evaluates labor mapping directly compatible with the provided 'Galvanizing Labor' (Finish Labor) matrix scale
            const galvMh = matchLabor(s.stringerSize || stairTypeLabel);
            galvShopHrs = risers * galvMh.shop;
            galvFieldHrs = risers * galvMh.field;
          }
        }

        // CONNECTION LABOR LOGIC
        const weldedShopMH = getRate('welded_shop_mh', 0.5);
        const weldedFieldMH = getRate('welded_field_mh', 0.25);
        const boltedShopMH = getRate('bolted_shop_mh', 1.0);
        const boltedFieldMH = getRate('bolted_field_mh', 0.5);

        const connectionPoints = [
          { extent: parseToFeet(s.nsStringerBot) || 0, conn: s.nsStringerConnBot || s.nsConnBot },
          { extent: parseToFeet(s.fsStringerBot) || 0, conn: s.fsStringerConnBot || s.fsConnBot },
          { extent: parseToFeet(s.nsStringerTop) || 0, conn: s.nsStringerConnTop || s.nsConnTop },
          { extent: parseToFeet(s.fsStringerTop) || 0, conn: s.fsStringerConnTop || s.fsConnTop },
        ];
        
        const activeConn = connectionPoints.filter(p => p.extent > 0);
        const weldedCount = activeConn.filter(p => p.conn === 'Welded').length;
        const boltedCount = activeConn.filter(p => p.conn === 'Bolted').length;

        const extraShopHours = (weldedCount * weldedShopMH) + (boltedCount * boltedShopMH);
        const extraFieldHours = (weldedCount * weldedFieldMH) + (boltedCount * boltedFieldMH);

        shopHoursInternal += extraShopHours;
        fieldHoursInternal += extraFieldHours;

        // ── Canonical Flow Steps (Benchmark Parity Handoff) ──
        // 1. steelCost = steelLbsTotal × steel_price_per_lb
        const steelPriceBase = stringerBaseWeight * steelPrice;

        // 2. scrapCost = scrapLbs × steel_price_per_lb
        // 🔄 EXCEL PARITY: Scrap applies to Stringers only in stairs.
        const scrapLbs = stringerBaseWeight * scrapPortion;
        const scrapPriceOnly = scrapLbs * steelPrice;

        // 3. finishCost = finishRate × steelLbsTotal (never × scrap)
        // Calculated above as finishTotalCost.

        // 4. porRokCost = postQty × mountingRate (anchored=$6, embedded=$5)
        // 5. anchorBoltsCost = steelLbsTotal × anchor_bolt_rate
        const anchorBoltRate = configManager.get('anchor_bolt_rate', 0.025);
        const embeddedRate = configManager.get('mounting_embedded_rate', 5.00);
        const anchoredRate = configManager.get('mounting_anchored_rate', 6.00);

        const mTypeVal = s.config?.mountingType || s.mountingType || '';
        const mType = (mTypeVal && typeof mTypeVal === 'string') ? mTypeVal.toLowerCase() : '';
        let porRokCost = 0;
        let anchorBoltsCost = stringerBaseWeight * anchorBoltRate;

        const isValidMType = mType !== '' && mType !== '0' && !mType.includes('select');
        if (isValidMType) {
          const stairConnCount = 4; // 2 stringers × 2 ends
          if (mType.includes('embedded')) {
            porRokCost = stairConnCount * embeddedRate;
          } else if (mType.includes('anchored')) {
            porRokCost = stairConnCount * anchoredRate;
          }
        }

        // 6. subTotalMaterial = steelCost + panCost + gratingCost + finishCost + porRokCost + anchorBoltsCost (NO scrap)
        const subTotalMaterial = steelPriceBase + panPriceTotal + gratingTotalCost + finishTotalCost + porRokCost + anchorBoltsCost;

        // 7. subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapCost
        const shopLaborCost = (shopHoursInternal + galvShopHrs) * shopRate;
        const fieldLaborCost = (fieldHoursInternal + galvFieldHrs) * fieldRate;
        const subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapPriceOnly;

        // 8. tax = subTotalMaterial × tax_rate
        const taxRate = configManager.get('tax_rate', 0.06);
        const taxTotal = subTotalMaterial * taxRate;

        // 9. total = subTotalWithoutTax + tax
        const totalCostPerStair = subTotalWithoutTax + taxTotal;

        return {
          ...s,
          totalWeight: this.roundExcel(totalUnitWeight, 3),
          shopHours: this.roundExcel(shopHoursInternal + galvShopHrs, 3),
          fieldHours: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
          totalCost: this.roundExcel(totalCostPerStair, 2),
          systemCalc: {
            risers,
            steelLbsPerLF: this.roundExcel(strLbs, 3),
            shopMH: this.roundExcel(shopHrs, 3),
            fieldMH: this.roundExcel(fieldHrs, 3),
            totalSteel: this.roundExcel(stringerBaseWeight, 3),
            scrapLbs: this.roundExcel(scrapLbs, 3),
            scrapFactorPct: scrapFactorPct,
            steelPriceBase: this.roundExcel(steelPriceBase, 2),
            scrapPriceOnly: this.roundExcel(scrapPriceOnly, 2),
            stairPansTotalPrice: this.roundExcel(panPriceTotal, 2),
            gratingTotalCost: this.roundExcel(gratingTotalCost, 2),
            finishTotalCost: this.roundExcel(finishTotalCost, 2),
            porRokCost: this.roundExcel(porRokCost, 2),
            anchorBoltsCost: this.roundExcel(anchorBoltsCost, 2),
            subTotalMaterial: this.roundExcel(subTotalMaterial, 2),
            shopLaborPrice: this.roundExcel(shopLaborCost, 2),
            fieldLaborPrice: this.roundExcel(fieldLaborCost, 2),
            shopTotalHrs: this.roundExcel(shopHoursInternal + galvShopHrs, 3),
            fieldTotalHrs: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
            subTotalWithoutTax: this.roundExcel(subTotalWithoutTax, 2),
            taxTotal: this.roundExcel(taxTotal, 2),
            taxRatePct: taxRate * 100,
            pricePerRiser: this.roundExcel(totalCostPerStair / (risers || 1), 2),
            stairPansTotalWeight: this.roundExcel(panTotalWeight, 3),
            galvShopTotalHrs: this.roundExcel(galvShopHrs, 3),
            galvFieldTotalHrs: this.roundExcel(galvFieldHrs, 3),
            angleHeight: s.heightFt,
            slope: geometry ? this.roundExcel(geometry.angle, 2) : (s.slope || 0),
            angle: geometry ? this.roundExcel(geometry.angle, 2) : (s.angle || 0),
            isCompliant: s.isCompliant,

            riserHeightIn: geometry ? this.roundExcel(geometry.actualRise * 12, 3) : 0,
            geometry: geometry ? {
              risers: geometry.risers,
              actualRise: geometry.actualRise,
              treads: geometry.treads,
              totalRun: geometry.totalRun,
              angle: geometry.angle,
              stringerLength: geometry.stringerLength
            } : null
          }
        };
      }))
    };

    // 🔄 Final aggregated project-level parity recalculation
    estimate.totalEstimatedCost = estimate.stairs.reduce((sum, s) => sum + s.totalCost, 0) +
      estimate.platforms.reduce((sum, p) => sum + p.totalCost, 0) +
      estimate.rails.reduce((sum, r) => sum + r.totalCost, 0);

    return estimate;
  }

  /**
   * LAYER 3: FINAL AGGREGATION
   * Summing all components, applying tax, and rounding.
   */
  /* ─── PHASE 4: GLOBAL AGGREGATION (THE SUMMARY) ────────────────────────────────────
   * Compiles the finished takeoff into a singular financial / weight report.
   * 🔄 EXCEL PARITY: Refactored to utilize Vertical Summation (Sum of Parts) logic.
   * This ensures that the Summary Grand Total is exactly equal to the sum of 
   * Stair + Landing + Rail totals, resolving rounding errors.
   */
  async calculateFinal(estimate) {
    if (!estimate) return null;

    const steelPrice = configManager.get('steel_price_per_lb', 0.75);
    const shopRate = configManager.get('shop_hourly_rate', 70);
    const fieldRate = configManager.get('field_hourly_rate', 70);

    // Accumulators for accurate Vertical Summation (Sum of Parts)
    let totalBaseSteelWeight = 0;
    let totalScrapLbs = 0;
    let totalShopHours = 0;
    let totalFieldHours = 0;
    let totalRisers = 0;
    let totalGalvShopHrs = 0;
    let totalGalvFieldHrs = 0;

    let sumSteelBasePrice = 0;
    let sumPansPrice = 0;
    let sumGratingPrice = 0;
    let sumGalvanizePrice = 0;
    let sumAnchorBolts = 0;
    let sumPorRok = 0;
    let sumScrapPrice = 0;
    let sumShopLaborPrice = 0;
    let sumFieldLaborPrice = 0;
    let sumTaxTotal = 0;
    let sumSubtotalWithoutTax = 0;

    console.log('[AUDIT] Starting Vertical Sum Audit...');

    // ── RAILS AGGREGATION ──
    const rails = estimate.rails || [];
    rails.forEach((r, i) => {
      const s = r.systemCalc || r;
      totalBaseSteelWeight += (s.totalSteel || 0);
      totalScrapLbs += (s.scrapLbs || 0);
      totalShopHours += (s.shopTotalHrs || 0);
      totalFieldHours += (s.fieldTotalHrs || 0);
      totalGalvShopHrs += (s.galvShopTotalHrs || 0);
      totalGalvFieldHrs += (s.galvFieldTotalHrs || 0);

      sumSteelBasePrice += (s.steelPriceBase || 0);
      sumGalvanizePrice += (s.finishTotalCost || 0);
      sumShopLaborPrice += (s.shopLaborPrice || 0);
      sumFieldLaborPrice += (s.fieldLaborPrice || 0);
      sumTaxTotal += (s.taxTotal || 0);
      sumSubtotalWithoutTax += (s.subTotalWithoutTax || 0);

      sumPorRok += (s.porRokCost || 0);
      sumAnchorBolts += (s.anchorBoltsCost || 0);

      const railScrapOnly = (s.scrapLbs || 0) * steelPrice;
      sumScrapPrice += (s.scrapPriceOnly || railScrapOnly);
    });

    // ── PLATFORMS AGGREGATION ──
    const platforms = estimate.platforms || [];
    platforms.forEach((p, i) => {
      const s = p.systemCalc || p;
      totalBaseSteelWeight += (s.totalSteel || 0);
      totalScrapLbs += (s.scrapLbs || 0);
      totalShopHours += (s.shopTotalHrs || 0);
      totalFieldHours += (s.fieldTotalHrs || 0);
      totalGalvShopHrs += (s.galvShopTotalHrs || 0);
      totalGalvFieldHrs += (s.galvFieldTotalHrs || 0);

      sumSteelBasePrice += (s.steelPriceBase || 0);
      sumGalvanizePrice += (s.finishTotalCost || 0);
      sumScrapPrice += (s.scrapPriceOnly || 0);
      sumShopLaborPrice += (s.shopLaborPrice || 0);
      sumFieldLaborPrice += (s.fieldLaborPrice || 0);
      sumTaxTotal += (s.taxTotal || 0);
      sumSubtotalWithoutTax += (s.subTotalWithoutTax || 0);

      sumPorRok += (s.porRokCost || 0);
      sumAnchorBolts += (s.anchorBoltsCost || 0);
    });

    // ── STAIRS AGGREGATION ──
    const stairs = estimate.stairs || [];
    stairs.forEach((st, i) => {
      const s = st.systemCalc || st;
      totalBaseSteelWeight += ((s.totalSteel || 0) + (s.stairPansTotalWeight || 0));
      totalScrapLbs += (s.scrapLbs || 0);
      totalShopHours += (s.shopTotalHrs || 0);
      totalFieldHours += (s.fieldTotalHrs || 0);
      totalGalvShopHrs += (s.galvShopTotalHrs || 0);
      totalGalvFieldHrs += (s.galvFieldTotalHrs || 0);
      totalRisers += (s.risers || 0);

      sumSteelBasePrice += (s.steelPriceBase || 0);
      sumPansPrice += (s.stairPansTotalPrice || 0);
      sumGratingPrice += (s.gratingTotalCost || 0);
      sumGalvanizePrice += (s.finishTotalCost || 0);
      sumScrapPrice += (s.scrapPriceOnly || 0);
      sumShopLaborPrice += (s.shopLaborPrice || 0);
      sumFieldLaborPrice += (s.fieldLaborPrice || 0);
      sumTaxTotal += (s.taxTotal || 0);
      sumSubtotalWithoutTax += (s.subTotalWithoutTax || 0);

      sumPorRok += (s.porRokCost || 0);
      sumAnchorBolts += (s.anchorBoltsCost || 0);
    });

    const subtotalWithoutTax = sumSubtotalWithoutTax;
    const taxAmount = sumTaxTotal;
    const grandTotal = subtotalWithoutTax + taxAmount;

    return {
      ...estimate,
      standardSummary: {
        totalSteelWeight: this.roundExcel(totalBaseSteelWeight + totalScrapLbs, 3),
        baseSteelWeight: this.roundExcel(totalBaseSteelWeight, 3),
        scrapWeight: this.roundExcel(totalScrapLbs, 3),

        baseSteelCost: this.roundExcel(sumSteelBasePrice, 2),
        scrapWeightCost: this.roundExcel(sumScrapPrice, 2),
        shopLaborCost: this.roundExcel(sumShopLaborPrice, 2),
        fieldLaborCost: this.roundExcel(sumFieldLaborPrice, 2),
        pansMaterialPrice: this.roundExcel(sumPansPrice, 2),
        gratingTotalCost: this.roundExcel(sumGratingPrice, 2),
        galvanizeCost: this.roundExcel(sumGalvanizePrice, 2),
        anchorBoltsCost: this.roundExcel(sumAnchorBolts, 2),
        porRokAnchorsCost: this.roundExcel(sumPorRok, 2),
        mountingCharges: this.roundExcel(sumAnchorBolts + sumPorRok, 2),

        subtotalWithoutTax: this.roundExcel(subtotalWithoutTax, 2),
        taxAmount: this.roundExcel(taxAmount, 2),
        grandTotal: this.roundExcel(grandTotal, 2),

        totalShopHours: this.roundExcel(totalShopHours, 3),
        totalFieldHours: this.roundExcel(totalFieldHours, 3),
        totalGalvanizeShopHours: this.roundExcel(totalGalvShopHrs, 3),
        totalGalvanizeFieldHours: this.roundExcel(totalGalvFieldHrs, 3),
        totalRisers: totalRisers,
        pricePerRiser: totalRisers > 0 ? this.roundExcel(grandTotal / totalRisers, 2) : 0
      }
    };
  }

  async calculateFull(input, debug = false) {
    try {
      this.debug = debug;
      this.resetTrace();

      await configManager.loadConfigs();

      const sanitized = validator.sanitizeInput(input);
      if (!sanitized) return { success: false, error: 'Sanitization failed' };

      const normalized = validator.normalizeUnits(sanitized);
      const takeoff = await this.calculateTakeoff(normalized);
      if (!takeoff) throw new Error('Takeoff phase returned undefined');

      const estimate = await this.calculateEstimate(takeoff);
      if (!estimate) throw new Error('Estimate phase returned undefined');

      const final = await this.calculateFinal(estimate);
      if (!final) throw new Error('Final aggregation returned undefined');

      const response = {
        success: true,
        breakdown: {
          rails: final.rails || [],
          platforms: final.platforms || [],
          stairs: final.stairs || [],
          totals: {
            totalSteelWeight: final.standardSummary?.totalSteelWeight || 0
          }
        },
        summary: final.standardSummary || {}
      };

      if (this.debug) {
        this.logAudit(final);
      }

      Object.freeze(response);
      return response;
    } catch (e) {
      console.error('[CRITICAL CALCULATE ERROR]', e);
      return { success: false, error: e.message };
    }
  }

  logAudit(final) {
    console.log('--- [ENGINE AUDIT MODE] START ---');
    if (final.breakdown.rails.length > 0) {
      console.table(final.breakdown.rails.map(r => ({ ...r.trace, id: r.id, type: 'Rail' })));
    }
    if (final.breakdown.stairs.length > 0) {
      console.table(final.breakdown.stairs.map(s => ({ ...s.trace, id: s.id, type: 'Stair' })));
    }
    console.log('--- [ENGINE AUDIT MODE] END ---');
  }
}

module.exports = new StairCalculationService();
