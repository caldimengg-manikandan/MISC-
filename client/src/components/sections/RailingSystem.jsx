import React from 'react';
import { GripVertical, Plus } from 'lucide-react';

const RailingSystem = ({
  formData,
  handleChange,
  railingTypes,
  customRailingType,
  setCustomRailingType,
  handleAddRailingType
}) => {
  return (
    <div className="space-y-6">
      {/* Railing Type */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-orange-600" />
          Railing Type *
        </label>
        <div className="flex gap-3">
          <select
            name="railingType"
            value={formData.railingType}
            onChange={handleChange}
            required
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Railing Type</option>
            {railingTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customRailingType}
            onChange={(e) => setCustomRailingType(e.target.value)}
            placeholder="Add custom railing type"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddRailingType}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Post Spacing */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Post to Post Spacing (inches)
          </label>
          <input
            type="text"
            name="postToPostSpacing"
            value={formData.postToPostSpacing}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Railing Height */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Railing Height (inches) *
          </label>
          <input
            type="number"
            name="railingTopHeight"
            value={formData.railingTopHeight}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="42"
          />
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Stringer Size *
          </label>
          <input
            type="text"
            name="stringerSize"
            value={formData.stringerSize}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="2x6"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Railing Size *
          </label>
          <input
            type="text"
            name="railingSize"
            value={formData.railingSize}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="1.5x1.5"
          />
        </div>
      </div>
    </div>
  );
};

export default RailingSystem;