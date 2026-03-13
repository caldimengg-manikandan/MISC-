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

const LeftEndNSConnection = ({ formData, handleChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Left End NS Connection</h4>
      
      <ConnectionSubMenu title="Connection Type" defaultOpen={true}>
        <div className="space-y-4">
          <select
            name="leftNSConnectionType"
            value={formData.leftNSConnectionType || ''}
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
              name="leftNSBoltSize"
              value={formData.leftNSBoltSize || ''}
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
              name="leftNSBoltGrade"
              value={formData.leftNSBoltGrade || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A325"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weld Size
            </label>
            <input
              type="text"
              name="leftNSWeldSize"
              value={formData.leftNSWeldSize || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1/4&quot;"
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
              name="leftNSConnectionMaterial"
              value={formData.leftNSConnectionMaterial || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Material</option>
              <option value="A36">A36 Steel</option>
              <option value="A992">A992 Steel</option>
              <option value="Stainless">Stainless Steel</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finish
            </label>
            <select
              name="leftNSConnectionFinish"
              value={formData.leftNSConnectionFinish || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Finish</option>
              <option value="Galvanized">Galvanized</option>
              <option value="Painted">Painted</option>
              <option value="Raw">Raw</option>
            </select>
          </div>
        </div>
      </ConnectionSubMenu>

      <ConnectionSubMenu title="Connection to Support (1)">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Type
            </label>
            <select
              name="leftNSSupport1Type"
              value={formData.leftNSSupport1Type || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Support Type</option>
              <option value="concrete-wall">Concrete Wall</option>
              <option value="steel-column">Steel Column</option>
              <option value="masonry">Masonry</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anchor Type
            </label>
            <input
              type="text"
              name="leftNSSupport1Anchor"
              value={formData.leftNSSupport1Anchor || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Wedge Anchor"
            />
          </div>
        </div>
      </ConnectionSubMenu>

      <ConnectionSubMenu title="Connection to Support (2)">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Type
            </label>
            <select
              name="leftNSSupport2Type"
              value={formData.leftNSSupport2Type || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Support Type</option>
              <option value="concrete-wall">Concrete Wall</option>
              <option value="steel-column">Steel Column</option>
              <option value="masonry">Masonry</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anchor Type
            </label>
            <input
              type="text"
              name="leftNSSupport2Anchor"
              value={formData.leftNSSupport2Anchor || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Wedge Anchor"
            />
          </div>
        </div>
      </ConnectionSubMenu>
    </div>
  );
};

export default LeftEndNSConnection;