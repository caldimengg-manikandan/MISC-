/**
 * get_project_detail.js
 * Returns full project data including estimationResult JSON.
 * Enforces ownership for estimators. Admins can see all company projects.
 */

const db = require('../../config/mssql');

async function get_project_detail({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { projectId, projectName, projectNumber } = params;

  if (!projectId && !projectName && !projectNumber) {
    throw new Error('MISSING_PARAM: Must provide projectId, projectName, or projectNumber');
  }

  let whereClause = 'WHERE p.company_id = ?';
  let queryParams  = [companyId];

  if (projectId) {
    whereClause += ' AND p.id = ?';
    queryParams.push(projectId);
  } else if (projectNumber) {
    whereClause += ' AND p.projectNumber LIKE ?';
    queryParams.push(`%${projectNumber}%`);
  } else if (projectName) {
    whereClause += ' AND p.projectName LIKE ?';
    queryParams.push(`%${projectName}%`);
  }

  // Estimator can only see own projects
  if (role !== 'admin' && role !== 'owner') {
    whereClause += ' AND (p.userId = ? OR p.engineerId = ? OR p.createdBy = ?)';
    queryParams.push(userId, userId, userId);
  }

  const query = `
    SELECT 
      p.id, p.projectNumber, p.projectName, p.customer_name,
      p.customer_id, p.projectLocation, p.status, p.workflow_status,
      p.submissionDeadline, p.updatedAt, p.createdAt,
      p.totalWeight, p.totalCost, p.estimationResult, p.localConfig,
      p.architect, p.eor, p.gcName, p.detailer, p.vendorName,
      p.aiscCertified, p.units, p.assignedEngineer,
      p.userId, p.engineerId,
      u.full_name as assigned_engineer_name, u.email as assigned_engineer_email,
      c.companyName as customer_company_name
    FROM projects p
    LEFT JOIN users u ON p.engineerId = u.id
    LEFT JOIN customers c ON p.customer_id = c.id
    ${whereClause}
    ORDER BY p.updatedAt DESC
    LIMIT 5
  `;

  const [rows] = await db.query(query, queryParams);

  if (rows.length === 0) return null;

  // Parse estimationResult JSON safely
  return rows.map(row => {
    let er = {};
    try {
      er = row.estimationResult
        ? (typeof row.estimationResult === 'string' ? JSON.parse(row.estimationResult) : row.estimationResult)
        : {};
    } catch (e) { /* noop */ }

    let lc = {};
    try {
      lc = row.localConfig
        ? (typeof row.localConfig === 'string' ? JSON.parse(row.localConfig) : row.localConfig)
        : {};
    } catch (e) { /* noop */ }

    return {
      ...row,
      estimationResult: er,
      localConfig: lc,
      summary: er?.summary || er?.standardSummary || {}
    };
  });
}

module.exports = get_project_detail;
