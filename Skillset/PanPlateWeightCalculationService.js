/**
 * PanPlateWeightCalculationService.js
 * 
 * Calculates pan plate weight using exact engineering formula:
 * Weight = Thickness(in) × Width(in) × Length(in) × 0.283
 * 
 * Accepts thickness directly from user (gauge or manual entry)
 * Uses ES modules for React compatibility
 */

class PanPlateWeightCalculationService {
  
  // Gauge to thickness lookup table (for reference)
  static GAUGE_THICKNESS = {
    '7ga': 0.1793,
    '10ga': 0.1345,
    '11ga': 0.1196,
    '12ga': 0.1046,
    '14ga': 0.0747,
    '16ga': 0.0598,
    '18ga': 0.0478,
    '20ga': 0.0359,
    '22ga': 0.0299,
    '24ga': 0.0239
  };
  
  // Density constant for carbon steel (lb/in³)
  static DENSITY = 0.283;
  
  // Scrap factor
  static SCRAP_FACTOR = 0.11;
  
  /**
   * Calculate pan plate weight and costs
   * 
   * @param {Object} panPlateConfig - From database
   *   {
   *     pl_thk: "12ga",
   *     pan_type: "TYPE-1(Z)",
   *     pan_support_type: "Type-1(Single support)",
   *     shopLaborMhLf: 1.25,
   *     fieldLaborMhLf: 0
   *   }
   * 
   * @param {number} riserHeightInches - From form RISE field (inches)
   * @param {number} treadWidthInches - From form TREAD WIDTH field (inches)
   * @param {number} stairWidthFeet - From form STAIR WIDTH field (feet)
   * @param {number} thicknessInches - User input (gauge or manual)
   * @param {string} thicknessSource - 'gauge' or 'manual' (for tracking)
   * @param {number} costPerLb - From system_config, default 0.75
   * 
   * @returns {Object} Complete calculation results
   */
  calculatePanPlateWeight(
    panPlateConfig,
    riserHeightInches,
    treadWidthInches,
    stairWidthFeet,
    thicknessInches,
    thicknessSource = 'gauge',
    costPerLb = 0.75,
    numberOfTreads = 1   // ← NEW: multiply per-tread weight by full tread count
  ) {
    try {
      // Validate inputs
      if (!panPlateConfig || !panPlateConfig.pl_thk) {
        return {
          success: false,
          error: 'No pan plate config selected'
        };
      }
      
      if (!thicknessInches || thicknessInches <= 0) {
        return {
          success: false,
          error: 'Invalid thickness value'
        };
      }
      
      // STEP 1: Thickness is already provided by user
      const T = parseFloat(thicknessInches);
      
      // STEP 2: Calculate plate width based on pan type
      const W = this.calculatePlateWidth(
        panPlateConfig.pan_type,
        riserHeightInches,
        treadWidthInches
      );
      
      // STEP 3: Convert stair width to inches (this is the LENGTH of each tread plate)
      const L = stairWidthFeet * 12;
      
      // STEP 4: Calculate raw weight using engineering formula
      const rawWeightPerTread = T * W * L * PanPlateWeightCalculationService.DENSITY;
      const treads = Math.max(1, parseInt(numberOfTreads) || 1);
      const rawWeight = rawWeightPerTread * treads;  // ← Total for all treads
      
      // STEP 5: Calculate scrap
      const scrapLbs = rawWeight * PanPlateWeightCalculationService.SCRAP_FACTOR;
      const totalWeight = rawWeight + scrapLbs;
      
      // STEP 6: Calculate costs
      const materialCost = rawWeight * costPerLb;
      const scrapCost = materialCost * PanPlateWeightCalculationService.SCRAP_FACTOR;
      
      // STEP 7: Return complete result
      return {
        success: true,
        
        // Weight results (lbs)
        panPlateWeight: parseFloat(rawWeight.toFixed(3)),
        panPlateWeightWithScrap: parseFloat(totalWeight.toFixed(3)),
        scrapLbs: parseFloat(scrapLbs.toFixed(3)),
        
        // Cost results ($)
        materialCost: parseFloat(materialCost.toFixed(2)),
        scrapCost: parseFloat(scrapCost.toFixed(2)),
        totalCost: parseFloat((materialCost + scrapCost).toFixed(2)),
        
        // Calculation breakdown
        calculation: {
          thicknessInches: T,
          thicknessSource: thicknessSource,
          plateWidthInches: W,
          plateLengthInches: L,
          rawWeightPerTread: parseFloat(rawWeightPerTread.toFixed(3)),
          numberOfTreads: treads,
          densityConstant: PanPlateWeightCalculationService.DENSITY,
          scrapFactorPercent: PanPlateWeightCalculationService.SCRAP_FACTOR * 100,
          costPerLb: costPerLb,
          formula: `${T} × ${W} × ${L} × ${PanPlateWeightCalculationService.DENSITY} × ${treads} treads`,
          result: rawWeight
        },
        
        // Display strings for UI
        display: {
          thickness: `${T}" (${thicknessSource === 'manual' ? 'Manual' : 'Gauge'})`,
          weight: `${totalWeight.toFixed(0)} lbs`,
          weightWithoutScrap: `${rawWeight.toFixed(0)} lbs`,
          scrap: `${scrapLbs.toFixed(0)} lbs (+11%)`,
          materialCost: `$${materialCost.toFixed(2)}`,
          scrapCost: `$${scrapCost.toFixed(2)}`,
          totalCost: `$${(materialCost + scrapCost).toFixed(2)}`
        }
      };
      
    } catch (error) {
      console.error('Pan plate weight calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate plate width based on pan type and dimensions
   * 
   * TYPE-1: W = a + b + c + d + 2 (simple return)
   * TYPE-2: W = (a × 2) + (b × 2) + c (dual return)
   * Bent Plate/Welded: Use TYPE-1 formula
   */
  calculatePlateWidth(panType, riserHeight, treadWidth) {
    // Standard return values (from pan plate engineering specs)
    const returnAtTop = 1;      // b value
    const returnAtBottom = 1;   // d value
    const extraForEnds = 2;     // For TYPE-1
    
    if (panType && panType.includes('TYPE-1')) {
      // TYPE-1: Simple return shape
      return riserHeight + returnAtTop + treadWidth + returnAtBottom + extraForEnds;
    } else if (panType && panType.includes('TYPE-2')) {
      // TYPE-2: Dual return shape
      return (riserHeight * 2) + (returnAtTop * 2) + treadWidth;
    } else {
      // Fallback for Bent Plate or Welded (use TYPE-1 formula)
      return riserHeight + returnAtTop + treadWidth + returnAtBottom + extraForEnds;
    }
  }
}

export default PanPlateWeightCalculationService;
