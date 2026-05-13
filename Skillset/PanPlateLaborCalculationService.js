/**
 * PanPlateLaborCalculationService.js
 * 
 * Calculates pan plate labor hours and costs
 * Shop Hours = Area × Labor Rate (from database)
 * Field Hours = Area × Labor Rate (from database)
 * 
 * Uses ES modules for React compatibility
 */

class PanPlateLaborCalculationService {
  
  /**
   * Calculate labor hours and costs for pan plate
   * 
   * @param {number} stairWidth - In feet
   * @param {number} stairLength - In feet
   * @param {Object} panPlateConfig - From database
   *   {
   *     shopLaborMhLf: 1.25,  // hours per SF
   *     fieldLaborMhLf: 0     // hours per SF
   *   }
   * @param {number} shopHourlyRate - $/hour, default $90
   * @param {number} fieldHourlyRate - $/hour, default $125
   * 
   * @returns {Object} Labor calculation results
   */
  calculateLaborCost(
    stairWidth,
    stairLength,
    panPlateConfig,
    shopHourlyRate = 90,
    fieldHourlyRate = 125
  ) {
    try {
      // Validate
      if (!panPlateConfig) {
        return {
          success: false,
          error: 'No pan plate config'
        };
      }
      
      // Calculate area in square feet
      const areaSqFt = stairWidth * stairLength;
      
      // Get labor rates from config
      const shopLaborRate = panPlateConfig.shopLaborMhLf || 0;
      const fieldLaborRate = panPlateConfig.fieldLaborMhLf || 0;
      
      // Calculate hours
      const shopHours = areaSqFt * shopLaborRate;
      const fieldHours = areaSqFt * fieldLaborRate;
      const totalHours = shopHours + fieldHours;
      
      // Calculate costs
      const shopCost = shopHours * shopHourlyRate;
      const fieldCost = fieldHours * fieldHourlyRate;
      const totalCost = shopCost + fieldCost;
      
      return {
        success: true,
        
        // Hours
        areaSqFt: areaSqFt,
        shopHours: parseFloat(shopHours.toFixed(1)),
        fieldHours: parseFloat(fieldHours.toFixed(1)),
        totalHours: parseFloat(totalHours.toFixed(1)),
        
        // Costs
        shopCost: parseFloat(shopCost.toFixed(2)),
        fieldCost: parseFloat(fieldCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        
        // Rates used
        shopHourlyRate: shopHourlyRate,
        fieldHourlyRate: fieldHourlyRate,
        
        // Display strings
        display: {
          area: `${areaSqFt} SF`,
          shopHours: `${shopHours.toFixed(1)} hrs`,
          fieldHours: `${fieldHours.toFixed(1)} hrs`,
          shopCost: `$${shopCost.toFixed(2)}`,
          fieldCost: `$${fieldCost.toFixed(2)}`,
          totalCost: `$${totalCost.toFixed(2)}`
        }
      };
      
    } catch (error) {
      console.error('Labor calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default PanPlateLaborCalculationService;
