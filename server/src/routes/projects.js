// server/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const tryParseJsonLikeObject = (val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}
  try {
    const normalized = trimmed
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/'/g, '"');
    return JSON.parse(normalized);
  } catch {
    return val;
  }
};

const tryParseJsonLikeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}
  try {
    const normalized = trimmed
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/'/g, '"');
    return JSON.parse(normalized);
  } catch {
    return [];
  }
};

// Function to clean up empty geometries
const removeEmptyGeometries = (geometries) => {
  return geometries.filter(geo => {
    // Keep geometries that have at least one non-empty value
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
    const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create project (placeholder)
router.post('/', (req, res) => {
  const project = req.body;
  res.json({
    success: true,
    message: 'Project created',
    project: {
      id: 'proj_' + Date.now(),
      ...project,
      created: new Date().toISOString()
    }
  });
});

// Create or update a project for the authenticated user
router.post('/upsert', auth, async (req, res) => {
  try {
    const { 
      _id,
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
      flights, 
      stairs, 
      guardRails, 
      customRailValues,
      calculatedValues 
    } = req.body;
    
    if (!projectNumber || !projectName) {
      return res.status(400).json({ 
        success: false, 
        message: 'projectNumber and projectName are required' 
      });
    }

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    let project;
    
    // Only update if _id is provided
    if (_id) {
        project = await Project.findOne({ _id, userId });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
    } else {
        // If creating new, check if projectNumber already exists for this user
        const existing = await Project.findOne({ projectNumber, userId });
        if (existing) {
             return res.status(400).json({
                success: false,
                message: 'Project Number already exists. Please use a different number or edit the existing project.'
             });
        }
    }
    
    if (project) {
      // Update existing project
      project.projectNumber = projectNumber; 
      project.projectName = projectName;
      if (customerName !== undefined) project.customerName = customerName;
      if (projectLocation !== undefined) project.projectLocation = projectLocation;
      if (architect !== undefined) project.architect = architect;
      if (eor !== undefined) project.eor = eor;
      if (gcName !== undefined) project.gcName = gcName;
      if (detailer !== undefined) project.detailer = detailer;
      if (vendorName !== undefined) project.vendorName = vendorName;
      if (aiscCertified !== undefined) project.aiscCertified = aiscCertified;
      if (units !== undefined) project.units = units;
      if (notes !== undefined) project.notes = notes;
      
      // Update rail data if provided
      if (stairs && Array.isArray(stairs)) {
        project.stairs = stairs.map(s => {
          const wallRail = tryParseJsonLikeObject(s.wallRail);
          const grabRail = tryParseJsonLikeObject(s.grabRail);
          return {
            ...s,
            wallRail: typeof wallRail === 'string' ? {} : wallRail || {},
            grabRail: typeof grabRail === 'string' ? {} : grabRail || {}
          };
        });
      } else if (flights && Array.isArray(flights)) {
        // Legacy support or if only flights provided
        if (!project.stairs) project.stairs = [];
        if (!project.stairs[0]) project.stairs[0] = { flights: [], flightGeometries: [] };
        project.stairs[0].flights = flights;
      }
      
      if (guardRails !== undefined) {
        const parsedGuardRails = tryParseJsonLikeArray(guardRails);
        project.guardRails = Array.isArray(parsedGuardRails) ? parsedGuardRails : [];
      }
      if (customRailValues) project.customRailValues = customRailValues;
      
      // Update calculated values if needed (schema might need update if we want to store this)
      
      project.updatedAt = new Date();
    } else {
      // Create new project
      project = new Project({
        projectNumber,
        projectName,
        userId,
        customerName: customerName || '',
        projectLocation: projectLocation || '',
        architect: architect || '',
        eor: eor || '',
        gcName: gcName || '',
        detailer: detailer || '',
        vendorName: vendorName || '',
        aiscCertified: aiscCertified || 'Yes',
        units: units || 'Imperial',
        notes: notes || '',
        stairs: (Array.isArray(stairs) ? stairs.map(s => {
          const wallRail = tryParseJsonLikeObject(s.wallRail);
          const grabRail = tryParseJsonLikeObject(s.grabRail);
          return {
            ...s,
            wallRail: typeof wallRail === 'string' ? {} : wallRail || {},
            grabRail: typeof grabRail === 'string' ? {} : grabRail || {}
          };
        }) : (flights && flights.length > 0 ? [{
          flights: flights,
          flightGeometries: []
        }] : [])),
        guardRails: Array.isArray(guardRails) ? guardRails : tryParseJsonLikeArray(guardRails),
        customRailValues: customRailValues || {},
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await project.save();
    
    res.json({ 
      success: true, 
      projectId: project._id, 
      project: project 
    });
    
  } catch (error) {
    console.error('Error upserting project:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project number already exists. Please use a different project number.',
        error: error.message
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message, 
      error: error.message 
    });
  }
});

// Save flight geometry with flights array
router.post('/:projectId/save-flight-geometry', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { flightData, flightIndex, stairIndex = 0, flights } = req.body;
    
    console.log('Saving flight geometry for project:', projectId);
    console.log('Flight data:', flightData);
    console.log('Flights array:', flights);
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Initialize stairs array if needed
    if (!project.stairs) {
      project.stairs = [];
    }
    
    if (!project.stairs[stairIndex]) {
      project.stairs[stairIndex] = { 
        flights: [], 
        flightGeometries: [] 
      };
    }
    
    // Update flights array if provided
    if (flights && Array.isArray(flights) && flights.length > 0) {
      project.stairs[stairIndex].flights = flights;
      console.log('Updated flights array:', flights);
    }
    
    // Ensure flightGeometries array exists
    if (!project.stairs[stairIndex].flightGeometries) {
      project.stairs[stairIndex].flightGeometries = [];
    }
    
    const flightGeometries = project.stairs[stairIndex].flightGeometries;
    
    // Find existing flight geometry
    const existingIndex = flightGeometries.findIndex(
      geo => geo.flightId === flightData.flightId
    );
    
    if (existingIndex >= 0) {
      // Update existing flight geometry
      flightGeometries[existingIndex] = {
        ...flightGeometries[existingIndex],
        ...flightData,
        lastModified: new Date(),
        savedAt: new Date()
      };
      console.log('Updated existing flight geometry');
    } else {
      // Add new flight geometry
      flightGeometries.push({
        ...flightData,
        lastModified: new Date(),
        savedAt: new Date()
      });
      console.log('Added new flight geometry');
    }
    
    // Clean up empty geometries after update
    project.stairs[stairIndex].flightGeometries = removeEmptyGeometries(flightGeometries);
    
    project.updatedAt = new Date();
    await project.save();
    
    console.log('Project saved successfully');
    console.log('Current flights in project:', project.stairs[stairIndex].flights);
    console.log('Current flight geometries:', project.stairs[stairIndex].flightGeometries);
    
    res.json({
      success: true,
      message: 'Flight geometry saved successfully',
      flightGeometryId: flightData.flightId,
      flights: project.stairs[stairIndex].flights,
      flightGeometries: project.stairs[stairIndex].flightGeometries
    });
    
  } catch (error) {
    console.error('Error saving flight geometry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get project by ID
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Ensure flights array exists
    if (project.stairs && project.stairs[0]) {
      if (!project.stairs[0].flights || project.stairs[0].flights.length === 0) {
        // Create default flights from flight geometries or default 2 flights
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
        
        // Save if we modified flights
        if (defaultFlights.length > 0) {
          await project.save();
        }
      }
    }
    
    res.json({
      success: true,
      project: project
    });
    
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update project
router.put('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Update project fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        project[key] = updates[key];
      }
    });
    
    project.updatedAt = new Date();
    await project.save();
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      project: project
    });
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
