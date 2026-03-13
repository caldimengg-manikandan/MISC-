import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, RefreshCw, AlertCircle, 
  CheckCircle, Shield, Download, Upload 
} from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const DebugHandrail = () => {
  const [handrailData, setHandrailData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchHandrailData();
  }, []);

  const fetchHandrailData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('steel_token');
      
      const response = await axios.get(`${API_BASE_URL}/api/debug/handrail`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setHandrailData(response.data.data);
        setRawData(response.data);
        toast.success('Handrail data loaded successfully');
      } else {
        setError(response.data.error);
        toast.error('Failed to load handrail data');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error fetching handrail data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error('Please upload Excel files only (.xlsx, .xls, .csv)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      const token = localStorage.getItem('steel_token');
      
      const response = await fetch(`${API_BASE_URL}/api/secure/excel/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.success) {
        toast.success('Excel file uploaded successfully');
        await fetchHandrailData(); // Refresh data
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      
      const response = await fetch(`${API_BASE_URL}/api/secure/excel/template`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'handrail_prices_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Handrail': 'bg-blue-100 text-blue-800',
      'Guardrail': 'bg-green-100 text-green-800',
      'Picket Guardrail': 'bg-orange-100 text-orange-800',
      'Pipe Guardrail': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handrail Data Debug</h1>
        <p className="text-gray-600">Debug and verify your Excel handrail data</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Upload Excel File</h2>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <input
            type="file"
            id="fileUpload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <label htmlFor="fileUpload" className="cursor-pointer">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">
              {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
            </div>
            <div className="text-sm text-gray-500">
              Upload your Excel file with handrail data (.xlsx, .xls, .csv)
            </div>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Data Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Handrail Data from Excel</h2>
            <p className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${handrailData.length} records found`}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {showRaw ? 'Show Table' : 'Show Raw JSON'}
            </button>
            <button
              onClick={fetchHandrailData}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4 text-gray-600">Loading handrail data...</div>
          </div>
        ) : showRaw ? (
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Steel lbs/LF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop MH/LF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field MH/LF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {handrailData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.steelLbsPerLF.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.shopLaborMHPerLF.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fieldLaborMHPerLF.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* How to Use Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How to Use This Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">In Your Estimation Form</h4>
              <p className="text-sm text-blue-800">
                This data will automatically populate the dropdowns in your estimation form.
                When you select a handrail type, the corresponding steel weight and labor rates
                will be filled in automatically.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Update Process</h4>
              <ol className="text-sm text-green-800 list-decimal list-inside space-y-1">
                <li>Update the Excel file with new prices</li>
                <li>Upload the file using the form above</li>
                <li>Data will automatically update in the system</li>
                <li>Refresh your estimation form to see changes</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugHandrail;