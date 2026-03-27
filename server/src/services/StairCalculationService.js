const { RAIL_CONFIG, getTypeCode } = require('../config/railConfig');
const excelLookup = require('../utils/excelLookup');
const configManager = require('../utils/configManager');
const validator = require('../utils/validator');
const db = require('../config/mssql');

// 📊 SFE MASTER BENCHMARK TABLE (Excel Truth Source)
// 📊 SFE GALVANIZED LABOR BENCHMARKS (Additional MH/LF)
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
  'Grating pan stair platform 10\'-0" wide': { shop: 0, field: 0.050 },

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

const SFE_RAIL_MASTER = {
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
  'Optional Kick Plate 4\'x4\'': { lbs: 3.400, shop: 0.125, field: 0.050 }
};

const STRINGER_BENCHMARKS = {
  'MC12X106': { lbs: 10.600, shop: 0.150, field: 0.100 },
  'MC12X143': { lbs: 14.300, shop: 0.150, field: 0.100 },
  'C12X207':  { lbs: 20.700, shop: 0.150, field: 0.100 },
  'C15X339':  { lbs: 33.900, shop: 0.150, field: 0.100 },
  'TS12X2X316': { lbs: 16.580, shop: 0.250, field: 0.200 },
  'TS12X2X14':  { lbs: 21.660, shop: 0.250, field: 0.200 },
  'W8X31':    { lbs: 31.000, shop: 0.150, field: 0.100 },
  'W10X33':   { lbs: 33.000, shop: 0.150, field: 0.100 },
  'W12X35':   { lbs: 35.000, shop: 0.150, field: 0.100 },
  'W12X40':   { lbs: 40.000, shop: 0.150, field: 0.100 },
  'W12X50':   { lbs: 50.000, shop: 0.150, field: 0.100 },
  'W14X43':   { lbs: 43.000, shop: 0.150, field: 0.100 }
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
        const lengthFt = parseFloat(r.length) || 0;

        // 🏗️ CONFIG RESOLUTION
        const typeCode = getTypeCode(r.railType);
        const config = RAIL_CONFIG[typeCode] || RAIL_CONFIG.GUARD_2_LINE;

        // 📏 POST SPACING (Respect User Input or Config Default)
        const userMaxSpacing = parseFloat(r.maxSpacing || r.maxPostSpacing);
        const maxSpacing = !isNaN(userMaxSpacing) && userMaxSpacing > 0 ? userMaxSpacing : (config.maxSpacing || 4);

        // 📏 POST DISTRIBUTION (Tekla Logic)
        let postQty = 0;
        if (config.hasPosts && lengthFt > 0) {
          postQty = Math.ceil(lengthFt / maxSpacing) + 1;
          postQty = Math.max(postQty, 2);
        }

        const actualSpacing = (config.hasPosts && postQty > 1)
          ? (lengthFt / (postQty - 1))
          : 0;

        // 📏 BRACKET DISTRIBUTION (Wall/Grab Logic)
        let bracketQty = 0;
        const wallMaxSpacing = 4; // Spec says 4ft max for brackets
        if (config.hasBrackets && lengthFt > 0) {
          bracketQty = Math.ceil(lengthFt / wallMaxSpacing) + 1;
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
          const toeWidthVal = r.toeWidth?.value || r.toeWidth || 0;
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
          hasBrackets: config.hasBrackets
        };
      }),

      platforms: (platforms || []).map(p => {
        const area = (parseFloat(p.length) || 0) * (parseFloat(p.width) || 0) * (p.quantity || 1);
        return { ...p, area: this.roundExcel(area, 2) };
      }),

      stairs: (stairs || []).map(s => {
        // 🏗️ STAIR GEOMETRY (FEET ONLY INTERNALLY)
        const heightFt = parseFloat(s.totalHeight) || 0;
        const widthFt = parseFloat(s.width) || 0;
        const runIn = parseFloat(s.run) || 11;
        const runFt = runIn / 12;

        let risers = parseInt(s.risers) || 0;
        const riseIn = parseFloat(s.rise) || 7;
        const riseFt = riseIn / 12;
        
        if (risers <= 1 && heightFt > 0) {
          risers = Math.ceil((heightFt * 12) / riseIn);
        }
        if (risers < 1) risers = 1;

        const totalRunFt = runFt * risers;
        const totalRiseFt = riseFt * risers;
        
        // 📏 STRICT GEOMETRY DECOUPLING
        // As per Excel, estimation length must use computed Rise x Risers, NOT the Total Height input.
        const diagonalFt = Math.sqrt(Math.pow(totalRiseFt, 2) + Math.pow(totalRunFt, 2));
        
        // Total Height is strictly reserved for the angle calculation to match existing blueprint behaviors.
        const angleHeight = heightFt > 0 ? heightFt : totalRiseFt;
        const slopeDeg = totalRunFt > 0 ? (Math.atan(angleHeight / totalRunFt) * (180 / Math.PI)) : 90;
        const panArea = widthFt * totalRunFt;

        // Extents (summing normalized feet)
        const nsBot = parseFloat(s.nsStringerBot) || 0;
        const fsBot = parseFloat(s.fsStringerBot) || 0;
        const nsTop = parseFloat(s.nsStringerTop) || 0;
        const fsTop = parseFloat(s.fsStringerTop) || 0;

        const nsTrueLength = diagonalFt + nsBot + nsTop;
        const fsTrueLength = diagonalFt + fsBot + fsTop;
        const totalLFBothStringers = nsTrueLength + fsTrueLength;

        this.addTrace(`stair_${s.id}_takeoff`, 'Tekla Geometry (Feet)',
          { H: heightFt, Run: runFt, Risers: risers },
          { totalRunFt, diagonalFt, slopeDeg, panArea });

        return {
          ...s,
          risers,
          heightFt,
          totalRunFt: this.roundExcel(totalRunFt, 2),
          slope: this.roundExcel(slopeDeg, 2),
          stringerLength: this.roundExcel(Math.max(nsTrueLength, fsTrueLength), 2),
          nsTrueLength: this.roundExcel(nsTrueLength, 2),
          fsTrueLength: this.roundExcel(fsTrueLength, 2),
          totalLFBothStringers: this.roundExcel(totalLFBothStringers, 2),
          panArea: this.roundExcel(panArea, 2),
          isCompliant: slopeDeg >= 30 && slopeDeg <= 38
        };
      })
    };

    return takeoff;
  }

  /**
   * LAYER 2: ESTIMATE
   * Convert takeoff units to weights and labor hours using lookups.
   */
  async calculateEstimate(takeoff) {
    const materialMarkup = 0.00;
    const fabricationFactor = 1.00;

    const [stringerProfiles] = await db.query('SELECT name, steel_lbs_per_ft FROM stringer_types');
    const lookupSheet = 'Table Data';

    const steelPrice = configManager.get('steel_price_per_lb', 0.85);
    const shopRate = configManager.get('shop_hourly_rate', 90);
    const fieldRate = configManager.get('field_hourly_rate', 125);
    const galvPricePerLb = configManager.get('galvanizing_price_per_lb', 0.50);

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
          const masterEntry = SFE_RAIL_MASTER[typeLabel];
          if (masterEntry) {
            lbsPerFt = masterEntry.lbs;
            shopMHPerFt = masterEntry.shop;
            fieldMHPerFt = masterEntry.field;
          } else {
            const normalizeString = (s) => (s || '').toUpperCase().replace(/["']/g, '').replace(/\./g, '').replace(/\s+/g, ' ').trim();
            const targetNorm = normalizeString(typeLabel);
            const foundKey = Object.keys(SFE_RAIL_MASTER).find(k => normalizeString(k) === targetNorm);
            if (foundKey) {
              lbsPerFt = SFE_RAIL_MASTER[foundKey].lbs;
              shopMHPerFt = SFE_RAIL_MASTER[foundKey].shop;
              fieldMHPerFt = SFE_RAIL_MASTER[foundKey].field;
            } else {
              const lookupSheet = 'Table Data';
              lbsPerFt = excelLookup.lookup(lookupSheet, rail.railType, 'Column3', null);
              shopMHPerFt = excelLookup.lookup(lookupSheet, rail.railType, 'Column4', null);
              fieldMHPerFt = excelLookup.lookup(lookupSheet, rail.railType, 'Column5', null);
            }
          }
        }

        let baseWeight = 0;
        let finalWeight = 0;
        let shopHours = 0;
        let fieldHours = 0;

        if (lbsPerFt !== null && lbsPerFt !== 0) {
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
          finalWeight = baseWeight * 1.10;
        } else {
          lbsPerFt = config.lbsPerFt || 2.75;
          shopMHPerFt = config.shopMH || 0.300;
          fieldMHPerFt = config.fieldMH || 0.280;
          baseWeight = lengthFt * lbsPerFt;
          shopHours = lengthFt * shopMHPerFt;
          fieldHours = lengthFt * fieldMHPerFt;
          finalWeight = baseWeight * 1.10;
        }

        const isGalv = (rail.finish || '').toUpperCase().includes('GALVANIZED') || (rail.finish || '').toUpperCase().includes('GALV');
        let galvShopHrs = 0;
        let galvFieldHrs = 0;
        let galvanizeTotalCost = 0;

        if (isGalv) {
          const galvMh = matchLabor(typeLabel);
          galvShopHrs = lengthFt * galvMh.shop;
          galvFieldHrs = lengthFt * galvMh.field;
          // Galvanize Cost in SFE summary is ONLY the material cost (dipping price/lb)
          galvanizeTotalCost = finalWeight * galvPricePerLb;
        }

        const totalCost = (finalWeight * steelPrice) + ((shopHours + galvShopHrs) * shopRate) + ((fieldHours + galvFieldHrs) * fieldRate) + galvanizeTotalCost;

        return {
          ...rail,
          baseWeight: this.roundExcel(baseWeight, 3),
          totalWeight: this.roundExcel(finalWeight, 3),
          shopHours: this.roundExcel(shopHours + galvShopHrs, 3),
          fieldHours: this.roundExcel(fieldHours + galvFieldHrs, 3),
          totalCost: this.roundExcel(totalCost, 2),
          systemCalc: {
            ...rail.systemCalc,
            steelPerLF: this.roundExcel(lbsPerFt, 3),
            shopMHPF: this.roundExcel(shopMHPerFt, 3),
            fieldMHPF: this.roundExcel(fieldMHPerFt, 3),
            baseSteelLbs: this.roundExcel(baseWeight, 3),
            scrapLbs: this.roundExcel(finalWeight - baseWeight, 3),
            finalScrapWeight: this.roundExcel(finalWeight, 3),
            shopTotalHrs: this.roundExcel(shopHours + galvShopHrs, 3),
            fieldTotalHrs: this.roundExcel(fieldHours + galvFieldHrs, 3),
            galvanizeTotalCost: this.roundExcel(galvanizeTotalCost, 2),
            mountingCharge: (function(r, self) {
              const mType = (r.mountingType || '').toLowerCase();
              const qty = r.postQty || r.bracketQty || 0;
              if (mType.includes('embedded')) return self.roundExcel(qty * 5, 2);
              if (mType.includes('anchored')) return self.roundExcel(qty * 6, 2);
              return 0;
            })(rail, this)
          }
        };
      })),

      platforms: await Promise.all((takeoff.platforms || []).map(async p => {
        const area = p.area || 0;
        const typeLabel = p.platformType || '';
        let lbsPerSF = 12.000;
        let shopMHPF = 0.200;
        let fieldMHPF = 0.250;
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
        const finalWeight = baseWeight * 1.10;
        let shopHoursInternal = area * shopMHPF;
        let fieldHoursInternal = area * fieldMHPF;

        const isGalv = (p.finish || '').toUpperCase().includes('GALVANIZED') || (p.finish || '').toUpperCase().includes('GALV');
        let galvanizeTotalCost = 0;
        let galvFieldHrs = 0;
        if (isGalv) {
          const galvMh = matchLabor(`${typeLabel} 10'-0" wide`);
          // Note: Platforms usually don't have Galv Shop hours in SFE sheet, only Field ones?
          // But we follow the master table.
          galvShopHrs = (area / 10) * galvMh.shop; // Area-based labor approx if no LF? 
          galvFieldHrs = (p.quantity || 1) * galvMh.field;
          galvanizeTotalCost = finalWeight * galvPricePerLb;
        }

        const totalCost = (finalWeight * steelPrice) + ((shopHoursInternal + (galvShopHrs || 0)) * shopRate) + ((fieldHoursInternal + galvFieldHrs) * fieldRate) + galvanizeTotalCost;

        return {
          ...p,
          baseWeight: this.roundExcel(baseWeight, 3),
          totalWeight: this.roundExcel(finalWeight, 3),
          shopHours: this.roundExcel(shopHoursInternal, 3),
          fieldHours: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
          totalCost: this.roundExcel(totalCost, 2),
          systemCalc: {
            area,
            steelPerLF: this.roundExcel(lbsPerSF, 3),
            shopMHPF: this.roundExcel(shopMHPF, 3),
            fieldMHPF: this.roundExcel(fieldMHPF, 3),
            baseSteelLbs: this.roundExcel(baseWeight, 3),
            finalScrapWeight: this.roundExcel(finalWeight, 3),
            shopTotalHrs: this.roundExcel(shopHoursInternal, 3),
            fieldTotalHrs: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
            galvanizeTotalCost: this.roundExcel(galvanizeTotalCost, 2)
          }
        };
      })),

      stairs: await Promise.all((takeoff.stairs || []).map(async s => {
        const risers = parseFloat(s.numRisers || s.risers) || 0;
        const stairTypeLabel = s.stairType || '';
        let strLbs = 25.320;
        let panLbs = 50.000;
        let shopHrs = 1.500;
        let fieldHrs = 1.000;
        
        let src = s.stringerSize || '';
        let searchProfile = src;
        if (src.includes('/')) {
          searchProfile = src.split('/').pop().trim();
        } else if (src.includes('MC') || src.includes('C ') || src.includes('TS')) {
           // If no slash, try to take the last 3-4 segments to catch MC 12 X 10.6
           const tokens = src.split(' ');
           if (tokens.length > 3) searchProfile = tokens.slice(-4).join(' ');
        }
        
        const cleanSearch = searchProfile.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        console.log(`[STAIR ENGINE] Profile: "${src}" -> Clean: "${cleanSearch}"`);
        
        // 🔍 Step 1: Check Internal Fallback Map
        if (STRINGER_BENCHMARKS[cleanSearch]) {
          strLbs = STRINGER_BENCHMARKS[cleanSearch].lbs;
          shopHrs = STRINGER_BENCHMARKS[cleanSearch].shop;
          fieldHrs = STRINGER_BENCHMARKS[cleanSearch].field;
          console.log(`   -> Internal Map Hit! Weight: ${strLbs}`);
        } else {
          // 🧠 Step 1.1: Try Smart Regex Extraction (e.g. X 10.6)
          const weightMatch = src.match(/X\s*(\d+(\.\d+)?)/i);
          if (weightMatch) {
            strLbs = parseFloat(weightMatch[1]);
            console.log(`   -> Regex Match Hit! Extracted Weight: ${strLbs}`);
          }
        }

        // 🗄️ Step 2: Query DB (Override if DB has data)
        const [dictBenchmarks] = await db.query(
          `SELECT steelLbsLf, shopLaborMhLf, fieldLaborMhLf FROM dictionary 
           WHERE (
             UPPER(REPLACE(REPLACE(REPLACE(label, ' ', ''), '.', ''), '-', '')) = ? 
             OR UPPER(REPLACE(REPLACE(REPLACE(value, ' ', ''), '.', ''), '-', '')) = ?
             OR label LIKE ?
           ) 
           AND category = ?`,
          [cleanSearch, cleanSearch, '%' + searchProfile + '%', 'stringer_size']
        );
        
        if (dictBenchmarks.length > 0 && dictBenchmarks[0].steelLbsLf !== null && dictBenchmarks[0].steelLbsLf > 0) {
          strLbs = parseFloat(dictBenchmarks[0].steelLbsLf);
          shopHrs = parseFloat(dictBenchmarks[0].shopLaborMhLf);
          fieldHrs = parseFloat(dictBenchmarks[0].fieldLaborMhLf);
        } else if (this.debug) {
          console.warn(`[ENGINE AUDIT] DB Stringer Miss: Original: "${src}" (Used Fallback Weight: ${strLbs})`);
        }
        const stringerBaseWeight = risers * strLbs;
        const panTotalWeight = risers * panLbs;
        const totalUnitWeight = (stringerBaseWeight * 1.10) + panTotalWeight;
        let shopHoursInternal = risers * shopHrs;
        let fieldHoursInternal = risers * fieldHrs;

        const isGalv = /GALV/i.test(s.finish || '');
        let galvanizeTotalCost = 0;
        let galvShopHrs = 0;
        let galvFieldHrs = 0;
        if (isGalv) {
          const galvMh = matchLabor(s.stringerSize || stairTypeLabel);
          galvShopHrs = risers * galvMh.shop;
          galvFieldHrs = risers * galvMh.field;
          galvanizeTotalCost = totalUnitWeight * galvPricePerLb;
        }

        const totalCost = (totalUnitWeight * steelPrice) + ((shopHoursInternal + galvShopHrs) * shopRate) + ((fieldHoursInternal + galvFieldHrs) * fieldRate) + galvanizeTotalCost;

        return {
          ...s,
          totalWeight: this.roundExcel(totalUnitWeight, 3),
          shopHours: this.roundExcel(shopHoursInternal + galvShopHrs, 3),
          fieldHours: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
          totalCost: this.roundExcel(totalCost, 2),
          systemCalc: {
            risers,
            stringerPerLF: this.roundExcel(strLbs, 3),
            stringerLF: this.roundExcel(s.totalLFBothStringers, 2),
            shopMHPF: this.roundExcel(shopHrs, 3),
            fieldMHPF: this.roundExcel(fieldHrs, 3),
            baseSteelLbs: this.roundExcel(stringerBaseWeight, 3),
            stringerTotalSteelLbs: this.roundExcel(stringerBaseWeight * 1.10, 3),
            scrapLbs: this.roundExcel(stringerBaseWeight * 0.10, 3),
            finalScrapWeight: this.roundExcel(stringerBaseWeight * 1.10, 3),
            pansTotalSteelLbs: this.roundExcel(panTotalWeight, 3),
            panArea: s.panArea,
            shopTotalHrs: this.roundExcel(shopHoursInternal + galvShopHrs, 3),
            fieldTotalHrs: this.roundExcel(fieldHoursInternal + galvFieldHrs, 3),
            totalWeight: this.roundExcel(totalUnitWeight, 3),
            galvanizeTotalCost: this.roundExcel(galvanizeTotalCost, 2),
            angleHeight: s.heightFt,
            slope: s.slope,
            angle: s.slope,
            isCompliant: s.isCompliant
          }
        };
      }))
    };

    return estimate;
  }

  /**
   * LAYER 3: FINAL AGGREGATION
   * Summing all components, applying tax, and rounding.
   */
  async calculateFinal(estimate) {
    const steelPrice = configManager.get('steel_price_per_lb', 0.85);
    const shopRate = configManager.get('shop_hourly_rate', 90);
    const fieldRate = configManager.get('field_hourly_rate', 125);
    const taxRate = configManager.get('tax_rate', 0.06);

    let totalBaseSteelWeight = 0;
    let totalScrapWeightOnly = 0;
    let totalPansWeight = 0;
    let totalShopHours = 0;
    let totalFieldHours = 0;
    let totalRisers = 0;
    let totalMountingCharges = 0;
    let totalGalvanizeCost = 0;

    // Aggregate from Rails
    estimate.rails.forEach(r => {
      if (r.systemCalc) {
        totalBaseSteelWeight += (r.systemCalc.baseSteelLbs || 0);
        totalScrapWeightOnly += (r.systemCalc.finalScrapWeight || 0) - (r.systemCalc.baseSteelLbs || 0);
        totalShopHours += (r.systemCalc.shopTotalHrs || 0);
        totalFieldHours += (r.systemCalc.fieldTotalHrs || 0);
        totalMountingCharges += (r.systemCalc.mountingCharge || 0);
        totalGalvanizeCost += (r.systemCalc.galvanizeTotalCost || 0);
      }
    });

    // Aggregate from Platforms
    estimate.platforms.forEach(p => {
      if (p.systemCalc) {
        totalBaseSteelWeight += (p.systemCalc.baseSteelLbs || 0);
        totalScrapWeightOnly += (p.systemCalc.finalScrapWeight || 0) - (p.systemCalc.baseSteelLbs || 0);
        totalShopHours += (p.systemCalc.shopTotalHrs || 0);
        totalFieldHours += (p.systemCalc.fieldTotalHrs || 0);
        totalGalvanizeCost += (p.systemCalc.galvanizeTotalCost || 0);
      }
    });

    // Aggregate from Stairs
    estimate.stairs.forEach(s => {
      if (s.systemCalc) {
        totalBaseSteelWeight += (s.systemCalc.baseSteelLbs || 0);
        totalScrapWeightOnly += (s.systemCalc.finalScrapWeight || 0) - (s.systemCalc.baseSteelLbs || 0);
        totalPansWeight += (s.systemCalc.pansTotalSteelLbs || 0);
        totalShopHours += (s.systemCalc.shopTotalHrs || 0);
        totalFieldHours += (s.systemCalc.fieldTotalHrs || 0);
        totalRisers += (s.systemCalc.risers || 0);
        totalGalvanizeCost += (s.systemCalc.galvanizeTotalCost || 0);
      }
    });

    // 🏗️ SFE SUMMARY CALCULATIONS (EXCEL ALIGNED)
    const baseSteelCost = totalBaseSteelWeight * steelPrice;
    const scrapWeightCost = totalScrapWeightOnly * steelPrice;
    const pansMaterialPrice = totalPansWeight * 1.0;
    const shopLaborCost = totalShopHours * shopRate;
    const fieldLaborCost = totalFieldHours * fieldRate;

    const anchorBoltsCost = totalRisers * 0.6845;

    // Summary without tax
    const materialSubtotal = baseSteelCost + pansMaterialPrice + anchorBoltsCost + totalMountingCharges + totalGalvanizeCost;
    const subtotalWithoutTax = materialSubtotal + scrapWeightCost + shopLaborCost + fieldLaborCost;
    const taxAmount = subtotalWithoutTax * taxRate;
    const grandTotal = subtotalWithoutTax + taxAmount;

    return {
      ...estimate,
      sfeSummary: {
        totalSteelWeight: this.roundExcel(totalBaseSteelWeight + totalScrapWeightOnly, 3),
        baseSteelWeight: this.roundExcel(totalBaseSteelWeight, 3),
        scrapWeight: this.roundExcel(totalScrapWeightOnly, 3),
        baseSteelCost: this.roundExcel(baseSteelCost, 2),
        scrapWeightCost: this.roundExcel(scrapWeightCost, 2),
        pansMaterialPrice: this.roundExcel(pansMaterialPrice, 2),
        anchorBoltsCost: this.roundExcel(anchorBoltsCost, 2),
        materialSubtotal: this.roundExcel(materialSubtotal, 2),
        mountingCharges: this.roundExcel(totalMountingCharges, 2),
        galvanizeCost: this.roundExcel(totalGalvanizeCost, 2),
        totalShopHours: this.roundExcel(totalShopHours, 3),
        totalFieldHours: this.roundExcel(totalFieldHours, 3),
        shopLaborCost: this.roundExcel(shopLaborCost, 2),
        fieldLaborCost: this.roundExcel(fieldLaborCost, 2),
        subtotalWithoutTax: this.roundExcel(subtotalWithoutTax, 2),
        taxAmount: this.roundExcel(taxAmount, 2),
        grandTotal: this.roundExcel(grandTotal, 2),
        pricePerRiser: totalRisers > 0 ? this.roundExcel(grandTotal / totalRisers, 2) : 0
      }
    };
  }

  async calculateFull(input, debug = false) {
    this.debug = debug;
    this.resetTrace();

    // Config must be loaded
    if (!configManager.isLoaded) await configManager.loadConfigs();

    const sanitized = validator.sanitizeInput(input);
    if (!sanitized) return null;

    const normalized = validator.normalizeUnits(sanitized);
    const takeoff = await this.calculateTakeoff(normalized);
    const estimate = await this.calculateEstimate(takeoff);
    const final = await this.calculateFinal(estimate);

    const response = {
      success: true,
      breakdown: {
        rails: final.rails,
        platforms: final.platforms,
        stairs: final.stairs,
        totals: {
          totalSteelWeight: final.sfeSummary.totalSteelWeight
        }
      },
      summary: final.sfeSummary
    };

    if (this.debug) {
      this.logAudit(final);
    }

    // 🔒 ENGINE IMMUTABILITY RULE
    Object.freeze(response);
    return response;
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
