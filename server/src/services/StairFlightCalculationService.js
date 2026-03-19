const db = require('../config/mssql');

/**
 * StairFlightCalculationService
 * Implements the 100% "math story" for steel stair flights.
 * Logic mirrors the Excel workbook formulas for:
 * - Stringer linear footage (NS and FS separately)
 * - Burdened material weights (11% scrap markup)
 * - Pan Plate vs Grating Piece routing (IDs 76 and 77)
 * - Connection complexity (Welded vs Bolted)
 * - Width-based labor multipliers (applied only where appropriate)
 * - Galvanizing labor and material costs
 */

const WIDTH_TIERS = [
  { maxWidth: 3.5,      multiplier: 1.00 },
  { maxWidth: 4.0,      multiplier: 1.10 },
  { maxWidth: 4.5,      multiplier: 1.20 },
  { maxWidth: Infinity, multiplier: 1.35 },
];

const DEFAULT_GALV_RATE_PER_LB = 0.45;

class StairFlightCalculationService {

  roundExcel(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Number(Math.round(+(value + 'e' + decimals)) + 'e-' + decimals);
  }

  computeGeometry(riseIn, runIn) {
    const stepSlopeIn = Math.sqrt(riseIn ** 2 + runIn ** 2);
    const slopeRatio  = this.roundExcel(riseIn / runIn, 4);
    const angleDeg    = this.roundExcel(Math.atan(riseIn / runIn) * (180 / Math.PI), 2);
    return { stepSlopeIn, slopeRatio, angleDeg };
  }

  computeOneSideLF(stepSlopeIn, numRisers, extBotIn, extTopIn) {
    const runLengthIn    = stepSlopeIn * numRisers;
    const totalOneSideIn = runLengthIn + (extBotIn || 0) + (extTopIn || 0);
    return this.roundExcel(totalOneSideIn / 12, 4);
  }

  computeBurdenedWeight(qty, ratePerUnit, markupFraction) {
    const raw      = qty * ratePerUnit;
    const burdened = this.roundExcel(raw * (1 + markupFraction), 2);
    return { raw: this.roundExcel(raw, 2), burdened };
  }

  getWidthMultiplier(stairWidthFt) {
    for (const tier of WIDTH_TIERS) {
      if (stairWidthFt <= tier.maxWidth) return tier.multiplier;
    }
    return 1.35;
  }

  async calculateFlightAndStringers(payload) {
    const {
      stairWidthFt,
      riseIn,
      runIn,
      numRisers,
      stringerProfileId,
      stairType = 'pan-concrete',
      extentBotNSIn = 0,
      extentBotFSIn = 0,
      extentTopNSIn = 0,
      extentTopFSIn = 0,
      connectionTypeBot = 'WELDED',
      connectionTypeTop = 'WELDED',
      finish = 'PRIMER',
      galvRatePerLb = DEFAULT_GALV_RATE_PER_LB,
      estimateId = null,
    } = payload;

    // ── Validate ────────────────────────────────────────────────────────────
    const errors = [];
    if (!stairWidthFt || stairWidthFt <= 0)  errors.push('stairWidthFt must be > 0');
    if (!riseIn       || riseIn <= 0)        errors.push('riseIn must be > 0');
    if (!runIn        || runIn <= 0)         errors.push('runIn must be > 0');
    if (!numRisers    || numRisers <= 0)     errors.push('numRisers must be > 0');
    if (!stringerProfileId)                 errors.push('stringerProfileId is required');
    if (errors.length) return { success: false, errors };

    // ── DB Lookups ──────────────────────────────────────────────────────────
    const configRows = await db.query('SELECT config_key, config_value FROM system_config');
    const configs    = configRows[0];
    const markup     = parseFloat(configs.find(c => c.config_key === 'material_markup')?.config_value ?? 0.11);
    const taxRate    = parseFloat(configs.find(c => c.config_key === 'tax_rate')?.config_value ?? 0.06);

    const stringerRows = await db.query('SELECT * FROM stringer_types WHERE name = ? AND is_active = 1', [stringerProfileId]);
    if (!stringerRows[0] || stringerRows[0].length === 0) {
      return { success: false, errors: [`Unknown stringer profile: "${stringerProfileId}"`] };
    }
    const stringer = stringerRows[0][0];

    const isPan     = (stairType === '76' || stairType === 'pan-concrete');
    const isGrating = (stairType === '77' || stairType === 'grating-tread');
    
    let panType = null;
    if (isPan) {
      const panRows = await db.query('SELECT * FROM platform_types WHERE id = 1');
      panType = panRows[0][0];
    } else if (isGrating) {
      const gRows = await db.query('SELECT * FROM platform_types WHERE id = 2');
      panType = gRows[0][0];
    }

    const laborRows = await db.query('SELECT labor_type, rate FROM labor_rates');
    const laborRates = {};
    for (const r of laborRows[0]) {
      laborRates[r.labor_type.toUpperCase()] = parseFloat(r.rate);
    }
    const shopRate  = laborRates['SHOP']  || 75;
    const fieldRate = laborRates['FIELD'] || 85;

    // ── STEP 1: Geometry ────────────────────────────────────────────────────
    const geo = this.computeGeometry(riseIn, runIn);

    // ── STEP 2: Separate Linear Footage (Near Side & Far Side) ──────────────
    const nsLF    = this.computeOneSideLF(geo.stepSlopeIn, numRisers, extentBotNSIn, extentTopNSIn);
    const fsLF    = this.computeOneSideLF(geo.stepSlopeIn, numRisers, extentBotFSIn, extentTopFSIn);
    const totalLF = this.roundExcel(nsLF + fsLF, 4);

    // ── STEP 3 + 4: Burdened Weight ─────────────────────────────────────────
    const stringerWeight = this.computeBurdenedWeight(totalLF, parseFloat(stringer.steel_lbs_per_ft), markup);

    // ── STEP 5: Routing Logic (ID 76 vs ID 77) ──────────────────────────────
    let panArea          = 0;
    let panWeight        = { raw: 0, burdened: 0 };
    let gratingCost      = 0;
    let hardwareCost     = 0;

    if (isPan && panType) {
      panArea = this.roundExcel(stairWidthFt * (runIn / 12) * numRisers, 2);
      panWeight = this.computeBurdenedWeight(panArea, parseFloat(panType.steel_lbs_per_sqft), markup);
    } else if (isGrating) {
      let gratingUnitPrice = 55.00;
      if (stairWidthFt > 4) gratingUnitPrice = 75.00;
      else if (stairWidthFt > 3.5) gratingUnitPrice = 65.00;
      else if (stairWidthFt > 3.0) gratingUnitPrice = 60.00;
      gratingCost = this.roundExcel(gratingUnitPrice * numRisers, 2);
    }

    // ── STEP 6: Connection Complexity (Welded vs Bolted) ───────────────────────
    let connectionShopHrs  = 0;
    let connectionFieldHrs = 0;
    const HW_UNIT_COST     = 15.00;

    if (connectionTypeBot?.toUpperCase() === 'WELDED') {
      connectionShopHrs += 0.5; connectionFieldHrs += 0.5;
    } else {
      hardwareCost += HW_UNIT_COST;
    }
    if (connectionTypeTop?.toUpperCase() === 'WELDED') {
      connectionShopHrs += 0.5; connectionFieldHrs += 0.5;
    } else {
      hardwareCost += HW_UNIT_COST;
    }

    // ── STEP 7: Labor & Width Multiplier ────────────────────────────────────
    const widthMult = isPan ? this.getWidthMultiplier(stairWidthFt) : 1;

    const stringerShopHrs  = this.roundExcel(parseFloat(stringer.shop_hrs_per_lf  || 0) * totalLF * widthMult, 2);
    const stringerFieldHrs = this.roundExcel(parseFloat(stringer.field_hrs_per_lf || 0) * totalLF * widthMult, 2);

    const panShopHrs  = (isPan && panType) ? this.roundExcel(parseFloat(panType.shop_labor_rate  || 0) * panArea * widthMult, 2) : 0;
    const panFieldHrs = (isPan && panType) ? this.roundExcel(parseFloat(panType.field_labor_rate || 0) * panArea * widthMult, 2) : 0;

    // ── STEP 8: Galvanizing ─────────────────────────────────────────────────
    const isGalv = finish?.toUpperCase() === 'GALVANIZED';
    const galvShopHrs      = isGalv ? this.roundExcel(parseFloat(stringer.galv_weep_hrs_per_lf || 0) * totalLF, 2) : 0;
    const galvMaterialCost = isGalv ? this.roundExcel(stringerWeight.burdened * galvRatePerLb, 2) : 0;

    // ── Aggregation ──────────────────────────────────────────────────────────
    const totalShopHrs  = this.roundExcel(stringerShopHrs + panShopHrs + connectionShopHrs + galvShopHrs, 2);
    const totalFieldHrs = this.roundExcel(stringerFieldHrs + panFieldHrs + connectionFieldHrs, 2);

    const shopLaborCost  = this.roundExcel(totalShopHrs  * shopRate, 2);
    const fieldLaborCost = this.roundExcel(totalFieldHrs * fieldRate, 2);

    const subtotal = this.roundExcel(
      shopLaborCost + fieldLaborCost + galvMaterialCost + gratingCost + hardwareCost,
      2
    );

    const taxAmount          = this.roundExcel(subtotal * taxRate, 2);
    const totalEstimatedCost = this.roundExcel(subtotal + taxAmount, 2);

    const result = {
      success: true,
      geometry: {
        stepSlopeIn: this.roundExcel(geo.stepSlopeIn, 4),
        slopeRatio:  geo.slopeRatio,
        angleDeg:    geo.angleDeg,
        numRisers
      },
      stringer: {
        profile: stringerProfileId,
        nsOneSideLF: nsLF,
        fsOneSideLF: fsLF,
        totalLF,
        rawWeightLbs: stringerWeight.raw,
        burdenedWeightLbs: stringerWeight.burdened
      },
      components: {
        stairType: isPan ? 'Pan Plate' : (isGrating ? 'Grating Tread' : 'Other'),
        panArea,
        panWeight: panWeight.burdened,
        gratingCost,
        hardwareCost
      },
      labor: {
        widthMultiplier: widthMult,
        totalShopHrs,
        totalFieldHrs,
        shopLaborCost,
        fieldLaborCost,
        connectionShopHrs,
        connectionFieldHrs
      },
      summary: {
        totalSteelLbs: this.roundExcel(stringerWeight.burdened + panWeight.burdened, 2),
        totalShopHrs,
        totalFieldHrs,
        shopLaborCost,
        fieldLaborCost,
        galvMaterialCost,
        gratingPieceCost: gratingCost,
        extraHardwareCost: hardwareCost,
        subtotal,
        taxAmount,
        totalEstimatedCost
      }
    };

    if (estimateId) {
      await db.query(
        `INSERT INTO takeoff_items 
          (estimate_id, category_id, description, length, width, rise, run, quantity, total_weight, total_cost)
         VALUES (?, 4, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          estimateId,
          `Stair Flight — ${stringerProfileId} (${isGrating ? 'Grating' : 'Pan'})`,
          this.roundExcel(totalLF, 2),
          this.roundExcel(stairWidthFt, 2),
          this.roundExcel(riseIn, 2),
          this.roundExcel(runIn, 2),
          numRisers,
          this.roundExcel(stringerWeight.burdened + panWeight.burdened, 2),
          totalEstimatedCost
        ]
      );
    }

    return result;
  }
}

module.exports = new StairFlightCalculationService();
