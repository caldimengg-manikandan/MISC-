/**
 * StringerWeightCalculationService.js
 * 
 * Calculates stringer weight with three components:
 * 1. Base weight (profile weight per foot × length)
 * 2. Connection weight (3.5 lbs per connection × 2 = 7 lbs)
 * 3. Tread support weight (1.33 lbs per tread per stringer)
 * 
 * Uses ES modules for React compatibility
 */

class StringerWeightCalculationService {
  
  // Fixed constants
  static CONNECTION_WEIGHT_PER_CONNECTION = 3.5; // lbs
  static CONNECTIONS_PER_STRINGER = 2;
  static TREAD_SUPPORT_WEIGHT_PER_TREAD = 1.33; // lbs per tread per stringer
  static SCRAP_FACTOR = 0.11;
  static NUMBER_OF_STRINGERS = 2; // Default for stairs
  
  /**
   * Calculate total stringer weight
   * 
   * @param {number} profileWeightPerFoot - From selected profile (lbs/ft)
   *   Example: 10.6 lbs/ft for MC 12 X 10.6
   * @param {number} totalStringerLengthFeet - Calculated stringer length
   * @param {number} numberOfRisers - From form RISERS field
   *   (Number of treads = risers - 1)
   * @param {number} numberOfStringers - Default 2, can be customized
   * @param {number} costPerLb - From system_config, default 0.75
   * 
   * @returns {Object} Complete weight calculation results
   */
  calculateStringerWeight(
    profileWeightPerFoot,
    totalStringerLengthFeet,
    numberOfRisers,
    numberOfStringers = StringerWeightCalculationService.NUMBER_OF_STRINGERS,
    costPerLb = 0.75
  ) {
    try {
      // Validate inputs
      if (!profileWeightPerFoot || profileWeightPerFoot <= 0) {
        return {
          success: false,
          error: 'Profile weight per foot must be greater than 0'
        };
      }
      
      if (!totalStringerLengthFeet || totalStringerLengthFeet <= 0) {
        return {
          success: false,
          error: 'Stringer length must be greater than 0'
        };
      }
      
      // Calculate number of treads
      const numberOfTreads = numberOfRisers - 1;
      
      // COMPONENT 1: Base Weight
      const baseWeightPerStringer = profileWeightPerFoot * totalStringerLengthFeet;
      
      // COMPONENT 2: Connection Weight (FIXED)
      const connectionWeightPerStringer = 
        StringerWeightCalculationService.CONNECTION_WEIGHT_PER_CONNECTION * 
        StringerWeightCalculationService.CONNECTIONS_PER_STRINGER;
      // = 3.5 × 2 = 7 lbs per stringer
      
      // COMPONENT 3: Tread Support Weight (FIXED)
      const treadSupportWeightPerStringer = 
        StringerWeightCalculationService.TREAD_SUPPORT_WEIGHT_PER_TREAD * numberOfTreads;
      // = 1.33 × numberOfTreads
      
      // Total weight per stringer
      const totalWeightPerStringer = 
        baseWeightPerStringer + 
        connectionWeightPerStringer + 
        treadSupportWeightPerStringer;
      
      // Total weight for all stringers
      const totalWeightAllStringers = totalWeightPerStringer * numberOfStringers;
      
      // Add scrap factor
      const scrapLbs = totalWeightAllStringers * StringerWeightCalculationService.SCRAP_FACTOR;
      const totalWithScrap = totalWeightAllStringers + scrapLbs;
      
      // Calculate costs
      const materialCost = totalWeightAllStringers * costPerLb;
      const scrapCost = materialCost * StringerWeightCalculationService.SCRAP_FACTOR;
      const totalCost = materialCost + scrapCost;
      
      // Return complete result
      return {
        success: true,
        
        // Component breakdown
        baseWeightPerStringer: parseFloat(baseWeightPerStringer.toFixed(3)),
        connectionWeightPerStringer: connectionWeightPerStringer,
        treadSupportWeightPerStringer: parseFloat(treadSupportWeightPerStringer.toFixed(3)),
        totalWeightPerStringer: parseFloat(totalWeightPerStringer.toFixed(3)),
        
        // Total weight
        totalWeightAllStringers: parseFloat(totalWeightAllStringers.toFixed(3)),
        scrapLbs: parseFloat(scrapLbs.toFixed(3)),
        totalWeightWithScrap: parseFloat(totalWithScrap.toFixed(3)),
        
        // Costs
        materialCost: parseFloat(materialCost.toFixed(2)),
        scrapCost: parseFloat(scrapCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        
        // Calculation breakdown
        calculation: {
          numberOfStringers: numberOfStringers,
          numberOfTreads: numberOfTreads,
          profileWeightPerFoot: profileWeightPerFoot,
          totalStringerLengthFeet: totalStringerLengthFeet,
          
          perStringerBreakdown: {
            baseWeight: `${profileWeightPerFoot} lbs/ft × ${totalStringerLengthFeet} ft = ${baseWeightPerStringer.toFixed(1)} lbs`,
            connectionWeight: `3.5 lbs/connection × 2 connections = 7 lbs`,
            treadSupportWeight: `1.33 lbs/tread × ${numberOfTreads} treads = ${treadSupportWeightPerStringer.toFixed(1)} lbs`,
            total: `${totalWeightPerStringer.toFixed(1)} lbs/stringer`
          },
          
          totalBreakdown: {
            allStringers: `${totalWeightPerStringer.toFixed(1)} lbs × ${numberOfStringers} = ${totalWeightAllStringers.toFixed(1)} lbs`,
            withScrap: `${totalWeightAllStringers.toFixed(1)} × 1.11 = ${totalWithScrap.toFixed(1)} lbs`
          }
        },
        
        // Display strings for UI
        display: {
          perStringer: `${totalWeightPerStringer.toFixed(1)} lbs per stringer`,
          total: `${totalWeightAllStringers.toFixed(0)} lbs (${numberOfStringers} stringers)`,
          scrap: `${scrapLbs.toFixed(0)} lbs (+11%)`,
          withScrap: `${totalWithScrap.toFixed(0)} lbs total`,
          materialCost: `$${materialCost.toFixed(2)}`,
          scrapCost: `$${scrapCost.toFixed(2)}`,
          totalCost: `$${totalCost.toFixed(2)}`
        }
      };
      
    } catch (error) {
      console.error('Stringer weight calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default StringerWeightCalculationService;
