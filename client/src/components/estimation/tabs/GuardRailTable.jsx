import React from 'react';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import ArchitecturalInput from '../../common/ArchitecturalInput';

const GuardRailTable = ({
  guardRailData,
  setGuardRailData,
  categorizedRails,
  loadingPrices,
  calculations,
  handleGuardRailChange,
  handleGuardRailDetailChange,
  addNewGuardRail,
  removeGuardRail,
  customRailValues,
  setCustomRailValues,
  EditableRailDropdown,
  showCostColumns = true,
  filterId
}) => {
  // Calculate guard rail totals for global access
  React.useEffect(() => {
    window.guardRailTotalSteel = guardRailData.guardRails.reduce((sum, rail) => sum + rail.steelWithScrap, 0);
    window.guardRailTotalShopHours = guardRailData.guardRails.reduce((sum, rail) => sum + rail.shopHours, 0);
    window.guardRailTotalFieldHours = guardRailData.guardRails.reduce((sum, rail) => sum + rail.fieldHours, 0);
  }, [guardRailData]);

  return (
    <div className="bg-white rounded-md shadow-sm p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Guard Rail Estimation Table</h3>
        {loadingPrices && (
          <div className="flex items-center text-xs text-blue-600">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Loading rail data...
          </div>
        )}
      </div>

      {guardRailData.guardRails
        .filter(rail => filterId === undefined || rail.id === filterId)
        .map((rail) => (
          <div key={`guardrail-${rail.id}`} className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900">{rail.name}</h4>
              {rail.id > 0 && removeGuardRail && (
                <button
                  onClick={() => removeGuardRail(rail.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors flex items-center"
                  title="Remove guard rail"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </button>
              )}
            </div>

            {/* Guard Rail Table */}
            <div className="overflow-x-auto mb-6">
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
                      Rail Type & Values
                    </th>
                    {showCostColumns && (
                      <>
                        <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                          Field MH/LF
                        </th>
                        <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                          STEEL LBS/LF
                        </th>
                        <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                          SHOP HOURS
                        </th>
                        <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                          FIELD HOURS
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-3 text-xs font-medium text-gray-900 border-r border-gray-200 align-middle">
                      {rail.name}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-gray-200 align-middle">
                      <ArchitecturalInput
                        value={rail.length}
                        onChange={(val) => handleGuardRailChange(rail.id, 'length', val)}
                        className="w-24 px-2 py-1.5 text-xs text-center bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="0.000"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 align-middle">
                      <EditableRailDropdown
                        railType="guardRail"
                        value={rail.type}
                        onChange={(value) => handleGuardRailChange(rail.id, 'type', value)}
                        categorizedRails={categorizedRails}
                        customRailValues={customRailValues}
                        setCustomRailValues={setCustomRailValues}
                      />
                    </td>
                    {showCostColumns && (
                      <>
                        <td className="py-2 px-3 text-center border-r border-gray-200 align-middle">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              value={rail.fieldMHPerLF}
                              onChange={(e) => handleGuardRailChange(rail.id, 'fieldMHPerLF', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1.5 text-xs text-center bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              step="0.001"
                              min="0"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {rail.fieldMHPerLF.toFixed(3)} hrs/LF
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-blue-700 border-r border-gray-200 align-middle">
                          <div className="text-sm font-bold">
                            {rail.steelWithScrap.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rail.length} LF × {rail.steelPerLF.toFixed(3)} lbs/LF × 1.10
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-green-700 border-r border-gray-200 align-middle">
                          <div className="text-sm font-bold">
                            {rail.shopHours.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rail.length} LF × {rail.shopMHPerLF.toFixed(3)} hrs/LF
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-purple-700 align-middle">
                          <div className="text-sm font-bold">
                            {rail.fieldHours.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rail.length} LF × {rail.fieldMHPerLF.toFixed(3)} hrs/LF
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Guard Rail Configuration Details */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{rail.name} Configuration Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Intermediate Rails */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Intermediate Rails (ft)
                  </label>
                  <input
                    type="number"
                    value={rail.details.intermediateRails}
                    onChange={(e) => handleGuardRailDetailChange(rail.id, 'intermediateRails', parseFloat(e.target.value))}
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
                    value={rail.details.maxPostSpacing}
                    onChange={(e) => handleGuardRailDetailChange(rail.id, 'maxPostSpacing', parseFloat(e.target.value))}
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
                    value={rail.details.postQuantity}
                    onChange={(e) => handleGuardRailDetailChange(rail.id, 'postQuantity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Post Type Dropdown (Anchored/Embedded) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Post Type
                  </label>
                  <select
                    value={rail.details.postType}
                    onChange={(e) => handleGuardRailDetailChange(rail.id, 'postType', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="anchored">Anchored</option>
                    <option value="embedded">Embedded</option>
                  </select>
                </div>

                {/* Optional Feature Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Optional Feature
                  </label>
                  <select
                    value={rail.details.optionalFeature}
                    onChange={(e) => handleGuardRailDetailChange(rail.id, 'optionalFeature', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="none">None</option>
                    <option value="kick_plate">Kick Plate 4'x4'</option>
                    <option value="pipe_returns">Pipe Returns</option>
                  </select>
                </div>

                {/* Optional Quantity */}
                {rail.details.optionalFeature !== 'none' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {rail.details.optionalFeature === 'kick_plate' ? 'Kick Plate LF' : 'Pipe Returns Quantity'}
                    </label>
                    <input
                      type="number"
                      value={rail.details.optionalQuantity}
                      onChange={(e) => handleGuardRailDetailChange(rail.id, 'optionalQuantity', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      step={rail.details.optionalFeature === 'kick_plate' ? "0.001" : "1"}
                      min="0"
                    />
                  </div>
                )}

                {/* Kick Plate (hidden when not selected) */}
                {rail.details.optionalFeature === 'kick_plate' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kick Plate (LF)
                    </label>
                    <input
                      type="number"
                      value={rail.details.kickPlate}
                      onChange={(e) => handleGuardRailDetailChange(rail.id, 'kickPlate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      step="0.001"
                      min="0"
                    />
                  </div>
                )}

                {/* Pipe Returns (hidden when not selected) */}
                {rail.details.optionalFeature === 'pipe_returns' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pipe Returns
                    </label>
                    <input
                      type="number"
                      value={rail.details.pipeReturns}
                      onChange={(e) => handleGuardRailDetailChange(rail.id, 'pipeReturns', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      step="1"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Add New Guard Rail Button */}
      {addNewGuardRail && (
        <div className="mb-6">
          <button
            onClick={addNewGuardRail}
            disabled={guardRailData.guardRails.length > 5}
            className={`w-full px-3 py-3 text-sm rounded flex items-center justify-center ${guardRailData.guardRails.length > 5
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Guard Rail
          </button>
        </div>
      )}

      {/* Total Row */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-2 px-3 text-left font-semibold border border-gray-600">
                GUARD RAIL TOTALS
              </th>
              <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                Linear Feet
              </th>
              {showCostColumns && (
                <>
                  <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                    FIELD MH/LF AVG
                  </th>
                  <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                    STEEL LBS/LF
                  </th>
                  <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                    SHOP HOURS
                  </th>
                  <th className="py-2 px-3 text-center font-semibold border border-gray-600 whitespace-nowrap">
                    FIELD HOURS
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-800 text-white">
              <td className="py-3 px-3 text-sm font-bold border border-gray-600">
                TOTAL
              </td>
              <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                {calculations.guardRailLF.toFixed(3)} LF
              </td>
              {showCostColumns && (
                <>
                  <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                    {guardRailData.guardRails.length > 0
                      ? (guardRailData.guardRails.reduce((sum, rail) => sum + rail.fieldMHPerLF, 0) / guardRailData.guardRails.length).toFixed(3)
                      : '0.000'} hrs/LF
                  </td>
                  <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                    {guardRailData.guardRails.reduce((sum, rail) => sum + rail.steelWithScrap, 0).toFixed(3)} lbs
                  </td>
                  <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                    {guardRailData.guardRails.reduce((sum, rail) => sum + rail.shopHours, 0).toFixed(3)} hrs
                  </td>
                  <td className="py-3 px-3 text-sm text-center font-bold border border-gray-600">
                    {guardRailData.guardRails.reduce((sum, rail) => sum + rail.fieldHours, 0).toFixed(3)} hrs
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuardRailTable;