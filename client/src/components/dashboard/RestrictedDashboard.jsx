import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, BarChart3, FileText, Calculator,
  CreditCard, AlertCircle, Eye, Download, User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

const RestrictedDashboard = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const limitedFeatures = [
    {
      title: 'View Existing Projects',
      description: 'View and download your existing projects',
      icon: <Eye className="w-6 h-6 text-blue-600" />,
      available: true
    },
    {
      title: 'Basic Calculations',
      description: 'Simple material calculations',
      icon: <Calculator className="w-6 h-6 text-orange-600" />,
      available: true
    },
    {
      title: 'Create New Projects',
      description: 'Start new estimation projects',
      icon: <FileText className="w-6 h-6 text-gray-400" />,
      available: true
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed project analytics',
      icon: <BarChart3 className="w-6 h-6 text-gray-400" />,
      available: false
    },
    {
      title: 'Export to CAD',
      description: 'Generate CAD files',
      icon: <Download className="w-6 h-6 text-gray-400" />,
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Sidebar onToggle={setIsSidebarCollapsed} />

      <div className={`transition-all duration-300 p-6 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
        {/* ================= HEADER WITH USER INFO ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Left: Dashboard Title */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Limited Access Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Your trial has ended. Upgrade to unlock all features.
                </p>
              </div>
            </div>
          </div>

          {/* Right: User Info Dropdown */}
          <div className="relative group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-w-[280px] hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-4 space-y-3">
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Company</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.company || '—'}
                  </p>
                </div>

                <div className="pb-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded capitalize">
                    {user?.role}
                  </span>
                </div>

                {user?.trialEnd && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trial Ended</p>
                    <p className="text-sm text-red-600 font-medium">
                      {new Date(user.trialEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 p-3">
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Profile →
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* ================= AVAILABLE FEATURES ================= */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {limitedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-sm border p-6 ${feature.available ? 'border-gray-200' : 'border-gray-100'
                  }`}
              >
                <div className={`p-3 rounded-lg mb-4 ${feature.available ? 'bg-gray-50' : 'bg-gray-100'
                  }`}>
                  {feature.icon}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                <p className={`text-sm mb-4 ${feature.available ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                  {feature.description}
                </p>

                <span className={`px-3 py-1 rounded-full text-xs font-medium ${feature.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {feature.available ? 'Available' : 'Locked'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ================= UPGRADE CTA ================= */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Unlock Full Access?
          </h2>
          <p className="text-gray-600 mb-6">
            Upgrade your plan to remove restrictions
          </p>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Upgrade Now
          </button>
        </div>

      </div>
    </div>
  );
};

export default RestrictedDashboard;