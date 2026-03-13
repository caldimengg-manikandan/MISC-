import React from 'react';

const RightEndSettings = ({ formData, handleChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Right End Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Right End Type
          </label>
          <select
            name="rightEndType"
            value={formData.rightEndType || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select End Type</option>
            <option value="wall-mounted">Wall Mounted</option>
            <option value="free-standing">Free Standing</option>
            <option value="beam-connected">Beam Connected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mounting Height
          </label>
          <input
            type="number"
            name="rightMountingHeight"
            value={formData.rightMountingHeight || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Inches"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clearance
          </label>
          <input
            type="number"
            name="rightClearance"
            value={formData.rightClearance || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Inches"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Spacing
          </label>
          <input
            type="number"
            name="rightSupportSpacing"
            value={formData.rightSupportSpacing || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Inches"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Include Bracket
          </label>
          <input
            type="checkbox"
            name="rightIncludeBracket"
            checked={formData.rightIncludeBracket || false}
            onChange={(e) => handleChange({
              target: { name: 'rightIncludeBracket', value: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Reinforced Connection
          </label>
          <input
            type="checkbox"
            name="rightReinforced"
            checked={formData.rightReinforced || false}
            onChange={(e) => handleChange({
              target: { name: 'rightReinforced', value: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default RightEndSettings;