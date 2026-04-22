/**
 * get_company_metrics.js
 * ADMIN ONLY — Returns company-wide aggregate metrics.
 */

const db = require('../../config/mssql');

async function get_company_metrics({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  // Strict role guard
  if (role !== 'admin' && role !== 'owner') {
    throw new Error('ACCESS_DENIED: Company metrics are only accessible to admin users.');
  }

  const [statusRows] = await db.query(`
    SELECT 
      COALESCE(workflow_status, status, 'NEW') as status,
      COUNT(*) as count
    FROM projects
    WHERE company_id = ?
    GROUP BY COALESCE(workflow_status, status, 'NEW')
  `, [companyId]);

  const [totalsRow] = await db.query(`
    SELECT 
      COUNT(*) as totalProjects,
      COALESCE(SUM(totalWeight), 0) as totalSteelWeight,
      COALESCE(SUM(totalCost), 0) as totalEstimatedCost,
      COUNT(DISTINCT customer_id) as uniqueCustomers,
      COUNT(DISTINCT COALESCE(engineerId, userId)) as activeEngineers
    FROM projects
    WHERE company_id = ?
  `, [companyId]);

  const [recentRows] = await db.query(`
    SELECT 
      id, projectName, projectNumber, customer_name,
      status, workflow_status, totalCost, updatedAt
    FROM projects
    WHERE company_id = ?
    ORDER BY updatedAt DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `, [companyId]);

  const statusMap = {};
  for (const row of statusRows) {
    statusMap[row.status] = row.count;
  }

  return {
    totals: totalsRow[0],
    byStatus: statusMap,
    recentProjects: recentRows
  };
}

module.exports = get_company_metrics;
