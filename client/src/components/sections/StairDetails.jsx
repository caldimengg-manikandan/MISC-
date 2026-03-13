import React from 'react';
import { StretchVertical, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const StairDetails = ({
  formData,
  handleChange,
  addFlight,
  removeFlight,
  updateFlightNumber
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    nosing: true,
    connections: true,
    beams: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Separate handler for stair type changes removed as it was unused


  return (
    <div className="space-y-8">
      {/* Basic Stair Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Stair Name
          </label>
          <input
            type="text"
            name="stairName"
            value={formData.stairName || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            placeholder="Main Staircase"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Landing Configuration
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange({ target: { name: 'landingType', value: 'with-landing' } })}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                formData.landingType === 'with-landing' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              With Landing
            </button>
            <button
              type="button"
              onClick={() => handleChange({ target: { name: 'landingType', value: 'without-landing' } })}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                formData.landingType === 'without-landing' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              Without Landing
            </button>
          </div>
        </div>

        {/* Number of Landings (only show if with landing) */}
        {formData.landingType === 'with-landing' && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Number of Landings
            </label>
            <select
              name="numberOfLandings"
              value={formData.numberOfLandings || 0}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={0}>0 - No Landing</option>
              <option value={1}>1 Landing</option>
              <option value={2}>2 Landings</option>
              <option value={3}>3 Landings</option>
              <option value={4}>4+ Landings</option>
            </select>
          </div>
        )}
      </div>

      {/* Flight Numbers */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Flight Numbers
        </label>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {formData.flights && formData.flights.map((flight) => (
            <div key={flight.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={flight.number || `FL-${String(flight.id).padStart(3, '0')}`}
                onChange={(e) => updateFlightNumber(flight.id, e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="FL-001"
              />
              {formData.flights.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFlight(flight.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addFlight}
            className="flex items-center gap-2 px-4 py-3 text-green-600 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-colors w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Another Flight
          </button>
        </div>
      </div>

      {/* Nosing Extension Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('nosing')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <StretchVertical className="w-5 h-5 text-green-600" />
            Nosing Extension & Stringer Details
          </h3>
          {expandedSections.nosing ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.nosing && (
          <div className="p-6 space-y-6">
            {/* Stringer and Tread Type Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Stringer Type
                </label>
                <select
                  name="stringerType"
                  value={formData.stringerType || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Stringer Type</option>
                  <option value="C-channel">C-Channel</option>
                  <option value="angle">Angle</option>
                  <option value="plate">Plate</option>
                  <option value="hss">HSS (Hollow Structural Section)</option>
                  <option value="w-beam">W-Beam</option>
                  <option value="custom">Custom</option>
                </select>
                {formData.stringerType === 'custom' && (
                  <input
                    type="text"
                    name="customStringerType"
                    value={formData.customStringerType || ''}
                    onChange={handleChange}
                    placeholder="Specify custom stringer type"
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tread Type
                </label>
                <select
                  name="treadType"
                  value={formData.treadType || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Tread Type</option>
                  <option value="checker-plate">Checker Plate</option>
                  <option value="grated">Grated</option>
                  <option value="solid-plate">Solid Plate</option>
                  <option value="concrete-filled">Concrete Filled</option>
                  <option value="wood">Wood</option>
                  <option value="custom">Custom</option>
                </select>
                {formData.treadType === 'custom' && (
                  <input
                    type="text"
                    name="customTreadType"
                    value={formData.customTreadType || ''}
                    onChange={handleChange}
                    placeholder="Specify custom tread type"
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </div>

            {/* Nosing Extension Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Left End Extension
                </label>
                <input
                  type="text"
                  name="leftEndExtension"
                  value={formData.leftEndExtension || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2' 4 3/4&quot;"
                />
                <p className="text-xs text-gray-500">Format: feet&apos; inches&quot; fractions</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Right End Extension
                </label>
                <input
                  type="text"
                  name="rightEndExtension"
                  value={formData.rightEndExtension || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2' 4 3/4&quot;"
                />
                <p className="text-xs text-gray-500">Format: feet&apos; inches&quot; fractions</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Front Nosing Extension
                </label>
                <input
                  type="text"
                  name="frontNosingExtension"
                  value={formData.frontNosingExtension || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1' 2 1/2&quot;"
                />
                <p className="text-xs text-gray-500">Format: feet&apos; inches&quot; fractions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Details Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('connections')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Connection & Bolt Details
          </h3>
          {expandedSections.connections ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.connections && (
          <div className="p-6 space-y-6">
            {/* Ground to Stringer Connection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Ground to Stringer Connection
                </label>
                <select
                  name="groundConnectionType"
                  value={formData.groundConnectionType || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Connection Type</option>
                  <option value="angle-braced">Angle Braced</option>
                  <option value="direct-bolted">Direct Bolted</option>
                  <option value="welded-baseplate">Welded Base Plate</option>
                  <option value="anchor-bolted">Anchor Bolted</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Connection Angle
                </label>
                <input
                  type="text"
                  name="connectionAngle"
                  value={formData.connectionAngle || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="30°"
                />
              </div>
            </div>

            

            {/* Bolt Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Bolt Size
                </label>
                <select
                  name="boltSize"
                  value={formData.boltSize || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Bolt Size</option>
                  <option value="1/2">1/2&quot;</option>
                  <option value="5/8">5/8&quot;</option>
                  <option value="3/4">3/4&quot;</option>
                  <option value="7/8">7/8&quot;</option>
                  <option value="1">1&quot;</option>
                  <option value="1-1/8">1-1/8&quot;</option>
                  <option value="1-1/4">1-1/4&quot;</option>
                  <option value="1-1/2">1-1/2&quot;</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Number of Bolts
                </label>
                <input
                  type="number"
                  name="numberOfBolts"
                  value={formData.numberOfBolts || ''}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="4"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Bolt Standard
                </label>
                <select
                  name="boltStandard"
                  value={formData.boltStandard || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Standard</option>
                  <option value="ASTM A325">ASTM A325</option>
                  <option value="ASTM A490">ASTM A490</option>
                  <option value="ASTM F3125">ASTM F3125</option>
                  <option value="ISO 898-1">ISO 898-1</option>
                  <option value="custom">Custom</option>
                </select>
                {formData.boltStandard === 'custom' && (
                  <input
                    type="text"
                    name="customBoltStandard"
                    value={formData.customBoltStandard || ''}
                    onChange={handleChange}
                    placeholder="Specify custom bolt standard"
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stair Beam Details Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('beams')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <StretchVertical className="w-5 h-5 text-green-600" />
            Stair Beam Details
          </h3>
          {expandedSections.beams ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.beams && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Beam */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800">Main Beam</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="mainBeam.size"
                    value={formData.mainBeam?.size || ''}
                    onChange={handleChange}
                    placeholder="Size (e.g., W12x35)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="mainBeam.material"
                    value={formData.mainBeam?.material || ''}
                    onChange={handleChange}
                    placeholder="Material"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="mainBeam.length"
                    value={formData.mainBeam?.length || ''}
                    onChange={handleChange}
                    placeholder="Length (ft)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Infill Beam */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800">Infill Beam</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="infillBeam.size"
                    value={formData.infillBeam?.size || ''}
                    onChange={handleChange}
                    placeholder="Size"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="infillBeam.material"
                    value={formData.infillBeam?.material || ''}
                    onChange={handleChange}
                    placeholder="Material"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="infillBeam.quantity"
                    value={formData.infillBeam?.quantity || ''}
                    onChange={handleChange}
                    placeholder="Quantity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* End Beam */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800">End Beam</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="endBeam.size"
                    value={formData.endBeam?.size || ''}
                    onChange={handleChange}
                    placeholder="Size"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="endBeam.material"
                    value={formData.endBeam?.material || ''}
                    onChange={handleChange}
                    placeholder="Material"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="endBeam.quantity"
                    value={formData.endBeam?.quantity || ''}
                    onChange={handleChange}
                    placeholder="Quantity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StairDetails;