/**
 * get_customers.js
 * Returns the company customer list.
 * Both roles can read (for linking to projects), admin gets full details.
 */

const db = require('../../config/mssql');

async function get_customers({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { search, status = 'active', limit = 20 } = params;

  let sql = `
    SELECT 
      id, companyName, contactName, email, phone,
      city, state, status, createdAt
    FROM customers
    WHERE company_id = ?
      AND status = ?
  `;

  let sqlParams = [companyId, status];

  if (search) {
    sql += ' AND (companyName LIKE ? OR contactName LIKE ? OR email LIKE ?)';
    const term = `%${search}%`;
    sqlParams.push(term, term, term);
  }

  sql += ' ORDER BY companyName ASC LIMIT ?';
  sqlParams.push(limit);

  const [rows] = await db.query(sql, sqlParams);
  return rows;
}

module.exports = get_customers;
