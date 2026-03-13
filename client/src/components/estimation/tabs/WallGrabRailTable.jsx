import React from 'react';
import { Bug, RefreshCw } from 'lucide-react';
import ArchitecturalInput from '../../common/ArchitecturalInput';

const WallGrabRailTable = ({
  formData,
  setFormData,
  categorizedRails,
  loadingPrices,
  handleStairRailChange,
  addNewStair,
  removeStair,
  calculations,
  customRailValues,
  setCustomRailValues,
  EditableRailDropdown,
  filterId
}) => {
  return (
    <div className="bg-white rounded-md shadow-sm p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Wall & Grab Rail Estimation Table</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open('/debug/handrail', '_blank')}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-md hover:bg-orange-600 transition-colors flex items-center"
          >
            <Bug className="w-3 h-3 mr-1" />
            Debug Excel
          </button>
          {loadingPrices && (
            <div className="flex items-center text-xs text-blue-600">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Loading rail data...
            </div>
          )}
        </div>
      </div>

      {/* Flights Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-900">Flights:</div>
          <div className="flex flex-wrap gap-2">
            {formData.stairs.map((stair, index) => (
              <div
                key={stair.id}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg border border-blue-200 flex items-center gap-2"
              >
                FL-{String(index + 1).padStart(3, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-300">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-3 px-4 text-left font-semibold border-r border-gray-600 w-1/4">
                Flight
              </th>
              <th className="py-3 px-4 text-center font-semibold border-r border-gray-600 w-1/6">
                Linear Feet
              </th>
              <th className="py-3 px-4 text-center font-semibold border-r border-gray-600 w-1/2">
                Rail Type & Values
              </th>
            </tr>
          </thead>
          <tbody>
            {formData.stairs
              .filter(stair => filterId === undefined || stair.id === filterId)
              .map((stair) => {
                const flightIndex = formData.stairs.findIndex(s => s.id === stair.id);
                return (
              <React.Fragment key={stair.id}>
                {/* Flight Separator */}
                <tr className="bg-gray-50">
                  <td colSpan="3" className="py-2 px-4">
                    <div className="text-sm font-medium text-gray-700">
                      FL-{String(flightIndex + 1).padStart(3, '0')} ( RAIL  {flightIndex + 1})
                    </div>
                  </td>
                </tr>

                {/* Wall Rail Row */}
                <tr className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 border-r border-gray-200 align-top">
                    <div className="flex items-start">
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded mr-2">
                        FL-{String(flightIndex + 1).padStart(3, '0')}
                      </span>
                      <span>Wall Rail</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center border-r border-gray-200 align-top">
                    <ArchitecturalInput
                      value={stair.wallRail.length || 0}
                      onChange={(val) => handleStairRailChange(stair.id, 'wallRail', 'length', val)}
                      className="w-32 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.000"
                    />
                    {stair.wallRail.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {stair.wallRail.length.toFixed(3)} LF
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200 align-top">
                    {/* First Rail Type Selection */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2 font-medium">Select a rail type</div>
                      <EditableRailDropdown
                        railType="wallRail"
                        value={stair.wallRail.type}
                        onChange={(value) => handleStairRailChange(stair.id, 'wallRail', 'type', value)}
                        categorizedRails={categorizedRails}
                        customRailValues={customRailValues}
                        setCustomRailValues={setCustomRailValues}
                      />
                    </div>
                  </td>
                </tr>

                {/* Grab Rail Row */}
                <tr className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 border-r border-gray-200 align-top">
                    <div className="flex items-start">
                      <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded mr-2">
                        FL-{String(flightIndex + 1).padStart(3, '0')}
                      </span>
                      <span>Grab Rail</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center border-r border-gray-200 align-top">
                    <ArchitecturalInput
                      value={stair.grabRail.length || 0}
                      onChange={(val) => handleStairRailChange(stair.id, 'grabRail', 'length', val)}
                      className="w-32 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.000"
                    />
                    {stair.grabRail.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {stair.grabRail.length.toFixed(3)} LF
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-200 align-top">
                    {/* First Rail Type Selection */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2 font-medium">Select a rail type</div>
                      <EditableRailDropdown
                        railType="grabRail"
                        value={stair.grabRail.type}
                        onChange={(value) => handleStairRailChange(stair.id, 'grabRail', 'type', value)}
                        categorizedRails={categorizedRails}
                        customRailValues={customRailValues}
                        setCustomRailValues={setCustomRailValues}
                      />
                    </div>
                  </td>
                </tr>

                {/* Separator between flights */}
                <tr>
                  <td colSpan="3" className="h-6 bg-gray-100"></td>
                </tr>
              </React.Fragment>
            );
          })}

            {/* Summary Row */}
            <tr className="bg-gray-800 text-white">
              <td className="py-3 px-4 text-sm font-bold border-t border-gray-600">
                TOTAL
              </td>
              <td className="py-3 px-4 text-sm text-center font-bold border-t border-gray-600">
                {(calculations.wallRailLF + calculations.grabRailLF).toFixed(3)} LF
              </td>
              <td className="py-3 px-4 text-sm text-center font-bold border-t border-gray-600">
                
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Total Wall Rail Length</div>
          <div className="text-2xl font-bold text-blue-800">{calculations.wallRailLF.toFixed(3)} LF</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">Total Grab Rail Length</div>
          <div className="text-2xl font-bold text-green-800">{calculations.grabRailLF.toFixed(3)} LF</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Total Combined Length</div>
          <div className="text-2xl font-bold text-purple-800">
            {(calculations.wallRailLF + calculations.grabRailLF).toFixed(3)} LF
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallGrabRailTable;