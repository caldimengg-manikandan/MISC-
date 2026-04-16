const db = require('../../config/mssql');

/**
 * StairFlightCalculationService
 * REBUILD: 100% Mathematical Parity with Legacy Excel/SQL Math Engine.
 */
class StairFlightCalculationService {

  roundExcel(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Number(Math.round(+(value + 'e' + decimals)) + 'e-' + decimals);
  }

  async calculateFlightAndStringers(payload) {
    const {
      stairWidthFt,
      riseIn,
      runIn,
      numRisers,
      stringerProfileId,
      stairType, // 'pan-concrete' (76) or 'grating-tread' (77)
      extentBotNSFt = 0,
      extentBotFSFt = 0,
      extentTopNSFt = 0,
      extentTopFSFt = 0,
      connectionTypeBot = 'WELDED',
      connectionTypeTop = 'WELDED',
      finish = 'PRIMER',
      galvRatePerLb = 0.50, // Standard specified rate
      estimateId = null,
    } = payload;

    // 1. Fetch Global Configs & Rates
    const configManager = require('../../utils/configManager');
    if (!configManager.isLoaded) await configManager.loadConfigs();

    const [configs] = await db.query('SELECT config_key, config_value FROM system_config');
    const markup = configManager.get('material_markup', 0.11);
    const taxRate = configManager.get('tax_rate', 0.06);

    const [laborRows] = await db.query('SELECT labor_type, rate FROM labor_rates');
    const rates = {};
    laborRows.forEach(r => rates[r.labor_type.toUpperCase()] = parseFloat(r.rate));
    
    // Priorities: configManager > labor_rates table > Defaults
    const SHOP_RATE = configManager.get('shop_hourly_rate', rates['SHOP'] || 75.00);
    const FIELD_RATE = configManager.get('field_hourly_rate', rates['FIELD'] || 85.00);
    const BASE_STEEL_PRICE = configManager.get('steel_price_per_lb', 0.75);
    const PAN_RATE = configManager.get('stair_pan_rate', 1.00);
    const GALV_RATE = configManager.get('galvanize_rate', 0.75);

    // 2. Stringer Profile Data
    const [sRows] = await db.query('SELECT * FROM stringer_types WHERE name = ?', [stringerProfileId]);
    if (!sRows || sRows.length === 0) throw new Error(`Invalid stringer profile: ${stringerProfileId}`);
    const stringer = sRows[0];

    // 3. MODULE A: Stair Geometry
    const slope = Math.sqrt(Math.pow(riseIn, 2) + Math.pow(runIn, 2));
    const angle = Math.atan(riseIn / runIn) * (180 / Math.PI);

    // 4. MODULE A: Total Stringer Length
    // Formula: ((Slope * Number of Risers) / 12) + Sum of 4 Extents
    const baseStringerLF = (slope * numRisers) / 12;
    const extentsSum = parseFloat(extentBotNSFt) + parseFloat(extentBotFSFt) + parseFloat(extentTopNSFt) + parseFloat(extentTopFSFt);
    
    // CRITICAL: Multiply entire length by 2 (Two Stringers)
    const totalStringerLF = (baseStringerLF + extentsSum) * 2;

    // 5. Stringer Weight & Labor
    const rawWeight = totalStringerLF * parseFloat(stringer.steel_lbs_per_ft);
    const burdenedWeight = this.roundExcel(rawWeight * (1 + markup), 2);
    
    let shopLaborHrs = totalStringerLF * parseFloat(stringer.shop_hrs_per_lf || 0.15);
    let fieldLaborHrs = totalStringerLF * parseFloat(stringer.field_hrs_per_lf || 0.10);

    // 6. Connection Hardware
    let hardwareCost = 0;
    const connTypes = [connectionTypeBot, connectionTypeTop];
    connTypes.forEach(conn => {
      if (conn?.toUpperCase() === 'WELDED') {
        shopLaborHrs += configManager.get('welded_shop_mh', 0.5);
        fieldLaborHrs += configManager.get('welded_field_mh', 0.5);
      } else if (conn?.toUpperCase() === 'BOLTED' || conn?.toUpperCase() === 'ANCHORED') {
        // Use consistent mounting rates from config
        const rate = (conn?.toUpperCase() === 'ANCHORED') 
          ? configManager.get('mounting_anchored_rate', 15.00)
          : configManager.get('mounting_embedded_rate', 10.00);
        hardwareCost += rate;
        
        shopLaborHrs += configManager.get('bolted_shop_mh', 1.0);
        fieldLaborHrs += configManager.get('bolted_field_mh', 0.5);
      }
    });

    // 7. Treads / Pans
    let panWeight = 0;
    let gratingTreadCost = 0;
    let componentArea = 0;

    if (stairType === 'pan-concrete' || stairType === '76') {
      // ID 76 (PAN PLATE): Area = Width * (Run / 12) * Risers
      componentArea = stairWidthFt * (runIn / 12) * numRisers;
      // Pan Burdened Weight = Area * 12.5 lbs/sqft * 1.11 markup
      panWeight = this.roundExcel(componentArea * 12.5 * (1 + markup), 2);
      // Labor from platform_types or standard rates (using standard 0.05 hr/sqft if not specified)
      shopLaborHrs += componentArea * 0.05;
      fieldLaborHrs += componentArea * 0.02;
    } else if (stairType === 'grating-tread' || stairType === '77') {
      // ID 77 (GRATING TREAD): Tiered pricing based on Width (Standard matrix)
      let unitPrice = 80.15; // Default for <= 5.0
      if (stairWidthFt <= 3.5) unitPrice = 56.10;
      else if (stairWidthFt <= 4.0) unitPrice = 64.12;
      else if (stairWidthFt <= 4.5) unitPrice = 72.15;
      else if (stairWidthFt <= 5.0) unitPrice = 80.15;
      
      gratingTreadCost = unitPrice * numRisers;
    }

    // 8. MODULE E: Finishes & Galvanizing
    let finishCost = 0;
    if (finish?.toUpperCase() === 'GALVANIZED') {
      // Weep-hole penalty
      shopLaborHrs += totalStringerLF * 0.15;
      fieldLaborHrs += totalStringerLF * 0.10;
      // Galv Material Cost: Burdened Weight * Dynamic Rate
      finishCost = burdenedWeight * GALV_RATE;
    }

    // 9. Monetize and Aggregate
    const laborCost = (shopLaborHrs * SHOP_RATE) + (fieldLaborHrs * FIELD_RATE);
    const steelCost = burdenedWeight * BASE_STEEL_PRICE;
    const panPlateCost = panWeight * PAN_RATE;
    
    const subtotal = laborCost + steelCost + panPlateCost + finishCost + hardwareCost + gratingTreadCost;
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    const result = {
      success: true,
      geometry: { slope: this.roundExcel(slope, 4), angle: this.roundExcel(angle, 2), stepSlopeIn: this.roundExcel(slope, 2) },
      stringer: { totalLF: totalStringerLF, rawWeight, burdenedWeight },
      panPlate: { areaSqFt: componentArea, burdenedWeight: panWeight, cost: this.roundExcel(panPlateCost, 2) },
      labor: { totalShopHrs: this.roundExcel(shopLaborHrs, 2), totalFieldHrs: this.roundExcel(fieldLaborHrs, 2), shopLaborCost: this.roundExcel(shopLaborHrs * SHOP_RATE, 2), fieldLaborCost: this.roundExcel(fieldLaborHrs * FIELD_RATE, 2), shopRatePerHr: SHOP_RATE, fieldRatePerHr: FIELD_RATE },
      finish: { galvMaterialCost: this.roundExcel(finishCost, 2) },
      components: {
        hardwareCost: this.roundExcel(hardwareCost, 2),
        gratingPieceCost: this.roundExcel(gratingTreadCost, 2)
      },
      summary: {
        totalSteelLbs: this.roundExcel(burdenedWeight + panWeight, 2),
        totalShopHrs: this.roundExcel(shopLaborHrs, 2),
        totalFieldHrs: this.roundExcel(fieldLaborHrs, 2),
        galvMaterialCost: this.roundExcel(finishCost, 2),
        gratingPieceCost: this.roundExcel(gratingTreadCost, 2),
        subtotal: this.roundExcel(subtotal, 2),
        taxRate,
        taxAmount: this.roundExcel(taxAmount, 2),
        totalEstimatedCost: this.roundExcel(grandTotal, 2)
      }
    };

    // 10. Persist to DB
    if (estimateId) {
      await db.query(
        `INSERT INTO takeoff_items (estimate_id, category_id, description, length, width, total_weight, total_cost)
         VALUES (?, 1, ?, ?, ?, ?, ?)`,
        [estimateId, `Stair Flight: ${stringerProfileId}`, totalStringerLF, stairWidthFt, burdenedWeight + panWeight, grandTotal]
      );
    }

    return result;
  }
}

module.exports = new StairFlightCalculationService();
