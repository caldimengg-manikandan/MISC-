/**
 * search_projects.js
 * Fuzzy search across projectName, projectNumber, customer_name.
 * Scoped by company + role.
 */

const db = require('../../config/mssql');

async function search_projects({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { query: searchQuery, limit = 10 } = params;
  if (!searchQuery || searchQuery.trim().length < 2) {
    throw new Error('MISSING_PARAM: Search query must be at least 2 characters');
  }

  const term = `%${searchQuery.trim()}%`;

  let sql = `
    SELECT 
      id, projectNumber, projectName, customer_name,
      status, workflow_status, submissionDeadline,
      totalWeight, totalCost, updatedAt, assignedEngineer,
      userId, engineerId
    FROM projects
    WHERE company_id = ?
      AND (
        projectName LIKE ?
        OR projectNumber LIKE ?
        OR customer_name LIKE ?
      )
  `;

  let sqlParams = [companyId, term, term, term];

  // Estimator: own projects only
  if (role !== 'admin' && role !== 'owner') {
    sql += ' AND (userId = ? OR engineerId = ? OR createdBy = ?)';
    sqlParams.push(userId, userId, userId);
  }

  sql += ' ORDER BY updatedAt DESC OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY';
  sqlParams.push(limit);

  const [rows] = await db.query(sql, sqlParams);
  return rows;
}

module.exports = search_projects;
