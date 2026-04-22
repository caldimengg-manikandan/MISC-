/**
 * get_upcoming_deadlines.js
 * Returns projects with submission deadlines within the next N days.
 * Admin: all company. Estimator: own only.
 */

const db = require('../../config/mssql');

async function get_upcoming_deadlines({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { days = 7 } = params;

  let sql = `
    SELECT 
      id, projectNumber, projectName, customer_name,
      status, workflow_status, submissionDeadline,
      assignedEngineer, updatedAt
    FROM projects
    WHERE company_id = ?
      AND submissionDeadline IS NOT NULL
      AND submissionDeadline BETWEEN GETDATE() AND DATEADD(day, ?, GETDATE())
      AND status != 'SUBMITTED'
  `;

  let sqlParams = [companyId, days];

  // Estimator: own projects only
  if (role !== 'admin' && role !== 'owner') {
    sql += ' AND (userId = ? OR engineerId = ? OR createdBy = ?)';
    sqlParams.push(userId, userId, userId);
  }

  sql += ' ORDER BY submissionDeadline ASC OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY';

  const [rows] = await db.query(sql, sqlParams);
  return rows;
}

module.exports = get_upcoming_deadlines;
