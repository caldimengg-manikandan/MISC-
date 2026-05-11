// server/routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');
const dashboardService = require('../services/DashboardService');
const notif = require('../services/NotificationService');
const resolveOwnerAdminId = require('../utils/resolveOwnerAdminId');

const tryParseJson = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'string') return val;
  
  // Recursive parse to handle "Inception JSON" (stringified strings)
  let current = val;
  let depth = 0;
  const MAX_DEPTH = 10;
  
  while (typeof current === 'string' && depth < MAX_DEPTH) {
    try {
      const trimmed = current.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
        break; 
      }
      const next = JSON.parse(current);
      if (next === current) break;
      current = next;
      depth++;
    } catch {
      break;
    }
  }
  return current;
};

// Function to clean up empty geometries
const removeEmptyGeometries = (geometries) => {
  if (!Array.isArray(geometries)) return [];
  return geometries.filter(geo => {
    return geo.nosingToNosingHorizontal || 
           geo.nosingToNosingVertical || 
           geo.numberOfRisers || 
           geo.stairWidth ||
           geo.stairAngle ||
           geo.headroomClearance ||
           geo.treadThickness ||
           geo.riserThickness;
  });
};

// Get all projects for user (admin sees ALL in company, estimator sees own)
router.get('/', auth, async (req, res) => {
  try {
    const ownerAdminId = await resolveOwnerAdminId(req);

    let query, params;
    if (ownerAdminId === null) {
      // superadmin — sees everything
      query = `SELECT p.*, u_creator.name as CreatorName, u_creator.full_name as CreatorFullName,
                      u_engineer.name as EngineerName, u_engineer.full_name as EngineerFullName
               FROM projects p
               LEFT JOIN users u_creator ON p.createdBy = u_creator.id
               LEFT JOIN users u_engineer ON p.assigned_engineer_id = u_engineer.id
               ORDER BY p.updatedAt DESC`;
      params = [];
    } else if (req.userRole === 'admin') {
      // Admin sees all projects they own OR created directly (legacy projects have NULL owner_admin_id)
      query = `SELECT p.*, u_creator.name as CreatorName, u_creator.full_name as CreatorFullName,
                      u_engineer.name as EngineerName, u_engineer.full_name as EngineerFullName
               FROM projects p
               LEFT JOIN users u_creator ON p.createdBy = u_creator.id
               LEFT JOIN users u_engineer ON p.assigned_engineer_id = u_engineer.id
               WHERE (p.owner_admin_id = ? OR p.company_id = ? OR p.userId = ? OR p.createdBy = ?)
               ORDER BY p.updatedAt DESC`;
      params = [ownerAdminId, ownerAdminId, req.userId, req.userId];
    } else {
      // Estimator/Engineer: must be creator, assigned engineer, or assigned reviewer
      query = `SELECT p.*, u_creator.name as CreatorName, u_creator.full_name as CreatorFullName,
                      u_engineer.name as EngineerName, u_engineer.full_name as EngineerFullName
               FROM projects p
               LEFT JOIN users u_creator ON p.createdBy = u_creator.id
               LEFT JOIN users u_engineer ON p.assigned_engineer_id = u_engineer.id
               WHERE (p.owner_admin_id = ? OR p.company_id = ?)
               AND (p.userId = ? OR p.createdBy = ? OR p.engineerId = ? OR p.assigned_engineer_id = ? OR p.reviewer_id = ?)
               ORDER BY p.updatedAt DESC`;
      params = [ownerAdminId, ownerAdminId, req.userId, req.userId, req.userId, req.userId, req.userId];
    }

    const [projects] = await db.query(query, params);
    
    const parsedProjects = projects.map(p => ({
      ...p,
      stairs: tryParseJson(p.stairs),
      guardRails: tryParseJson(p.guardRails),
      customRailValues: tryParseJson(p.customRailValues),
      estimationResult: tryParseJson(p.estimationResult)
    }));

    res.json({ success: true, projects: parsedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Lookup projects by name or number
router.get('/lookup/name', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, projects: [] });
    const ownerAdminId = await resolveOwnerAdminId(req);

    let query, params;
    if (ownerAdminId === null) {
      query = `SELECT id, projectNumber, projectName, customer_name, customer_id,
                      project_location, architect, eor, gc_name, detailer, vendor_name,
                      aisc_certified as aiscCertified, units, status, createdAt
               FROM projects WHERE (projectName = ? OR projectName LIKE ? OR projectNumber = ?)
               ORDER BY createdAt DESC`;
      params = [q, `%${q}%`, q];
    } else if (req.userRole === 'admin') {
      query = `SELECT id, projectNumber, projectName, customer_name, customer_id,
                      project_location, architect, eor, gc_name, detailer, vendor_name,
                      aisc_certified as aiscCertified, units, status, createdAt
               FROM projects
               WHERE owner_admin_id = ? AND (projectName = ? OR projectName LIKE ? OR projectNumber = ?)
               ORDER BY createdAt DESC`;
      query = `SELECT p.id, p.projectNumber, p.projectName, p.customer_name, p.customer_id,
                      p.project_location, p.architect, p.eor, p.gc_name, p.detailer, p.vendor_name,
                      p.aisc_certified as aiscCertified, p.units, p.status, p.createdAt,
                      u_creator.full_name as CreatorFullName
               FROM projects p
               LEFT JOIN users u_creator ON p.createdBy = u_creator.id
               WHERE p.owner_admin_id = ? AND (p.projectName = ? OR p.projectName LIKE ? OR p.projectNumber = ?)
               ORDER BY p.createdAt DESC`;
      params = [ownerAdminId, q, `%${q}%`, q];
    } else {
      query = `SELECT p.id, p.projectNumber, p.projectName, p.customer_name, p.customer_id,
                      p.project_location, p.architect, p.eor, p.gc_name, p.detailer, p.vendor_name,
                      p.aisc_certified as aiscCertified, p.units, p.status, p.createdAt,
                      u_creator.full_name as CreatorFullName
               FROM projects p
               LEFT JOIN users u_creator ON p.createdBy = u_creator.id
               WHERE p.owner_admin_id = ?
               AND (p.userId = ? OR p.createdBy = ? OR p.engineerId = ?)
               AND (p.projectName = ? OR p.projectName LIKE ? OR p.projectNumber = ?)
               ORDER BY p.createdAt DESC`;
      params = [ownerAdminId, req.userId, req.userId, req.userId, q, `%${q}%`, q];
    }

    const [projects] = await db.query(query, params);
    const normalized = projects.map(p => ({
      ...p, projectName: p.projectName, projectNumber: p.projectNumber,
      customerName: p.customer_name, customerId: p.customer_id,
      projectLocation: p.project_location, gcName: p.gc_name, vendorName: p.vendor_name
    }));
    res.json({ success: true, projects: normalized });
  } catch (error) {
    console.error('Error in project lookup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Check for duplicate project name/number
router.get('/check-duplicate', auth, async (req, res) => {
  try {
    const { projectName, projectNumber, excludeId } = req.query;
    if (!projectName && !projectNumber) return res.json({ success: true, exists: false, history: [] });
    const ownerAdminId = await resolveOwnerAdminId(req);

    let query = `SELECT p.*, u.full_name as assigned_engineer_name, u.email as assigned_engineer_email
      FROM projects p LEFT JOIN users u ON p.engineerId = u.id
      WHERE (p.projectName LIKE ? OR p.projectNumber LIKE ?)`;
    let params = [`%${projectName || '___NONE___'}%`, `%${projectNumber || '___NONE___'}%`];
    if (ownerAdminId !== null) { query += ' AND p.owner_admin_id = ?'; params.push(ownerAdminId); }
    if (excludeId && excludeId !== 'null') { query += ' AND p.id != ?'; params.push(excludeId); }
    query += ' ORDER BY p.updatedAt DESC';

    const [history] = await db.query(query, params);
    const results = Array.isArray(history) ? history : [];
    const targetName = (projectName || '').toLowerCase();
    const targetNum  = (projectNumber || '').toLowerCase();
    const nameHistory = results.map(p => ({ ...p, customerName: p.customer_name, customerId: p.customer_id, projectLocation: p.project_location, gcName: p.gc_name, vendorName: p.vendor_name, aiscCertified: p.aisc_certified }));
    res.json({ success: true, exists: results.length > 0, exactMatch: results.some(p => (p.projectName||'').toLowerCase()===targetName&&(p.projectNumber||'').toLowerCase()===targetNum), numberCollision: results.some(p => (p.projectNumber||'').toLowerCase()===targetNum&&(p.projectName||'').toLowerCase()!==targetName), history: nameHistory, latestProject: nameHistory[0]||null });
  } catch (err) {
    console.error('Error in check-duplicate:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Get Dashboard Metrics — scoped by owner_admin_id
router.get('/dashboard-metrics', auth, async (req, res) => {
  try {
    const ownerAdminId = await resolveOwnerAdminId(req);
    const uid = req.userId;

    let query, params;
    if (ownerAdminId === null) {
      query = `SELECT id, projectNumber, projectName, customer_name, assignedEngineer, status, enquiryDate, submissionDeadline, updatedAt, createdAt FROM projects`;
      params = [];
    } else if (req.userRole === 'admin') {
      query = `SELECT id, projectNumber, projectName, customer_name, assignedEngineer, status, enquiryDate, submissionDeadline, updatedAt, createdAt FROM projects WHERE owner_admin_id = ?`;
      params = [ownerAdminId];
    } else {
      query = `SELECT id, projectNumber, projectName, customer_name, assignedEngineer, status, enquiryDate, submissionDeadline, updatedAt, createdAt FROM projects WHERE owner_admin_id = ? AND (userId = ? OR engineerId = ?)`;
      params = [ownerAdminId, uid, uid];
    }

    const [rows] = await db.query(query, params);
    const { metrics, projects } = dashboardService.computeMetrics(rows);
    res.json({ success: true, metrics, projects });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Create or update a project for the authenticated user
router.post('/upsert', auth, async (req, res) => {
  try {
    const { 
      id, // MySQL uses 'id' instead of '_id'
      projectNumber, 
      projectName, 
      customerName,
      customerId,
      projectLocation,
      architect,
      eor,
      gcName,
      detailer,
      vendorName,
      aiscCertified,
      units,
      notes, 
      stairs, 
      guardRails, 
      customRailValues,
      assignedEngineer,
      assigned_engineer_id,
      assigned_engineer_name,
      enquiryDate,
      submissionDeadline,
      status,
      localConfig,
      isPinned,
      isArchived
    } = req.body;
    
    if (!projectNumber || !projectName) {
      return res.status(400).json({ success: false, message: 'projectNumber and projectName are required' });
    }

    const userId = req.userId;

    let existingProject = null;
    if (id) {
      // Check ownership — allow legacy projects (NULL owner_admin_id) via userId
      const [rows] = await db.query(
        'SELECT * FROM projects WHERE id = ? AND (userId = ? OR createdBy = ? OR assigned_engineer_id = ?)',
        [id, userId, userId, userId]
      );
      existingProject = rows[0];
      if (!existingProject) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
    } else {
      const [rows] = await db.query('SELECT * FROM projects WHERE projectNumber = ? AND userId = ?', [projectNumber, userId]);
      if (rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Project Number already exists for this user.'
        });
      }
    }

    const stairsJson = JSON.stringify(Array.isArray(stairs) ? stairs : []);
    const guardRailsJson = JSON.stringify(Array.isArray(guardRails) ? guardRails : []);
    const customRailValuesJson = JSON.stringify(customRailValues || {});
    const localConfigJson = JSON.stringify(localConfig || {});

    // Normalize boolean/numeric inputs for BIT columns
    const pinnedVal = isPinned !== undefined ? (isPinned ? 1 : 0) : (existingProject ? (existingProject.isPinned ? 1 : 0) : 0);
    const archivedVal = isArchived !== undefined ? (isArchived ? 1 : 0) : (existingProject ? (existingProject.isArchived ? 1 : 0) : 0);

    if (existingProject) {
      // Update existing
      await db.query(
        `UPDATE projects SET 
          projectNumber = ?, projectName = ?, customer_name = ?, customer_id = ?, project_location = ?, 
          architect = ?, eor = ?, gc_name = ?, detailer = ?, vendor_name = ?, 
          aisc_certified = ?, units = ?, notes = ?, stairs = ?, guardRails = ?, 
          customRailValues = ?, localConfig = ?, assignedEngineer = ?, assigned_engineer_id = ?, engineerId = ?, 
          enquiryDate = ?, submissionDeadline = ?, status = ?, isPinned = ?, isArchived = ?, updatedAt = GETDATE() 
        WHERE id = ? AND company_id = ? AND (userId = ? OR createdBy = ? OR engineerId = ?)`,
        [
          projectNumber, projectName, customerName || '', customerId || null, projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          stairsJson, guardRailsJson, customRailValuesJson, localConfigJson,
          assignedEngineer || assigned_engineer_name || null, 
          assigned_engineer_id || null, // set assigned_engineer_id
          assigned_engineer_id || null, // set engineerId
          enquiryDate || null, submissionDeadline || null, status || 'Project Created',
          pinnedVal, archivedVal,
          id, req.companyId, userId, userId, userId
        ]
      );
      
      const [updated] = await db.query(`
        SELECT p.*, u.full_name as assigned_engineer_name, u.email as assigned_engineer_email 
        FROM projects p 
        LEFT JOIN users u ON p.engineerId = u.id 
        WHERE p.id = ?`, [id]);
      res.json({ success: true, projectId: id, project: updated[0] });
    } else {
      // Insert new project — stamp owner_admin_id
      const ownerAdminId = await resolveOwnerAdminId(req);
      const defaultStairs = JSON.stringify([{ label: "Stair 1", flights: [], landings: [], rails: [] }]);
      const [rows] = await db.query(
        `INSERT INTO projects
          (projectNumber, projectName, userId, createdBy, owner_admin_id, customer_name, customer_id, project_location,
           architect, eor, gc_name, detailer, vendor_name, aisc_certified, units,
           notes, stairs, guardRails, customRailValues, localConfig, status, workflow_status, revision_number,
           assignedEngineer, assigned_engineer_id, engineerId, enquiryDate, submissionDeadline,
           isPinned, isArchived)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assigned', 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectNumber, projectName, userId, userId, ownerAdminId, customerName || '', customerId || null, projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          defaultStairs, guardRailsJson, customRailValuesJson, localConfigJson, status || 'Project Created',
          assignedEngineer || assigned_engineer_name || null,
          assigned_engineer_id || userId,
          assigned_engineer_id || userId,
          enquiryDate || new Date(), submissionDeadline || null,
          pinnedVal, archivedVal
        ]
      );
      
      const newId = rows[0].id;
      const [inserted] = await db.query(`
        SELECT p.*, u.full_name as assigned_engineer_name, u.email as assigned_engineer_email,
               u_creator.name as CreatorName, u_creator.full_name as CreatorFullName 
        FROM projects p 
        LEFT JOIN users u ON p.engineerId = u.id 
        LEFT JOIN users u_creator ON p.createdBy = u_creator.id
        WHERE p.id = ?`, [newId]);
      
      try { await notif.onProjectCreated(newId, req.user || { email: req.userId }); } catch (e) {}

      res.json({ success: true, projectId: newId, project: inserted[0] });
    }
    
  } catch (error) {
    console.error('Error upserting project:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Save flight geometry
router.post('/:projectId/save-flight-geometry', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { flightData, flightIndex, stairIndex = 0, flights } = req.body;
    
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND (userId = ? OR assigned_engineer_id = ?)', [projectId, req.userId, req.userId]);
    const project = projects[0];
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    let stairs = tryParseJson(project.stairs) || [];
    if (!Array.isArray(stairs)) stairs = [];
    
    if (!stairs[stairIndex]) {
      stairs[stairIndex] = { flights: [], flightGeometries: [] };
    }
    
    if (flights && Array.isArray(flights)) {
      stairs[stairIndex].flights = flights;
    }
    
    if (!stairs[stairIndex].flightGeometries) {
      stairs[stairIndex].flightGeometries = [];
    }
    
    const geometries = stairs[stairIndex].flightGeometries;
    const existingIndex = geometries.findIndex(geo => geo.flightId === flightData.flightId);
    
    if (existingIndex >= 0) {
      geometries[existingIndex] = { ...geometries[existingIndex], ...flightData, lastModified: new Date() };
    } else {
      geometries.push({ ...flightData, lastModified: new Date() });
    }
    
    stairs[stairIndex].flightGeometries = removeEmptyGeometries(geometries);
    
    await db.query('UPDATE projects SET stairs = ?, updatedAt = GETDATE() WHERE id = ?', [JSON.stringify(stairs), projectId]);
    
    res.json({
      success: true,
      message: 'Flight geometry saved',
      flights: stairs[stairIndex].flights,
      flightGeometries: stairs[stairIndex].flightGeometries
    });
    
  } catch (error) {
    console.error('Error saving flight geometry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get project by ID — scoped by owner_admin_id
router.get('/:projectId', auth, async (req, res) => {
  try {
    const ownerAdminId = await resolveOwnerAdminId(req);

    let whereClause = 'p.id = ?';
    let params = [req.params.projectId];
    if (ownerAdminId !== null) {
      // Allow access if: scoped by owner_admin_id/company_id OR the user created it directly (legacy projects)
      whereClause += ' AND (p.owner_admin_id = ? OR p.company_id = ? OR p.userId = ? OR p.createdBy = ?)';
      params.push(ownerAdminId, ownerAdminId, req.userId, req.userId);
      if (req.userRole === 'estimator') {
        whereClause += ' AND (p.userId = ? OR p.createdBy = ? OR p.engineerId = ? OR p.assigned_engineer_id = ? OR p.reviewer_id = ?)';
        params.push(req.userId, req.userId, req.userId, req.userId, req.userId);
      }
    }

    const [rows] = await db.query(`
      SELECT p.*, c.companyName as LinkedCustomerName, c.contactPerson, c.email as CustomerEmail, c.phone as CustomerPhone,
             c.street as CustomerStreet, c.city as CustomerCity, c.state as CustomerState, c.zip as CustomerZip,
             u_creator.name as CreatorName, u_creator.full_name as CreatorFullName,
             u_engineer.name as EngineerName, u_engineer.full_name as EngineerFullName,
             COALESCE(u_engineer.full_name, u_creator.full_name) as assigned_engineer_name,
             COALESCE(u_engineer.email, u_creator.email) as assigned_engineer_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u_creator ON p.createdBy = u_creator.id
      LEFT JOIN users u_engineer ON p.assigned_engineer_id = u_engineer.id
      WHERE ${whereClause}
    `, params);

    const project = rows[0];
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // 🛡️ HYDRATION GUARD: Ensure default estimation data exists
    project.stairs = tryParseJson(project.stairs) || [{ label: "Stair 1", flights: [], landings: [], rails: [] }];
    project.estimationResult = tryParseJson(project.estimationResult) || { totalWeight: 0, totalCost: 0 };
    
    project.guardRails = tryParseJson(project.guardRails);
    project.customRailValues = tryParseJson(project.customRailValues);
    project.localConfig = tryParseJson(project.localConfig);
    project.additionalCosts = tryParseJson(project.additionalCosts);

    res.json({ success: true, project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Update project (re-using upsert logic essentially)
router.put('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    const ownerAdminId = await resolveOwnerAdminId(req);
    let checkQuery = 'SELECT * FROM projects WHERE id = ?';
    let checkParams = [projectId];
    
    if (ownerAdminId !== null) {
      // Allow access if: scoped by owner_admin_id/company_id OR the user created it directly (legacy projects)
      checkQuery += ' AND (owner_admin_id = ? OR company_id = ? OR userId = ? OR createdBy = ?)';
      checkParams.push(ownerAdminId, ownerAdminId, req.userId, req.userId);
      if (req.userRole === 'estimator') {
        checkQuery += ' AND (userId = ? OR createdBy = ? OR engineerId = ? OR assigned_engineer_id = ?)';
        checkParams.push(req.userId, req.userId, req.userId, req.userId);
      }
    }

    const [rows] = await db.query(checkQuery, checkParams);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }
    
    const allowedFields = [
      'projectNumber', 'projectName', 'customerName', 'customerId', 'projectLocation', 
      'architect', 'eor', 'gcName', 'detailer', 'vendorName', 
      'aiscCertified', 'units', 'notes', 'stairs', 'guardRails', 
      'customRailValues', 'status', 'totalWeight', 'totalCost',
      'assignedEngineer', 'enquiryDate', 'submissionDeadline', 'estimationResult',
      'isPinned', 'isArchived', 'additionalCosts', 'localConfig'
    ];
    
    let setClause = [];
    let queryParams = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        if (['stairs', 'guardRails', 'customRailValues', 'estimationResult', 'additionalCosts', 'localConfig'].includes(key)) {
           // 🛡️ Prevent double-stringification if client already sent a string
           queryParams.push(typeof updates[key] === 'string' ? updates[key] : JSON.stringify(updates[key]));
        } else if (key === 'customerId') {
           setClause[setClause.length - 1] = 'customer_id = ?';
           queryParams.push(updates[key]);
        } else if (key === 'customerName') {
           setClause[setClause.length - 1] = 'customer_name = ?';
           queryParams.push(updates[key]);
        } else {
           queryParams.push(updates[key]);
        }
      }
    });
    
    if (setClause.length > 0) {
      setClause.push('updatedAt = GETDATE()');
      const ownerAdminId = await resolveOwnerAdminId(req);
      if (ownerAdminId === null || req.userRole === 'admin') {
        queryParams.push(projectId);
        if (ownerAdminId !== null) queryParams.push(ownerAdminId);
        await db.query(
          `UPDATE projects SET ${setClause.join(', ')} WHERE id = ?${ownerAdminId !== null ? ' AND owner_admin_id = ?' : ''}`,
          queryParams
        );
      } else {
        queryParams.push(projectId, ownerAdminId, req.userId, req.userId, req.userId);
        await db.query(
          `UPDATE projects SET ${setClause.join(', ')} WHERE id = ? AND owner_admin_id = ? AND (userId = ? OR createdBy = ? OR engineerId = ?)`,
          queryParams
        );
      }
    }
    
    const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.json({ success: true, message: 'Project updated', project: updated[0] });
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
