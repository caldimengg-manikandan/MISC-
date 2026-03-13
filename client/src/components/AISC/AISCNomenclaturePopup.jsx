import React, { useState } from 'react';
import { X, Plus, Save, Edit, Trash2, Database } from 'lucide-react';

const AISCNomenclaturePopup = ({ onClose }) => {
  const [data, setData] = useState([
    { id: 1, variable: 'EDI_Std_Nomenclature', description: 'Standard naming convention for structural elements', aiscLabel: 'W-Shape', nominalWeight: '50.0', crossSectionArea: '14.7' },
    { id: 2, variable: 'Beam_Type_A', description: 'Type A beam specifications', aiscLabel: 'W12x35', nominalWeight: '35.0', crossSectionArea: '10.3' },
    { id: 3, variable: 'Column_Type_B', description: 'Type B column specifications', aiscLabel: 'W14x90', nominalWeight: '90.0', crossSectionArea: '26.5' }
  ]);
  const [editingRow, setEditingRow] = useState(null);

  const handleAddNew = () => {
    const newId = Math.max(...data.map(item => item.id)) + 1;
    setData([
      ...data,
      {
        id: newId,
        variable: '',
        description: '',
        aiscLabel: '',
        nominalWeight: '',
        crossSectionArea: ''
      }
    ]);
    setEditingRow(newId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Update Nomenclature</h2>
              <p className="text-gray-600 mt-1">Manage standard naming conventions and variables</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex justify-between items-center">
            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ADD NEW
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AISC Manual Label</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal Weight (lb/ft)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cross-sectional area, in.2 (mm2)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    {Object.keys(item).filter(key => key !== 'id').map((key) => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id ? (
                          <input
                            type="text"
                            value={item[key]}
                            onChange={(e) => setData(data.map(d => d.id === item.id ? {...d, [key]: e.target.value} : d))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          item[key]
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {editingRow === item.id ? (
                          <button 
                            onClick={() => setEditingRow(null)} 
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setEditingRow(item.id)} 
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setData(data.filter(d => d.id !== item.id))} 
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISCNomenclaturePopup;