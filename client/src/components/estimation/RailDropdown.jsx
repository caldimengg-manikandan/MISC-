import React from 'react';
import { ChevronDown } from 'lucide-react';

const RailDropdown = ({ 
  compact, 
  type, 
  value, 
  onChange,
  categorizedRails = { wallRail: [], grabRail: [], guardRail: [] }
}) => {
  // Get options based on rail type
  const getOptions = () => {
    switch(type) {
      case 'wall_rail':
        return categorizedRails.wallRail || [];
      case 'grab_rail':
        return categorizedRails.grabRail || [];
      case 'guard_rail':
        return categorizedRails.guardRail || [];
      default:
        return [];
    }
  };

  const options = getOptions();
  
  // Find selected option
  const selectedOption = options.find(opt => opt.id === value);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    onChange(selectedId); // Pass only the ID
  };

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={handleChange}
        className={`w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
          compact ? 'pr-6' : 'pr-8'
        }`}
      >
        <option value="">Select {type.replace('_', ' ')} type</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.description}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
      
      {/* Show price info for selected option */}
      {selectedOption && (
        <div className="mt-1 text-xs text-gray-600">
          <div className="grid grid-cols-3 gap-1">
            <div className="text-center">
              <span className="font-medium">Steel:</span>
              <br />
              {selectedOption.steelLbsPerLF?.toFixed(3) || '0.000'} lbs/LF
            </div>
            <div className="text-center">
              <span className="font-medium">Shop:</span>
              <br />
              {selectedOption.shopMHPerLF?.toFixed(3) || '0.000'} MH/LF
            </div>
            <div className="text-center">
              <span className="font-medium">Field:</span>
              <br />
              {selectedOption.fieldMHPerLF?.toFixed(3) || '0.000'} MH/LF
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RailDropdown;