/**
 * get_estimate_summary.js
 * Returns the estimation cost/weight breakdown for a project.
 * Parses the stored estimationResult JSON to extract meaningful numbers.
 */

const get_project_detail = require('./get_project_detail');

async function get_estimate_summary({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const projects = await get_project_detail({ userId, companyId, role, params });
  if (!projects || projects.length === 0) return null;

  return projects.map(p => {
    const s = p.summary || {};
    const er = p.estimationResult || {};

    return {
      id: p.id,
      projectName: p.projectName,
      projectNumber: p.projectNumber,
      customer: p.customer_name || p.customer_company_name,
      status: p.workflow_status || p.status,
      deadline: p.submissionDeadline,
      lastUpdated: p.updatedAt,

      // Steel
      totalSteelWeight: s.totalSteelWeight || er.totalWeight || p.totalWeight || 0,
      baseSteelWeight: s.baseSteelWeight || 0,
      scrapWeight: s.scrapWeight || 0,

      // Labor
      totalShopHours: s.totalShopHours || 0,
      totalFieldHours: s.totalFieldHours || 0,

      // Costs
      baseSteelCost: s.baseSteelCost || 0,
      galvanizeCost: s.galvanizeCost || 0,
      shopLaborCost: s.shopLaborCost || 0,
      fieldLaborCost: s.fieldLaborCost || 0,
      pansMaterialPrice: s.pansMaterialPrice || 0,
      mountingCharges: s.mountingCharges || 0,

      // Totals
      subtotalWithoutTax: s.subtotalWithoutTax || 0,
      taxAmount: s.taxAmount || 0,
      grandTotal: s.grandTotal || er.totalCost || p.totalCost || 0,
      pricePerRiser: s.pricePerRiser || 0,
      totalRisers: s.totalRisers || 0,

      // Local pricing overrides active?
      hasLocalPricing: Object.keys(p.localConfig || {}).length > 0,
    };
  });
}

module.exports = get_estimate_summary;
