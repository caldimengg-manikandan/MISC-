const { RAIL_CONFIG, getTypeCode } = require('../../config/railConfig');
const benchmarkLookup = require('../../utils/benchmarkLookup');
const configManager = require('../../utils/configManager');
const validator = require('../../utils/validator');
const db = require('../../config/mssql');
const { calculatePanPlateWeight: engineeringPanWeight, getThicknessFromGaugeLabel } = require('./PanPlateWeightCalculationService');
const { calculateStairGeometry, parseToFeet } = require('./stairGeometry.service');

// 📊 MASTER BENCHMARK TABLE (Excel Truth Source)
// Connection hardware: 3.5 lbs/connection × 2 connections/stringer × 2 stringers = 14 lbs total
const CONNECTION_WEIGHT_PER_CONNECTION = 3.5;
const CONNECTIONS_PER_STRINGER = 2;
const NUMBER_OF_STRINGERS = 2;
const CONNECTION_WEIGHT_LBS = CONNECTION_WEIGHT_PER_CONNECTION * CONNECTIONS_PER_STRINGER * NUMBER_OF_STRINGERS; // = 14 lbs
// Tread support: 1.33 lbs per tread per stringer side
const TREAD_SUPPORT_WEIGHT_PER_TREAD_PER_STRINGER = 1.33;
// Pan plate density (lbs per square foot)
const PAN_PLATE_PSF = 5;
// Grating tread density (for 1 1/2 x 3/16 profile)
const GRATING_TREAD_PSF = 11;

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

  /**
   * 🔄 AUTO-CALC: Compute stringer length directly from rise/run/risers
   * using the Pythagorean theorem. Used as a guaranteed fallback when
   * the geometry engine cannot produce a result (e.g. totalHeight missing).
   *
   * Formula: √( (rise_in × risers / 12)² + (run_in × risers / 12)² )
   *
   * @param {number} riseInches - Rise per step in inches
   * @param {number} runInches  - Run (tread) per step in inches
   * @param {number} risers     - Number of risers
   * @returns {number} Stringer length in feet (2 dp), or 0 if inputs invalid
   */
  calculateStringerLengthDirect(riseInches, runInches, risers) {
    if (!riseInches || !runInches || !risers || risers < 1) {
      console.warn('[STRINGER ENGINE] calculateStringerLengthDirect: invalid inputs', { riseInches, runInches, risers });
      return 0;
    }
    const totalRiseFt = (riseInches * risers) / 12;
    const totalRunFt  = (runInches  * risers) / 12;
    const lengthFt    = Math.sqrt(Math.pow(totalRiseFt, 2) + Math.pow(totalRunFt, 2));
    if (!isFinite(lengthFt) || lengthFt <= 0) {
      console.error('[STRINGER ENGINE] calculateStringerLengthDirect: non-finite result');
      return 0;
    }
    return parseFloat(lengthFt.toFixed(2));
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
  async calculateTakeoff(input, adminOwnerId = null) {
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

        const calcTakeoff = (st) => {
          let geometry = null;
          try {
            geometry = calculateStairGeometry({
              totalHeight: st.totalHeight,
              tread: st.run || st.tread,
              rise: st.rise,
              risers: st.numRisers || st.risers
            });
          } catch (e) {
            if (this.debug) console.warn(`[ENGINE OMIT] Invalid geometry for stair/flight: ${e.message}`);
          }

          const risers = geometry ? geometry.risers : 0;
          const totalRunFt = geometry ? geometry.totalRun : 0;
          const diagonalFt = geometry ? geometry.stringerLength : 0;
          const slopeDeg = geometry ? geometry.angle : 0;
          const panArea = (st.widthFt || widthFt) * totalRunFt;

          let manualStringerLength = 0;
          if (st.stringerLength && typeof st.stringerLength === 'object') {
            manualStringerLength = st.stringerLength.unit === 'IN' ? parseFloat(st.stringerLength.value || 0) / 12 : parseFloat(st.stringerLength.value || 0);
          } else {
            manualStringerLength = parseToFeet(st.stringerLength) || 0;
          }

          // 🔄 3-PRIORITY STRINGER LENGTH RESOLUTION:
          //   1. Manual entry (user typed a value)
          //   2. Geometry engine result (diagonalFt from calculateStairGeometry)
          //   3. Direct Pythagorean fallback (always works if rise/run/risers present)
          let resolvedDiagonalFt = 0;
          let stringerLengthCalculated = false;
          let stringerCalculationMethod = 'none';

          // Parse rise/run for Pythagorean fallback
          const riseIn = parseToFeet(st.rise, 'IN') * 12;   // back to inches
          const runIn  = parseToFeet(st.run || st.tread, 'IN') * 12;
          const numRisers = risers || parseInt(st.numRisers) || 0;

          if (manualStringerLength > 0) {
            resolvedDiagonalFt = manualStringerLength;
            stringerCalculationMethod = 'manual';
            stringerLengthCalculated = false;
            console.log(`[STRINGER ENGINE] Using manual entry: ${resolvedDiagonalFt} ft`);
          } else if (diagonalFt > 0) {
            resolvedDiagonalFt = diagonalFt;
            stringerCalculationMethod = 'geometry-engine';
            stringerLengthCalculated = true;
            console.log(`[STRINGER ENGINE] Using geometry engine: ${resolvedDiagonalFt} ft`);
          } else if (riseIn > 0 && runIn > 0 && numRisers > 0) {
            resolvedDiagonalFt = this.calculateStringerLengthDirect(riseIn, runIn, numRisers);
            stringerCalculationMethod = 'pythagorean-fallback';
            stringerLengthCalculated = true;
            console.log(`[STRINGER ENGINE] Using Pythagorean fallback: ${resolvedDiagonalFt} ft (${riseIn}" rise × ${runIn}" run × ${numRisers} risers)`);
          } else {
            resolvedDiagonalFt = 0;
            stringerCalculationMethod = 'none';
            console.warn('[STRINGER ENGINE] ⚠️ Could not resolve stringer length — insufficient data');
          }

          const nsBot = parseToFeet(st.nsStringerBot);
          const fsBot = parseToFeet(st.fsStringerBot);
          const nsTop = parseToFeet(st.nsStringerTop);
          const fsTop = parseToFeet(st.fsStringerTop);

          const nsTrueLength = resolvedDiagonalFt > 0 ? resolvedDiagonalFt + nsBot + nsTop : 0;
          const fsTrueLength = resolvedDiagonalFt > 0 ? resolvedDiagonalFt + fsBot + fsTop : 0;
          const totalLFBothStringers = nsTrueLength + fsTrueLength;

          return {
            ...st,
            geometry,
            risers,
            widthFt: st.widthFt || widthFt,
            heightFt: parseToFeet(st.totalHeight, 'IN'),
            totalRunFt: this.roundExcel(totalRunFt, 3),
            slope: this.roundExcel(slopeDeg, 2),
            stringerLength: this.roundExcel(Math.max(nsTrueLength, fsTrueLength), 2),
            nsTrueLength: this.roundExcel(nsTrueLength, 2),
            fsTrueLength: this.roundExcel(fsTrueLength, 2),
            totalLFBothStringers: this.roundExcel(totalLFBothStringers, 2),
            panArea: this.roundExcel(panArea, 2),
            isCompliant: slopeDeg >= 30 && slopeDeg <= 38,
            stringerLengthCalculated,
            stringerCalculationMethod,
            resolvedDiagonalFt: this.roundExcel(resolvedDiagonalFt, 2)
          };
        };

        const mainTakeoff = calcTakeoff(s);
        const flightTakeoffs = (s.flights || []).map(fl => calcTakeoff({
          ...fl,
          stairType: fl.stairType || s.stairType,
          stringerType: fl.stringerType || s.stringerType,
          stringerSize: fl.stringerSize || s.stringerSize,
          stairWidth: fl.stairWidth || s.stairWidth,
          widthFt: parseToFeet(fl.stairWidth || fl.width || width)
        }));

        return {
          ...mainTakeoff,
          flights: flightTakeoffs
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
  async calculateEstimate(takeoff, adminOwnerId = null) {
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
    const scrapFactorPct = getRate('scrap_factor_pct', 11);
    const scrapMultiplier = 1 + (scrapFactorPct / 100);
    const scrapPortion = scrapFactorPct / 100;
    const shopRate = getRate('shop_hourly_rate', 90);
    const fieldRate = getRate('field_hourly_rate', 125);
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

    // 📚 LIBRARY LOOKUP HELPERS
    const getCostPerLb = async (materialGradeId, fallbackPrice) => {
      if (!materialGradeId) return fallbackPrice;
      try {
        const [rows] = await db.query(
          'SELECT price FROM dictionary WHERE id = ? AND category = ?',
          [materialGradeId, 'material_type']
        );
        if (rows.length > 0 && rows[0].price !== null) {
          return parseFloat(rows[0].price);
        }
      } catch (err) {
        console.error(`[ENGINE] Error fetching material cost for ID ${materialGradeId}:`, err);
      }
      return fallbackPrice;
    };

    const getLbsPerSf = async (gaugeId, fallbackWeight) => {
      if (!gaugeId) return { weight: fallbackWeight, price: null };
      try {
        const [rows] = await db.query(
          'SELECT steelLbsLf, price FROM dictionary WHERE id = ? AND category = ?',
          [gaugeId, 'gauge_plate_spec']
        );
        if (rows.length > 0) {
          return { 
            weight: rows[0].steelLbsLf !== null ? parseFloat(rows[0].steelLbsLf) : fallbackWeight,
            price: (rows[0].price !== null && rows[0].price > 0) ? parseFloat(rows[0].price) : null
          };
        }
      } catch (err) {
        console.error(`[ENGINE] Error fetching gauge weight/price for ID ${gaugeId}:`, err);
      }
      return { weight: fallbackWeight, price: null };
    };

    // 📦 PAN PLATE TYPE: fetch shop hrs/SF from library (stored in shopEfficiency column)
    // Default 1.2 hrs/SF (TYPE-1(Z shape)) if not set
    const getPanPlateShopHrs = async (panPlateTypeId) => {
      if (!panPlateTypeId) return 1.2;
      try {
        const [rows] = await db.query(
          'SELECT shopEfficiency FROM dictionary WHERE id = ? AND category = ?',
          [panPlateTypeId, 'pan_plate_type']
        );
        if (rows.length > 0 && rows[0].shopEfficiency !== null) {
          const hrs = parseFloat(rows[0].shopEfficiency);
          console.log(`[ENGINE] 📦 Pan plate type ID ${panPlateTypeId}: ${hrs} shop hrs/SF`);
          return hrs;
        }
      } catch (err) {
        console.error(`[ENGINE] Error fetching pan plate type for ID ${panPlateTypeId}:`, err);
      }
      return 1.2; // Excel default: TYPE-1(Z shape)
    };

    // 🔩 PAN SUPPORT TYPE: fetch labor multiplier from library (stored as fieldEfficiency × 100)
    // Default 1.0 (Single support) if not set
    const getPanSupportMultiplier = async (panSupportTypeId) => {
      if (!panSupportTypeId) return 1.0;
      try {
        const [rows] = await db.query(
          'SELECT fieldEfficiency, value FROM dictionary WHERE id = ? AND category = ?',
          [panSupportTypeId, 'pan_support_type']
        );
        if (rows.length > 0 && rows[0].fieldEfficiency !== null) {
          const multiplier = parseFloat(rows[0].fieldEfficiency) / 100;
          console.log(`[ENGINE] 🔩 Pan support type ID ${panSupportTypeId} (${rows[0].value}): ${multiplier}× labor adj`);
          return multiplier;
        }
      } catch (err) {
        console.error(`[ENGINE] Error fetching pan support type for ID ${panSupportTypeId}:`, err);
      }
      return 1.0; // Default: Single support (no adjustment)
    };


    const getGratingFactors = async (gratingLabel) => {
      if (!gratingLabel || gratingLabel.toLowerCase().includes('select')) return null;
      try {
        const [rows] = await db.query(
          'SELECT price, shopLaborMhLf FROM dictionary WHERE (label = ? OR value = ?) AND category = ?',
          [gratingLabel, gratingLabel, 'grating_type']
        );
        if (rows.length > 0) {
          return {
            price: rows[0].price !== null ? parseFloat(rows[0].price) : null,
            laborFactor: rows[0].shopLaborMhLf !== null ? parseFloat(rows[0].shopLaborMhLf) : 1.00
          };
        }
      } catch (err) {
        console.error(`[ENGINE] Error fetching grating factors for ${gratingLabel}:`, err);
      }
      return null;
    };

    const estimate = {
      rails: await Promise.all((takeoff.rails || []).map(async rail => {
        const lengthFt = rail.lengthFt || 0;
        const config = RAIL_CONFIG[rail.typeCode] || RAIL_CONFIG.GUARD_2_LINE;
        const typeLabel = rail.railType || '';

        let lbsPerFt = null;
        let shopMHPerFt = null;
        let fieldMHPerFt = null;
        let dictPriceLF = null;

        const [dbBenchmarks] = await db.query(
          'SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf, price FROM dictionary WHERE label = ? AND (category LIKE ? OR category LIKE ? OR category LIKE ? OR category LIKE ?)',
          [typeLabel, 'guardRail_type', 'wallRail_type', 'grabRail_type', 'caneRail_type']
        );

        if (dbBenchmarks.length > 0 && dbBenchmarks[0].steelLbsLf !== null) {
          lbsPerFt = dbBenchmarks[0].steelLbsLf;
          shopMHPerFt = dbBenchmarks[0].shopLaborMhLf;
          fieldMHPerFt = dbBenchmarks[0].fieldLaborMhLf;
          if (dbBenchmarks[0].price !== null && dbBenchmarks[0].price > 0) {
            dictPriceLF = dbBenchmarks[0].price;
          }
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

        let finishRate = 0;
        let finishShopRate = null;
        let finishFieldRate = null;
        let finishTotalCost = 0;
        let finishShopHrs = 0;
        let finishFieldHrs = 0;

        // 🧠 PRICING: Check dictionary for finish-specific price/labor first
        const isGalv = (rail.finish || '').toUpperCase().includes('GALVANIZED') || (rail.finish || '').toUpperCase().includes('GALV');
        const isPowder = (rail.finish || '').toUpperCase().includes('POWDER');
        const isPrimer = (rail.finish || '').toUpperCase().includes('PRIMER') || (!isGalv && !isPowder);

        if (rail.finish) {
          const [fRows] = await db.query(
            'SELECT price, shopLaborMhLf, fieldLaborMhLf FROM dictionary WHERE (label = ? OR value = ?) AND category = ?',
            [rail.finish, rail.finish, 'finish_option']
          );
          if (fRows.length > 0) {
            if (fRows[0].price !== null && fRows[0].price > 0) finishRate = fRows[0].price;
            if (fRows[0].shopLaborMhLf !== null) finishShopRate = fRows[0].shopLaborMhLf;
            if (fRows[0].fieldLaborMhLf !== null) finishFieldRate = fRows[0].fieldLaborMhLf;
          }
        }

        // Fallback to global rates if not set in dictionary
        if (finishRate === 0) {
          if (isGalv) finishRate = getRate('galvanize_charge', 0.75);
          else if (isPowder) finishRate = getRate('powder_coat_rate', 1.7587);
          else if (isPrimer) finishRate = getRate('primer_rate', 0.00);
        }
        
        finishTotalCost = baseWeight * finishRate;

        if (isGalv || isPowder) {
          if (finishShopRate === null) {
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
          }
          
          finishShopHrs = lengthFt * (finishShopRate || 0);
          finishFieldHrs = lengthFt * (finishFieldRate || 0);
        }

        // ── Canonical Flow Steps (Benchmark Parity Handoff) ──
        // 1. steelCost = steelLbsTotal × steel_price_per_lb OR Dictionary Price
        let steelPriceBase = 0;
        let scrapPriceOnly = 0;
        const scrapLbs = baseWeight * scrapPortion;

        const dynamicSteelPrice = await getCostPerLb(rail.materialGradeId, steelPrice);

        if (dictPriceLF !== null) {
          // 💰 FIXED PRICE MODE: Use price from dictionary per LF
          steelPriceBase = lengthFt * dictPriceLF;
          scrapPriceOnly = 0; // Assume scrap included in fixed price
          console.log(`[RAIL ENGINE] 💰 Using dictionary fixed price for "${typeLabel}": $${dictPriceLF}/LF (Total: $${steelPriceBase})`);
        } else {
          // ⚖️ WEIGHT MODE: Use steel price per lb
          steelPriceBase = baseWeight * dynamicSteelPrice;
          scrapPriceOnly = scrapLbs * dynamicSteelPrice;
        }

        // 3. finishCost = finishRate × steelLbsTotal (never × scrap)
        // Calculated above as finishTotalCost.

        // 4. porRokCost = postQty × mountingRate (anchored=$6, embedded=$5, or specialized por_rok_rate)
        // 5. anchorBoltsCost = steelLbsTotal × anchor_bolt_rate
        const mTypeVal = rail.config?.mountingType || rail.mountingType || '';
        const mType = (mTypeVal && typeof mTypeVal === 'string') ? mTypeVal.toLowerCase() : '';
        let porRokCost = 0;
        let anchorBoltsCost = baseWeight * (getRate('anchor_bolt_rate', 0.025));

        // 🧠 PRICING: Check dictionary for mounting-specific price first
        let dictMountingPrice = null;
        if (mTypeVal) {
          const [mRows] = await db.query(
            'SELECT price FROM dictionary WHERE (label = ? OR value = ?) AND category = ?',
            [mTypeVal, mTypeVal, 'mounting_type']
          );
          if (mRows.length > 0 && mRows[0].price !== null && mRows[0].price > 0) {
            dictMountingPrice = mRows[0].price;
          }
        }

        // 🛡️ SECURITY RULE: No mounting costs for Kick Plates
        const isValidMType = mType !== '' && mType !== '0' && !mType.includes('select');
        if (rail.typeCode !== 'KICK_PLATE' && isValidMType) {
          if (dictMountingPrice !== null) {
            porRokCost = rail.postQty * dictMountingPrice;
          } else if (mType.includes('embedded')) {
            porRokCost = rail.postQty * (getRate('mounting_embedded_rate', 5.00));
          } else if (mType.includes('anchored')) {
            const porRokRateOverride = getRate('por_rok_anchor_rate', 0.0);
            const anchoredRate = getRate('mounting_anchored_rate', 6.00);
            porRokCost = rail.postQty * (porRokRateOverride > 0 ? porRokRateOverride : anchoredRate);
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
            steelPricePerLb: this.roundExcel(dynamicSteelPrice, 2),
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
        let dictPriceSF = null;

        const [dbBenchmarks] = await db.query(
          `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf, price FROM dictionary 
           WHERE (label = ? OR value = ?) AND category = ? 
           AND (admin_owner_id IS NULL OR admin_owner_id = ?)
           ORDER BY CASE WHEN admin_owner_id IS NULL THEN 1 ELSE 0 END`,
          [typeLabel, typeLabel, 'platform_type', adminOwnerId]
        );
        if (dbBenchmarks.length > 0 && dbBenchmarks[0].steelLbsLf !== null) {
          lbsPerSF = dbBenchmarks[0].steelLbsLf;
          shopMHPF = dbBenchmarks[0].shopLaborMhLf;
          fieldMHPF = dbBenchmarks[0].fieldLaborMhLf;
          if (dbBenchmarks[0].price !== null && dbBenchmarks[0].price > 0) {
            dictPriceSF = dbBenchmarks[0].price;
          }
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
        const isPrimer = (p.finish || '').toUpperCase().includes('PRIMER') || (!isGalv && !isPowder);

        let finishRate = 0;
        if (isGalv) finishRate = getRate('galvanize_charge', 0.7500);
        else if (isPowder) finishRate = getRate('powder_coat_rate', 1.7587);
        else if (isPrimer) finishRate = getRate('primer_rate', 0.00);

        let finishTotalCost = baseWeight * finishRate;
        let finishFieldHrs = 0;
        let finishShopHrs = 0;

        if (isGalv || isPowder) {
          if (isGalv) {
            const galvMh = matchLabor(`${typeLabel} 10'-0" wide`);
            finishShopHrs = (area / 10) * galvMh.shop;
            finishFieldHrs = area * 0.05; // 🔄 EXCEL PARITY: Landings add exactly 0.05 MH/SF field finish labor
          } else if (isPowder) {
            finishFieldHrs = area * 0.05; // Powder coat also adds handling labor
          }
        }

        // ── Canonical Flow Steps (Benchmark Parity Handoff) ──
        // 1. steelCost = steelLbsTotal × steel_price_per_lb OR Dictionary Price
        let steelPriceBase = 0;
        let scrapPriceOnly = 0;

        const dynamicSteelPrice = await getCostPerLb(p.materialGradeId, steelPrice);

        if (dictPriceSF !== null) {
          // 💰 FIXED PRICE MODE: Use price from dictionary per SF
          steelPriceBase = area * dictPriceSF;
          scrapPriceOnly = 0; // Assume scrap included
          console.log(`[PLATFORM ENGINE] 💰 Using dictionary fixed price for "${typeLabel}": $${dictPriceSF}/SF (Total: $${steelPriceBase})`);
        } else {
          // ⚖️ WEIGHT MODE
          steelPriceBase = baseWeight * dynamicSteelPrice;
          scrapPriceOnly = scrapLbs * dynamicSteelPrice;
        }

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
            steelPricePerLb: this.roundExcel(dynamicSteelPrice, 2),
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
        const estimateStair = async (st) => {
          const dynamicSteelPrice = await getCostPerLb(st.materialGradeId, steelPrice);
          const panSpec = await getLbsPerSf(st.gaugeId, PAN_PLATE_PSF);
          const dynamicPanPlatePsf = panSpec.weight;
          const dictPanPrice = panSpec.price;
          // 📦 PAN PLATE TYPE & SUPPORT — fetched from library
          const panShopHrsPerSf = await getPanPlateShopHrs(st.panPlateTypeId);
          const panSupportMultiplier = await getPanSupportMultiplier(st.panSupportTypeId);
          const stairTypeLabel = (st.stairType || '').toUpperCase();
          const geometry = st.geometry;
          const risers = st.risers || 0;
          const treads = geometry ? geometry.treads : (risers > 0 ? risers - 1 : 0);
          const hasGeometry = (st.totalLFBothStringers > 0 && risers > 0) || (geometry !== null);

          let strLbs = 0;
          let panLbs = 0;
          let shopHrs = 0;
          let fieldHrs = 0;
          const numberOfTreads = Math.max(0, risers - 1);
          let panTypeStr = 'NONE';

          if (!hasGeometry) {
            return {
              ...st,
              totalWeight: 0, shopHours: 0, fieldHours: 0, totalCost: 0,
              systemCalc: { 
                risers: 0, 
                baseSteelLbs: 0, 
                scrapLbs: 0, 
                shopTotalHrs: 0, 
                fieldTotalHrs: 0, 
                stringerShopHrs: 0,
                panPlateShopHrs: 0,
                panPlateWeight: 0,
                totalSteel: 0,
                mountingCharge: 0 
              }
            };
          }

          let baseRiserShopHrs = 0;
          let baseRiserFieldHrs = 0;
          let resolvedWidth = st.widthFt || 5.0;

          // 🔍 STAIR TYPE DICTIONARY LOOKUP
          const [stairDict] = await db.query(
            'SELECT shopLaborMhLf, fieldLaborMhLf, price FROM dictionary WHERE label = ? AND category = ?',
            [st.stairType, 'stair_type']
          );

          if (stairDict.length > 0) {
            baseRiserShopHrs = parseFloat(stairDict[0].shopLaborMhLf || 1.25);
            baseRiserFieldHrs = parseFloat(stairDict[0].fieldLaborMhLf || 0.85);
            // If price is set on the stair type (e.g., fixed unit price), we could use it, 
            // but usually we calculate based on weight * material rate.
            console.log(`[ENGINE] 🔍 Using dictionary factors for stair type "${st.stairType}": Shop ${baseRiserShopHrs}, Field ${baseRiserFieldHrs}`);
          } else {
            if (stairTypeLabel.includes('PAN')) {
              strLbs = 10.600;
              panLbs = resolvedWidth * 10.0;
              // ✅ EXCEL PARITY: Per-tread labor rates (1.6 shop, 1.0 field per tread)
              baseRiserShopHrs = 1.600;
              baseRiserFieldHrs = 1.000;
            } else if (stairTypeLabel.includes('GRATING')) {
              strLbs = 10.600;
              panLbs = resolvedWidth * 10.0;
              baseRiserShopHrs = 1.600;
              baseRiserFieldHrs = 1.000;
            } else {
              panLbs = 0;
              baseRiserShopHrs = 1.600;
              baseRiserFieldHrs = 1.000;
            }
          }

          const src = st.stringerSize || '';
          const [exactMatch] = await db.query(
            `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
             WHERE (UPPER(TRIM(label)) = UPPER(TRIM(?)) OR UPPER(TRIM(value)) = UPPER(TRIM(?)) OR UPPER(TRIM(description)) = UPPER(TRIM(?)))
             AND category = 'stringer_size'
             AND (admin_owner_id IS NULL OR admin_owner_id = ?)
             ORDER BY CASE WHEN admin_owner_id IS NULL THEN 1 ELSE 0 END`,
            [src, src, src, adminOwnerId]
          );

          let dictPriceLF = null;

          if (exactMatch.length > 0 && exactMatch[0].steelLbsLf !== null) {
            strLbs = parseFloat(exactMatch[0].steelLbsLf);
            // ✅ Use explicit null-check so a stored value of 0 doesn't fall back
            if (exactMatch[0].shopLaborMhLf !== null && exactMatch[0].shopLaborMhLf !== undefined) {
              shopHrs = parseFloat(exactMatch[0].shopLaborMhLf);
            }
            if (exactMatch[0].fieldLaborMhLf !== null && exactMatch[0].fieldLaborMhLf !== undefined) {
              fieldHrs = parseFloat(exactMatch[0].fieldLaborMhLf);
            }
            if (exactMatch[0].price !== null && exactMatch[0].price > 0) {
              dictPriceLF = exactMatch[0].price;
            }
            console.log(`[STAIR ENGINE] 📋 Stringer dict EXACT MATCH: "${src.substring(0,50)}" → lbs/ft=${strLbs}, shopHrs=${shopHrs}, fieldHrs=${fieldHrs}`);
          } else {
            const cleanFull = src.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            const [fullMatch] = await db.query(
              `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf, price FROM dictionary 
               WHERE (UPPER(REPLACE(REPLACE(REPLACE(label, ' ', ''), '.', ''), '-', '')) = ? OR UPPER(REPLACE(REPLACE(REPLACE(value, ' ', ''), '.', ''), '-', '')) = ? OR UPPER(REPLACE(REPLACE(REPLACE(description, ' ', ''), '.', ''), '-', '')) = ?) 
               AND category = ?
               AND (admin_owner_id IS NULL OR admin_owner_id = ?)
               ORDER BY CASE WHEN admin_owner_id IS NULL THEN 1 ELSE 0 END`,
              [cleanFull, cleanFull, cleanFull, 'stringer_size', adminOwnerId]
            );

            if (fullMatch.length > 0 && fullMatch[0].steelLbsLf !== null) {
              strLbs = parseFloat(fullMatch[0].steelLbsLf);
              if (fullMatch[0].shopLaborMhLf !== null && fullMatch[0].shopLaborMhLf !== undefined) {
                shopHrs = parseFloat(fullMatch[0].shopLaborMhLf);
              }
              if (fullMatch[0].fieldLaborMhLf !== null && fullMatch[0].fieldLaborMhLf !== undefined) {
                fieldHrs = parseFloat(fullMatch[0].fieldLaborMhLf);
              }
              if (fullMatch[0].price !== null && fullMatch[0].price > 0) {
                dictPriceLF = fullMatch[0].price;
              }
              console.log(`[STAIR ENGINE] 📋 Stringer dict FULL MATCH: lbs/ft=${strLbs}, shopHrs=${shopHrs}, fieldHrs=${fieldHrs}`);
            } else {
              let searchProfile = src;
              if (src.includes('/')) {
                searchProfile = src.split('/').pop().trim();
              } else if (src.includes('MC') || src.includes('C ') || src.includes('TS')) {
                const tokens = src.split(' ');
                if (tokens.length > 3) searchProfile = tokens.slice(-4).join(' ');
              }
              const cleanSearch = searchProfile.replace(/[^A-Z0-9]/gi, '').toUpperCase();

              if (STRINGER_BENCHMARKS[cleanSearch]) {
                strLbs = STRINGER_BENCHMARKS[cleanSearch].lbs;
                shopHrs = STRINGER_BENCHMARKS[cleanSearch].shop;
                fieldHrs = STRINGER_BENCHMARKS[cleanSearch].field;
              } else {
                const weightMatch = src.match(/X\s*(\d+(\.\d+)?)/i);
                if (weightMatch) {
                  strLbs = parseFloat(weightMatch[1]);
                  shopHrs = 0.150;
                  fieldHrs = 0.100;
                }
              }

              const [dictBenchmarks] = await db.query(
                `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
                 WHERE (UPPER(REPLACE(REPLACE(REPLACE(label, ' ', ''), '.', ''), '-', '')) = ? OR UPPER(REPLACE(REPLACE(REPLACE(value, ' ', ''), '.', ''), '-', '')) = ? OR (label LIKE ? AND label NOT LIKE '%wide%' AND label NOT LIKE '%Std.%')) 
                 AND category = 'stringer_size'
                 AND (admin_owner_id IS NULL OR admin_owner_id = ?)
                 ORDER BY CASE WHEN admin_owner_id IS NULL THEN 1 ELSE 0 END`,
                [cleanSearch, cleanSearch, '%' + searchProfile + '%', adminOwnerId]
              );

              if (dictBenchmarks.length > 0 && dictBenchmarks[0].steelLbsLf !== null && dictBenchmarks[0].steelLbsLf > 0) {
                strLbs = parseFloat(dictBenchmarks[0].steelLbsLf);
                if (dictBenchmarks[0].shopLaborMhLf !== null && dictBenchmarks[0].shopLaborMhLf !== undefined) {
                  shopHrs = parseFloat(dictBenchmarks[0].shopLaborMhLf);
                }
                if (dictBenchmarks[0].fieldLaborMhLf !== null && dictBenchmarks[0].fieldLaborMhLf !== undefined) {
                  fieldHrs = parseFloat(dictBenchmarks[0].fieldLaborMhLf);
                }
                console.log(`[STAIR ENGINE] 📋 Stringer dict FUZZY MATCH: lbs/ft=${strLbs}, shopHrs=${shopHrs}, fieldHrs=${fieldHrs}`);
              } else {
                console.warn(`[STAIR ENGINE] ⚠️ No stringer_size dict match for "${src}" — using weight regex / STRINGER_BENCHMARKS fallback`);
              }
            }
          }

          const isRecipeMode = (src || '').toLowerCase().includes('std.') || (src || '').toLowerCase().includes('std ');
          let stringerBaseWeight = 0;
          let shopHoursInternal = 0;
          let fieldHoursInternal = 0;

          // 🔄 SAFE FALLBACK: Use 0 when stringer LF is missing — never use risers*2 (causes $19k+ overestimation)
          // If totalLFBothStringers is 0, the upstream calcTakeoff couldn't resolve the geometry,
          // meaning there is genuinely insufficient data to price the stringer.
          const effectiveStringerLF = (st.totalLFBothStringers > 0) ? st.totalLFBothStringers : 0;

          // ✅ FORMULA: Base Weight = profile lbs/ft × total LF both stringers
          //   e.g. MC12x10.6 stringer, 10ft long: 10.6 lbs/ft × 10ft × 2 stringers = 212 lbs
          stringerBaseWeight = effectiveStringerLF * strLbs;

          // ✅ FORMULA: Shop/Field Hours = rate_per_tread × numTreads
          //   PRIMARY SOURCE: stringer_size library (shopHrs / fieldHrs resolved from dict lookup above).
          //   These are per-tread rates stored in the "Shop HRS" and "Field HRS" columns.
          //   e.g. MC12x10.6 → 1.5 shop hrs/tread × 10 treads = 15 shop hrs
          //        MC12x14.3 → 1.5 shop hrs/tread × 10 treads = 15 shop hrs
          //   FALLBACK: if no stringer-size rate found, use baseRiserShopHrs from the stair_type dict.
          const resolvedShopHrsPerTread = shopHrs > 0 ? shopHrs : baseRiserShopHrs;
          const resolvedFieldHrsPerTread = fieldHrs > 0 ? fieldHrs : baseRiserFieldHrs;
          shopHoursInternal = resolvedShopHrsPerTread * numberOfTreads;
          fieldHoursInternal = resolvedFieldHrsPerTread * numberOfTreads;
          console.log(`[STAIR ENGINE] 🕐 Stringer Labor: ${resolvedShopHrsPerTread} shop hrs/tread × ${numberOfTreads} treads = ${shopHoursInternal.toFixed(2)} shop hrs (source: ${shopHrs > 0 ? 'stringer_size dict' : 'stair_type fallback'})`);

          const isGratingStair = stairTypeLabel.includes('GRATING') || (st.config && st.config.stairGrating === true);
          const isPanPlateStair = stairTypeLabel === 'PAN_PLATE_CONC_FILLED' || 
                                  stairTypeLabel === 'PAN PLATE CONC. FILLED' || 
                                  stairTypeLabel === 'PAN-CONCRETE' || 
                                  stairTypeLabel === 'PAN_CONCRETE';
          
          let panTotalWeight = 0;
          let panPlateArea = 0;
          let panShopHoursContrib = 0;
          let panPriceTotal = 0;
          let structuralSteelCost = 0;
          let gratingTotalCost = 0;
          let gratingTotalWeight = 0;
          
          if (isPanPlateStair) {
            // numberOfTreads already declared in outer scope
            panPlateArea = resolvedWidth * 1.0 * numberOfTreads;

            let dictPanPricePerPiece = null;
            let dictPanShopHrsPerPiece = null;
            panTypeStr = 'TYPE-1';

            if (st.panPlateConfigId) {
              try {
                const [panRows] = await db.query(
                  'SELECT description, price, shopLaborMhLf FROM dictionary WHERE id = ? AND category = ?',
                  [st.panPlateConfigId, 'pan_plate_config']
                );
                if (panRows.length > 0) {
                  if (panRows[0].description) panTypeStr = panRows[0].description;
                  if (panRows[0].price !== null) dictPanPricePerPiece = parseFloat(panRows[0].price);
                  if (panRows[0].shopLaborMhLf !== null) dictPanShopHrsPerPiece = parseFloat(panRows[0].shopLaborMhLf);
                }
              } catch(e) {
                console.warn('[STAIR ENGINE] Could not resolve pan details from panPlateConfigId:', e.message);
              }
            }

            // 🔬 ENGINEERING FORMULA PATH: use T×W×L×0.283 when thickness + geometry provided
            // Resolve thickness: direct value takes priority, then gauge label lookup
            let resolvedThickness = parseFloat(st.panPlateThickness) || 0;
            if (!resolvedThickness && st.panPlateGauge) {
              resolvedThickness = getThicknessFromGaugeLabel(st.panPlateGauge) || 0;
              if (resolvedThickness) {
                console.log(`[STAIR ENGINE] 🏷️ Resolved thickness from gauge label "${st.panPlateGauge}": ${resolvedThickness}"`);
              }
            }

            const hasEngineeringInputs = resolvedThickness > 0
              && st.riserHeightInches && parseFloat(st.riserHeightInches) > 0
              && st.treadWidthInches  && parseFloat(st.treadWidthInches)  > 0
              && numberOfTreads > 0;

            if (hasEngineeringInputs) {
              const engResult = engineeringPanWeight(
                resolvedThickness,
                parseFloat(st.riserHeightInches),
                parseFloat(st.treadWidthInches),
                parseFloat(st.stairWidthFeet || resolvedWidth),
                numberOfTreads,
                panTypeStr,
                steelPrice
              );

              if (engResult) {
                panTotalWeight = engResult.panPlateWeight;
                console.log(`[STAIR ENGINE] 🔬 Engineering formula: ${engResult.calculation.formula} = ${panTotalWeight.toFixed(2)} lbs`);
              } else {
                // Fallback if engineering inputs were invalid
                panTotalWeight = panPlateArea * dynamicPanPlatePsf;
                console.warn('[STAIR ENGINE] ⚠️ Engineering formula returned null — falling back to PSF model');
              }
            } else {
              // 📦 PSF FALLBACK: used when no thickness/geometry supplied in payload
              panTotalWeight = panPlateArea * dynamicPanPlatePsf;
              console.log(`[STAIR ENGINE] 📦 PSF model: ${panPlateArea.toFixed(2)} SF × ${dynamicPanPlatePsf} PSF = ${panTotalWeight.toFixed(2)} lbs`);
            }

            // ✅ LIBRARY-DRIVEN: shop hours
            // If the dictionary provides a specific per-piece hour, use it (multiplied by treads)
            if (dictPanShopHrsPerPiece !== null) {
              panShopHoursContrib = dictPanShopHrsPerPiece * numberOfTreads;
              console.log(`[ENGINE] 📐 Pan plate (Fixed): ${numberOfTreads} treads × ${dictPanShopHrsPerPiece} hrs/piece = ${panShopHoursContrib.toFixed(2)} shop hrs`);
            } else {
              // Fallback to area-based calculation
              panShopHoursContrib = panPlateArea * panShopHrsPerSf * panSupportMultiplier;
              console.log(`[ENGINE] 📐 Pan plate (Area): ${panPlateArea.toFixed(2)} SF × ${panShopHrsPerSf} hrs/SF × ${panSupportMultiplier}× = ${panShopHoursContrib.toFixed(2)} shop hrs`);
            }

            // ✅ PRICE HANDLING: If the dictionary has a price, it's treated as per-piece (tread)
            if (dictPanPricePerPiece !== null) {
              panPriceTotal = dictPanPricePerPiece * numberOfTreads;
              console.log(`[ENGINE] 💰 Pan plate (Fixed Price): ${numberOfTreads} treads × $${dictPanPricePerPiece}/piece = $${panPriceTotal.toFixed(2)}`);
            }
          } else if (!isGratingStair) {
            panTotalWeight = Math.max(0, risers - 1) * panLbs; // legacy fallback
          }
          
          // ✅ Pan plate shop hours are kept SEPARATE from stringer hours.
          // They will be reported independently in systemCalc (panPlateShopHrs)
          // and added to the total labor cost, but NOT merged into the stringer hour count.
          


          const totalUnitWeight = stringerBaseWeight + panTotalWeight;
          if (stairTypeLabel.includes('GRATING') || (st.config && st.config.stairGrating === true)) {
            const w = parseFloat(st.widthFt || 5);
            const gratingKeyLookup = (st.gratingTreadType || st.gratingType || '').trim();
            const isValidGrating = gratingKeyLookup !== '' && !gratingKeyLookup.toLowerCase().includes('select');

            if (!isValidGrating) {
              console.log(`[ENGINE] ⚠️ No grating type selected. Skipping grating calculation.`);
              gratingTotalCost = 0;
              gratingTotalWeight = 0;
            } else {
              const dictGrating = await getGratingFactors(gratingKeyLookup);
              let gratingTreadRate = 95.30;
              let dictGratingLaborFactor = 1.00;

              if (dictGrating) {
                if (dictGrating.price !== null) gratingTreadRate = dictGrating.price;
                dictGratingLaborFactor = dictGrating.laborFactor;
                console.log(`[ENGINE] 💰 Using dictionary factors for grating "${gratingKeyLookup}": Price $${gratingTreadRate}, Labor x${dictGratingLaborFactor}`);
              } else {
                // Fallback width-based pricing
                if (w <= 3.51) gratingTreadRate = 71.10;
                else if (w <= 4.01) gratingTreadRate = 78.60;
                else if (w <= 4.51) gratingTreadRate = 87.80;
                console.log(`[ENGINE] ℹ️ Using width-based fallback for grating: ${gratingTreadRate} (Width: ${w}ft)`);
              }

              // 🔍 Hybrid Factor Lookup: Priority to legacy keys, fallback to dynamic slugs
              const getBaseSpec = (label) => {
                if (!label) return '';
                return label.replace(/\s+x?\s*\d+'-\d+"?.*$/, '').trim();
              };
              const baseLabel = getBaseSpec(gratingKeyLookup);

              const legacyFactors = {
                '1 1/4" Bar / Welded': 'grating_factor_bar_125_welded',
                '1-1/4" Bar / Welded': 'grating_factor_bar_125_welded',
                '1 1/4" Bar / Bolted': 'grating_factor_bar_125_bolted',
                '1-1/4" Bar / Bolted': 'grating_factor_bar_125_bolted',
                '1" Bar / Welded': 'grating_factor_bar_100_welded',
                '1" Bar / Bolted': 'grating_factor_bar_100_bolted',
                'McNichols': 'grating_factor_mcnichols',
                'Prefab': 'grating_factor_prefab',
              };
              
              let gratingFactorKey = null;
              for (const [k, v] of Object.entries(legacyFactors)) {
                if (baseLabel.toLowerCase().includes(k.toLowerCase())) {
                  gratingFactorKey = v;
                  break;
                }
              }

              if (!gratingFactorKey) {
                const slug = baseLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                gratingFactorKey = `grating_factor_${slug}`;
              }
              
              console.log(`[ENGINE] 🔍 Grating Factor Match: "${gratingFactorKey}" for "${baseLabel}"`);
              
              const treadFactor = dictGrating ? dictGratingLaborFactor : configManager.get(gratingFactorKey, 1.00);
              const gratingNumberOfTreads = risers > 0 ? risers - 1 : 0;
              gratingTotalCost = gratingTreadRate * treadFactor * gratingNumberOfTreads;
              
              // 🔄 EXCEL PARITY: Add grating weight to total steel calculation
              gratingTotalWeight = w * 1.0 * gratingNumberOfTreads * GRATING_TREAD_PSF;
            }
            
            panPriceTotal = 0;
          }

          const finishBaseLbs = stringerBaseWeight + panTotalWeight;
          const isGalv = /GALV/i.test(st.finish || '');
          const isPowder = /POWDER/i.test(st.finish || '');
          const isPrimer = /PRIMER/i.test(st.finish || '') || (!isGalv && !isPowder);

          let finishTotalCost = 0;
          let galvShopHrs = 0;
          let galvFieldHrs = 0;

          let finishRate = 0;
          if (isGalv) finishRate = getRate('galvanize_charge', 0.7500);
          else if (isPowder) finishRate = getRate('powder_coat_rate', 1.7587);
          else if (isPrimer) finishRate = getRate('primer_rate', 0.00);

          finishTotalCost = finishBaseLbs * finishRate;

          if (isGalv || isPowder) {
            const galvMh = matchLabor(st.stringerSize || stairTypeLabel);
            galvShopHrs = risers * galvMh.shop;
            galvFieldHrs = risers * galvMh.field;
          }

          const weldedShopMH = getRate('welded_shop_mh', 0.5);
          const weldedFieldMH = getRate('welded_field_mh', 0.25);
          const boltedShopMH = getRate('bolted_shop_mh', 1.0);
          const boltedFieldMH = getRate('bolted_field_mh', 0.5);

          const connectionPoints = [
            { extent: parseToFeet(st.nsStringerBot) || 0, conn: st.nsStringerConnBot || st.nsConnBot },
            { extent: parseToFeet(st.fsStringerBot) || 0, conn: st.fsStringerConnBot || st.fsConnBot },
            { extent: parseToFeet(st.nsStringerTop) || 0, conn: st.nsStringerConnTop || st.nsConnTop },
            { extent: parseToFeet(st.fsStringerTop) || 0, conn: st.fsStringerConnTop || st.fsConnTop },
          ];
          
          const activeConn = connectionPoints.filter(p => p.extent > 0);
          const weldedCount = activeConn.filter(p => p.conn === 'Welded').length;
          const boltedCount = activeConn.filter(p => p.conn === 'Bolted').length;

          const connectionShopHrs = (weldedCount * weldedShopMH) + (boltedCount * boltedShopMH);
          const connectionFieldHrs = (weldedCount * weldedFieldMH) + (boltedCount * boltedFieldMH);

          // ✅ FORMULA: Total steel weight = stringers + connections + tread supports + pans/grating
          // Connection weight: 3.5 lbs × 2 connections × 2 stringers = 14 lbs
          const connectionWeight = CONNECTION_WEIGHT_LBS; // = 14 lbs
          // Tread support: 1.33 lbs per tread per stringer × 2 stringers
          // numberOfTreads already declared in outer scope
          const treadSupportWeight = TREAD_SUPPORT_WEIGHT_PER_TREAD_PER_STRINGER * numberOfTreads * NUMBER_OF_STRINGERS;
          console.log(`[STAIR ENGINE] ✅ Tread support: 1.33 × ${numberOfTreads} treads × 2 stringers = ${treadSupportWeight.toFixed(2)} lbs`);
          console.log(`[STAIR ENGINE] ✅ Connection weight: ${connectionWeight} lbs (3.5 × 2 connections × 2 stringers)`);
          const totalSteelWeight = stringerBaseWeight + panTotalWeight + gratingTotalWeight + connectionWeight + treadSupportWeight;

          let scrapPriceOnly = 0;
          const scrapLbs = totalSteelWeight * scrapPortion;

          // 🏗️ CALCULATE PAN PLATE MATERIAL COST
          if (panPriceTotal === 0) {
            panPriceTotal = (panTotalWeight || 0) * dynamicSteelPrice;
          }
          
          // 🏗️ CALCULATE STRINGERS (STRUCTURAL STEEL)
          structuralSteelCost = (stringerBaseWeight + connectionWeight + treadSupportWeight) * dynamicSteelPrice;
          
          // Try to get dynamic profile pricing if available
          dictPriceLF = null;
          
          const isMetalStair = isGratingStair || isPanPlateStair;
          if (isMetalStair && st.stringerSize) {
            try {
              const [dictRows] = await db.query(
                `SELECT price FROM dictionary WHERE category = 'stringer_size' AND (label = ? OR value = ?)`,
                [st.stringerSize, st.stringerSize]
              );
              if (dictRows && dictRows.length > 0 && dictRows[0].price !== null && parseFloat(dictRows[0].price) > 0) {
                dictPriceLF = parseFloat(dictRows[0].price);
                // If we have a dictionary price, it overrides the weight-based cost for stringers
                structuralSteelCost = effectiveStringerLF * dictPriceLF;
                console.log(`[STAIR ENGINE] 💰 Using dictionary fixed price for stringer: $${dictPriceLF}/LF`);
              }
            } catch (err) {
              console.warn('Stringer price lookup failed, falling back to weight-based:', err);
            }
          }

          // 🏗️ MATERIAL AGGREGATION
          // steelPriceBase is a legacy field used in some summary views; we'll define it as the sum of primary steel components
          const steelPriceBase = structuralSteelCost + panPriceTotal + gratingTotalCost;

          const anchorBoltRate = configManager.get('anchor_bolt_rate', 0.025);
          const embeddedRate = configManager.get('mounting_embedded_rate', 5.00);
          const anchoredRate = configManager.get('mounting_anchored_rate', 6.00);

          const mTypeVal = st.config?.mountingType || st.mountingType || '';
          const mType = (mTypeVal && typeof mTypeVal === 'string') ? mTypeVal.toLowerCase() : '';
          let porRokCost = 0;
          let anchorBoltsCost = stringerBaseWeight * anchorBoltRate;

          const isValidMType = mType !== '' && mType !== '0' && !mType.includes('select');
          if (isValidMType) {
            const stairConnCount = 4;
            if (mType.includes('embedded')) porRokCost = stairConnCount * embeddedRate;
            else if (mType.includes('anchored')) porRokCost = stairConnCount * anchoredRate;
          }

          const stringerShopHrs = shopHoursInternal;
          const stringerFieldHrs = fieldHoursInternal;
          const panPlateShopHrs = panShopHoursContrib;
          
          // ── FINAL AGGREGATION ──
          const shopTotalHrsCombined = stringerShopHrs + panPlateShopHrs + connectionShopHrs;
          const fieldTotalHrsCombined = stringerFieldHrs + connectionFieldHrs;

          const shopLaborCost = shopTotalHrsCombined * shopRate;
          const fieldLaborCost = fieldTotalHrsCombined * fieldRate;
          
          // Scrap is calculated based on the total steel weight excluding grating (which is often pre-fab)
          scrapPriceOnly = scrapLbs * dynamicSteelPrice; 
          
          // Subtotal Material now includes everything except labor and tax
          const subTotalMaterial = structuralSteelCost + panPriceTotal + gratingTotalCost + finishTotalCost + porRokCost;
          
          const subTotalWithoutTax = subTotalMaterial + shopLaborCost + fieldLaborCost + scrapPriceOnly;
          const taxRate_ = configManager.get('tax_rate', 0.06);
          const taxTotal = subTotalMaterial * taxRate_;
          const totalCostPerStair = subTotalWithoutTax + taxTotal;

          const separatedCosts = {
            stringer: {
              type: st.stringerSize || stairTypeLabel,
              weight: stringerBaseWeight + connectionWeight + treadSupportWeight,
              cost: structuralSteelCost
            },

            grating: (stairTypeLabel.includes('GRATING') || (st.config && st.config.stairGrating === true)) ? {
              type: st.gratingTreadType || st.gratingType || '',
              quantity: risers > 0 ? risers - 1 : 0,
              weight: gratingTotalWeight,
              cost: gratingTotalCost
            } : null,
            panPlate: isPanPlateStair ? {
              quantity: risers > 0 ? risers - 1 : 0,
              area: panPlateArea,
              weight: panTotalWeight,
              cost: panPriceTotal,
              supportType: panTypeStr
            } : null,
            total: {
              weight: totalSteelWeight,
              scrapWeight: scrapLbs,
              materialCost: subTotalMaterial,
              totalCost: totalCostPerStair
            }
          };

          return {
            ...st,
            separatedCosts,
            totalWeight: this.roundExcel(totalSteelWeight + scrapLbs, 3),
            totalCost: this.roundExcel(totalCostPerStair, 2),
            systemCalc: {
              risers,
              steelLbsPerLF: this.roundExcel(strLbs, 3),
              totalSteel: this.roundExcel(totalSteelWeight, 3),
              scrapLbs: this.roundExcel(scrapLbs, 3),
              scrapFactorPct: scrapFactorPct,
              steelPriceBase: this.roundExcel(steelPriceBase, 2),
              structuralSteelCost: this.roundExcel(structuralSteelCost, 2),
              panPlateCost: this.roundExcel(panPriceTotal, 2),
              steelPricePerLb: this.roundExcel(dynamicSteelPrice, 2),
              scrapPriceOnly: this.roundExcel(scrapPriceOnly, 2),
              stairPansTotalPrice: this.roundExcel(panPriceTotal, 2),
              gratingTotalCost: this.roundExcel(gratingTotalCost, 2),
              finishTotalCost: this.roundExcel(finishTotalCost, 2),
              porRokCost: this.roundExcel(porRokCost, 2),
              anchorBoltsCost: this.roundExcel(anchorBoltsCost, 2),
              subTotalMaterial: this.roundExcel(subTotalMaterial, 2),
              shopLaborPrice: this.roundExcel(shopLaborCost, 2),
              fieldLaborPrice: this.roundExcel(fieldLaborCost, 2),
              totalStringerShopHours: this.roundExcel(stringerShopHrs, 3),
              stringerFieldHrs: this.roundExcel(stringerFieldHrs, 3),
              panPlateShopHrs: this.roundExcel(panPlateShopHrs, 3),
              panPlateFieldHrs: 0,
              panSupportType: panTypeStr,
              shopTotalHrs: this.roundExcel(shopTotalHrsCombined, 3),
              fieldTotalHrs: this.roundExcel(fieldTotalHrsCombined, 3),
              subTotalWithoutTax: this.roundExcel(subTotalWithoutTax, 2),
              taxTotal: this.roundExcel(taxTotal, 2),
              taxRatePct: taxRate_ * 100,
              pricePerRiser: this.roundExcel(totalCostPerStair / (risers || 1), 2),
              stairPansTotalWeight: this.roundExcel(panTotalWeight, 3),
              panPlateWeight: this.roundExcel(panTotalWeight, 3),
              gratingWeight: this.roundExcel(gratingTotalWeight, 3),
              connectionWeight: this.roundExcel(connectionWeight, 3),
              treadSupportWeight: this.roundExcel(treadSupportWeight, 3),
              numberOfTreads,
              angleHeight: st.heightFt,
              slope: geometry ? this.roundExcel(geometry.angle, 2) : (st.slope || 0),
              angle: geometry ? this.roundExcel(geometry.angle, 2) : (st.angle || 0),
              isCompliant: st.isCompliant,
              riserHeightIn: geometry ? this.roundExcel(geometry.actualRise * 12, 3) : 0,
              stringerLengthFt: this.roundExcel(st.resolvedDiagonalFt || 0, 2),
              stringerLengthCalculated: st.stringerLengthCalculated || false,
              stringerCalculationMethod: st.stringerCalculationMethod || 'none',
              geometry: geometry ? {
                risers: geometry.risers,
                actualRise: geometry.actualRise,
                treads: geometry.treads,
                totalRun: geometry.totalRun,
                angle: geometry.angle,
                stringerLength: geometry.stringerLength
              } : null,
              summary: {
                totalStairStringerWeight: this.roundExcel(stringerBaseWeight + treadSupportWeight + connectionWeight, 3),
                totalPanPlateWeight: this.roundExcel(panTotalWeight, 3),
                totalHardwareWeight: this.roundExcel(CONNECTION_WEIGHT_LBS, 3),
                connectionWeight: this.roundExcel(connectionWeight, 3),
                baseSteelWeight: this.roundExcel(totalSteelWeight, 3),
                scrapWeight: this.roundExcel(scrapLbs, 3),
                totalStairStringerShopHours: this.roundExcel(stringerShopHrs, 3),
                totalStairStringerFieldHours: this.roundExcel(fieldTotalHrsCombined, 3),
                totalPanPlateShopHours: this.roundExcel(panPlateShopHrs, 3),
                totalPanPlateFieldHours: 0,
                totalConnectionShopHours: this.roundExcel(connectionShopHrs, 3),
                totalFieldHours: this.roundExcel(fieldTotalHrsCombined, 3),
                shopLaborCost: this.roundExcel(shopLaborCost, 2),
                fieldLaborCost: this.roundExcel(fieldLaborCost, 2),
                baseSteelCost: this.roundExcel(steelPriceBase, 2),
                pansMaterialPrice: this.roundExcel(panPriceTotal, 2),
                gratingTotalCost: this.roundExcel(gratingTotalCost, 2),
                galvanizeCost: this.roundExcel(finishTotalCost, 2),
                porRokAnchorsCost: this.roundExcel(porRokCost, 2),
                scrapWeightCost: this.roundExcel(scrapPriceOnly, 2),
                grandTotal: this.roundExcel(totalCostPerStair, 2)
              },
              // ✅ root properties for calculateFinal:aggregate
              totalStairStringerWeight: this.roundExcel(stringerBaseWeight + treadSupportWeight + connectionWeight, 3),
              totalStairStringerShopHours: this.roundExcel(stringerShopHrs, 3),
              totalStairStringerFieldHours: this.roundExcel(fieldTotalHrsCombined, 3),
              totalPanPlateWeight: this.roundExcel(panTotalWeight, 3),
              totalPanPlateShopHours: this.roundExcel(panPlateShopHrs, 3),
              totalPanPlateFieldHours: 0,
              totalHardwareWeight: this.roundExcel(CONNECTION_WEIGHT_LBS, 3),
              connectionWeight: this.roundExcel(connectionWeight, 3)
            }
          };
        };

        const mainResult = await estimateStair(s);
        const flightResults = await Promise.all((s.flights || []).map(fl => estimateStair(fl)));

        // 🔄 ISOLATION FIX: Do NOT aggregate flight results back into the parent stair's top-level fields.
        // This ensures that "Flight 1" (the main stair) displays only its own cost/weight,
        // while the Calculation Summary correctly sums all independent components.
        // The frontend mapping in triggerLiveCalc expects stairCalc.totalCost to reflect the item itself.

        return {
          ...mainResult,
          // totalWeight/Cost/Hours removed from aggregation loop — parent now stands alone
          flights: flightResults
        };
      }))
    };

    // 🔄 Final aggregated project-level parity recalculation
    // Must explicitly sum stairs AND their nested flights now that they are decoupled.
    estimate.totalEstimatedCost = estimate.stairs.reduce((sum, s) => {
      const flightSum = (s.flights || []).reduce((fSum, f) => fSum + (f.totalCost || 0), 0);
      return sum + (s.totalCost || 0) + flightSum;
    }, 0) +
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
    const shopRate = configManager.get('shop_hourly_rate', 90);
    const fieldRate = configManager.get('field_hourly_rate', 125);

    let totalBaseSteelWeight = 0;
    let totalStairStringerWeight = 0;
    let totalStairStringerShopHours = 0;
    let totalStairStringerFieldHours = 0;
    let totalPanPlateWeight = 0;
    let totalPanPlateShopHours = 0;
    let totalPanPlateFieldHours = 0;
    let totalHardwareWeight = 0;
    let connectionWeight = 0;
    let totalRailWeight = 0;
    let totalRailShopHours = 0;
    let totalRailFieldHours = 0;
    let totalLandingWeight = 0;
    let totalLandingShopHours = 0;
    let totalLandingFieldHours = 0;
    let totalScrapLbs = 0;
    let totalShopHours = 0;
    let totalConnectionShopHours = 0;
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
      totalRailWeight += (s.totalSteel || 0);
      totalScrapLbs += (s.scrapLbs || 0);
      totalShopHours += (s.shopTotalHrs || 0);
      totalRailShopHours += (s.shopTotalHrs || 0);
      totalRailFieldHours += (s.fieldTotalHrs || 0);
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
      totalLandingWeight += (s.totalSteel || 0);
      totalScrapLbs += (s.scrapLbs || 0);
      totalShopHours += (s.shopTotalHrs || 0);
      totalLandingShopHours += (s.shopTotalHrs || 0);
      totalLandingFieldHours += (s.fieldTotalHrs || 0);
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
      const aggregate = (item) => {
        const s = item.systemCalc || item;
        
        // ✅ Reliable Metric Aggregation from top-level systemCalc properties
        const strW = (s.totalStairStringerWeight || 0);
        const strShop = (s.totalStairStringerShopHours || 0);
        const strField = (s.totalStairStringerFieldHours || 0);

        totalBaseSteelWeight += (s.totalSteel || 0);
        totalStairStringerWeight += strW;
        totalPanPlateWeight += (s.totalPanPlateWeight || 0);
        totalScrapLbs += (s.scrapLbs || 0);
        totalShopHours += (s.shopTotalHrs || 0);
        totalStairStringerShopHours += strShop;
        totalStairStringerFieldHours += strField;
        
        totalPanPlateShopHours += (s.panPlateShopHrs || 0);
        totalPanPlateFieldHours += (s.panPlateFieldHrs || 0);
        totalHardwareWeight += (s.totalHardwareWeight || 0);
        connectionWeight += (s.connectionWeight || 0);
        totalConnectionShopHours += (s.totalConnectionShopHours || 0);
        totalFieldHours += (s.fieldTotalHrs || 0);
        totalGalvShopHrs += (s.galvShopTotalHrs || 0);
        totalGalvFieldHrs += (s.galvFieldTotalHrs || 0);
        totalRisers += (s.risers || 0);

        sumSteelBasePrice += (s.structuralSteelCost || s.steelPriceBase || 0);
        sumPansPrice += (s.panPlateCost || s.stairPansTotalPrice || 0);
        sumGratingPrice += (s.gratingTotalCost || 0);
        sumGalvanizePrice += (s.finishTotalCost || 0);
        sumScrapPrice += (s.scrapPriceOnly || 0);
        sumShopLaborPrice += (s.shopLaborPrice || 0);
        sumFieldLaborPrice += (s.fieldLaborPrice || 0);
        sumTaxTotal += (s.taxTotal || 0);
        sumSubtotalWithoutTax += (s.subTotalWithoutTax || 0);

        sumPorRok += (s.porRokCost || 0);
        sumAnchorBolts += (s.anchorBoltsCost || 0);
      };

      aggregate(st);
      (st.flights || []).forEach(fl => aggregate(fl));
    });

    const subtotalWithoutTax = sumSubtotalWithoutTax;
    const taxAmount = sumTaxTotal;
    const grandTotal = subtotalWithoutTax + taxAmount;

    return {
      ...estimate,
      summary: {
        totalSteelWeight: this.roundExcel(totalBaseSteelWeight + totalScrapLbs, 3),
        baseSteelWeight: this.roundExcel(totalBaseSteelWeight, 3),
        totalStairStringerWeight: this.roundExcel(totalStairStringerWeight, 3),
        totalPanPlateWeight: this.roundExcel(totalPanPlateWeight, 3),
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

        subtotalWithoutTax: this.roundExcel(subtotalWithoutTax, 2),
        taxAmount: this.roundExcel(taxAmount, 2),
        grandTotal: this.roundExcel(grandTotal, 2),

        totalShopHours: this.roundExcel(totalShopHours, 3),
        totalStairStringerShopHours: this.roundExcel(totalStairStringerShopHours, 3),
        totalStairStringerFieldHours: this.roundExcel(totalStairStringerFieldHours, 3),
        totalPanPlateShopHours: this.roundExcel(totalPanPlateShopHours, 3),
        totalPanPlateFieldHours: this.roundExcel(totalPanPlateFieldHours, 3),
        totalHardwareWeight: this.roundExcel(totalHardwareWeight, 3),
        connectionWeight: this.roundExcel(connectionWeight, 3),
        totalRailWeight: this.roundExcel(totalRailWeight, 3),
        totalRailShopHours: this.roundExcel(totalRailShopHours, 3),
        totalRailFieldHours: this.roundExcel(totalRailFieldHours, 3),
        totalLandingWeight: this.roundExcel(totalLandingWeight, 3),
        totalLandingShopHours: this.roundExcel(totalLandingShopHours, 3),
        totalLandingFieldHours: this.roundExcel(totalLandingFieldHours, 3),
        totalConnectionShopHours: this.roundExcel(totalConnectionShopHours, 3),
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
      const takeoff = await this.calculateTakeoff(normalized, normalized.adminOwnerId);
      if (!takeoff) throw new Error('Takeoff phase returned undefined');

      const estimate = await this.calculateEstimate(takeoff, normalized.adminOwnerId);
      if (!estimate) throw new Error('Estimate phase returned undefined');

      const final = await this.calculateFinal(estimate);
      if (!final) throw new Error('Final aggregation returned undefined');

      const response = {
        success: true,
        totalWeight: final.summary?.totalSteelWeight || 0,
        totalCost: final.summary?.grandTotal || 0,
        breakdown: {
          rails: final.rails || [],
          platforms: final.platforms || [],
          stairs: final.stairs || [],
          totals: {
            totalSteelWeight: final.summary?.totalSteelWeight || 0
          }
        },
        summary: final.summary || {}
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
