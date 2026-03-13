import React from 'react';
import { Building, Plus, Trash2 } from 'lucide-react';

const ProjectInfo = ({ 
  formData, 
  handleChange,
  addFlight,
  removeFlight,
  updateFlightNumber
}) => {
  const addStair = () => {
    const current = formData.stairs || [];
    const nextId = current.length ? Math.max(...current.map(s => s.id)) + 1 : 0;
    const updated = [...current, { id: nextId, name: `Stair ${nextId}` }];
    handleChange({ target: { name: 'stairs', value: updated } });
  };

  const removeStair = (stairId) => {
    const updated = (formData.stairs || []).filter(s => s.id !== stairId);
    handleChange({ target: { name: 'stairs', value: updated } });
  };
  return (
    <div className="space-y-8">
      {/* Project Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Project Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Project Number *
            </label>
            <input
              type="text"
              name="projectNumber"
              value={formData.projectNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="PRJ-001"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter project name"
            />
          </div>
        </div>
      </div>

      {/* Stair Name */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Stair Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Stair Name</label>
            <input
              type="text"
              name="stairName"
              value={formData.stairName || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Main Staircase"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {((formData.stairs && formData.stairs.length > 0) ? formData.stairs : [{ id: 0, name: 'Stair 0' }]).map(stair => (
                <span key={stair.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-xl border border-gray-300">
                  {stair.name}
                  <button
                    type="button"
                    onClick={() => removeStair(stair.id)}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Delete stair"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={addStair}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-green-600 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50"
              >
                <Plus className="w-3 h-3" /> Add Stair
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Landing Configuration</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'landingType', value: 'with-landing' } })}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  formData.landingType === 'with-landing'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                With Landing
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'landingType', value: 'without-landing' } })}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  formData.landingType === 'without-landing'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                Without Landing
              </button>
            </div>
          </div>

          {formData.landingType === 'with-landing' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Number of Landings</label>
              <select
                name="numberOfLandings"
                value={formData.numberOfLandings || 0}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>0 - No Landing</option>
                <option value={1}>1 Landing</option>
                <option value={2}>2 Landings</option>
                <option value={3}>3 Landings</option>
                <option value={4}>4+ Landings</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Flight Numbers */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Flight Numbers</label>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {(formData.flights || []).map((flight) => (
            <div key={flight.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={flight.number || ''}
                onChange={(e) => updateFlightNumber(flight.id, e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fl--01"
              />
              <button
                type="button"
                onClick={() => removeFlight(flight.id)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete flight"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFlight}
            className="flex items-center gap-2 px-4 py-3 text-green-600 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-colors w-full justify-center"
          >
            + Add Another Flight
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;