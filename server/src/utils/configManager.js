const db = require('../config/mssql');

class ConfigManager {
  constructor() {
    this.configs = {};
    this.isLoaded = false;
  }

  async loadConfigs() {
    try {
      // Load system_config
      const [systemConfigRows] = await db.query('SELECT config_key, config_value FROM system_config');
      if (systemConfigRows) {
        systemConfigRows.forEach(row => {
          this.configs[row.config_key] = parseFloat(row.config_value);
        });
      }

      // Load specific pricing/rates if needed
      const [pricingRows] = await db.query('SELECT item_key, rate FROM pricing');
      if (pricingRows) {
        pricingRows.forEach(row => {
          this.configs[`price_${row.item_key}`] = parseFloat(row.rate);
        });
      }

      // Fallbacks for critical values if DB is missing them
      this.configs['material_markup'] = this.configs['material_markup'] || 0.11;
      this.configs['tax_rate'] = this.configs['tax_rate'] || 0.06;
      this.configs['steel_price_per_lb'] = this.configs['steel_price_per_lb'] || 0.75;
      
      // Mounting & Anchor Rates
      this.configs['mounting_embedded_rate'] = this.configs['mounting_embedded_rate'] || 5.00;
      this.configs['mounting_anchored_rate'] = this.configs['mounting_anchored_rate'] || 6.00;
      this.configs['anchor_bolt_rate'] = this.configs['anchor_bolt_rate'] || 0.025;
      this.configs['por_rok_anchor_rate'] = this.configs['por_rok_anchor_rate'] || 0.00;

      // ── New Labor & Pricing Extensions ──
      if (this.configs['scrap_factor_pct'] === undefined) this.configs['scrap_factor_pct'] = 10;
      if (this.configs['galvanize_markup_pct'] === undefined) this.configs['galvanize_markup_pct'] = 10;
      if (this.configs['stair_pan_rate'] === undefined) this.configs['stair_pan_rate'] = 1.00;
      if (this.configs['welded_shop_mh'] === undefined) this.configs['welded_shop_mh'] = 0.5;
      if (this.configs['welded_field_mh'] === undefined) this.configs['welded_field_mh'] = 0.25;
      if (this.configs['bolted_shop_mh'] === undefined) this.configs['bolted_shop_mh'] = 1.0;
      if (this.configs['bolted_field_mh'] === undefined) this.configs['bolted_field_mh'] = 0.5;
      if (this.configs['grating_factor_bar_125_welded'] === undefined) this.configs['grating_factor_bar_125_welded'] = 1.00;
      if (this.configs['grating_factor_bar_125_bolted'] === undefined) this.configs['grating_factor_bar_125_bolted'] = 1.00;
      if (this.configs['grating_factor_bar_100_welded'] === undefined) this.configs['grating_factor_bar_100_welded'] = 1.00;
      if (this.configs['grating_factor_bar_100_bolted'] === undefined) this.configs['grating_factor_bar_100_bolted'] = 1.00;
      if (this.configs['grating_factor_mcnichols'] === undefined) this.configs['grating_factor_mcnichols'] = 1.00;
      if (this.configs['grating_factor_prefab'] === undefined) this.configs['grating_factor_prefab'] = 1.00;

      // ── MIGRATION: Correct stale finish rates from pre-benchmark-parity sessions ──
      // Old `galvanize_rate` used to be a % markup (e.g. 0.10). The benchmark-correct value is $/lb = 0.75.
      // If the stored value is unreasonably low (< 0.50), it is treated as stale and corrected.
      const STD_GALV_MIN  = 0.50;   // Anything below this is considered a legacy % value, not $/lb
      const STD_GALV_DEFAULT  = 0.7500;
      const STD_PC_DEFAULT    = 1.7587;

      if (!this.configs['galvanize_rate'] || this.configs['galvanize_rate'] < STD_GALV_MIN) {
        console.warn(`⚠️  Migrating stale galvanize_rate (${this.configs['galvanize_rate']}) → ${STD_GALV_DEFAULT}`);
        this.configs['galvanize_rate'] = STD_GALV_DEFAULT;
        // Persist correction to DB so it survives restarts
        await db.query(
          'IF EXISTS (SELECT 1 FROM system_config WHERE config_key = ?) UPDATE system_config SET config_value = ? WHERE config_key = ? ELSE INSERT INTO system_config (config_key, config_value) VALUES (?, ?)',
          ['galvanize_rate', STD_GALV_DEFAULT.toString(), 'galvanize_rate', 'galvanize_rate', STD_GALV_DEFAULT.toString()]
        );
      }
      if (!this.configs['powder_coat_rate'] || this.configs['powder_coat_rate'] < 1.00) {
        console.warn(`⚠️  Migrating stale powder_coat_rate (${this.configs['powder_coat_rate']}) → ${STD_PC_DEFAULT}`);
        this.configs['powder_coat_rate'] = STD_PC_DEFAULT;
        await db.query(
          'IF EXISTS (SELECT 1 FROM system_config WHERE config_key = ?) UPDATE system_config SET config_value = ? WHERE config_key = ? ELSE INSERT INTO system_config (config_key, config_value) VALUES (?, ?)',
          ['powder_coat_rate', STD_PC_DEFAULT.toString(), 'powder_coat_rate', 'powder_coat_rate', STD_PC_DEFAULT.toString()]
        );
      }


      this.isLoaded = true;
      console.log('✅ System Configurations Loaded');
    } catch (error) {
      console.error('❌ Failed to load configurations:', error);
      // Ensure defaults are set on failure
      this.configs['material_markup'] = 0.11;
      this.configs['tax_rate'] = 0.06;
      this.configs['steel_price_per_lb'] = 0.75;
      this.configs['mounting_embedded_rate'] = 5.00;
      this.configs['mounting_anchored_rate'] = 6.00;
      this.configs['anchor_bolt_rate'] = 0.025;
      this.configs['por_rok_anchor_rate'] = 0.00;
      this.configs['galvanize_rate'] = 0.7500;
      this.configs['powder_coat_rate'] = 1.7587;
      this.configs['scrap_factor_pct'] = 10;
      this.configs['galvanize_markup_pct'] = 10;
      this.configs['stair_pan_rate'] = 1.00;
      this.configs['welded_shop_mh'] = 0.5;
      this.configs['welded_field_mh'] = 0.25;
      this.configs['bolted_shop_mh'] = 1.0;
      this.configs['bolted_field_mh'] = 0.5;
      this.configs['grating_factor_bar_125_welded'] = 1.00;
      this.configs['grating_factor_bar_125_bolted'] = 1.00;
      this.configs['grating_factor_bar_100_welded'] = 1.00;
      this.configs['grating_factor_bar_100_bolted'] = 1.00;
      this.configs['grating_factor_mcnichols'] = 1.00;
      this.configs['grating_factor_prefab'] = 1.00;
    }
  }

  get(key, fallback = 0) {
    return this.configs[key] !== undefined ? this.configs[key] : fallback;
  }
}

module.exports = new ConfigManager();
