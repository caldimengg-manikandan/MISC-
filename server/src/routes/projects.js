// server/routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');
const dashboardService = require('../services/DashboardService');
const notif = require('../services/NotificationService');

const tryParseJson = (val) => {
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
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
    const isAdmin = req.userRole === 'admin';
    const cid = req.companyId;

    // Users with no company affiliation see nothing
    if (!cid) return res.json({ success: true, projects: [] });

    let query, params;
    if (isAdmin) {
      query = 'SELECT * FROM projects WHERE company_id = ? ORDER BY updatedAt DESC';
      params = [cid];
    } else {
      query = `SELECT * FROM projects
               WHERE company_id = ?
               AND (userId = ? OR createdBy = ? OR engineerId = ?)
               ORDER BY updatedAt DESC`;
      params = [cid, req.userId, req.userId, req.userId];
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

// Get Dashboard Metrics — scoped by company_id and role (W3)
router.get('/dashboard-metrics', auth, async (req, res) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const cid = req.companyId;
    const uid = req.userId;

    // Users with no company affiliation see empty metrics
    if (!cid) {
      const { metrics, projects } = dashboardService.computeMetrics([]);
      return res.json({ success: true, metrics, projects });
    }

    let query, params;
    if (isAdmin) {
      query = `SELECT id, projectNumber, projectName, customer_name, assignedEngineer, status,
               enquiryDate, submissionDeadline, updatedAt, createdAt
               FROM projects WHERE company_id = ?`;
      params = [cid];
    } else {
      query = `SELECT id, projectNumber, projectName, customer_name, assignedEngineer, status,
               enquiryDate, submissionDeadline, updatedAt, createdAt
               FROM projects
               WHERE company_id = ? AND (userId = ? OR engineerId = ?)`;
      params = [cid, uid, uid];
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
      enquiryDate,
      submissionDeadline,
      status
    } = req.body;
    
    if (!projectNumber || !projectName) {
      return res.status(400).json({ success: false, message: 'projectNumber and projectName are required' });
    }

    const userId = req.userId;

    let existingProject = null;
    if (id) {
      const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND (userId = ? OR assigned_engineer_id = ?)', [id, userId, userId]);
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

    if (existingProject) {
      // Update existing
      await db.query(
        `UPDATE projects SET 
          projectNumber = ?, projectName = ?, customer_name = ?, customer_id = ?, project_location = ?, 
          architect = ?, eor = ?, gc_name = ?, detailer = ?, vendor_name = ?, 
          aisc_certified = ?, units = ?, notes = ?, stairs = ?, guardRails = ?, 
          customRailValues = ?, assignedEngineer = ?, enquiryDate = ?, submissionDeadline = ?, status = ?, updatedAt = GETDATE() 
        WHERE id = ? AND company_id = ? AND (userId = ? OR createdBy = ? OR engineerId = ?)`,
        [
          projectNumber, projectName, customerName || '', customerId || null, projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          stairsJson, guardRailsJson, customRailValuesJson, 
          assignedEngineer || null, enquiryDate || null, submissionDeadline || null, status || 'Project Created',
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
      // Insert new project — stamp company_id
      const [rows] = await db.query(
        `INSERT INTO projects 
          (projectNumber, projectName, userId, createdBy, company_id, customer_name, customer_id, project_location, 
           architect, eor, gc_name, detailer, vendor_name, aisc_certified, units, 
           notes, stairs, guardRails, customRailValues, status, workflow_status, engineerId, enquiryDate, submissionDeadline) 
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assigned', ?, ?, ?)`,
        [
          projectNumber, projectName, userId, userId, req.companyId, customerName || '', customerId || null, projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          stairsJson, guardRailsJson, customRailValuesJson, status || 'Project Created',
          req.body.assigned_engineer_id || userId, enquiryDate || new Date(), submissionDeadline || null
        ]
      );
      
      const newId = rows[0].id;
      const [inserted] = await db.query(`
        SELECT p.*, u.full_name as assigned_engineer_name, u.email as assigned_engineer_email 
        FROM projects p 
        LEFT JOIN users u ON p.engineerId = u.id 
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

// Get project by ID — must belong to user's company
router.get('/:projectId', auth, async (req, res) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const cid = req.companyId;

    let whereClause = 'p.id = ? AND p.company_id = ?';
    let params = [req.params.projectId, cid];
    if (!isAdmin) {
      whereClause += ' AND (p.userId = ? OR p.createdBy = ? OR p.engineerId = ?)';
      params.push(req.userId, req.userId, req.userId);
    }

    const [rows] = await db.query(`
      SELECT p.*, c.companyName as LinkedCustomerName, c.contactPerson, c.email as CustomerEmail, c.phone as CustomerPhone,
             c.street as CustomerStreet, c.city as CustomerCity, c.state as CustomerState, c.zip as CustomerZip,
             COALESCE(u.full_name, creator.full_name) as assigned_engineer_name, 
             COALESCE(u.email, creator.email) as assigned_engineer_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.engineerId = u.id
      LEFT JOIN users creator ON p.userId = creator.id
      WHERE ${whereClause}
    `, params);
    
    const project = rows[0];
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    project.stairs = tryParseJson(project.stairs);
    project.guardRails = tryParseJson(project.guardRails);
    project.customRailValues = tryParseJson(project.customRailValues);
    project.estimationResult = tryParseJson(project.estimationResult);
    
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
    
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND (userId = ? OR assigned_engineer_id = ?)', [projectId, req.userId, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const allowedFields = [
      'projectNumber', 'projectName', 'customerName', 'customerId', 'projectLocation', 
      'architect', 'eor', 'gcName', 'detailer', 'vendorName', 
      'aiscCertified', 'units', 'notes', 'stairs', 'guardRails', 
      'customRailValues', 'status', 'totalWeight', 'totalCost',
      'assignedEngineer', 'enquiryDate', 'submissionDeadline', 'estimationResult'
    ];
    
    let setClause = [];
    let queryParams = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        if (['stairs', 'guardRails', 'customRailValues', 'estimationResult'].includes(key)) {
           queryParams.push(JSON.stringify(updates[key]));
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
      // Scope update to company + ownership (I3: only real columns)
      const isAdmin = req.userRole === 'admin';
      if (isAdmin) {
        queryParams.push(projectId, req.companyId);
        await db.query(`UPDATE projects SET ${setClause.join(', ')} WHERE id = ? AND company_id = ?`, queryParams);
      } else {
        queryParams.push(projectId, req.companyId, req.userId, req.userId, req.userId);
        await db.query(
          `UPDATE projects SET ${setClause.join(', ')} WHERE id = ? AND company_id = ? AND (userId = ? OR createdBy = ? OR engineerId = ?)`,
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
