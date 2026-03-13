// src/components/estimation/SecureExcelUpload.jsx
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SecureExcelUpload = ({ onPricesUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const { user } = useAuth();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error('Please upload Excel files only (.xlsx, .xls, .csv)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    validateFile(file);
  };

  const validateFile = (file) => {
    // Basic client-side validation
    const validationResult = {
      isValid: true,
      issues: []
    };

    if (file.name.length > 100) {
      validationResult.issues.push('Filename too long');
      validationResult.isValid = false;
    }

    setValidation(validationResult);
  };

  const handleUpload = async () => {
    if (!selectedFile || !validation?.isValid) {
      toast.error('Please select a valid Excel file');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      const token = localStorage.getItem('steel_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/secure/excel/upload`, {
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
        // Show success toast
        toast.success(`Successfully imported ${data.savedPrices?.count || 0} price records`);
        
        if (data.warning) {
          toast.warning(data.warning);
        }

        // Update parent component with new prices
        if (onPricesUpdated) {
          onPricesUpdated();
        }

        // Reset form
        setSelectedFile(null);
        setValidation(null);
        
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // Show error toast - FIXED SYNTAX
      toast.error(error.message || 'Upload failed. Please try again.');
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

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'steel_prices_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded successfully');

    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Clean version without the problematic custom toast
  const SuccessToast = () => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center">
        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
        <div>
          <div className="font-medium text-green-900">Import Successful</div>
          <div className="text-sm text-green-700">
            File processed successfully
          </div>
        </div>
      </div>
    </div>
  );

  const ErrorToast = ({ message }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        <div>
          <div className="font-medium text-red-900">Upload Failed</div>
          <div className="text-sm text-red-700">
            {message || 'Please try again or contact support'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Security Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <div className="font-medium text-blue-900">Secure Excel Upload</div>
            <div className="text-sm text-blue-700">
              All files are processed securely on our servers. Your pricing data is encrypted.
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          id="excelUpload"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <label htmlFor="excelUpload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-700 mb-2">
              {selectedFile ? selectedFile.name : 'Select Excel File'}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Drag and drop or click to browse
              <br />
              Supported formats: .xlsx, .xls, .csv (Max 10MB)
            </div>
            
            <button
              type="button"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={uploading}
            >
              Browse Files
            </button>
          </div>
        </label>
      </div>

      {/* File Validation */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-lg ${
              validation?.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {validation?.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
              
              {validation?.issues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">Issues found:</div>
                  <ul className="text-sm text-yellow-700">
                    {validation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
          disabled={uploading}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Download Template
        </button>
        
        <div className="space-x-3">
          <button
            onClick={() => setSelectedFile(null)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={uploading || !selectedFile}
          >
            Cancel
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || !validation?.isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Secure Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecureExcelUpload;