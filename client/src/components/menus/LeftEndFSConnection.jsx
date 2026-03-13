import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ConnectionSubMenu = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        className="w-full p-3 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900 text-sm">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-gray-50 border-t border-gray-200">{children}</div>}
    </div>
  );
};

const LeftEndFSConnection = ({ formData, handleChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Left End FS Connection</h4>
      
      <ConnectionSubMenu title="Connection Type" defaultOpen={true}>
        <div className="space-y-4">
          <select
            name="leftFSConnectionType"
            value={formData.leftFSConnectionType || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Connection Type</option>
            <option value="welded">Welded</option>
            <option value="bolted">Bolted</option>
            <option value="pinned">Pinned</option>
            <option value="sliding">Sliding</option>
          </select>
        </div>
      </ConnectionSubMenu>

      <ConnectionSubMenu title="Connection Specification">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bolt Size
            </label>
            <input
              type="text"
              name="leftFSBoltSize"
              value={formData.leftFSBoltSize || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 3/4&quot;"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bolt Grade
            </label>
            <input
              type="text"
              name="leftFSBoltGrade"
              value={formData.leftFSBoltGrade || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A325"
            />
          </div>
        </div>
      </ConnectionSubMenu>

      <ConnectionSubMenu title="Material Settings">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Material
            </label>
            <select
              name="leftFSConnectionMaterial"
              value={formData.leftFSConnectionMaterial || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Material</option>
              <option value="A36">A36 Steel</option>
              <option value="A992">A992 Steel</option>
              <option value="Stainless">Stainless Steel</option>
            </select>
          </div>
        </div>
      </ConnectionSubMenu>
    </div>
  );
};

export default LeftEndFSConnection;