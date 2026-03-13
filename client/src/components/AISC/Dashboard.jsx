import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  Calculator, 
  Database,
  DollarSign,
  FolderOpen,
  Users,
  HelpCircle,
  User,
  Settings,
  ChevronDown,
  Info,
  Box
} from 'lucide-react';

import { authService } from '../services/authService';
import SummaryPopup from './SummaryPopup';
import AISCNomenclaturePopup from './AISCNomenclaturePopup';
import AISCClassificationPopup from './AISCClassificationPopup';
import AISCShapeDatabasePopup from './AISCShapeDatabasePopup';

// 🧱 Import your 3D BIM Scene
import { StructuralScene } from './3d/StructuralScene';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [estimations, setEstimations] = useState([]);
  const [aiscPopup, setAiscPopup] = useState(null);
  const profileRef = useRef(null);
  const versionRef = useRef(null);
  const navigate = useNavigate();

  const mockEstimations = [
    { id: 1, sNo: 1, customerName: 'ABC Construction', projectName: 'Office Tower A', estimationStatus: 'Completed', totalWeight: '2,450 kg', date: '2024-01-15', steelGrade: 'ASTM A36', stairWidth: '48"', railingType: 'Type 1' },
    { id: 2, sNo: 2, customerName: 'XYZ Builders', projectName: 'Shopping Mall', estimationStatus: 'In Progress', totalWeight: '1,850 kg', date: '2024-01-10', steelGrade: 'ASTM A572', stairWidth: '42"', railingType: 'Type 2' }
  ];

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setEstimations(mockEstimations);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (versionRef.current && !versionRef.current.contains(event.target)) setShowVersionInfo(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleNewEstimation = (data) => {
    const newEstimation = {
      id: estimations.length + 1,
      sNo: estimations.length + 1,
      customerName: data.customerName,
      projectName: data.projectName,
      estimationStatus: 'Completed',
      totalWeight: `${Math.floor(Math.random() * 5000) + 1000} kg`,
      date: new Date().toISOString().split('T')[0],
      steelGrade: data.steelGrade,
      stairWidth: data.stairWidth,
      railingType: data.railingType
    };
    setEstimations([newEstimation, ...estimations]);
  };

  // 🔹 Added "3D BIM Viewer" module
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
    { id: 'misc-estimate', name: 'Miscellaneous Estimate', icon: Calculator, color: 'from-green-500 to-green-600' },
    { id: 'aisc-standard', name: 'AISC Standard', icon: Database, color: 'from-purple-500 to-purple-600' },
    { id: 'bim-viewer', name: '3D BIM Viewer', icon: Box, color: 'from-pink-500 to-rose-600' },
    { id: 'process-costing', name: 'Process Costing', icon: DollarSign, color: 'from-yellow-500 to-yellow-600' },
    { id: 'project-record', name: 'Project Record', icon: FolderOpen, color: 'from-red-500 to-red-600' },
    { id: 'customer-database', name: 'Customer Database', icon: Users, color: 'from-indigo-500 to-indigo-600' },
    { id: 'help', name: 'Help', icon: HelpCircle, color: 'from-gray-500 to-gray-600' }
  ];

  const handleMenuClick = (id) => setActiveModule(id);

  const renderContent = () => {
    switch (activeModule) {
      case 'misc-estimate': return <MiscEstimateContent onNewEstimation={() => setShowMiscEstimation(true)} />;
      case 'aisc-standard': return <AISCStandardContent onOpenPopup={setAiscPopup} />;
      case 'bim-viewer':
        return (
          <div className="w-full h-[80vh] rounded-xl overflow-hidden border border-gray-200 shadow-md">
            <StructuralScene />
          </div>
        );
      case 'process-costing': return <ProcessCostingContent />;
      case 'project-record': return <ProjectRecordContent />;
      case 'customer-database': return <CustomerDatabaseContent />;
      case 'help': return <HelpContent />;
      default:
        return (
          <div className="w-full max-w-4xl mx-auto text-center py-16">
            <LayoutDashboard className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Caldim EPM</h2>
            <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
              Select a module from the dashboard to get started with your engineering project management tasks.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowSummaryPopup(true)} className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg">View Summary</button>
              <button onClick={() => setShowMiscEstimation(true)} className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-lg">Create Estimate</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 w-full relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 w-full sticky top-0 z-50 relative">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div onClick={() => navigate('/dashboard')} className="flex items-center space-x-4 mx-auto cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Caldim EPM</h1>
          </div>
          {/* Profile + Version Buttons */}
          <div className="absolute right-6 flex items-center gap-3">
            {/* Profile dropdown & version info omitted for brevity */}
          </div>
        </div>
      </header>

      {/* Menu */}
      <div className="w-full px-4 py-8 relative z-10">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 justify-items-center px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} onClick={() => handleMenuClick(item.id)} className="flex flex-col items-center group cursor-pointer transform transition-all duration-300 hover:scale-105">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg border-4 border-white group-hover:border-blue-100 ${activeModule === item.id ? 'ring-4 ring-blue-300' : ''}`}>
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div className="mt-4 text-center">
                  <span className={`text-sm font-semibold ${activeModule === item.id ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    {item.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-300 my-12"></div>

        {/* Module content */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 mx-auto min-h-[400px] relative z-10">
          {renderContent()}
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-40">
        <p className="text-sm text-gray-600 text-center">
          Developed by <span className="text-blue-600 font-semibold">CALDIM</span>
        </p>
      </footer>

      {/* Popups */}
      {showSummaryPopup && <SummaryPopup onClose={() => setShowSummaryPopup(false)} estimations={estimations} />}
      {aiscPopup === 'nomenclature' && <AISCNomenclaturePopup onClose={() => setAiscPopup(null)} />}
      {aiscPopup === 'classification' && <AISCClassificationPopup onClose={() => setAiscPopup(null)} />}
      {aiscPopup === 'shape-database' && <AISCShapeDatabasePopup onClose={() => setAiscPopup(null)} />}
    </div>
  );
};

/* Existing content components retained below */
const MiscEstimateContent = ({ onNewEstimation }) => (
  <div className="w-full max-w-4xl mx-auto text-center py-8">
    <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Miscellaneous Estimates</h2>
    <div className="flex justify-center gap-4">
      <button onClick={onNewEstimation} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Calculate New Estimate</button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Reports and Analytics</button>
    </div>
  </div>
);

const AISCStandardContent = ({ onOpenPopup }) => {
  const options = [
    { id: 'nomenclature', name: 'Update Nomenclature', icon: Database, color: 'from-purple-500 to-purple-600' },
    { id: 'classification', name: 'Update Classification', icon: Database, color: 'from-blue-500 to-blue-600' },
    { id: 'shape-database', name: 'Update Shape Database', icon: Database, color: 'from-green-500 to-green-600' }
  ];
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <Database className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AISC Standard Database</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.id} onClick={() => onOpenPopup(option.id)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-300">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.name}</h3>
              <div className="text-purple-600 font-medium flex items-center">
                <span>Open Tool</span>
                <ChevronDown className="w-4 h-4 ml-1 -rotate-90" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProcessCostingContent = () => (
  <div className="w-full max-w-4xl mx-auto text-center py-8">
    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Process Costing</h2>
    <div className="flex justify-center gap-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Cost Analysis</button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Budget Reports</button>
    </div>
  </div>
);

const ProjectRecordContent = () => (
  <div className="w-full max-w-4xl mx-auto text-center py-8">
    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Record</h2>
    <div className="flex justify-center gap-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">View Projects</button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Upload Documents</button>
    </div>
  </div>
);

const CustomerDatabaseContent = () => (
  <div className="w-full max-w-4xl mx-auto text-center py-8">
    <Users className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Database</h2>
    <div className="flex justify-center gap-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Customer List</button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Add New Customer</button>
    </div>
  </div>
);

const HelpContent = () => (
  <div className="w-full max-w-4xl mx-auto text-center py-8">
    <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Help & Support</h2>
    <div className="flex justify-center gap-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">Documentation</button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Contact Support</button>
    </div>
  </div>
);

export default Dashboard;
