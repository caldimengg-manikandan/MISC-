/**
 * get_rates.js
 * ADMIN ONLY — Returns all system_config key-value pairs (global pricing rates).
 */

const db = require('../../config/mssql');

async function get_rates({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  // Strict admin-only guard
  if (role !== 'admin' && role !== 'owner') {
    throw new Error('ACCESS_DENIED: Rate configuration is only accessible to admin users. You can view the rates applied to your current estimate in the Rates Bar inside each calculation panel.');
  }

  const [rows] = await db.query(
    `SELECT \`key\`, value, description, updatedAt FROM system_config WHERE company_id = ? ORDER BY \`key\` ASC`,
    [companyId]
  );

  // Group into categories for readability
  const categories = {
    material: [],
    labor: [],
    mounting: [],
    factors: [],
    other: []
  };

  const materialKeys = ['steel_price_per_lb', 'stair_pan_rate', 'galvanize_rate', 'powder_coat_rate', 'grating_rate'];
  const laborKeys    = ['shop_hourly_rate', 'field_hourly_rate'];
  const mountingKeys = ['mounting_embedded_rate', 'mounting_anchored_rate', 'anchor_bolt_rate', 'por_rok_rate'];
  const factorKeys   = ['scrap_factor_pct', 'tax_rate'];

  for (const row of rows) {
    if (materialKeys.includes(row.key)) categories.material.push(row);
    else if (laborKeys.includes(row.key)) categories.labor.push(row);
    else if (mountingKeys.includes(row.key)) categories.mounting.push(row);
    else if (factorKeys.includes(row.key)) categories.factors.push(row);
    else categories.other.push(row);
  }

  return categories;
}

module.exports = get_rates;
