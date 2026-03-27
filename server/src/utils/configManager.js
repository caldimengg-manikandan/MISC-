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
      this.configs['steel_price_per_lb'] = this.configs['steel_price_per_lb'] || 0.85;

      this.isLoaded = true;
      console.log('✅ System Configurations Loaded');
    } catch (error) {
      console.error('❌ Failed to load configurations:', error);
      // Ensure defaults are set on failure
      this.configs['material_markup'] = 0.11;
      this.configs['tax_rate'] = 0.06;
      this.configs['steel_price_per_lb'] = 0.85;
    }
  }

  get(key, fallback = 0) {
    return this.configs[key] !== undefined ? this.configs[key] : fallback;
  }
}

module.exports = new ConfigManager();
