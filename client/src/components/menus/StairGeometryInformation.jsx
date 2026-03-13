// src/components/menus/StairGeometryInformation.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Calculator, Save, Edit } from 'lucide-react';
import StairVisualization2D from '../AISC/StairVisualization2D';
import API_BASE_URL from '../../config/api';

// Helper function to clean and format flight numbers
const cleanFlightNumber = (number, index) => {
  if (!number || number.trim() === '') {
    return `FL-${String(index + 1).padStart(3, '0')}`;
  }
  
  // Remove any double dashes
  let cleaned = number.replace(/FL-+/g, 'FL-');
  
  // Ensure it starts with FL-
  if (!cleaned.startsWith('FL-')) {
    cleaned = `FL-${cleaned}`;
  }
  
  // Ensure proper number formatting (3 digits)
  cleaned = cleaned.replace(/(FL-)(\d+)$/, (match, prefix, num) => {
    return `${prefix}${String(parseInt(num) || index + 1).padStart(3, '0')}`;
  });
  
  return cleaned;
};

const StairGeometryInformation = ({ 
  formData, 
  handleChange, 
  calculatedValues,
  selectedFlightId,
  handleFlightSaveStatus
}) => {
  const geometryFields = [
    'nosingToNosingHorizontal',
    'nosingToNosingVertical',
    'numberOfRisers',
    'stairWidth',
    'stairAngle',
    'headroomClearance',
    'treadThickness',
    'riserThickness'
  ];

  // Derive active flight details from props
  const flights = formData.flights || [];
  const activeFlightIndex = flights.findIndex(f => f.id === selectedFlightId);
  const currentFlight = flights[activeFlightIndex] || flights[0];
  const flightNumber = currentFlight ? cleanFlightNumber(currentFlight.number, activeFlightIndex) : 'FL-001';

  // Use persisted save status from formData
  const isSaved = formData.isSaved || false;

  const handleEdit = () => {
    if (handleFlightSaveStatus) {
      handleFlightSaveStatus(selectedFlightId, false);
    }
  };

  // Get current flight value directly from formData (which is already specific to the selected flight)
  const getCurrentFlightValue = useCallback((fieldName) => {
    return formData[fieldName] || '';
  }, [formData]);

  // Handle visualization changes - update parent state directly
  const handleVisualizationChange = useCallback((newDimensions) => {
    if (!currentFlight) return;

    const updates = {};
    if (newDimensions.horizontal !== undefined) {
      updates.nosingToNosingHorizontal = newDimensions.horizontal.toString();
    }
    if (newDimensions.vertical !== undefined) {
      updates.nosingToNosingVertical = newDimensions.vertical.toString();
    }
    if (newDimensions.risers !== undefined) {
      updates.numberOfRisers = newDimensions.risers.toString();
    }
    if (newDimensions.width !== undefined) {
      updates.stairWidth = newDimensions.width.toString();
    }

    if (handleChange) {
      if (updates.nosingToNosingHorizontal !== undefined) {
        handleChange({
          target: {
            name: 'nosingToNosingHorizontal',
            value: updates.nosingToNosingHorizontal
          },
          flightId: selectedFlightId
        });
      }
      if (updates.nosingToNosingVertical !== undefined) {
        handleChange({
          target: {
            name: 'nosingToNosingVertical',
            value: updates.nosingToNosingVertical
          },
          flightId: selectedFlightId
        });
      }
      if (updates.numberOfRisers !== undefined) {
        handleChange({
          target: {
            name: 'numberOfRisers',
            value: updates.numberOfRisers
          },
          flightId: selectedFlightId
        });
      }
      if (updates.stairWidth !== undefined) {
        handleChange({
          target: {
            name: 'stairWidth',
            value: updates.stairWidth
          },
          flightId: selectedFlightId
        });
      }
    }
  }, [currentFlight, handleChange, selectedFlightId]);

  // Save flight geometry to MongoDB
  const saveFlightGeometry = async () => {
    try {
      console.log('=== SAVING FLIGHT GEOMETRY ===');
      
      if (!currentFlight) {
        alert('No flight selected.');
        return;
      }
      
      const flightId = currentFlight.id; // Should match selectedFlightId
      
      // Collect values from formData
      const valuesToSave = {};
      geometryFields.forEach(field => {
        valuesToSave[field] = formData[field] || '';
      });
      
      console.log('Values to save:', valuesToSave);
      
      // Check if we have any actual values
      const hasValues = geometryFields.some(field => {
        const value = valuesToSave[field];
        return value && value !== '' && value !== '0';
      });
      
      if (!hasValues) {
        alert('Please enter some geometry values before saving.');
        return;
      }
      
      // Prepare data for MongoDB
      const flightToSave = {
        flightId: flightId,
        flightNumber: flightNumber,
        ...valuesToSave,
        hasCustomValues: true,
        lastModified: new Date().toISOString()
      };
      
      console.log('Flight to save:', flightToSave);
      
      let projectId = formData.projectId || formData._id;
      const token = localStorage.getItem('steel_token');
      
      if (!projectId) {
        const upsertRes = await fetch(`${API_BASE_URL}/api/projects/upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            projectNumber: formData.projectNumber || `PRJ-${new Date().getTime()}`,
            projectName: formData.projectName || 'Untitled Project',
            notes: formData.notes || '',
            flights: flights
          })
        });
        
        if (upsertRes.ok) {
          const upsertData = await upsertRes.json();
          projectId = upsertData.projectId;
          if (projectId) {
            handleChange({ target: { name: 'projectId', value: projectId } });
          }
        } else {
          throw new Error('Unable to create project');
        }
      }
      
      console.log('Saving to project:', projectId);
      
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/save-flight-geometry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flightData: flightToSave,
          flightIndex: activeFlightIndex,
          stairIndex: formData.stairIndex || 0,
          flights: flights
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save successful:', result);
        
        alert(`Flight ${flightNumber} saved successfully!\n\nValues saved:\n- Horizontal: ${flightToSave.nosingToNosingHorizontal}\n- Vertical: ${flightToSave.nosingToNosingVertical}\n- Risers: ${flightToSave.numberOfRisers}\n- Width: ${flightToSave.stairWidth}`);
        
        if (handleFlightSaveStatus) {
          handleFlightSaveStatus(selectedFlightId, true);
        }
        
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        throw new Error(errorData.message || 'Failed to save to database');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      alert(`Save failed: ${error.message}`);
    }
  };

  if (!currentFlight) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No flight selected.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Flight Geometry: {flightNumber}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure geometry for {flightNumber} using the calculator below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSaved ? (
              <>
                <span className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg border border-green-200">
                  Saved
                </span>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg 
                             bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  title="Edit Flight Geometry"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={saveFlightGeometry}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg 
                           bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save {flightNumber}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geometry Editor */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Interactive Stair Geometry Calculator
          </h4>
        </div>
        
        <StairVisualization2D 
          horizontalDistance={getCurrentFlightValue('nosingToNosingHorizontal')}
          verticalDistance={getCurrentFlightValue('nosingToNosingVertical')}
          numberOfRisers={getCurrentFlightValue('numberOfRisers')}
          stairWidth={getCurrentFlightValue('stairWidth')}
          onDimensionChange={handleVisualizationChange}
          readOnly={isSaved}
        />
      </div>

      {/* Current Values Summary */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Values Summary ({flightNumber})</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border border-gray-200">
            <span className="block text-xs text-gray-500">Horizontal</span>
            <span className="font-mono text-sm font-semibold">{getCurrentFlightValue('nosingToNosingHorizontal') || '-'}</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <span className="block text-xs text-gray-500">Vertical</span>
            <span className="font-mono text-sm font-semibold">{getCurrentFlightValue('nosingToNosingVertical') || '-'}</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <span className="block text-xs text-gray-500">Risers</span>
            <span className="font-mono text-sm font-semibold">{getCurrentFlightValue('numberOfRisers') || '-'}</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <span className="block text-xs text-gray-500">Width</span>
            <span className="font-mono text-sm font-semibold">{getCurrentFlightValue('stairWidth') || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StairGeometryInformation;