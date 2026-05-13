const db = require('../../config/mssql');

const DEFAULT_APPLICATION_TYPE = 'Commercial / Standard Duty';

class PanPlateRecommendationService {
  /**
   * Recommends the best pan plate config based on area + application type.
   * Does NOT calculate weight/labor/cost.
   */
   async getRecommendedPanPlate(width, length, stairType = null, applicationType = DEFAULT_APPLICATION_TYPE, adminOwnerId = null, gauge = '12ga') {
    if (!width || !length) {
      throw new Error('Width and length are required to recommend a pan plate');
    }

    try {
      const wFt = parseFloat(width);
      const appType = applicationType || DEFAULT_APPLICATION_TYPE;
      
      // 1. Query for matching config based on width range and optionally gauge
      // We look for a row where min <= width <= max
      let query = `
        SELECT TOP 1 * FROM dictionary 
        WHERE category = 'pan_plate_config' 
        AND (min_stair_width_ft <= @width OR min_stair_width_ft IS NULL)
        AND (max_stair_width_ft >= @width OR max_stair_width_ft IS NULL)
      `;
      
      const params = { width: wFt };

      if (gauge) {
        query += ` AND custom_fields LIKE @gaugeMatch`;
        params.gaugeMatch = `%${gauge}%`;
      }

      query += ` ORDER BY recommendation_order ASC, [order] ASC`;

      const [rows] = await db.query(query, params);
      
      if (rows && rows.length > 0) {
        return rows[0];
      }

      // Fallback: Try without gauge if no match found for specific gauge
      if (gauge) {
        const [fallbackRows] = await db.query(`
          SELECT TOP 1 * FROM dictionary 
          WHERE category = 'pan_plate_config' 
          AND (min_stair_width_ft <= @width OR min_stair_width_ft IS NULL)
          AND (max_stair_width_ft >= @width OR max_stair_width_ft IS NULL)
          ORDER BY recommendation_order ASC
        `, { width: wFt });
        if (fallbackRows && fallbackRows.length > 0) return fallbackRows[0];
      }

      // Final Fallback: Just the highest-priority config overall
      const [globalFallback] = await db.query(`
        SELECT TOP 1 * FROM dictionary
        WHERE category = 'pan_plate_config'
        ORDER BY recommendation_order ASC, [order] ASC
      `);
      return globalFallback && globalFallback.length > 0 ? globalFallback[0] : null;

    } catch (error) {
      console.error('Error in getRecommendedPanPlate:', error);
      throw error;
    }
  }

  /**
   * Determine what support type is needed based on area and application
   */
  determineSupportType(areaSqFt, applicationType) {
    const app = (applicationType || '').toLowerCase();
    
    if (areaSqFt < 30 && app.includes('light')) {
      return 'Type-1(Single support)';
    } else if (areaSqFt < 60 && (app.includes('commercial') || app.includes('standard'))) {
      return 'Type-1(Single support)';
    } else if (areaSqFt < 100) {
      return 'Type-2(Dual support)';
    } else if (app.includes('heavy') || app.includes('industrial') || app.includes('outdoor')) {
      return 'Type-3(bent plate)';
    } else {
      return 'Type-(Welded)';
    }
  }

  /**
   * Validates if a manually selected config fits the dimensions.
   */
  async validatePanPlateForDimensions(configId, width, length, applicationType = DEFAULT_APPLICATION_TYPE) {
    if (!configId) return { valid: false, issues: ['No configuration provided'], config: null };
    
    try {
      const [configs] = await db.query(`
        SELECT * FROM dictionary WHERE id = @configId AND category = 'pan_plate_config'
      `, { configId });

      if (!configs || configs.length === 0) {
        return { valid: false, issues: ['Configuration not found'], config: null };
      }

      const config = configs[0];
      const areaSqFt = parseFloat(width) * parseFloat(length);
      const appType = applicationType || DEFAULT_APPLICATION_TYPE;
      
      const recommendedSupport = this.determineSupportType(areaSqFt, appType);
      const currentSupport = config.value || '';
      
      const issues = [];
      if (!currentSupport.toLowerCase().includes(recommendedSupport.toLowerCase().split('(')[0])) {
        issues.push(`Selected support "${currentSupport}" might not be ideal for this area (${areaSqFt.toFixed(1)} SF). Recommended: "${recommendedSupport}".`);
      }

      return {
        valid: issues.length === 0,
        issues,
        config
      };
    } catch (error) {
      console.error('Error in validatePanPlateForDimensions:', error);
      throw error;
    }
  }
}

module.exports = new PanPlateRecommendationService();
