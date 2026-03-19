/**
 * StairCalculationService.js
 * 
 * CORE REQUIREMENT: This service replicates Excel calculations EXACTLY.
 * Formula logic is hard-mirrored to provide 100% matching results.
 */

class StairCalculationService {
  constructor() {
    this.PREC_WEIGHT = 2;
    this.PREC_LABOR = 2;
    this.PREC_COST = 2;
    this.PREC_ANGLE = 2;
    this.PREC_SLOPE = 4;
  }

  /**
   * Helper to match Excel's ROUNDING behavior
   */
  roundExcel(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Number(Math.round(+(value + 'e' + decimals)) + 'e-' + decimals);
  }

  /**
   * 1. ── RAIL CALCULATION ─────────────────────────────────────────────
   */
  calculateRail(rail, typeData, markup = 0.11) {
    const { length, spacing } = rail;
    const { steel_lbs_per_lf, shop_labor_rate, field_labor_rate } = typeData;

    // Excel Logic: baseWeight -> extraWeight (markup) -> totalWeight
    const baseWeight = length * (steel_lbs_per_lf || 0);
    const extraWeight = baseWeight * markup;
    const totalWeight = baseWeight + extraWeight;
    const steelWeight = this.roundExcel(totalWeight, this.PREC_WEIGHT);
    
    // shop_labor = length × shop_labor_rate
    const shopLabor = this.roundExcel(length * (shop_labor_rate || 0), this.PREC_LABOR);
    
    // field_labor = length × field_labor_rate
    const fieldLabor = this.roundExcel(length * (field_labor_rate || 0), this.PREC_LABOR);

    // FIXED: REQUIRED (EXCEL) Math.floor
    let postQty = 0;
    if (spacing > 0) {
      postQty = Math.floor(length / spacing);
    }

    return { 
      steelWeight, 
      shopLabor, 
      fieldLabor, 
      postQty 
    };
  }

  /**
   * 2. ── PLATFORM CALCULATION ──────────────────────────────────────────
   */
  calculatePlatform(platform, typeData, markup = 0.11) {
    const { length, width } = platform;
    const { steel_lbs_per_sqft, shop_labor_rate, field_labor_rate } = typeData;

    const area = this.roundExcel(length * width, 2);
    
    // Excel Logic: Apply 11% markup to steel
    const baseWeight = area * (steel_lbs_per_sqft || 0);
    const extraWeight = baseWeight * markup;
    const totalWeight = baseWeight + extraWeight;
    const steelWeight = this.roundExcel(totalWeight, this.PREC_WEIGHT);
    
    const shopLabor = this.roundExcel(area * (shop_labor_rate || 0), this.PREC_LABOR);
    const fieldLabor = this.roundExcel(area * (field_labor_rate || 0), this.PREC_LABOR);

    return { 
      area, 
      steelWeight, 
      shopLabor, 
      fieldLabor 
    };
  }

  /**
   * 3. ── STAIR GEOMETRY ───────────────────────────────────────────────
   */
  calculateStairGeometry(input) {
    const { height, rise, run } = input;

    // risers = height / rise
    const risers = this.roundExcel(height / (rise || 1), 0);
    
    const slope = this.roundExcel((rise || 0) / (run || 1), this.PREC_SLOPE);
    const angle = this.roundExcel(Math.atan(slope || 0) * (180 / Math.PI), this.PREC_ANGLE);

    return { 
      risers, 
      slope, 
      angle 
    };
  }

  /**
   * 4. ── STRINGER CALCULATION ─────────────────────────────────────────
   */
  calculateStringer(stringer, typeData, markup = 0.11) {
    const { length } = stringer;
    const { steel_lbs_per_ft } = typeData;

    // Excel Logic: Apply 11% markup
    const baseWeight = length * (steel_lbs_per_ft || 0);
    const extraWeight = baseWeight * markup;
    const totalWeight = baseWeight + extraWeight;
    const steelWeight = this.roundExcel(totalWeight, this.PREC_WEIGHT);

    return { 
      steelWeight 
    };
  }

  calculateFinish(totalSteel, ratePerLb) {
    return this.roundExcel(totalSteel * (ratePerLb || 0), this.PREC_COST);
  }

  /**
   * 6. ── TOTAL AGGREGATION (INCLUDES TAX) ────────────────────────────
   */
  aggregateTotals(data) {
    const {
      railSteel = 0,
      platformSteel = 0,
      stringerSteel = 0,
      optionalSteel = 0,
      shopLaborHours = 0,
      fieldLaborHours = 0,
      materialRates = {},
      laborRates = {},
      finishCost = 0,
      taxRate = 0.06
    } = data;

    const totalSteel = this.roundExcel(
      railSteel + platformSteel + stringerSteel + optionalSteel, 
      this.PREC_WEIGHT
    );

    const totalLaborHours = this.roundExcel(
      shopLaborHours + fieldLaborHours, 
      this.PREC_LABOR
    );

    const steelRate = materialRates.steel || 0;
    const totalSteelCost = this.roundExcel(totalSteel * steelRate, this.PREC_COST);

    const shopLaborCost = this.roundExcel(shopLaborHours * (laborRates.shop || 0), this.PREC_COST);
    const fieldLaborCost = this.roundExcel(fieldLaborHours * (laborRates.field || 0), this.PREC_COST);
    const totalLaborCost = this.roundExcel(shopLaborCost + fieldLaborCost, this.PREC_COST);

    // J53 = subtotal
    const subtotal = this.roundExcel(totalSteelCost + finishCost + totalLaborCost, this.PREC_COST);
    
    // J54 = tax
    const taxAmount = this.roundExcel(subtotal * taxRate, this.PREC_COST);
    
    // J55 = final total
    const totalEstimatedCost = this.roundExcel(subtotal + taxAmount, this.PREC_COST);

    return {
      totalSteel,
      totalLaborHours,
      totalSteelCost,
      totalLaborCost,
      subtotal,
      taxAmount,
      totalEstimatedCost
    };
  }
}

module.exports = new StairCalculationService();
