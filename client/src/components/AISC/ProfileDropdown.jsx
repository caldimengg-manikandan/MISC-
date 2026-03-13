import React, { useState } from 'react';
import { X, Check, Ruler, Building, Layers, GripVertical, ChevronDown, MoreHorizontal } from 'lucide-react';
import AISCShapeDatabasePopup from './AISCShapeDatabasePopup';

const ProfileDropdown = ({ onClose, onProfileSelected }) => {
  const [activeTab, setActiveTab] = useState('picture');
  const [showAISCModal, setShowAISCModal] = useState(false);

  // Stair Setup Form State
  const [stairForm, setStairForm] = useState({
    leftStringer: 'C12X20.7',
    leftPosNo: '1',
    leftMaterial: '-',
    leftName: 'STAIR',
    rightStringer: 'C12X20.7',
    rightPosNo: '1',
    rightMaterial: '-',
    rightName: 'STAIR',
    upperHPlate: '',
    upperHPosNo: '',
    upperHMaterial: '',
    upperHName: 'CAP',
    upperVPlate: '',
    upperVPosNo: '',
    upperVMaterial: '',
    upperVName: 'END',
    lowerVPlate: '',
    lowerVPosNo: '',
    lowerVMaterial: '',
    lowerVName: 'END',
    createAssembly: true,
    stringerReferenceLine: 'default',
    positionInPlane: 'middle',
    offset: true,
    stringerRotation: 'none',
    bracket: true,
    createTopStep: true,
    createBottomStep: true
  });

  const tabs = [
    { id: 'picture', name: 'Picture', icon: Building },
    { id: 'stairSetup', name: 'Stair Setup', icon: Ruler },
    { id: 'zPan', name: 'Z Pan', icon: Layers },
    { id: 'horizontalBracket', name: 'Horizontal Bracket', icon: GripVertical },
    { id: 'verticalBracket', name: 'Vertical Bracket', icon: GripVertical },
    { id: 'bentPlateBracket', name: 'Bent Plate Bracket', icon: GripVertical }
  ];

  const handleStairFormChange = (field, value) => {
    setStairForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSelectFromAISC = (profile) => {
    if (profile) {
      setStairForm(prev => ({
        ...prev,
        leftStringer: profile.name
      }));
    }
  };

  const handleApply = () => {
    if (onProfileSelected) {
      onProfileSelected({
        stairForm,
        activeTab
      });
    }
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'picture':
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4">
            <div className="text-center">
              <img 
                // src="/images/Z pan.png" 
                alt="Z Pan Configuration"
                className="w-full max-w-2xl h-auto rounded-lg shadow-lg border border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-4">Z Pan Configuration Diagram</p>
            </div>
          </div>
        );

      case 'stairSetup':
        return (
          <div className="space-y-6">
            {/* Detailed Stair Setup Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stair Configuration</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                {/* Left Stringer */}
                <div className="col-span-1">
                  <label className="block font-semibold mb-1">Left stringer</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stairForm.leftStringer}
                      onChange={(e) => handleStairFormChange('leftStringer', e.target.value)}
                      placeholder="C12X20.7"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAISCModal(true)}
                      className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Pos. No</label>
                  <input
                    type="text"
                    value={stairForm.leftPosNo}
                    onChange={(e) => handleStairFormChange('leftPosNo', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <input
                    type="text"
                    value={stairForm.leftMaterial}
                    onChange={(e) => handleStairFormChange('leftMaterial', e.target.value)}
                    placeholder="-"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={stairForm.leftName}
                    onChange={(e) => handleStairFormChange('leftName', e.target.value)}
                    placeholder="STAIR"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Right Stringer */}
                <div className="col-span-1">
                  <label className="block font-semibold mb-1">Right stringer</label>
                  <input
                    type="text"
                    value={stairForm.rightStringer}
                    onChange={(e) => handleStairFormChange('rightStringer', e.target.value)}
                    placeholder="C12X20.7"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Pos. No</label>
                  <input
                    type="text"
                    value={stairForm.rightPosNo}
                    onChange={(e) => handleStairFormChange('rightPosNo', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <input
                    type="text"
                    value={stairForm.rightMaterial}
                    onChange={(e) => handleStairFormChange('rightMaterial', e.target.value)}
                    placeholder="-"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={stairForm.rightName}
                    onChange={(e) => handleStairFormChange('rightName', e.target.value)}
                    placeholder="STAIR"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Upper H Plate */}
                <div>
                  <label className="block font-semibold mb-1">Upper H plate</label>
                  <input
                    type="text"
                    value={stairForm.upperHPlate}
                    onChange={(e) => handleStairFormChange('upperHPlate', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pos. No</label>
                  <input
                    type="text"
                    value={stairForm.upperHPosNo}
                    onChange={(e) => handleStairFormChange('upperHPosNo', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <input
                    type="text"
                    value={stairForm.upperHMaterial}
                    onChange={(e) => handleStairFormChange('upperHMaterial', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={stairForm.upperHName}
                    onChange={(e) => handleStairFormChange('upperHName', e.target.value)}
                    placeholder="CAP"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Upper V Plate */}
                <div>
                  <label className="block font-semibold mb-1">Upper V plate</label>
                  <input
                    type="text"
                    value={stairForm.upperVPlate}
                    onChange={(e) => handleStairFormChange('upperVPlate', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pos. No</label>
                  <input
                    type="text"
                    value={stairForm.upperVPosNo}
                    onChange={(e) => handleStairFormChange('upperVPosNo', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <input
                    type="text"
                    value={stairForm.upperVMaterial}
                    onChange={(e) => handleStairFormChange('upperVMaterial', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={stairForm.upperVName}
                    onChange={(e) => handleStairFormChange('upperVName', e.target.value)}
                    placeholder="END"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Lower V Plate */}
                <div>
                  <label className="block font-semibold mb-1">Lower V plate</label>
                  <input
                    type="text"
                    value={stairForm.lowerVPlate}
                    onChange={(e) => handleStairFormChange('lowerVPlate', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pos. No</label>
                  <input
                    type="text"
                    value={stairForm.lowerVPosNo}
                    onChange={(e) => handleStairFormChange('lowerVPosNo', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <input
                    type="text"
                    value={stairForm.lowerVMaterial}
                    onChange={(e) => handleStairFormChange('lowerVMaterial', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={stairForm.lowerVName}
                    onChange={(e) => handleStairFormChange('lowerVName', e.target.value)}
                    placeholder="END"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Assembly & Position Section */}
                <div className="col-span-1 flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={stairForm.createAssembly}
                      onChange={(e) => handleStairFormChange('createAssembly', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      stairForm.createAssembly 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {stairForm.createAssembly && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <label className="font-semibold">Create assembly</label>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Stringer reference line</label>
                  <select
                    value={stairForm.stringerReferenceLine}
                    onChange={(e) => handleStairFormChange('stringerReferenceLine', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="default">Default</option>
                    <option value="inner">Inner</option>
                    <option value="outer">Outer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Position in plane</label>
                  <select
                    value={stairForm.positionInPlane}
                    onChange={(e) => handleStairFormChange('positionInPlane', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={stairForm.offset}
                      onChange={(e) => handleStairFormChange('offset', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      stairForm.offset 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {stairForm.offset && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <label className="font-semibold">Offset</label>
                </div>

                {/* Rotation */}
                <div className="col-span-4 flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={stairForm.stringerRotation !== 'none'}
                      onChange={(e) => handleStairFormChange('stringerRotation', e.target.checked ? 'mirror' : 'none')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      stairForm.stringerRotation !== 'none' 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {stairForm.stringerRotation !== 'none' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <label className="font-semibold">Stringer rotation</label>
                  <select
                    value={stairForm.stringerRotation}
                    onChange={(e) => handleStairFormChange('stringerRotation', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="mirror">Mirror</option>
                    <option value="flip">Flip</option>
                  </select>
                </div>

                {/* Bracket and Step Previews */}
                <div className="col-span-2 flex flex-col items-center border rounded-lg p-3">
                  <div className="flex items-center space-x-2 self-start mb-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={stairForm.bracket}
                        onChange={(e) => handleStairFormChange('bracket', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        stairForm.bracket 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {stairForm.bracket && <Check className="w-2 h-2 text-white" />}
                      </div>
                    </div>
                    <label className="font-semibold">Bracket</label>
                  </div>
                  <div className="w-48 h-32 bg-gray-100 border rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Bracket Preview</span>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col items-center space-y-3">
                  <div className="flex flex-col items-center border rounded-lg p-3 w-full">
                    <div className="flex items-center space-x-2 self-start mb-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={stairForm.createTopStep}
                          onChange={(e) => handleStairFormChange('createTopStep', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          stairForm.createTopStep 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {stairForm.createTopStep && <Check className="w-2 h-2 text-white" />}
                        </div>
                      </div>
                      <label className="font-semibold">Create top step</label>
                    </div>
                    <div className="w-40 h-24 bg-gray-100 border rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Top Step</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center border rounded-lg p-3 w-full">
                    <div className="flex items-center space-x-2 self-start mb-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={stairForm.createBottomStep}
                          onChange={(e) => handleStairFormChange('createBottomStep', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          stairForm.createBottomStep 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {stairForm.createBottomStep && <Check className="w-2 h-2 text-white" />}
                        </div>
                      </div>
                      <label className="font-semibold">Create bottom step</label>
                    </div>
                    <div className="w-40 h-24 bg-gray-100 border rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Bottom Step</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'zPan':
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <Layers className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Z Pan Configuration</p>
              <p className="text-sm mt-2">Configure Z pan settings and specifications</p>
            </div>
          </div>
        );

      case 'horizontalBracket':
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <GripVertical className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Horizontal Bracket Settings</p>
              <p className="text-sm mt-2">Configure horizontal bracket parameters</p>
            </div>
          </div>
        );

      case 'verticalBracket':
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <GripVertical className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Vertical Bracket Settings</p>
              <p className="text-sm mt-2">Configure vertical bracket parameters</p>
            </div>
          </div>
        );

      case 'bentPlateBracket':
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <GripVertical className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Bent Plate Bracket Settings</p>
              <p className="text-sm mt-2">Configure bent plate bracket parameters</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Profile Configuration</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all duration-200 min-w-max whitespace-nowrap ${
                      isActive 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      </div>

      {/* AISC Shape Database Modal */}
      {showAISCModal && (
        <AISCShapeDatabasePopup 
          onClose={() => setShowAISCModal(false)}
          onProfileSelected={handleProfileSelectFromAISC}
        />
      )}
    </>
  );
};

export default ProfileDropdown;