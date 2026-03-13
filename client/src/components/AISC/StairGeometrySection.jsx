// src/components/AISC/StairGeometrySection.jsx
import React, { useState } from 'react';
import { Building } from 'lucide-react';

// CORRECTED IMPORTS: Use '../menus/' instead of './menus/'
import StairGeometryInformation from '../menus/StairGeometryInformation';

const SidebarMenuItem = ({ 
  title, 
  icon: Icon, 
  isActive, 
  onClick,
  hasSubmenu = false,
  isExpanded = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left flex items-center justify-between transition-all duration-200 rounded border ${
        isActive 
          ? 'bg-blue-50 border-blue-200 text-blue-700' 
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        <span className="font-medium text-xs">{title}</span>
      </div>
    </button>
  );
};

const StairGeometrySection = ({
  formData,
  handleChange,
  calculatedValues,
  updateFlightGeometry,
  onApplyToAll,
  selectedFlightId,
  steelGrades,
  threadTypes,
  railingTypes,
  showProfileDropdown,
  setShowProfileDropdown,
  handleProfileDropdownSelect,
  handleFlightSaveStatus
}) => {
  const [activeMainMenu, setActiveMainMenu] = useState('stair-geometry');

  const commonProps = {
    formData,
    handleChange,
    calculatedValues,
    updateFlightGeometry,
    onApplyToAll,
    selectedFlightId,
    steelGrades,
    threadTypes,
    railingTypes,
    showProfileDropdown,
    setShowProfileDropdown,
    handleProfileDropdownSelect,
    handleFlightSaveStatus
  };

  // Main menu items configuration
  const mainMenuItems = [
    { 
      id: 'stair-geometry', 
      title: 'Stair Geometry', 
      icon: Building,
      component: StairGeometryInformation
    }
  ];

  const handleMainMenuClick = (menuId) => {
    setActiveMainMenu(menuId);
  };

  const getActiveComponent = () => {
    // Default to stair geometry
    return StairGeometryInformation;
  };

  const ActiveComponent = getActiveComponent();

  return (
    <div className="flex gap-4 h-full p-4">
      {/* Main Content Area - Maximized */}
      <div className="flex-1">
        <div className="bg-white rounded border border-gray-300 h-full overflow-auto">
          <div className="p-4">
            <ActiveComponent {...commonProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StairGeometrySection;