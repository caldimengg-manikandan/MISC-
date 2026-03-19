// server/routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');

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

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projects WHERE userId = ? ORDER BY updatedAt DESC', [req.userId]);
    
    // Parse JSON fields
    const parsedProjects = projects.map(p => ({
      ...p,
      stairs: tryParseJson(p.stairs),
      guardRails: tryParseJson(p.guardRails),
      customRailValues: tryParseJson(p.customRailValues)
    }));

    res.json({
      success: true,
      projects: parsedProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
      customRailValues 
    } = req.body;
    
    if (!projectNumber || !projectName) {
      return res.status(400).json({ success: false, message: 'projectNumber and projectName are required' });
    }

    const userId = req.userId;

    let existingProject = null;
    if (id) {
      const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND userId = ?', [id, userId]);
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
      // Update
      await db.query(
        `UPDATE projects SET 
          projectNumber = ?, projectName = ?, customer_name = ?, project_location = ?, 
          architect = ?, eor = ?, gc_name = ?, detailer = ?, vendor_name = ?, 
          aisc_certified = ?, units = ?, notes = ?, stairs = ?, guardRails = ?, 
          customRailValues = ?, updatedAt = GETDATE() 
        WHERE id = ? AND userId = ?`,
        [
          projectNumber, projectName, customerName || '', projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          stairsJson, guardRailsJson, customRailValuesJson, id, userId
        ]
      );
      
      const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
      res.json({ success: true, projectId: id, project: updated[0] });
    } else {
      // Insert
      const [rows] = await db.query(
        `INSERT INTO projects 
          (projectNumber, projectName, userId, customer_name, project_location, 
           architect, eor, gc_name, detailer, vendor_name, aisc_certified, units, 
           notes, stairs, guardRails, customRailValues, status) 
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectNumber, projectName, userId, customerName || '', projectLocation || '',
          architect || '', eor || '', gcName || '', detailer || '', vendorName || '',
          aiscCertified || 'Yes', units || 'Imperial', notes || '',
          stairsJson, guardRailsJson, customRailValuesJson, 'draft'
        ]
      );
      
      const newId = rows[0].id;
      const [inserted] = await db.query('SELECT * FROM projects WHERE id = ?', [newId]);
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
    
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND userId = ?', [projectId, req.userId]);
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

// Get project by ID
router.get('/:projectId', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND userId = ?', [req.params.projectId, req.userId]);
    const project = rows[0];
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Parse JSON
    project.stairs = tryParseJson(project.stairs);
    project.guardRails = tryParseJson(project.guardRails);
    project.customRailValues = tryParseJson(project.customRailValues);
    
    // Ensure flights array exists (matching existing logic)
    if (project.stairs && project.stairs[0]) {
      if (!project.stairs[0].flights || project.stairs[0].flights.length === 0) {
        const defaultFlights = project.stairs[0].flightGeometries && project.stairs[0].flightGeometries.length > 0
          ? project.stairs[0].flightGeometries.map((geo, index) => ({
              id: geo.flightId || `flight-${index + 1}`,
              number: geo.flightNumber || `FL-${String(index + 1).padStart(3, '0')}`
            }))
          : [
              { id: '1', number: 'FL-001' },
              { id: '2', number: 'FL-002' }
            ];
        
        project.stairs[0].flights = defaultFlights;
        await db.query('UPDATE projects SET stairs = ? WHERE id = ?', [JSON.stringify(project.stairs), project.id]);
      }
    }
    
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
    
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND userId = ?', [projectId, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const allowedFields = [
      'projectNumber', 'projectName', 'customerName', 'projectLocation', 
      'architect', 'eor', 'gcName', 'detailer', 'vendorName', 
      'aiscCertified', 'units', 'notes', 'stairs', 'guardRails', 
      'customRailValues', 'status', 'totalWeight', 'totalCost'
    ];
    
    let setClause = [];
    let queryParams = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        if (['stairs', 'guardRails', 'customRailValues'].includes(key)) {
           queryParams.push(JSON.stringify(updates[key]));
        } else {
           queryParams.push(updates[key]);
        }
      }
    });
    
    if (setClause.length > 0) {
      setClause.push('updatedAt = GETDATE()');
      const query = `UPDATE projects SET ${setClause.join(', ')} WHERE id = ? AND userId = ?`;
      queryParams.push(projectId, req.userId);
      await db.query(query, queryParams);
    }
    
    const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.json({ success: true, message: 'Project updated', project: updated[0] });
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
