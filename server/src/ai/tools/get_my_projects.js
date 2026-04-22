/**
 * get_my_projects.js
 * Returns a role-scoped list of projects.
 * - Estimator: own projects only (userId = ? OR engineerId = ?)
 * - Admin: all company projects
 */

const db = require('../../config/mssql');

async function get_my_projects({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { status, limit = 20, offset = 0 } = params;

  let query;
  let queryParams;

  const baseSelect = `
    SELECT 
      id, projectNumber, projectName, customer_name,
      assignedEngineer, status, workflow_status,
      submissionDeadline, updatedAt, created_at,
      totalWeight, totalCost, company_id,
      userId, engineerId
    FROM projects
    WHERE company_id = ?
  `;

  const statusFilter = status ? ` AND (status = ? OR workflow_status = ?)` : '';
  const estimatorFilter = ` AND (userId = ? OR engineerId = ? OR createdBy = ?)`;
  const orderLimit = ` ORDER BY updatedAt DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;

  if (role === 'admin' || role === 'owner') {
    query = baseSelect + statusFilter + orderLimit;
    queryParams = status
      ? [companyId, status, status, offset, limit]
      : [companyId, offset, limit];
  } else {
    // Estimator — own projects only
    query = baseSelect + estimatorFilter + statusFilter + orderLimit;
    queryParams = status
      ? [companyId, userId, userId, userId, status, status, offset, limit]
      : [companyId, userId, userId, userId, offset, limit];
  }

  const [rows] = await db.query(query, queryParams);
  return rows;
}

module.exports = get_my_projects;
