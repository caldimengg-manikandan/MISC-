// src/components/estimation/EstimationForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import {
  Download,
  Printer,
  Shield,
  Building,
  DollarSign,
  Package,
  Clock,
  Scale,
  CheckCircle,
  Edit2,
  X,
  Check
} from 'lucide-react';


import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import NavigationBar from './components/NavigationBar';
import Sidebar from '../dashboard/Sidebar';
import WallGrabRailTable from './tabs/WallGrabRailTable';
import GuardRailTable from './tabs/GuardRailTable';

// Project Information Step removed

// Editable Rail Dropdown Component
const EditableRailDropdown = ({ 
  railType, 
  value, 
  onChange, 
  categorizedRails, 
  customRailValues,
  setCustomRailValues,
  onEditRail
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    steelLbsPerLF: '',
    shopMHPerLF: '',
    fieldMHPerLF: ''
  });

  const handleEditClick = (e, railId) => {
    e.stopPropagation();
    e.preventDefault();
    const rail = categorizedRails[railType]?.find(r => r.id === railId);
    if (rail) {
      const customValues = customRailValues[railId];
      setEditingId(railId);
      setEditForm({
        steelLbsPerLF: customValues?.steelLbsPerLF || rail.steelLbsPerLF || '',
        shopMHPerLF: customValues?.shopMHPerLF || rail.shopMHPerLF || '',
        fieldMHPerLF: customValues?.fieldMHPerLF || rail.fieldMHPerLF || ''
      });
    }
  };

  const handleSaveEdit = (e, railId) => {
    e.stopPropagation();
    e.preventDefault();
    setCustomRailValues(prev => ({
      ...prev,
      [railId]: {
        steelLbsPerLF: parseFloat(editForm.steelLbsPerLF) || 0,
        shopMHPerLF: parseFloat(editForm.shopMHPerLF) || 0,
        fieldMHPerLF: parseFloat(editForm.fieldMHPerLF) || 0
      }
    }));
    setEditingId(null);
    toast.success('Rail values updated');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(null);
  };

  const getRailValue = (railId, field) => {
    const rail = categorizedRails[railType]?.find(r => r.id === railId);
    if (!rail) return 0;
    
    const custom = customRailValues[railId];
    if (custom && custom[field] !== undefined) {
      return custom[field];
    }
    return rail[field] || 0;
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a rail type</option>
        {categorizedRails[railType]?.map((rail) => (
          <option key={rail.id} value={rail.id}>
            {rail.description}
          </option>
        ))}
      </select>
      
      {value && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Current Values:</span>
            <button
              onClick={(e) => handleEditClick(e, value)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </button>
          </div>
          
          {editingId === value && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Steel (lbs/LF)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.steelLbsPerLF}
                    onChange={(e) => setEditForm(prev => ({ ...prev, steelLbsPerLF: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Shop Hours/LF</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.shopMHPerLF}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shopMHPerLF: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Field Hours/LF</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.fieldMHPerLF}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fieldMHPerLF: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Cancel
                </button>
                <button
                  onClick={(e) => handleSaveEdit(e, value)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SummaryView = ({ formData, guardRailData, categorizedRails }) => {
  return (
    <div className="space-y-6">
      {/* Project Info Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2 text-blue-500" />
          Project Information
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Project Number</p>
            <p className="font-medium">{formData.projectNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Project Name</p>
            <p className="font-medium">{formData.projectName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{formData.customerName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created Date</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stairs Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Stair Configuration
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wall Rail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grab Rail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.stairs.map((stair) => {
                const wallRailType = categorizedRails?.wallRail?.find(r => r.id === stair.wallRail?.type)?.description || '-';
                const grabRailType = categorizedRails?.grabRail?.find(r => r.id === stair.grabRail?.type)?.description || '-';
                return (
                  <tr key={stair.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stair.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wallRailType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grabRailType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      W: {stair.wallRail?.length || 0} / G: {stair.grabRail?.length || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
       {/* Guard Rails Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-purple-500" />
          Guard Rails
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rail Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guardRailData.guardRails.map((rail, index) => {
                 const railTypeObj = categorizedRails?.guardRail?.find(r => r.id === rail.type);
                 const railName = railTypeObj ? railTypeObj.description : 'Unknown Type';
                 return (
                <tr key={rail.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{railName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rail.length} LF</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rail.details?.postType || '-'}</td>
                </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Rail Estimation Step with Tabs
const RailEstimationStep = ({ 
  activeTab, 
  setActiveTab, 
  calculations, 
  formData,
  setFormData,
  categorizedRails,
  loadingPrices,
  handleStairRailChange,
  addNewStair,
  removeStair,
  guardRailData,
  setGuardRailData,
  handleGuardRailChange,
  handleGuardRailDetailChange,
  addNewGuardRail,
  removeGuardRail,
  onComplete,
  customRailValues,
  setCustomRailValues
}) => {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: <CheckCircle className="w-4 h-4 mr-2" /> },
    { id: 'wallRail', label: 'Wall & Grab Rails', icon: <Building className="w-4 h-4 mr-2" /> },
    { id: 'guardRail', label: 'Guard Rails', icon: <Shield className="w-4 h-4 mr-2" /> }
  ];

  return (
    <div>
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Rail Estimation
          </h3>
        </div>
        <p className="text-gray-600 text-sm mb-6">Configure your rail components and estimate costs</p>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Steel</p>
              <p className="text-lg font-bold text-gray-900">
                {calculations.totalSteelWithScrap.toFixed(1)} lbs
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-lg font-bold text-gray-900">
                {(calculations.totalShopHours + calculations.totalFieldHours).toFixed(1)} hrs
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Shop: {calculations.totalShopHours.toFixed(1)}h • Field: {calculations.totalFieldHours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rail Length</p>
              <p className="text-lg font-bold text-gray-900">
                {(
                  calculations.wallRailLF +
                  calculations.grabRailLF +
                  calculations.guardRailLF
                ).toFixed(1)} LF
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Wall: {calculations.wallRailLF.toFixed(1)} • Grab: {calculations.grabRailLF.toFixed(1)} • Guard: {calculations.guardRailLF.toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-lg font-bold text-gray-900">
                ${calculations.totalCost.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            @ $2.00/lb steel cost
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        {activeTab === 'wallRail' ? (
          <WallGrabRailTable
            formData={formData}
            setFormData={setFormData}
            categorizedRails={categorizedRails}
            loadingPrices={loadingPrices}
            handleStairRailChange={handleStairRailChange}
            addNewStair={addNewStair}
            removeStair={removeStair}
            calculations={calculations}
            customRailValues={customRailValues}
            setCustomRailValues={setCustomRailValues}
            EditableRailDropdown={EditableRailDropdown}
          />
        ) : activeTab === 'guardRail' ? (
          <GuardRailTable
            guardRailData={guardRailData}
            setGuardRailData={setGuardRailData}
            categorizedRails={categorizedRails}
            loadingPrices={loadingPrices}
            calculations={calculations}
            handleGuardRailChange={handleGuardRailChange}
            handleGuardRailDetailChange={handleGuardRailDetailChange}
            addNewGuardRail={addNewGuardRail}
            removeGuardRail={removeGuardRail}
            customRailValues={customRailValues}
            setCustomRailValues={setCustomRailValues}
            EditableRailDropdown={EditableRailDropdown}
          />
        ) : (
          <SummaryView formData={formData} guardRailData={guardRailData} categorizedRails={categorizedRails} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          Complete Estimation
          <CheckCircle className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

const EstimationForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Load project data if ID is present in location state
  useEffect(() => {
    const loadProjectData = async (projectId) => {
      try {
        const token = localStorage.getItem('steel_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch project');
        
        const data = await response.json();
        if (data.success && data.project) {
          const p = data.project;
          
          setFormData(prev => ({
            ...prev,
            projectNumber: p.projectNumber,
            projectName: p.projectName,
            notes: p.notes || '',
            stairs: p.stairs && p.stairs.length > 0 ? p.stairs : prev.stairs,
            metalPlatform: p.metalPlatform || prev.metalPlatform,
            starMetalPans: p.starMetalPans || prev.starMetalPans
          }));

          if (p.guardRails && p.guardRails.length > 0) {
            setGuardRailData({ guardRails: p.guardRails });
          }

          if (p.customRailValues) {
            setCustomRailValues(p.customRailValues);
          }
          
          toast.success('Project data loaded successfully');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
      }
    };

    if (location.state?.projectId) {
      loadProjectData(location.state.projectId);
    }
  }, [location.state]);

  // Excel upload states
  const [categorizedRails, setCategorizedRails] = useState({
    wallRail: [],
    grabRail: [],
    guardRail: []
  });
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Add state for custom rail values
  const [customRailValues, setCustomRailValues] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    projectNumber: '',
    projectName: '',
    notes: '',
    stairs: [
      {
        id: 0,
        name: 'WALL RAIL',
        wallRail: {
          length: 0,
          type: '',
          steelPerLF: 0,
          shopMHPerLF: 0,
          fieldMHPerLF: 0,
          steelWithScrap: 0,
          shopHours: 0,
          fieldHours: 0
        },
        grabRail: {
          length: 0,
          type: '',
          steelPerLF: 0,
          shopMHPerLF: 0,
          fieldMHPerLF: 0,
          steelWithScrap: 0,
          shopHours: 0,
          fieldHours: 0
        }
      }
    ],
    metalPlatform: {
      quantity: 0,
      length: 0,
      width: 0,
      type: 'metal_pan_platform'
    },
    starMetalPans: {
      quantity: 0,
      tread: 11,
      riser: 7,
      width: 4.33,
      stringerType: 'MC 12 X 14.3'
    }
  });

  // Guard Rail form data
  const [guardRailData, setGuardRailData] = useState({
    guardRails: [
      {
        id: 0,
        name: 'Guard Rail 1',
        type: '',
        length: 0.000,
        steelPerLF: 0,
        shopMHPerLF: 0,
        fieldMHPerLF: 0,
        steelWithScrap: 0,
        shopHours: 0,
        fieldHours: 0,
        details: {
          intermediateRails: 0,
          maxPostSpacing: 4.000,
          postQuantity: 0.00,
          postType: 'anchored',
          optionalFeature: 'none',
          optionalQuantity: 0,
          kickPlate: 0.000,
          pipeReturns: 0,
          ballType: '2-Line Steel Pipe Guardrail 1\'K" Sch 40 Pipe Rails and Fast'
        }
      }
    ]
  });

  const [calculations, setCalculations] = useState({
    wallRailLF: 0,
    grabRailLF: 0,
    guardRailLF: 0,
    totalSteelWithScrap: 0,
    totalShopHours: 0,
    totalFieldHours: 0,
    totalCost: 0
  });

  const categorizedRailsRef = useRef(categorizedRails);

  useEffect(() => {
    categorizedRailsRef.current = categorizedRails;
  }, [categorizedRails]);

  useEffect(() => {
    fetchCategorizedRails();
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modify the fetch function to preserve custom values
  const fetchCategorizedRails = async () => {
    try {
      setLoadingPrices(true);
      const token = localStorage.getItem('steel_token');
      
      if (!token) {
        toast.error('Please login first');
        setLoadingPrices(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/debug/categorized-rails`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      if (data.success) {
        setCategorizedRails(data.data);
        
        updateFormWithCategorizedRails(data.data);
        updateGuardRailWithCategorizedRails(data.data);
        
        toast.success(`Loaded ${Object.values(data.data).flat().length} rail items`);
      } else {
        toast.error('Failed to load rail data');
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch rail data');
      setFallbackRails();
    } finally {
      setLoadingPrices(false);
    }
  };

  const setFallbackRails = () => {
    const fallbackData = {
      wallRail: [
        {
          id: 'wallRail_1',
          description: '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe',
          steelLbsPerLF: 3.300,
          shopMHPerLF: 0.300,
          fieldMHPerLF: 0.250
        }
      ],
      grabRail: [
        {
          id: 'grabRail_1',
          description: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe',
          steelLbsPerLF: 2.850,
          shopMHPerLF: 0.300,
          fieldMHPerLF: 0.280
        }
      ],
      guardRail: [
        {
          id: 'guardRail_1',
          description: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post',
          steelLbsPerLF: 6.840,
          shopMHPerLF: 0.500,
          fieldMHPerLF: 0.350
        }
      ]
    };

    setCategorizedRails(fallbackData);

    updateFormWithCategorizedRails(fallbackData);
    updateGuardRailWithCategorizedRails(fallbackData);
  };

  const updateFormWithCategorizedRails = (categorizedData) => {
    setFormData(prev => {
      const updatedStairs = prev.stairs.map(stair => {
        // Wall Rail Logic
        let wallRailType = stair.wallRail?.type;
        let wallRailItem = null;
        if (wallRailType) {
            wallRailItem = categorizedData.wallRail.find(r => r.id === wallRailType);
        }
        if (!wallRailItem) {
             const defaultWallRail = categorizedData.wallRail[0];
             wallRailItem = defaultWallRail;
             wallRailType = defaultWallRail?.id || '';
        }
        const wallRailCustom = customRailValues[wallRailType];

        // Grab Rail Logic
        let grabRailType = stair.grabRail?.type;
        let grabRailItem = null;
        if (grabRailType) {
            grabRailItem = categorizedData.grabRail.find(r => r.id === grabRailType);
        }
        if (!grabRailItem) {
             const defaultGrabRail = categorizedData.grabRail[0];
             grabRailItem = defaultGrabRail;
             grabRailType = defaultGrabRail?.id || '';
        }
        const grabRailCustom = customRailValues[grabRailType];

        return {
          ...stair,
          wallRail: {
            ...stair.wallRail,
            type: wallRailType,
            steelPerLF: wallRailCustom?.steelLbsPerLF || wallRailItem?.steelLbsPerLF || 0,
            shopMHPerLF: wallRailCustom?.shopMHPerLF || wallRailItem?.shopMHPerLF || 0,
            fieldMHPerLF: wallRailCustom?.fieldMHPerLF || wallRailItem?.fieldMHPerLF || 0,
            ...calculateRailEstimation({
              length: stair.wallRail.length,
              steelPerLF: wallRailCustom?.steelLbsPerLF || wallRailItem?.steelLbsPerLF || 0,
              shopMHPerLF: wallRailCustom?.shopMHPerLF || wallRailItem?.shopMHPerLF || 0,
              fieldMHPerLF: wallRailCustom?.fieldMHPerLF || wallRailItem?.fieldMHPerLF || 0
            })
          },
          grabRail: {
            ...stair.grabRail,
            type: grabRailType,
            steelPerLF: grabRailCustom?.steelLbsPerLF || grabRailItem?.steelLbsPerLF || 0,
            shopMHPerLF: grabRailCustom?.shopMHPerLF || grabRailItem?.shopMHPerLF || 0,
            fieldMHPerLF: grabRailCustom?.fieldMHPerLF || grabRailItem?.fieldMHPerLF || 0,
            ...calculateRailEstimation({
              length: stair.grabRail.length,
              steelPerLF: grabRailCustom?.steelLbsPerLF || grabRailItem?.steelLbsPerLF || 0,
              shopMHPerLF: grabRailCustom?.shopMHPerLF || grabRailItem?.shopMHPerLF || 0,
              fieldMHPerLF: grabRailCustom?.fieldMHPerLF || grabRailItem?.fieldMHPerLF || 0
            })
          }
        };
      });

      return {
        ...prev,
        stairs: updatedStairs
      };
    });
  };

  const updateGuardRailWithCategorizedRails = (categorizedData) => {
    setGuardRailData(prev => {
      const updatedGuardRails = prev.guardRails.map(rail => {
        let guardRailType = rail.type;
        let guardRailItem = null;
        if (guardRailType) {
            guardRailItem = categorizedData.guardRail.find(r => r.id === guardRailType);
        }
        if (!guardRailItem) {
             const defaultGuardRail = categorizedData.guardRail[0];
             guardRailItem = defaultGuardRail;
             guardRailType = defaultGuardRail?.id || '';
        }
        
        const guardRailCustom = customRailValues[guardRailType];

        return {
          ...rail,
          type: guardRailType,
          steelPerLF: guardRailCustom?.steelLbsPerLF || guardRailItem?.steelLbsPerLF || 0,
          shopMHPerLF: guardRailCustom?.shopMHPerLF || guardRailItem?.shopMHPerLF || 0,
          fieldMHPerLF: guardRailCustom?.fieldMHPerLF || guardRailItem?.fieldMHPerLF || 0,
          ...calculateRailEstimation({
            length: rail.length,
            steelPerLF: guardRailCustom?.steelLbsPerLF || guardRailItem?.steelLbsPerLF || 0,
            shopMHPerLF: guardRailCustom?.shopMHPerLF || guardRailItem?.shopMHPerLF || 0,
            fieldMHPerLF: guardRailCustom?.fieldMHPerLF || guardRailItem?.fieldMHPerLF || 0
          })
        };
      });

      return {
        ...prev,
        guardRails: updatedGuardRails
      };
    });
  };

  const calculateRailEstimation = (rail) => {
    const steelWeight = rail.length * rail.steelPerLF;
    const steelWithScrap = steelWeight * 1.10;
    const shopHours = rail.length * rail.shopMHPerLF;
    const fieldHours = rail.length * rail.fieldMHPerLF;

    return {
      steelWithScrap: parseFloat(steelWithScrap.toFixed(3)),
      shopHours: parseFloat(shopHours.toFixed(3)),
      fieldHours: parseFloat(fieldHours.toFixed(3))
    };
  };

  // Modified Wall & Grab Rail Handlers to use custom values
  const handleStairRailChange = (stairId, railType, field, value) => {
    setFormData(prev => {
      const updatedStairs = prev.stairs.map(stair => {
        if (stair.id !== stairId) return stair;

        const currentCategorizedRails = categorizedRailsRef.current;

        if ((field === 'type' && railType === 'wallRail') ||
          (field === 'type' && railType === 'grabRail')) {

          let selectedRail = null;
          if (railType === 'wallRail') {
            selectedRail = currentCategorizedRails.wallRail.find(r => r.id === value);
          } else if (railType === 'grabRail') {
            selectedRail = currentCategorizedRails.grabRail.find(r => r.id === value);
          }

          // Check for custom values
          const customValues = customRailValues[value];

          const updatedRail = {
            ...stair[railType],
            [field]: value,
            steelPerLF: customValues?.steelLbsPerLF || selectedRail?.steelLbsPerLF || 0,
            shopMHPerLF: customValues?.shopMHPerLF || selectedRail?.shopMHPerLF || 0,
            fieldMHPerLF: customValues?.fieldMHPerLF || selectedRail?.fieldMHPerLF || 0
          };

          const estimation = calculateRailEstimation(updatedRail);

          return {
            ...stair,
            [railType]: { ...updatedRail, ...estimation }
          };
        } else {
          const updatedRail = {
            ...stair[railType],
            [field]: value
          };

          if (field === 'length' || field === 'steelPerLF' ||
            field === 'shopMHPerLF' || field === 'fieldMHPerLF') {
            const estimation = calculateRailEstimation(updatedRail);
            return {
              ...stair,
              [railType]: { ...updatedRail, ...estimation }
            };
          }

          return {
            ...stair,
            [railType]: updatedRail
          };
        }
      });

      return { ...prev, stairs: updatedStairs };
    });
  };

  // Modified Guard Rail Handlers to use custom values
  const handleGuardRailChange = (railId, field, value) => {
    setGuardRailData(prev => {
      const updatedRails = prev.guardRails.map(rail => {
        if (rail.id !== railId) return rail;

        if (field === 'type') {
          const selectedRail = categorizedRails.guardRail.find(r => r.id === value);
          const customValues = customRailValues[value];
          
          const updatedRail = {
            ...rail,
            type: value,
            steelPerLF: customValues?.steelLbsPerLF || selectedRail?.steelLbsPerLF || 0,
            shopMHPerLF: customValues?.shopMHPerLF || selectedRail?.shopMHPerLF || 0,
            fieldMHPerLF: customValues?.fieldMHPerLF || selectedRail?.fieldMHPerLF || 0
          };

          const estimation = calculateRailEstimation(updatedRail);
          return { ...updatedRail, ...estimation };
        } else {
          const updatedRail = { ...rail, [field]: value };
          
          if (field === 'length' || field === 'steelPerLF' || 
              field === 'shopMHPerLF' || field === 'fieldMHPerLF') {
            const estimation = calculateRailEstimation(updatedRail);
            return { ...updatedRail, ...estimation };
          }
          
          return updatedRail;
        }
      });

      return { ...prev, guardRails: updatedRails };
    });
  };

  // Keep other handlers the same
  const addNewStair = () => {
    if (formData.stairs.length > 10) return;

    const newId = formData.stairs.length;
    const lastStair = formData.stairs[formData.stairs.length - 1];

    const newStair = {
      id: newId,
      name: `Stair ${newId}`,
      wallRail: {
        ...lastStair.wallRail,
        length: 0,
        steelWithScrap: 0,
        shopHours: 0,
        fieldHours: 0
      },
      grabRail: {
        ...lastStair.grabRail,
        length: 0,
        steelWithScrap: 0,
        shopHours: 0,
        fieldHours: 0
      }
    };

    setFormData(prev => ({
      ...prev,
      stairs: [...prev.stairs, newStair]
    }));
  };

  const removeStair = (stairId) => {
    if (formData.stairs.length <= 1) return;

    setFormData(prev => ({
      ...prev,
      stairs: prev.stairs
        .filter(stair => stair.id !== stairId)
        .map((stair, index) => ({
          ...stair,
          id: index,
          name: `Stair ${index}`
        }))
    }));
  };

  const handleGuardRailDetailChange = (railId, field, value) => {
    setGuardRailData(prev => {
      const updatedRails = prev.guardRails.map(rail => {
        if (rail.id !== railId) return rail;
        
        const updatedDetails = {
          ...rail.details,
          [field]: value
        };

        if (field === 'optionalFeature') {
          updatedDetails.optionalQuantity = 0;
          if (value === 'kick_plate') {
            updatedDetails.kickPlate = 0;
          } else if (value === 'pipe_returns') {
            updatedDetails.pipeReturns = 0;
          }
        }

        return {
          ...rail,
          details: updatedDetails
        };
      });

      return { ...prev, guardRails: updatedRails };
    });
  };

  const addNewGuardRail = () => {
    if (guardRailData.guardRails.length > 5) return;

    const newId = guardRailData.guardRails.length;
    const lastRail = guardRailData.guardRails[guardRailData.guardRails.length - 1];

    const newRail = {
      id: newId,
      name: `Guard Rail ${newId + 1}`,
      type: lastRail.type,
      length: 0.000,
      steelPerLF: lastRail.steelPerLF,
      shopMHPerLF: lastRail.shopMHPerLF,
      fieldMHPerLF: lastRail.fieldMHPerLF,
      steelWithScrap: 0,
      shopHours: 0,
      fieldHours: 0,
      details: {
        ...lastRail.details
      }
    };

    setGuardRailData(prev => ({
      ...prev,
      guardRails: [...prev.guardRails, newRail]
    }));
  };

  const removeGuardRail = (railId) => {
    if (guardRailData.guardRails.length <= 1) return;

    setGuardRailData(prev => ({
      ...prev,
      guardRails: prev.guardRails
        .filter(rail => rail.id !== railId)
        .map((rail, index) => ({
          ...rail,
          id: index,
          name: `Guard Rail ${index + 1}`
        }))
    }));
  };

  const calculateTotals = React.useCallback(() => {
    let wallRailLF = 0;
    let grabRailLF = 0;
    let guardRailLF = 0;
    let totalSteelWithScrap = 0;
    let totalShopHours = 0;
    let totalFieldHours = 0;

    formData.stairs.forEach(stair => {
      wallRailLF += stair.wallRail.length || 0;
      totalSteelWithScrap += stair.wallRail.steelWithScrap || 0;
      totalShopHours += stair.wallRail.shopHours || 0;
      totalFieldHours += stair.wallRail.fieldHours || 0;

      grabRailLF += stair.grabRail.length || 0;
      totalSteelWithScrap += stair.grabRail.steelWithScrap || 0;
      totalShopHours += stair.grabRail.shopHours || 0;
      totalFieldHours += stair.grabRail.fieldHours || 0;
    });

    guardRailData.guardRails.forEach(rail => {
      guardRailLF += rail.length || 0;
      totalSteelWithScrap += rail.steelWithScrap || 0;
      totalShopHours += rail.shopHours || 0;
      totalFieldHours += rail.fieldHours || 0;
    });

    const steelCostPerLB = 2.00;
    const totalCost = totalSteelWithScrap * steelCostPerLB;

    setCalculations({
      wallRailLF: parseFloat(wallRailLF.toFixed(3)),
      grabRailLF: parseFloat(grabRailLF.toFixed(3)),
      guardRailLF: parseFloat(guardRailLF.toFixed(3)),
      totalSteelWithScrap: parseFloat(totalSteelWithScrap.toFixed(3)),
      totalShopHours: parseFloat(totalShopHours.toFixed(3)),
      totalFieldHours: parseFloat(totalFieldHours.toFixed(3)),
      totalCost: parseFloat(totalCost.toFixed(2))
    });
  }, [formData.stairs, guardRailData.guardRails]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    calculateTotals();

    try {
      const token = localStorage.getItem('steel_token');
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          guardRailData,
          combinedCalculations: calculations,
          customRailValues // Include custom values in submission
        })
      });

      if (response.ok) {
        toast.success('Estimation saved successfully!');
      } else {
        throw new Error('Failed to save estimation');
      }
    } catch (error) {
      toast.error('Failed to save estimation');
      console.error('Submit error:', error);
    }
  };

  // Project Info step removed

  const handleCompleteEstimation = () => {
    handleSubmit({ preventDefault: () => {} });
    toast.success('Estimation completed successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onToggle={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
      <NavigationBar
        formData={formData}
        setFormData={setFormData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleSubmit={handleSubmit}
      />

      <div className="p-4 max-w-7xl mx-auto">
        <RailEstimationStep
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          calculations={calculations}
          formData={formData}
          setFormData={setFormData}
          categorizedRails={categorizedRails}
          loadingPrices={loadingPrices}
          handleStairRailChange={handleStairRailChange}
          addNewStair={addNewStair}
          removeStair={removeStair}
          guardRailData={guardRailData}
          setGuardRailData={setGuardRailData}
          handleGuardRailChange={handleGuardRailChange}
          handleGuardRailDetailChange={handleGuardRailDetailChange}
          addNewGuardRail={addNewGuardRail}
          removeGuardRail={removeGuardRail}
          onComplete={handleCompleteEstimation}
          customRailValues={customRailValues}
          setCustomRailValues={setCustomRailValues}
        />

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EstimationForm;
