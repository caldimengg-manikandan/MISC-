const db = require('../config/mssql');

/**
 * ConfigManager
 * Standardizes global pricing variables across the application.
 * Bridges the gap between UI/DB field names and Calculation Engine expectations.
 */
class ConfigManager {
  constructor() {
    this.configs = {};
    this.isLoaded = false;
  }

  async loadConfigs() {
    try {
      // 1. Load system_config (Primary source for global parameters)
      const [systemConfigRows] = await db.query('SELECT config_key, config_value FROM system_config');
      if (systemConfigRows) {
        systemConfigRows.forEach(row => {
          this.configs[row.config_key] = parseFloat(row.config_value);
        });
      }

      // 2. Load pricing (Legacy/Item-specific pricing)
      const [pricingRows] = await db.query('SELECT item_key, rate FROM pricing');
      if (pricingRows) {
        pricingRows.forEach(row => {
          this.configs[`price_${row.item_key}`] = parseFloat(row.rate);
        });
      }

      // 3. Aliasing / Bridging (Ensure engine compatibility)
      // The Engine uses 'galvanize_charge' but DB uses 'galvanize_rate'
      if (this.configs['galvanize_rate'] !== undefined) {
        this.configs['galvanize_charge'] = this.configs['galvanize_rate'];
      }

      // 4. Critical Parameter Safety Mixins (Fallback to industry standard if missing)
      const defaults = {
        'material_markup': 0.11,
        'tax_rate': 0.06,
        'steel_price_per_lb': 0.75,
        'shop_hourly_rate': 90.00,
        'field_hourly_rate': 125.00,
        'mounting_embedded_rate': 5.00,
        'mounting_anchored_rate': 6.00,
        'anchor_bolt_rate': 0.025,
        'por_rok_anchor_rate': 10.00, // Safe default for missing benchmark
        'scrap_factor_pct': 11,
        'galvanize_markup_pct': 10,
        'stair_pan_rate': 1.00,
        'welded_shop_mh': 0.5,
        'welded_field_mh': 0.25,
        'bolted_shop_mh': 1.0,
        'bolted_field_mh': 0.5,
        'galvanize_rate': 0.75,
        'powder_coat_rate': 1.7587
      };

      Object.keys(defaults).forEach(key => {
        if (this.configs[key] === undefined || isNaN(this.configs[key])) {
          this.configs[key] = defaults[key];
        }
      });

      // Synchronize galvanize_charge again after defaults
      this.configs['galvanize_charge'] = this.configs['galvanize_rate'];

      // ── MIGRATION: Sanitize stale or unreasonably low rates ──
      const STD_GALV_MIN  = 0.50; 
      if (this.configs['galvanize_rate'] < STD_GALV_MIN) {
        console.warn(`⚠️  Correcting stale galvanize_rate (${this.configs['galvanize_rate']}) → ${defaults.galvanize_rate}`);
        this.configs['galvanize_rate'] = defaults.galvanize_rate;
        this.configs['galvanize_charge'] = defaults.galvanize_rate;
        await this.persistCorrection('galvanize_rate', defaults.galvanize_rate);
      }

      this.isLoaded = true;
      console.log('✅ System Configurations Synchronized');
    } catch (error) {
      console.error('❌ Failed to load configurations:', error);
      this.isLoaded = false;
    }
  }

  async persistCorrection(key, value) {
    try {
      await db.query(
        'IF EXISTS (SELECT 1 FROM system_config WHERE config_key = ?) UPDATE system_config SET config_value = ? WHERE config_key = ? ELSE INSERT INTO system_config (config_key, config_value) VALUES (?, ?)',
        [key, value.toString(), key, key, value.toString()]
      );
    } catch (e) {
      console.error(`Failed to persist ${key} correction:`, e);
    }
  }

  get(key, fallback = 0) {
    // If specific key exists, return it, otherwise try the fallback or 0
    return this.configs[key] !== undefined ? this.configs[key] : fallback;
  }
}

module.exports = new ConfigManager();

