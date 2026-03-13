// src/components/estimation/components/DataStatusBar.jsx
import React from 'react';
import { RefreshCw } from 'lucide-react';

const DataStatusBar = ({ categorizedRails, loadingPrices, onRefresh }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Rail Data Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center bg-white/50 p-2 rounded">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div>
                <p className="text-xs text-gray-600">Wall Rail</p>
                <p className="text-sm font-semibold text-blue-700">{categorizedRails.wallRail.length} items</p>
              </div>
            </div>
            
            <div className="flex items-center bg-white/50 p-2 rounded">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-xs text-gray-600">Grab Rail</p>
                <p className="text-sm font-semibold text-green-700">{categorizedRails.grabRail.length} items</p>
              </div>
            </div>
            
            <div className="flex items-center bg-white/50 p-2 rounded">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <div>
                <p className="text-xs text-gray-600">Guard Rail</p>
                <p className="text-sm font-semibold text-red-700">{categorizedRails.guardRail.length} items</p>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onRefresh}
          disabled={loadingPrices}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrices ? 'animate-spin' : ''}`} />
          {loadingPrices ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default DataStatusBar;