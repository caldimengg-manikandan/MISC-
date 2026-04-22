/**
 * get_activity_log.js
 * Returns recent activity for a project.
 * Estimator: own projects only. Admin: any company project.
 */

const db = require('../../config/mssql');

async function get_activity_log({ userId, companyId, role, params = {} }) {
  if (!companyId) throw new Error('ACCESS_DENIED: No company context');

  const { projectId, projectName, limit = 10 } = params;

  if (!projectId && !projectName) {
    throw new Error('MISSING_PARAM: Provide projectId or projectName');
  }

  // First, resolve the project and check access
  let projWhere = 'WHERE p.company_id = ?';
  let projParams = [companyId];

  if (projectId) {
    projWhere += ' AND p.id = ?';
    projParams.push(projectId);
  } else {
    projWhere += ' AND p.projectName LIKE ?';
    projParams.push(`%${projectName}%`);
  }

  if (role !== 'admin' && role !== 'owner') {
    projWhere += ' AND (p.userId = ? OR p.engineerId = ? OR p.createdBy = ?)';
    projParams.push(userId, userId, userId);
  }

  const [projRows] = await db.query(
    `SELECT TOP 1 id, projectName, projectNumber FROM projects p ${projWhere}`,
    projParams
  );

  if (projRows.length === 0) {
    return { error: 'PROJECT_NOT_FOUND', message: 'Project not found or you do not have access to it.' };
  }

  const resolvedProjectId = projRows[0].id;

  // Try to fetch from workflow_history or project_activity table (uses updated_at as fallback)
  let activityRows = [];
  
  try {
    const [histRows] = await db.query(`
      SELECT 
        wh.id, wh.fromStatus, wh.toStatus, wh.changedAt, wh.comment,
        u.full_name as changedByName, u.email as changedByEmail
      FROM workflow_history wh
      LEFT JOIN users u ON wh.changedBy = u.id
      WHERE wh.projectId = ?
      ORDER BY wh.changedAt DESC
      OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
    `, [resolvedProjectId, limit]);

    activityRows = histRows;
  } catch (e) {
    // Table may not exist; return basic project info instead
    activityRows = [];
  }

  return {
    project: projRows[0],
    activity: activityRows,
    hasActivity: activityRows.length > 0
  };
}

module.exports = get_activity_log;
