// src/components/estimation/components/TabNavigation.jsx
import React from 'react';
import { Building, Shield } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab, tabs = [] }) => {
  const defaultTabs = [
    { id: 'wallRail', label: 'Wall & Grab Rails', icon: <Building className="w-4 h-4 mr-2" /> },
    { id: 'guardRail', label: 'Guard Rails', icon: <Shield className="w-4 h-4 mr-2" /> }
  ];

  const tabItems = tabs.length > 0 ? tabs : defaultTabs;

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;