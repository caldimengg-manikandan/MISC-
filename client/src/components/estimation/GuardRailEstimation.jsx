// src/components/estimation/GuardRailEstimation.jsx
import React, { useState, useEffect } from 'react';
import { Save, Calculator, Plus, Trash2, RefreshCw, ChevronDown, Upload, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import RailDropdown from './RailDropdown';

const GuardRailEstimation = () => {
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
        fieldHours: 0
      }
    ],
    // Additional fields from reference image
    details: {
      lineType: '2-Line Picket Guardrail wIY2',
      intermediateRails: 0,
      maxPostSpacing: 4.000,
      postQuantity: 0.00,
      anchored: true,
      optional: false,
      kickPlate: 0.000,
      pipeReturnQuantity: 0,
      pipeReturns: [],
      ballType: '2-Line Steel Pipe Guardrail 1\'K" Sch 40 Pipe Rails and Fast'
    }
  });

  const [categorizedRails, setCategorizedRails] = useState({
    guardRail: []
  });
  const [loadingPrices, setLoadingPrices] = useState(false);

  const [calculations, setCalculations] = useState({
    totalLF: 0,
    totalSteelWithScrap: 0,
    totalShopHours: 0,
    totalFieldHours: 0,
    totalCost: 0
  });

  useEffect(() => {
    fetchGuardRailData();
    calculateGuardRailTotals();
  }, []);

  const fetchGuardRailData = async () => {
    try {
      setLoadingPrices(true);
      const token = localStorage.getItem('steel_token');
      
      if (!token) {
        console.error('No auth token found in localStorage');
        toast.error('Please login first');
        setLoadingPrices(false);
        return;
      }

      const response = await fetch('${API_BASE_URL}/api/debug/categorized-rails', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCategorizedRails({
          guardRail: data.data.guardRail || []
        });
        
        toast.success(`Loaded ${data.data.guardRail?.length || 0} guard rail items`);
      } else {
        console.error('API returned success:false', data.error);
        toast.error('Failed to load guard rail data');
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch guard rail data: ' + error.message);
      setFallbackGuardRails();
    } finally {
      setLoadingPrices(false);
    }
  };

  const setFallbackGuardRails = () => {
    const fallbackData = {
      guardRail: [
        {
          id: 'guardRail_1',
          description: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post',
          steelLbsPerLF: 6.840,
          shopMHPerLF: 0.500,
          fieldMHPerLF: 0.350
        },
        {
          id: 'guardRail_2',
          description: '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post',
          steelLbsPerLF: 8.160,
          shopMHPerLF: 0.600,
          fieldMHPerLF: 0.375
        },
        {
          id: 'guardRail_3',
          description: '1-Line Steel Floor Mounted Handrail 1\'M" SCH 40',
          steelLbsPerLF: 3.500,
          shopMHPerLF: 0.350,
          fieldMHPerLF: 0.300
        }
      ]
    };

    setCategorizedRails(fallbackData);
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

  const handleGuardRailChange = (railId, field, value) => {
    setGuardRailData(prev => {
      const updatedRails = prev.guardRails.map(rail => {
        if (rail.id !== railId) return rail;

        if (field === 'type') {
          const selectedRail = categorizedRails.guardRail.find(r => r.id === value);
          
          const updatedRail = {
            ...rail,
            type: value,
            steelPerLF: selectedRail?.steelLbsPerLF || 0,
            shopMHPerLF: selectedRail?.shopMHPerLF || 0,
            fieldMHPerLF: selectedRail?.fieldMHPerLF || 0
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

  const handleDetailChange = (field, value) => {
    setGuardRailData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value
      }
    }));
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
      fieldHours: 0
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

  const calculateGuardRailTotals = () => {
    let totalLF = 0;
    let totalSteelWithScrap = 0;
    let totalShopHours = 0;
    let totalFieldHours = 0;

    guardRailData.guardRails.forEach(rail => {
      totalLF += rail.length || 0;
      totalSteelWithScrap += rail.steelWithScrap || 0;
      totalShopHours += rail.shopHours || 0;
      totalFieldHours += rail.fieldHours || 0;
    });

    const steelCostPerLB = 2.00;
    const totalCost = totalSteelWithScrap * steelCostPerLB;

    setCalculations({
      totalLF: parseFloat(totalLF.toFixed(3)),
      totalSteelWithScrap: parseFloat(totalSteelWithScrap.toFixed(3)),
      totalShopHours: parseFloat(totalShopHours.toFixed(3)),
      totalFieldHours: parseFloat(totalFieldHours.toFixed(3)),
      totalCost: parseFloat(totalCost.toFixed(2))
    });
  };

  useEffect(() => {
    calculateGuardRailTotals();
  }, [guardRailData.guardRails]);

  const handleSubmit = async () => {
    calculateGuardRailTotals();

    try {
      const token = localStorage.getItem('steel_token');

      const response = await fetch('http://localhost:5000/api/guard-rails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guardRailData)
      });

      if (response.ok) {
        toast.success('Guard rail estimation saved successfully!');
      } else {
        throw new Error('Failed to save guard rail estimation');
      }
    } catch (error) {
      toast.error('Failed to save guard rail estimation');
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Guard Rail Estimation</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGuardRailData}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors flex items-center"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loadingPrices ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors flex items-center"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </button>
        </div>
      </div>

      {/* Guard Rail Details Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Guard Rail Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Line Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              2-Line Type
            </label>
            <select
              value={guardRailData.details.lineType}
              onChange={(e) => handleDetailChange('lineType', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="2-Line Picket Guardrail wIY2">2-Line Picket Guardrail wIY2</option>
              <option value="2-Line Steel Pipe Guardrail">2-Line Steel Pipe Guardrail</option>
              <option value="1-Line Steel Floor Mounted Handrail">1-Line Steel Floor Mounted Handrail</option>
            </select>
          </div>

          {/* Intermediate Rails */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Intermediate Rails (ft)
            </label>
            <input
              type="number"
              value={guardRailData.details.intermediateRails}
              onChange={(e) => handleDetailChange('intermediateRails', parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              step="0.5"
              min="0"
            />
          </div>

          {/* Max Post Spacing */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max Post Spacing (FL)
            </label>
            <input
              type="number"
              value={guardRailData.details.maxPostSpacing}
              onChange={(e) => handleDetailChange('maxPostSpacing', parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              step="0.5"
              min="0"
            />
          </div>

          {/* Post Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Post Quantity
            </label>
            <input
              type="number"
              value={guardRailData.details.postQuantity}
              onChange={(e) => handleDetailChange('postQuantity', parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              step="0.01"
              min="0"
            />
          </div>

          {/* Kick Plate */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kick Plate (LF)
            </label>
            <input
              type="number"
              value={guardRailData.details.kickPlate}
              onChange={(e) => handleDetailChange('kickPlate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              step="0.001"
              min="0"
            />
          </div>

          {/* Pipe Return Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pipe Return Qty
            </label>
            <input
              type="number"
              value={guardRailData.details.pipeReturnQuantity}
              onChange={(e) => handleDetailChange('pipeReturnQuantity', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              min="0"
            />
          </div>
        </div>

        {/* Anchored & Optional Checkboxes */}
        <div className="flex items-center space-x-4 mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={guardRailData.details.anchored}
              onChange={(e) => handleDetailChange('anchored', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Anchored</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={guardRailData.details.optional}
              onChange={(e) => handleDetailChange('optional', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Optional</span>
          </label>
        </div>

        {/* Ball Type */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ball Type
          </label>
          <select
            value={guardRailData.details.ballType}
            onChange={(e) => handleDetailChange('ballType', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="2-Line Steel Pipe Guardrail 1'K' Sch 40 Pipe Rails and Fast">
              2-Line Steel Pipe Guardrail 1'K" Sch 40 Pipe Rails and Fast
            </option>
            <option value="1-Line Steel Floor Mounted Handrail 1'M' SCH 40">
              1-Line Steel Floor Mounted Handrail 1'M" SCH 40
            </option>
          </select>
        </div>
      </div>

      {/* Guard Rail Estimation Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-2 px-3 text-left font-semibold border border-gray-600">
                Guard Rail
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                Linear Feet
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                STEEL LBS/LF
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                FIELD MH/LF
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                STEEL (+10% SCRAP) LBS
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                SHOP HOURS
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                FIELD HOURS
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {guardRailData.guardRails.map((rail) => (
              <tr key={rail.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-3 text-xs font-medium text-gray-900 border-r border-gray-200 align-middle">
                  {rail.name}
                </td>
                <td className="py-2 px-3 text-center border-r border-gray-200 align-middle">
                  <input
                    type="number"
                    value={rail.length}
                    onChange={(e) => handleGuardRailChange(rail.id, 'length', parseFloat(e.target.value))}
                    className="w-24 px-2 py-1.5 text-xs text-center bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                  />
                </td>
                <td className="py-2 px-3 border-r border-gray-200 align-middle">
                  <div className="flex flex-col space-y-1">
                    <RailDropdown
                      compact
                      type="guard_rail"
                      value={rail.type}
                      onChange={(value) => handleGuardRailChange(rail.id, 'type', value)}
                      categorizedRails={categorizedRails}
                    />
                    <input
                      type="number"
                      value={rail.steelPerLF}
                      className="w-full px-2 py-1.5 text-xs text-center bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      readOnly
                    />
                  </div>
                </td>
                <td className="py-2 px-3 text-center border-r border-gray-200 align-middle">
                  <input
                    type="number"
                    value={rail.fieldMHPerLF}
                    className="w-20 px-2 py-1.5 text-xs text-center bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    readOnly
                  />
                </td>
                <td className="py-2 px-3 text-center font-medium text-blue-700 border-r border-gray-200 align-middle">
                  <div className="text-sm font-bold">
                    {rail.steelWithScrap.toFixed(3)}
                  </div>
                </td>
                <td className="py-2 px-3 text-center font-medium text-green-700 border-r border-gray-200 align-middle">
                  <div className="text-sm font-bold">
                    {rail.shopHours.toFixed(3)}
                  </div>
                </td>
                <td className="py-2 px-3 text-center font-medium text-purple-700 border-r border-gray-200 align-middle">
                  <div className="text-sm font-bold">
                    {rail.fieldHours.toFixed(3)}
                  </div>
                </td>
                <td className="py-2 px-3 text-center align-middle">
                  {rail.id > 0 && (
                    <button
                      onClick={() => removeGuardRail(rail.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove guard rail"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {/* Add New Rail Row */}
            <tr>
              <td colSpan="8" className="py-2 px-3">
                <button
                  onClick={addNewGuardRail}
                  disabled={guardRailData.guardRails.length > 5}
                  className={`w-full px-3 py-2 text-xs rounded flex items-center justify-center ${
                    guardRailData.guardRails.length > 5
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Guard Rail
                </button>
              </td>
            </tr>

            {/* Total Row */}
            <tr className="bg-gray-800 text-white">
              <td className="py-3 px-3 text-sm font-bold border border-gray-600">
                TOTAL
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {calculations.totalLF.toFixed(3)} LF
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {guardRailData.guardRails.reduce((sum, rail) => sum + rail.steelPerLF, 0).toFixed(3)} lbs/LF avg
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {guardRailData.guardRails.reduce((sum, rail) => sum + rail.fieldMHPerLF, 0).toFixed(3)} hrs/LF avg
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {calculations.totalSteelWithScrap.toFixed(3)} lbs
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {calculations.totalShopHours.toFixed(3)} hrs
              </td>
              <td colSpan="2" className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {calculations.totalFieldHours.toFixed(3)} hrs
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Additional Platforms Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Platforms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Platform 1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Platform 1</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Metal pan stair platform 10-01</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Length</label>
                <input
                  type="number"
                  value="9.660"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  value="4.330"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  readOnly
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Area: 41.79 SQ. FT.</span>
            </div>
          </div>

          {/* Platform 2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Platform 2</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Length</label>
                <input
                  type="number"
                  value="0.000"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  value="0.000"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  readOnly
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Area: 0.000 SQ. FT.</span>
            </div>
          </div>
        </div>

        {/* Start Metal Pans Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Start Metal Pans</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                value="0"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tread (In.)</label>
              <input
                type="number"
                value="11.000"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Riser (In.)</label>
              <input
                type="number"
                value="7.000"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width of Stairs</label>
              <input
                type="number"
                value="4.330"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                readOnly
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Stringer: Rise Slot 4'-0" wide 14' 0" - 19'-0" Long Stringer MC 12 x 14.3
          </div>
        </div>
      </div>

      {/* Calculation Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium text-blue-900 mb-1">Total Linear Feet</div>
            <div className="text-lg font-bold text-blue-700">{calculations.totalLF} LF</div>
          </div>
          <div>
            <div className="text-xs font-medium text-green-900 mb-1">Total Steel Weight</div>
            <div className="text-lg font-bold text-green-700">{calculations.totalSteelWithScrap} lbs</div>
          </div>
          <div>
            <div className="text-xs font-medium text-yellow-900 mb-1">Shop Hours</div>
            <div className="text-lg font-bold text-yellow-700">{calculations.totalShopHours} hrs</div>
          </div>
          <div>
            <div className="text-xs font-medium text-red-900 mb-1">Estimated Cost</div>
            <div className="text-lg font-bold text-red-700">${calculations.totalCost.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => calculateGuardRailTotals()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate Totals
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardRailEstimation;