import React from 'react';
import { Calculator } from 'lucide-react';
import ProfileDropdown from '../ProfileDropdown';
import DimensionsSection from './DimensionsSection';

const MaterialsDimensions = ({
  formData,
  handleChange,
  calculatedValues,
  showProfileDropdown,
  setShowProfileDropdown,
  handleProfileDropdownSelect
}) => {
  return (
    <div className="space-y-8">
      {/* Profile Selection */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Profile Specification</h3>
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Profile Configuration</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
            >
              <span>{formData.profile || 'Select Profile Configuration'}</span>
              <span className="text-gray-400">Configure...</span>
            </button>
          </div>
          {formData.profile && (
            <div className="text-sm text-gray-600 bg-purple-100 p-3 rounded-lg">
              Selected Profile: <strong>{formData.profile}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Dimensions Section */}
      <DimensionsSection
        formData={formData}
        handleChange={handleChange}
        calculatedValues={calculatedValues}
      />

      {/* Profile Dropdown Modal */}
      {showProfileDropdown && (
        <ProfileDropdown 
          onClose={() => setShowProfileDropdown(false)}
          onProfileSelected={handleProfileDropdownSelect}
        />
      )}
    </div>
  );
};

export default MaterialsDimensions;