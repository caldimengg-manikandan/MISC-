import React from 'react';

const GeneralSettings = ({ formData, handleChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">General Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Type
          </label>
          <select
            name="projectType"
            value={formData.projectType || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Project Type</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stair Category
          </label>
          <select
            name="stairCategory"
            value={formData.stairCategory || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Category</option>
            <option value="straight-run">Straight Run</option>
            <option value="l-shaped">L-Shaped</option>
            <option value="u-shaped">U-Shaped</option>
            <option value="spiral">Spiral</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Building Code
          </label>
          <select
            name="buildingCode"
            value={formData.buildingCode || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Code</option>
            <option value="aisc">AISC</option>
            <option value="ibc">IBC</option>
            <option value="osha">OSHA</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Safety Factor
          </label>
          <input
            type="number"
            name="safetyFactor"
            value={formData.safetyFactor || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1.5"
            step="0.1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="includeHandrails"
            checked={formData.includeHandrails || false}
            onChange={(e) => handleChange({
              target: { name: 'includeHandrails', value: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">Include Handrails</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="includeGuardrails"
            checked={formData.includeGuardrails || false}
            onChange={(e) => handleChange({
              target: { name: 'includeGuardrails', value: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">Include Guardrails</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="shopAssembly"
            checked={formData.shopAssembly || false}
            onChange={(e) => handleChange({
              target: { name: 'shopAssembly', value: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">Shop Assembly</label>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;