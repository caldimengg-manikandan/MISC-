import React from 'react';
import { Layers, Plus } from 'lucide-react';

const MaterialsSection = ({
  formData,
  handleChange,
  steelGrades,
  threadTypes,
  newSteelGrade,
  setNewSteelGrade,
  newSteelGradeImage,
  setNewSteelGradeImage,
  newThreadType,
  setNewThreadType,
  newThreadTypeImage,
  setNewThreadTypeImage,
  handleAddSteelGrade,
  handleAddThreadType
}) => {
  const selectedSteelGrade = steelGrades.find(grade => grade.name === formData.steelGrade);
  const selectedThreadType = threadTypes.find(type => type.name === formData.threadType);

  return (
    <div className="space-y-8">
      {/* Steel Grade Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Steel Grade *</label>
            <div className="flex gap-3">
              <select
                name="steelGrade"
                value={formData.steelGrade}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Steel Grade</option>
                {steelGrades.map((grade) => (
                  <option key={grade.name} value={grade.name}>{grade.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Add Custom Steel Grade */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700">
              Add Custom Steel Grade
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSteelGrade}
                onChange={(e) => setNewSteelGrade(e.target.value)}
                placeholder="Steel grade name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddSteelGrade}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newSteelGradeImage}
              onChange={(e) => setNewSteelGradeImage(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Steel Grade Image Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Steel Grade Preview</label>
          <div className="h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {selectedSteelGrade ? (
              <img 
                src={selectedSteelGrade.image} 
                alt={selectedSteelGrade.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <Layers className="w-12 h-12 mx-auto mb-2" />
                <p>Select a steel grade to preview</p>
              </div>
            )}
          </div>
          {selectedSteelGrade && (
            <p className="text-sm text-gray-600 text-center">{selectedSteelGrade.name}</p>
          )}
        </div>
      </div>

      {/* Thread Type Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Thread Type *</label>
            <div className="flex gap-3">
              <select
                name="threadType"
                value={formData.threadType}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Thread Type</option>
                {threadTypes.map((type) => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Add Custom Thread Type */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700">
              Add Custom Thread Type
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newThreadType}
                onChange={(e) => setNewThreadType(e.target.value)}
                placeholder="Thread type name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddThreadType}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newThreadTypeImage}
              onChange={(e) => setNewThreadTypeImage(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Thread Type Image Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Thread Type Preview</label>
          <div className="h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
            {selectedThreadType ? (
              <img 
                src={selectedThreadType.image} 
                alt={selectedThreadType.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <Layers className="w-12 h-12 mx-auto mb-2" />
                <p>Select a thread type to preview</p>
              </div>
            )}
          </div>
          {selectedThreadType && (
            <p className="text-sm text-gray-600 text-center">{selectedThreadType.name}</p>
          )}
        </div>
      </div>

      {/* Additional Material Specifications */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Riser Height - Max (inches)
            </label>
            <input
              type="text"
              name="riserHeightMax"
              value={formData.riserHeightMax}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder='7"'
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Riser Height - Min (inches)
            </label>
            <input
              type="text"
              name="riserHeightMin"
              value={formData.riserHeightMin}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder='1"'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsSection;