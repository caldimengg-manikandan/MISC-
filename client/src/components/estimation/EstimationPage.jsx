// src/components/estimation/EstimationPage.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Layers,
  GripVertical,
  Shield,
  Edit2,
  Check,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import ProfileDropdown from '../AISC/ProfileDropdown';
import { parseArchitecturalInput } from '../../utils/conversionUtils';
import Sidebar from '../dashboard/Sidebar';

// Correct imports from sections folder
import ProjectInfo from '../sections/ProjectInfo';
import StairGeometrySection from '../AISC/StairGeometrySection';
import WallGrabRailTable from './tabs/WallGrabRailTable';
import GuardRailTable from './tabs/GuardRailTable';

const SummaryView = ({ formData, guardRailData, categorizedRails, calculations }) => {
  const LABOR_RATE = 65.00;
  const MATERIAL_RATE = 2.00;

  const totalWeight = calculations?.totalSteelWithScrap || 0;
  const totalHours = (calculations?.totalShopHours || 0) + (calculations?.totalFieldHours || 0);
  
  const materialCost = totalWeight * MATERIAL_RATE;
  const laborCost = totalHours * LABOR_RATE;
  const totalCost = materialCost + laborCost;

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

      {/* Cost Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Cost Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Weight</p>
            <p className="text-xl font-bold text-gray-900">{totalWeight.toFixed(2)} lbs</p>
            <p className="text-xs text-gray-400 mt-1">Including scrap</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 mb-1">Material Cost</p>
            <p className="text-xl font-bold text-blue-900">${materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-blue-400 mt-1">@ ${MATERIAL_RATE.toFixed(2)}/lb</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600 mb-1">Labour Cost</p>
            <p className="text-xl font-bold text-purple-900">${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-purple-400 mt-1">{totalHours.toFixed(1)} hrs @ ${LABOR_RATE.toFixed(2)}/hr</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-600 mb-1">Total Cost</p>
            <p className="text-xl font-bold text-green-900">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-400 mt-1">Material + Labour</p>
          </div>
        </div>
      </div>

      {/* Stair Configuration (Wall & Grab Rails) */}
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
              {formData.stairs?.map((stair) => {
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rail Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guardRailData.map((rail, index) => {
                 // Find rail name
                 const railTypeObj = categorizedRails?.guardRail?.find(r => r.id === rail.type);
                 const railName = railTypeObj ? railTypeObj.description : 'Unknown Type';
                 
                 return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{railName}</td>
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

const EstimationPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation
  const [projectId, setProjectId] = useState(location.state?.projectId || null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('estimation');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [formData, setFormData] = useState({
    // Project Information
    customerName: '',
    projectNumber: '',
    projectName: '',
    
    // Stair Information
    stairName: '',
    stairType: 'residential',
    landingType: 'without-landing',
    numberOfLandings: 0,
    flights: [{ id: 1, number: 'FL-001' }],
    flightGeometry: {},
    
    // Stair Beam Details
    mainBeam: {
      size: '',
      material: '',
      length: ''
    },
    infillBeam: {
      size: '',
      material: '',
      quantity: ''
    },
    endBeam: {
      size: '',
      material: '',
      quantity: ''
    },
    
    // Material Specifications
    profile: '',
    steelGrade: '',
    stairWidth: '',
    nosingToNosingHorizontal: '',
    nosingToNosingVertical: '',
    numberOfRisers: '',
    riserHeight: '',
    treadDepth: '',
    riserHeightMax: '7"',
    riserHeightMin: '1"',
    
    // Thread & Pan Details
    panType: '11"',
    threadType: '',
    
    // Railing System
    railingType: '',
    postToPostSpacing: '4"',
    railingTopHeight: '',
    stringerSize: '',
    railingSize: '',
    
    // Additional fields for StairGeometrySection
    leftEndType: '',
    leftMountingHeight: '',
    leftClearance: '',
    leftIncludeBracket: false,
    rightEndType: '',
    rightMountingHeight: '',
    rightClearance: '',
    rightIncludeBracket: false
  });

  const [activeSection, setActiveSection] = useState('project');
  const [selectedFlightId, setSelectedFlightId] = useState(1);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatedValuesByFlight, setCalculatedValuesByFlight] = useState({});

  // Fix: Initialize selectedFlightId and flightGeometry from DB data if present
  useEffect(() => {
    // 1. Handle flightGeometry transformation (Array -> Object)
    if (formData.stairs && formData.stairs.length > 0) {
      const firstStair = formData.stairs[0];
      
      // Check if we have flightGeometries array (DB structure) but missing flightGeometry object (UI structure)
      if (firstStair.flightGeometries && Array.isArray(firstStair.flightGeometries) && firstStair.flightGeometries.length > 0) {
        // Only proceed if UI state is empty or incomplete
        const currentKeys = Object.keys(formData.flightGeometry || {});
        if (currentKeys.length === 0) {
          console.log('Migrating flightGeometries from DB structure to UI state...');
          
          const newFlightGeometry = {};
          
          firstStair.flightGeometries.forEach(geo => {
            if (geo.flightId) {
              newFlightGeometry[geo.flightId] = {
                nosingToNosingHorizontal: geo.nosingToNosingHorizontal,
                nosingToNosingVertical: geo.nosingToNosingVertical,
                numberOfRisers: geo.numberOfRisers,
                stairWidth: geo.stairWidth,
                stairAngle: geo.stairAngle,
                headroomClearance: geo.headroomClearance,
                treadThickness: geo.treadThickness,
                riserThickness: geo.riserThickness
              };
            }
          });
          
          setFormData(prev => ({
            ...prev,
            flightGeometry: newFlightGeometry
          }));
        }
      }
    }

    // 2. Handle selectedFlightId type mismatch (Number vs String)
    if (formData.flights && formData.flights.length > 0) {
      // Check if current selectedFlightId is valid in the current flights list
      const currentExists = formData.flights.some(f => f.id === selectedFlightId);
      
      if (!currentExists) {
        console.log('Fixing selectedFlightId mismatch. Current:', selectedFlightId, 'Available:', formData.flights.map(f => f.id));
        // Set to the first flight's ID
        const firstId = formData.flights[0].id;
        if (firstId) {
          setSelectedFlightId(firstId);
        }
      }
    }
  }, [formData.stairs, formData.flights, selectedFlightId, formData.flightGeometry]);
  
  // Enhanced steel grades with images
  const [steelGrades, setSteelGrades] = useState([
    { 
      name: 'ASTM A36', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'ASTM A572', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'ASTM A992', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'SS 304', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'SS 316', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    }
  ]);

  // Enhanced thread types with images
  const [threadTypes, setThreadTypes] = useState([
    { 
      name: "Type 1 - Pan Plate Z'Type", 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'Type 2 - Grating', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    },
    { 
      name: 'Type 3 - Checkered Plate', 
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
    }
  ]);

  const [railingTypes, setRailingTypes] = useState(
    Array.from({ length: 20 }, (_, i) => `Type ${i + 1}`
  ));

  const [newSteelGrade, setNewSteelGrade] = useState('');
  const [newSteelGradeImage, setNewSteelGradeImage] = useState('');
  const [newThreadType, setNewThreadType] = useState('');
  const [newThreadTypeImage, setNewThreadTypeImage] = useState('');
  const [customRailingType, setCustomRailingType] = useState('');

  const [railsActiveTab, setRailsActiveTab] = useState('wallRail');

  const initialRailsStairs = (formData.flights || []).map((flight) => ({
    id: flight.id,
    name: flight.number || `FL-${String(flight.id).padStart(3, '0')}`,
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
  }));

  const [railsFormData, setRailsFormData] = useState({
    stairs: initialRailsStairs.length > 0
      ? initialRailsStairs
      : [
          {
            id: 0,
            name: 'Stair 0',
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
        ]
  });

  const [railsGuardRailData, setRailsGuardRailData] = useState({
    guardRails: [
      {
        id: 0,
        name: 'Guard Rail 1',
        type: '',
        length: 0,
        steelPerLF: 0,
        shopMHPerLF: 0,
        fieldMHPerLF: 0,
        steelWithScrap: 0,
        shopHours: 0,
        fieldHours: 0,
        details: {
          intermediateRails: 0,
          maxPostSpacing: 4,
          postQuantity: 0,
          postType: 'anchored',
          optionalFeature: 'none',
          optionalQuantity: 0,
          kickPlate: 0,
          pipeReturns: 0,
          ballType: ''
        }
      }
    ]
  });

  const [railsCalculations, setRailsCalculations] = useState({
    wallRailLF: 0,
    grabRailLF: 0,
    guardRailLF: 0,
    totalSteelWithScrap: 0,
    totalShopHours: 0,
    totalFieldHours: 0,
    totalCost: 0
  });

  const [railsCategorizedRails, setRailsCategorizedRails] = useState({
    wallRail: [],
    grabRail: [],
    guardRail: []
  });

  const [railsLoadingPrices, setRailsLoadingPrices] = useState(false);
  const [railsCustomRailValues, setRailsCustomRailValues] = useState({});
  const [railsDataLoaded, setRailsDataLoaded] = useState(false);

  const RailEditableRailDropdown = ({
    railType,
    value,
    onChange,
    categorizedRails,
    customRailValues,
    setCustomRailValues
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
      </div>
    );
  };

  // Conversion functions
  const inchesToFeetInchesFraction = (inches) => {
    if (!inches || inches === 0) return '0"';
    
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    if (sixteenths === 0) {
      if (feet > 0 && wholeInches === 0) return `${feet}'`;
      if (feet > 0) return `${feet}'-${wholeInches}"`;
      return `${wholeInches}"`;
    }
    
    // Simplify fraction
    let numerator = sixteenths;
    let denominator = 16;
    
    // Simplify fraction by dividing by greatest common divisor
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(numerator, denominator);
    
    numerator /= divisor;
    denominator /= divisor;
    
    if (feet > 0) {
      if (wholeInches === 0) {
        return `${feet}'-${numerator}/${denominator}"`;
      } else {
        return `${feet}'-${wholeInches} ${numerator}/${denominator}"`;
      }
    } else {
      if (wholeInches === 0) {
        return `${numerator}/${denominator}"`;
      } else {
        return `${wholeInches} ${numerator}/${denominator}"`;
      }
    }
  };

  // Calculate stair geometry
  const calculateStairGeometry = () => {
    const geo = formData.flightGeometry?.[selectedFlightId] || {};
    const horizontal = parseArchitecturalInput(geo.nosingToNosingHorizontal) || 0;
const vertical = parseArchitecturalInput(geo.nosingToNosingVertical) || 0;

    const risers = parseInt(geo.numberOfRisers) || 0;

    if (horizontal > 0 && vertical > 0 && risers > 1) {
      const riserHeight = vertical / risers;
      const treadDepth = horizontal / (risers - 1);
      const stringerLength = Math.sqrt(Math.pow(horizontal, 2) + Math.pow(vertical, 2));
      const numberOfSteps = risers - 1;

      const formattedRiserHeight = inchesToFeetInchesFraction(riserHeight);
      const formattedTreadDepth = inchesToFeetInchesFraction(treadDepth);
      const formattedStringerLength = inchesToFeetInchesFraction(stringerLength);

      setCalculatedValuesByFlight(prev => ({
        ...prev,
        [selectedFlightId]: {
          riserHeight: formattedRiserHeight,
          treadDepth: formattedTreadDepth,
          stringerLength: formattedStringerLength,
          numberOfSteps
        }
      }));
    } else {
      setCalculatedValuesByFlight(prev => ({
        ...prev,
        [selectedFlightId]: {
          riserHeight: '',
          treadDepth: '',
          stringerLength: '',
          numberOfSteps: 0
        }
      }));
    }
  };

  const fetchRailsCategorized = async () => {
    try {
      setRailsLoadingPrices(true);
      const token = localStorage.getItem('steel_token');

      if (!token) {
        toast.error('Please login first');
        setRailsLoadingPrices(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/debug/categorized-rails`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRailsCategorizedRails(data.data);
        setRailsDataLoaded(true);
        const totalItems = Object.values(data.data).flat().length;
        toast.success(`Loaded ${totalItems} rail items`);
      } else {
        toast.error('Failed to load rail data');
      }
    } catch (error) {
      console.error('Fetch rail data error:', error);
      toast.error('Failed to fetch rail data');
    } finally {
      setRailsLoadingPrices(false);
    }
  };

  const calculateRailEstimation = (rail) => {
    const steelWeight = rail.length * rail.steelPerLF;
    const steelWithScrap = steelWeight * 1.1;
    const shopHours = rail.length * rail.shopMHPerLF;
    const fieldHours = rail.length * rail.fieldMHPerLF;

    return {
      steelWithScrap: parseFloat(steelWithScrap.toFixed(3)),
      shopHours: parseFloat(shopHours.toFixed(3)),
      fieldHours: parseFloat(fieldHours.toFixed(3))
    };
  };

  const handleRailsStairRailChange = (stairId, railType, field, value) => {
    setRailsFormData((prev) => {
      const updatedStairs = prev.stairs.map((stair) => {
        if (stair.id !== stairId) return stair;

        if (field === 'type') {
          const currentCategorizedRails = railsCategorizedRails;
          let selectedRail = null;

          if (railType === 'wallRail') {
            selectedRail = currentCategorizedRails.wallRail.find((r) => r.id === value);
          } else if (railType === 'grabRail') {
            selectedRail = currentCategorizedRails.grabRail.find((r) => r.id === value);
          }

          const customValues = railsCustomRailValues[value];

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
        }

        const updatedRail = {
          ...stair[railType],
          [field]: value
        };

        if (
          field === 'length' ||
          field === 'steelPerLF' ||
          field === 'shopMHPerLF' ||
          field === 'fieldMHPerLF'
        ) {
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
      });

      return { ...prev, stairs: updatedStairs };
    });
  };

  const handleRailsGuardRailChange = (railId, field, value) => {
    setRailsGuardRailData((prev) => {
      const updatedRails = prev.guardRails.map((rail) => {
        if (rail.id !== railId) return rail;

        if (field === 'type') {
          const selectedRail = railsCategorizedRails.guardRail.find((r) => r.id === value);
          const customValues = railsCustomRailValues[value];

          const updatedRail = {
            ...rail,
            type: value,
            steelPerLF: customValues?.steelLbsPerLF || selectedRail?.steelLbsPerLF || 0,
            shopMHPerLF: customValues?.shopMHPerLF || selectedRail?.shopMHPerLF || 0,
            fieldMHPerLF: customValues?.fieldMHPerLF || selectedRail?.fieldMHPerLF || 0
          };

          const estimation = calculateRailEstimation(updatedRail);
          return { ...updatedRail, ...estimation };
        }

        const updatedRail = { ...rail, [field]: value };

        if (
          field === 'length' ||
          field === 'steelPerLF' ||
          field === 'shopMHPerLF' ||
          field === 'fieldMHPerLF'
        ) {
          const estimation = calculateRailEstimation(updatedRail);
          return { ...updatedRail, ...estimation };
        }

        return updatedRail;
      });

      return { ...prev, guardRails: updatedRails };
    });
  };

  const handleRailsGuardRailDetailChange = (railId, field, value) => {
    setRailsGuardRailData((prev) => {
      const updatedRails = prev.guardRails.map((rail) => {
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

  const addRailsStair = () => {
    setRailsFormData((prev) => {
      if (prev.stairs.length > 10) return prev;

      const newId = prev.stairs.length;
      const lastStair = prev.stairs[prev.stairs.length - 1];

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

      return {
        ...prev,
        stairs: [...prev.stairs, newStair]
      };
    });
  };

  const removeRailsStair = (stairId) => {
    setRailsFormData((prev) => {
      if (prev.stairs.length <= 1) return prev;

      return {
        ...prev,
        stairs: prev.stairs
          .filter((stair) => stair.id !== stairId)
          .map((stair, index) => ({
            ...stair,
            id: index,
            name: `Stair ${index}`
          }))
      };
    });
  };

  const addRailsGuardRail = () => {
    setRailsGuardRailData((prev) => {
      if (prev.guardRails.length > 5) return prev;

      const newId = prev.guardRails.length;
      const lastRail = prev.guardRails[prev.guardRails.length - 1];

      const newRail = {
        id: newId,
        name: `Guard Rail ${newId + 1}`,
        type: lastRail.type,
        length: 0,
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

      return {
        ...prev,
        guardRails: [...prev.guardRails, newRail]
      };
    });
  };

  const removeRailsGuardRail = (railId) => {
    setRailsGuardRailData((prev) => {
      if (prev.guardRails.length <= 1) return prev;

      return {
        ...prev,
        guardRails: prev.guardRails
          .filter((rail) => rail.id !== railId)
          .map((rail, index) => ({
            ...rail,
            id: index,
            name: `Guard Rail ${index + 1}`
          }))
      };
    });
  };

  const calculateRailsTotals = () => {
    let wallRailLF = 0;
    let grabRailLF = 0;
    let guardRailLF = 0;
    let totalSteelWithScrap = 0;
    let totalShopHours = 0;
    let totalFieldHours = 0;

    railsFormData.stairs.forEach((stair) => {
      wallRailLF += stair.wallRail.length || 0;
      totalSteelWithScrap += stair.wallRail.steelWithScrap || 0;
      totalShopHours += stair.wallRail.shopHours || 0;
      totalFieldHours += stair.wallRail.fieldHours || 0;

      grabRailLF += stair.grabRail.length || 0;
      totalSteelWithScrap += stair.grabRail.steelWithScrap || 0;
      totalShopHours += stair.grabRail.shopHours || 0;
      totalFieldHours += stair.grabRail.fieldHours || 0;
    });

    railsGuardRailData.guardRails.forEach((rail) => {
      guardRailLF += rail.length || 0;
      totalSteelWithScrap += rail.steelWithScrap || 0;
      totalShopHours += rail.shopHours || 0;
      totalFieldHours += rail.fieldHours || 0;
    });

    const steelCostPerLB = 2;
    const totalCost = totalSteelWithScrap * steelCostPerLB;

    setRailsCalculations({
      wallRailLF: parseFloat(wallRailLF.toFixed(3)),
      grabRailLF: parseFloat(grabRailLF.toFixed(3)),
      guardRailLF: parseFloat(guardRailLF.toFixed(3)),
      totalSteelWithScrap: parseFloat(totalSteelWithScrap.toFixed(3)),
      totalShopHours: parseFloat(totalShopHours.toFixed(3)),
      totalFieldHours: parseFloat(totalFieldHours.toFixed(3)),
      totalCost: parseFloat(totalCost.toFixed(2))
    });
  };

  // Auto-calculate when dimensions change
  useEffect(() => {
    calculateStairGeometry();
  }, [
    formData.flightGeometry?.[selectedFlightId]?.nosingToNosingHorizontal,
    formData.flightGeometry?.[selectedFlightId]?.nosingToNosingVertical,
    formData.flightGeometry?.[selectedFlightId]?.numberOfRisers,
    selectedFlightId
  ]);

  useEffect(() => {
    // Load rail data if we are in any flight tab or project tab
    const shouldLoadRails = activeSection === 'project' || activeSection.startsWith('flight-');
    if (shouldLoadRails && !railsDataLoaded && !railsLoadingPrices) {
      fetchRailsCategorized();
    }
  }, [activeSection, railsDataLoaded, railsLoadingPrices]);

  useEffect(() => {
    calculateRailsTotals();
  }, [railsFormData.stairs, railsGuardRailData.guardRails, railsCustomRailValues]);

  // Sync railsFormData.stairs with formData.flights
  useEffect(() => {
    setRailsFormData(prev => {
      const currentStairs = prev.stairs || [];
      const newFlights = formData.flights || [];
      
      // Create a map of existing stairs for easy lookup by ID
      const stairMap = new Map(currentStairs.map(s => [s.id, s]));
      
      const updatedStairs = newFlights.map(flight => {
        // If this flight already has a corresponding stair entry, preserve it (but update name/number)
        if (stairMap.has(flight.id)) {
          return {
            ...stairMap.get(flight.id),
            name: flight.number || `FL-${String(flight.id).padStart(3, '0')}`
          };
        }
        
        // Otherwise create a new entry
        return {
          id: flight.id,
          name: flight.number || `FL-${String(flight.id).padStart(3, '0')}`,
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
        };
      });
      
      return {
        ...prev,
        stairs: updatedStairs
      };
    });
  }, [formData.flights]);

  // Sync railsGuardRailData.guardRails with formData.flights
  useEffect(() => {
    setRailsGuardRailData(prev => {
      const currentGuardRails = prev.guardRails || [];
      const newFlights = formData.flights || [];
      
      // Create a map of existing guard rails for easy lookup by ID
      const guardRailMap = new Map(currentGuardRails.map(gr => [gr.id, gr]));
      
      const updatedGuardRails = newFlights.map(flight => {
        // If this flight already has a corresponding guard rail entry, preserve it
        if (guardRailMap.has(flight.id)) {
          return {
            ...guardRailMap.get(flight.id),
            name: `Guard Rail - ${flight.number || `FL-${String(flight.id).padStart(3, '0')}`}`
          };
        }
        
        // Otherwise create a new entry
        return {
          id: flight.id,
          name: `Guard Rail - ${flight.number || `FL-${String(flight.id).padStart(3, '0')}`}`,
          type: '',
          length: 0,
          steelPerLF: 0,
          shopMHPerLF: 0,
          fieldMHPerLF: 0,
          steelWithScrap: 0,
          shopHours: 0,
          fieldHours: 0,
          details: {
            intermediateRails: 0,
            maxPostSpacing: 4,
            postQuantity: 0,
            postType: 'anchored',
            optionalFeature: 'none',
            optionalQuantity: 0,
            kickPlate: 0,
            pipeReturns: 0,
            ballType: ''
          }
        };
      });
      
      return {
        ...prev,
        guardRails: updatedGuardRails
      };
    });
  }, [formData.flights]);

  const sections = [
    { 
      id: 'project', 
      name: 'Project Info', 
      icon: Building, 
      color: 'blue',
      description: 'Basic project and customer information'
    },
    ...(formData.flights || []).map(flight => ({
      id: `flight-${flight.id}`,
      name: flight.number || `Flight ${flight.id}`,
      icon: Layers,
      color: 'purple',
      description: `Configuration for ${flight.number}`
    })),
    {
      id: 'summary',
      name: 'Summary',
      icon: CheckCircle,
      color: 'green',
      description: 'Review estimation summary'
    }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Proxy for geometry field changes to per-flight storage
  const geometryFields = new Set(['nosingToNosingHorizontal','nosingToNosingVertical','numberOfRisers','stairWidth']);
  const handleGeometryChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (geometryFields.has(name)) {
      const v = type === 'checkbox' ? checked : value;
      setFormData(prev => ({
        ...prev,
        flightGeometry: {
          ...prev.flightGeometry,
          [selectedFlightId]: {
            ...(prev.flightGeometry?.[selectedFlightId] || {}),
            [name]: v
          }
        }
      }));
    } else {
      handleChange(e);
    }
  };

  // Flight Management Functions
  const addFlight = () => {
    // Find the next available ID by checking max existing ID
    const maxId = formData.flights.length > 0 
      ? Math.max(...formData.flights.map(f => f.id)) 
      : 0;
    const newFlightId = maxId + 1;

    const newFlight = {
      id: newFlightId,
      number: `FL-${String(newFlightId).padStart(3, '0')}`
    };

    // Determine initial geometry values
    // Default to empty values
    let initialGeometry = {
      nosingToNosingHorizontal: '',
      nosingToNosingVertical: '',
      numberOfRisers: '',
      stairWidth: ''
    };

    // If there are existing flights, try to copy from the last one (FL001 -> FL002)
    if (formData.flights.length > 0) {
      const lastFlight = formData.flights[formData.flights.length - 1];
      const lastFlightId = lastFlight.id;
      
      // Check if we have geometry for the last flight
      if (formData.flightGeometry && formData.flightGeometry[lastFlightId]) {
        // Copy the values to the new flight
        initialGeometry = { ...formData.flightGeometry[lastFlightId] };
        // Reset saved status for new flight
        initialGeometry.isSaved = false;
      }
    }

    setFormData({
      ...formData,
      flights: [...formData.flights, newFlight],
      flightGeometry: {
        ...formData.flightGeometry,
        [newFlightId]: initialGeometry
      }
    });
    
    // Switch to the new flight tab
    setTimeout(() => {
      setActiveSection(`flight-${newFlightId}`);
      setSelectedFlightId(newFlightId);
    }, 100);
  };

  const removeFlight = (flightId) => {
    if (formData.flights.length > 1) {
      const { [flightId]: _, ...restGeo } = formData.flightGeometry || {};
      const remainingFlights = formData.flights.filter(flight => flight.id !== flightId);
      
      setFormData({
        ...formData,
        flights: remainingFlights,
        flightGeometry: restGeo
      });

      // If we are currently viewing the deleted flight, switch to the first available flight
      if (activeSection === `flight-${flightId}`) {
        const first = remainingFlights[0];
        if (first) {
          setActiveSection(`flight-${first.id}`);
        } else {
          setActiveSection('project');
        }
      }
      
      // Also update selectedFlightId if needed
      if (selectedFlightId === flightId) {
        const first = remainingFlights[0];
        setSelectedFlightId(first ? first.id : 1);
      }
    }
  };

  const updateFlightNumber = (flightId, newNumber) => {
    setFormData({
      ...formData,
      flights: formData.flights.map(flight =>
        flight.id === flightId ? { ...flight, number: newNumber } : flight
      )
    });
  };

  // Enhanced steel grade handling with images
  const handleAddSteelGrade = () => {
    if (newSteelGrade && !steelGrades.some(grade => grade.name === newSteelGrade)) {
      const newGrade = {
        name: newSteelGrade,
        image: newSteelGradeImage || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
      };
      setSteelGrades([...steelGrades, newGrade]);
      setFormData({ ...formData, steelGrade: newSteelGrade });
      setNewSteelGrade('');
      setNewSteelGradeImage('');
    }
  };

  // Enhanced thread type handling with images
  const handleAddThreadType = () => {
    if (newThreadType && !threadTypes.some(type => type.name === newThreadType)) {
      const newType = {
        name: newThreadType,
        image: newThreadTypeImage || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
      };
      setThreadTypes([...threadTypes, newType]);
      setFormData({ ...formData, threadType: newThreadType });
      setNewThreadType('');
      setNewThreadTypeImage('');
    }
  };

  const handleAddRailingType = () => {
    if (customRailingType && !railingTypes.includes(customRailingType)) {
      setRailingTypes([...railingTypes, customRailingType]);
      setFormData({ ...formData, railingType: customRailingType });
      setCustomRailingType('');
    }
  };

  const handleProfileDropdownSelect = (profileData) => {
    console.log('Profile configuration selected:', profileData);
    if (profileData.stairForm) {
      setFormData(prev => ({
        ...prev,
        profile: profileData.stairForm.leftStringer || ''
      }));
    }
  };

  // Save estimation to MongoDB
  const saveEstimationToMongoDB = async (estimationData) => {
    try {
      console.log('Saving estimation data:', estimationData);
      
      const token = localStorage.getItem('steel_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_BASE_URL}/api/projects/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(estimationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Estimation saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving estimation:', error);
      throw new Error(`Failed to save estimation: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Basic validation
    if (!formData.projectNumber || !formData.projectName) {
      toast.error('Please enter Project Number and Project Name');
      // If we are not on project tab, switch to it so user can see what's missing
      if (activeSection !== 'project') {
        setActiveSection('project');
      }
      return;
    }

    setLoading(true);

    try {
      // Merge rail data into stairs
      const mergedStairs = formData.flights.map((flight, index) => {
        // Find corresponding rail data by index
        // railsFormData.stairs should be synced with flights
        const railStair = railsFormData.stairs[index];
        const flightGeo = formData.flightGeometry?.[flight.id] || {};
        
        // Structure according to stairSchema
        // We create one stair entry per flight to maintain per-flight rail data
        return {
          stairName: flight.number,
          // flights array required by schema
          flights: [{
            id: String(flight.id),
            number: flight.number,
            description: flight.description || ''
          }],
          // flightGeometries array required by schema
          flightGeometries: [{
            flightId: String(flight.id),
            flightNumber: flight.number,
            nosingToNosingHorizontal: flightGeo.nosingToNosingHorizontal,
            nosingToNosingVertical: flightGeo.nosingToNosingVertical,
            numberOfRisers: flightGeo.numberOfRisers,
            stairWidth: flightGeo.stairWidth,
            hasCustomValues: flightGeo.isSaved || false
          }],
          // Add rail data
          wallRail: railStair ? railStair.wallRail : {},
          grabRail: railStair ? railStair.grabRail : {}
        };
      });

      const estimationData = {
        id: projectId, // Pass the existing project ID if editing
        ...formData,
        stairs: mergedStairs,
        guardRails: railsGuardRailData.guardRails,
        customRailValues: railsCustomRailValues,
        calculatedValues: calculatedValuesByFlight,
        createdAt: new Date().toISOString(),
        status: 'draft',
        totalCost: 0,
      };

      const savedEstimation = await saveEstimationToMongoDB(estimationData);
      
      console.log('Estimation saved successfully:', savedEstimation);
      
      toast.success('Estimation created and saved successfully!');
      // Navigate to costing page with the project ID
      const savedProjectId = savedEstimation.data?.id || savedEstimation.projectId || savedEstimation.id;
      if (savedProjectId) {
        navigate('/costing', { state: { projectId: savedProjectId } });
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('Error creating estimation:', error);
      toast.error(`Failed to create estimation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        border: 'border-blue-500',
        text: 'text-blue-700',
        bg: 'bg-blue-50',
        button: 'bg-blue-500 hover:bg-blue-600'
      },
      green: {
        border: 'border-green-500',
        text: 'text-green-700',
        bg: 'bg-green-50',
        button: 'bg-green-500 hover:bg-green-600'
      },
      purple: {
        border: 'border-purple-500',
        text: 'text-purple-700',
        bg: 'bg-purple-50',
        button: 'bg-purple-500 hover:bg-purple-600'
      },
      red: {
        border: 'border-red-500',
        text: 'text-red-700',
        bg: 'bg-red-50',
        button: 'bg-red-500 hover:bg-red-600'
      },
      orange: {
        border: 'border-orange-500',
        text: 'text-orange-700',
        bg: 'bg-orange-50',
        button: 'bg-orange-500 hover:bg-orange-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const commonProps = {
    formData,
    handleChange,
    steelGrades,
    threadTypes,
    railingTypes,
    newSteelGrade,
    setNewSteelGrade,
    newSteelGradeImage,
    setNewSteelGradeImage,
    newThreadType,
    setNewThreadType,
    newThreadTypeImage,
    setNewThreadTypeImage,
    customRailingType,
    setCustomRailingType,
    handleAddSteelGrade,
    handleAddThreadType,
    handleAddRailingType,
    showProfileDropdown,
    setShowProfileDropdown,
    handleProfileDropdownSelect,
    addFlight,
    removeFlight,
    updateFlightNumber
  };

  const handleFlightSaveStatus = (flightId, status) => {
    setFormData(prev => ({
      ...prev,
      flightGeometry: {
        ...prev.flightGeometry,
        [flightId]: {
          ...(prev.flightGeometry?.[flightId] || {}),
          isSaved: status
        }
      }
    }));
  };

  const renderSectionContent = () => {
    if (activeSection === 'project') {
      return <ProjectInfo {...commonProps} />;
    }

    if (activeSection.startsWith('flight-')) {
      const flightId = parseInt(activeSection.split('-')[1]);
      
      // Derive per-flight form data overlay for Geometry
      const flightGeo = formData.flightGeometry?.[flightId] || {};
      const derivedFormData = {
        ...formData,
        nosingToNosingHorizontal: flightGeo.nosingToNosingHorizontal || '',
        nosingToNosingVertical: flightGeo.nosingToNosingVertical || '',
        numberOfRisers: flightGeo.numberOfRisers || '',
        stairWidth: flightGeo.stairWidth || '',
        isSaved: flightGeo.isSaved || false
      };
      const currentCalculated = calculatedValuesByFlight[flightId] || {
        riserHeight: '',
        treadDepth: '',
        stringerLength: '',
        numberOfSteps: 0
      };

      return (
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {formData.flights.find(f => f.id === flightId)?.number || `Flight ${flightId}`}
            </h3>
          </div>

          {/* Stair Geometry Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6 border-b border-gray-200 pb-2">
              <Layers className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Stair Geometry</h3>
            </div>
            
            <StairGeometrySection
              formData={derivedFormData}
              handleChange={handleGeometryChange}
              handleFlightSaveStatus={handleFlightSaveStatus}
              calculatedValues={currentCalculated}
              selectedFlightId={flightId}
              steelGrades={steelGrades}
              threadTypes={threadTypes}
              railingTypes={railingTypes}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              handleProfileDropdownSelect={handleProfileDropdownSelect}
            />
          </div>

          {/* Rails Section */}
          <div className="mb-6">
            <div className="flex items-center mb-6 border-b border-gray-200 pb-2">
              <GripVertical className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Rails</h3>
            </div>

            <div className="space-y-6">
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {[
                    { id: 'wallRail', label: 'Wall & Grab Rails', icon: <Building className="w-4 h-4 mr-2" /> },
                    { id: 'guardRail', label: 'Guard Rails', icon: <Shield className="w-4 h-4 mr-2" /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRailsActiveTab(tab.id)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                        railsActiveTab === tab.id
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

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                {railsActiveTab === 'wallRail' ? (
                  <WallGrabRailTable
                    formData={railsFormData}
                    setFormData={setRailsFormData}
                    categorizedRails={railsCategorizedRails}
                    loadingPrices={railsLoadingPrices}
                    handleStairRailChange={handleRailsStairRailChange}
                    calculations={railsCalculations}
                    customRailValues={railsCustomRailValues}
                    setCustomRailValues={setRailsCustomRailValues}
                    EditableRailDropdown={RailEditableRailDropdown}
                    showCostColumns={false}
                    filterId={flightId}
                  />
                ) : (
                  <GuardRailTable
                    guardRailData={railsGuardRailData}
                    setGuardRailData={setRailsGuardRailData}
                    categorizedRails={railsCategorizedRails}
                    loadingPrices={railsLoadingPrices}
                    calculations={railsCalculations}
                    handleGuardRailChange={handleRailsGuardRailChange}
                    handleGuardRailDetailChange={handleRailsGuardRailDetailChange}
                    customRailValues={railsCustomRailValues}
                    setCustomRailValues={setRailsCustomRailValues}
                    EditableRailDropdown={RailEditableRailDropdown}
                    showCostColumns={false}
                    filterId={flightId}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'summary') {
      return (
        <SummaryView 
          formData={formData} 
          guardRailData={railsGuardRailData.guardRails} 
          categorizedRails={railsCategorizedRails}
          calculations={railsCalculations}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onToggle={setIsSidebarCollapsed} />
      
      <div className={`transition-all duration-300 p-8 ml-0 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'} flex flex-col h-screen`}>
        <div className="bg-white rounded-2xl shadow-lg w-full h-full flex flex-col overflow-hidden">
          <div className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-900">New Estimation</h2>
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex overflow-x-auto px-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      if (section.id.startsWith('flight-')) {
                        setSelectedFlightId(parseInt(section.id.split('-')[1]));
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-all duration-200 min-w-max text-sm ${
                      isActive 
                        ? 'border-blue-600 text-blue-700 bg-blue-50 font-semibold' 
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {renderSectionContent()}
          </div>
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Saving...' : 'Create Estimation'}
            </button>
          </div>
        </div>
      </div>
      {showProfileDropdown && (
        <ProfileDropdown 
          onClose={() => setShowProfileDropdown(false)}
          onProfileSelected={handleProfileDropdownSelect}
        />
      )}
    </div>
  );
};

export default EstimationPage;
