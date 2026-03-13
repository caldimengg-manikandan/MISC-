import React from 'react';
import { Save, Download, Calculator, Settings, User, DollarSign } from 'lucide-react';

const EstimationSummary = ({ calculations }) => {
  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4 border border-blue-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Estimation Summary</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {}}
            className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors flex items-center"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Report
          </button>
          <button type="button" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors flex items-center">
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-blue-900 mb-1">Wall & Grab Rail LF</div>
              <div className="text-lg font-bold text-blue-700">
                {calculations.wallRailLF + calculations.grabRailLF} LF
              </div>
            </div>
            <div className="p-2 bg-blue-200 rounded-lg">
              <Calculator className="w-4 h-4 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-green-900 mb-1">Guard Rail LF</div>
              <div className="text-lg font-bold text-green-700">
                {calculations.guardRailLF} LF
              </div>
            </div>
            <div className="p-2 bg-green-200 rounded-lg">
              <Settings className="w-4 h-4 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-yellow-900 mb-1">Total Steel Weight</div>
              <div className="text-lg font-bold text-yellow-700">
                {calculations.totalSteelWithScrap} lbs
              </div>
            </div>
            <div className="p-2 bg-yellow-200 rounded-lg">
              <Settings className="w-4 h-4 text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-purple-900 mb-1">Total Hours</div>
              <div className="text-lg font-bold text-purple-700">
                {calculations.totalShopHours + calculations.totalFieldHours} hrs
              </div>
            </div>
            <div className="p-2 bg-purple-200 rounded-lg">
              <User className="w-4 h-4 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-red-900 mb-1">Estimated Cost</div>
              <div className="text-lg font-bold text-red-700">
                ${calculations.totalCost.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-red-200 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimationSummary;