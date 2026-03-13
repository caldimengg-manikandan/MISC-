// client/src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, FileText, Calculator, Database, 
  Download, Settings, Bell, Search, Plus,
  TrendingUp, DollarSign, Clock,
  Building2, Layers, Target, PieChart,
  Activity, ChevronRight, Filter, MoreVertical,
  Sparkles, Award, TrendingDown, CheckCircle,
  Calendar, Upload, Eye, Home,
  LayoutDashboard, Users, Save,
  X, Grid, Ruler, Weight, Percent, Copy, Trash2,
  LogOut, User, ChevronDown, CreditCard, HelpCircle, Moon
} from 'lucide-react';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';

const Dashboard = () => {
    const location = useLocation();
  const isDashboardHome = location.pathname === '/dashboard';

 
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [showCalculatorWidget, setShowCalculatorWidget] = useState(true);
  const [showJobberCalculator, setShowJobberCalculator] = useState(false);
  const [showStairCalculator, setShowStairCalculator] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  // Jobber Calculator State
  const [jobberInputs, setJobberInputs] = useState({
    length: '',
    width: '',
    height: '',
    quantity: '1',
    materialType: 'steel',
    wasteFactor: '10'
  });
  const [jobberResult, setJobberResult] = useState(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Stair Calculator State
  const [stairInputs, setStairInputs] = useState({
    floorToFloor: '',
    riserHeight: '',
    treadWidth: '',
    numberOfSteps: '',
    run: '',
    pitch: '',
    angle: '',
    nose: '1.25',
    firstStep: '0',
    mode: 'feet-inches',
    measurement: 'feet'
  });
  const [stairResults, setStairResults] = useState(null);
  const [activeInput, setActiveInput] = useState(null);

  // Mock user data
  const user = {
    name: 'Steel Professional',
    email: 'admin@steelpro.com',
    role: 'Administrator',
    company: 'Steel Structures Inc.',
    initials: 'SP',
    avatarColor: 'from-blue-500 to-blue-600'
  };

  // Mock data for charts
  const projectTimelineData = [
    { month: 'Jan', projects: 4, cost: 12500 },
    { month: 'Feb', projects: 7, cost: 18500 },
    { month: 'Mar', projects: 6, cost: 16500 },
    { month: 'Apr', projects: 9, cost: 22500 },
    { month: 'May', projects: 8, cost: 19500 },
    { month: 'Jun', projects: 12, cost: 28500 },
  ];

  const costBreakdownData = [
    { name: 'Material', value: 65, color: '#3B82F6' },
    { name: 'Labor', value: 20, color: '#10B981' },
    { name: 'Engineering', value: 10, color: '#8B5CF6' },
    { name: 'Misc', value: 5, color: '#F59E0B' },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 42000, expenses: 28000 },
    { month: 'Feb', revenue: 52000, expenses: 32000 },
    { month: 'Mar', revenue: 61000, expenses: 35000 },
    { month: 'Apr', revenue: 58000, expenses: 38000 },
    { month: 'May', revenue: 72000, expenses: 42000 },
    { month: 'Jun', revenue: 85000, expenses: 48000 },
  ];

  const projectTypeData = [
    { type: 'Industrial', value: 35, color: '#3B82F6' },
    { type: 'Commercial', value: 25, color: '#10B981' },
    { type: 'Residential', value: 20, color: '#8B5CF6' },
    { type: 'Architectural', value: 15, color: '#F59E0B' },
    { type: 'Other', value: 5, color: '#EF4444' },
  ];

  const kpiData = [
    { metric: 'Avg Project Cost', value: '$14,250', change: '+12%', trend: 'up' },
    { metric: 'Estimation Accuracy', value: '98.5%', change: '+2.3%', trend: 'up' },
    { metric: 'Time Saved', value: '45 hrs', change: '+18%', trend: 'up' },
    { metric: 'Error Rate', value: '1.2%', change: '-0.4%', trend: 'down' },
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockProjects = [
      { id: 1, name: 'Factory Steel Staircase', number: 'ST-2024-001', status: 'completed', date: '2024-01-15', cost: 28500, type: 'Industrial', progress: 100 },
      { id: 2, name: 'Office Building Guard Rails', number: 'ST-2024-002', status: 'in-progress', date: '2024-01-18', cost: 18500, type: 'Commercial', progress: 75 },
      { id: 3, name: 'Shopping Mall Escalator', number: 'ST-2024-003', status: 'in-progress', date: '2024-01-20', cost: 42500, type: 'Commercial', progress: 60 },
      { id: 4, name: 'Residential Spiral Stair', number: 'ST-2024-004', status: 'draft', date: '2024-01-22', cost: 9500, type: 'Residential', progress: 30 },
      { id: 5, name: 'Warehouse Mezzanine', number: 'ST-2024-005', status: 'completed', date: '2024-01-25', cost: 32500, type: 'Industrial', progress: 100 },
    ];
    setProjects(mockProjects);
  }, []);

  const stats = [
    { title: 'Total Projects', value: '18', icon: <FileText className="w-6 h-6" />, change: '+3', color: 'blue', subtext: 'This month' },
    { title: 'Active Estimates', value: '7', icon: <Calculator className="w-6 h-6" />, change: '+2', color: 'green', subtext: 'In progress' },
    { title: 'Revenue Generated', value: '$248,500', icon: <DollarSign className="w-6 h-6" />, change: '+24%', color: 'purple', subtext: 'Last 30 days' },
    { title: 'Trial Days Left', value: '24', icon: <Clock className="w-6 h-6" />, change: '', color: 'orange', subtext: 'Upgrade anytime' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('$') ? `$${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('steel_token');
    localStorage.removeItem('user');
    
    // Show logout message
    alert('You have been logged out successfully!');
    
    // Close dropdown
    setShowUserDropdown(false);
    
    // Redirect to login page
    navigate('/login');
  };

  // Jobber Calculator Functions
  const calculateJobber = () => {
    const { length, width, height, quantity, materialType, wasteFactor } = jobberInputs;
    
    if (!length || !width || !height) {
      alert('Please fill in all dimensions');
      return;
    }

    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const qty = parseFloat(quantity);
    const waste = parseFloat(wasteFactor) / 100;

    // Material density in kg/m³ (simplified)
    const densities = {
      steel: 7850,
      aluminum: 2700,
      wood: 600,
      concrete: 2400
    };

    // Material cost per kg (simplified)
    const costs = {
      steel: 3.5,
      aluminum: 8.5,
      wood: 1.2,
      concrete: 0.15
    };

    const volume = (l * w * h) / 1000000000; // Convert mm³ to m³
    const density = densities[materialType] || 7850;
    const weight = volume * density * qty;
    const materialCost = weight * (costs[materialType] || 3.5);
    const totalWithWaste = materialCost * (1 + waste);
    const laborCost = materialCost * 0.4; // 40% of material cost for labor
    const totalCost = totalWithWaste + laborCost;

    setJobberResult({
      volume: volume.toFixed(4),
      weight: weight.toFixed(2),
      materialCost: materialCost.toFixed(2),
      wasteCost: (materialCost * waste).toFixed(2),
      laborCost: laborCost.toFixed(2),
      totalCost: totalCost.toFixed(2)
    });
  };

  const resetJobberCalculator = () => {
    setJobberInputs({
      length: '',
      width: '',
      height: '',
      quantity: '1',
      materialType: 'steel',
      wasteFactor: '10'
    });
    setJobberResult(null);
  };

  const copyJobberResult = () => {
    if (jobberResult) {
      const text = `Jobber Calculator Results:\nVolume: ${jobberResult.volume} m³\nWeight: ${jobberResult.weight} kg\nMaterial Cost: $${jobberResult.materialCost}\nWaste: $${jobberResult.wasteCost}\nLabor: $${jobberResult.laborCost}\nTotal Cost: $${jobberResult.totalCost}`;
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  // Stair Calculator Functions
  const parseFeetInches = (value) => {
    if (!value) return 0;
    
    // Check if value contains feet/inches format like 9'10"
    if (typeof value === 'string') {
      const feetMatch = value.match(/(\d+(?:\.\d+)?)\s*'/);
      const inchesMatch = value.match(/(\d+(?:\.\d+)?)\s*"/);
      
      let totalInches = 0;
      if (feetMatch) totalInches += parseFloat(feetMatch[1]) * 12;
      if (inchesMatch) totalInches += parseFloat(inchesMatch[1]);
      
      if (totalInches > 0) return totalInches;
    }
    
    // Try to parse as a number
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatFeetInches = (inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}' ${remainingInches.toFixed(2)}"`;
  };

  const formatByMeasurement = (inches) => {
    const val = typeof inches === 'number' ? inches : parseFloat(inches) || 0;
    if (stairInputs.measurement === 'feet') return formatFeetInches(val);
    if (stairInputs.measurement === 'inches') return `${val.toFixed(2)} in`;
    const mm = val * 25.4;
    return `${mm.toFixed(1)} mm`;
  };

  const calculateStairs = () => {
    // Parse inputs
    const floorToFloorInches = parseFeetInches(stairInputs.floorToFloor);
    const riserHeight = parseFloat(stairInputs.riserHeight) || 0;
    const treadWidth = parseFloat(stairInputs.treadWidth) || 0;
    const numberOfSteps = parseFloat(stairInputs.numberOfSteps) || 0;
    const runInches = parseFeetInches(stairInputs.run);
    const pitch = parseFloat(stairInputs.pitch) || 0;
    const angle = parseFloat(stairInputs.angle) || 0;
    const nose = parseFloat(stairInputs.nose) || 1.25;
    const firstStep = parseFloat(stairInputs.firstStep) || 0;

    let calculatedResults = {};
    
    // Calculate number of steps if floor-to-floor and riser height are provided
    if (floorToFloorInches > 0 && riserHeight > 0) {
      calculatedResults.numberOfSteps = Math.ceil(floorToFloorInches / riserHeight);
      calculatedResults.exactRiser = floorToFloorInches / calculatedResults.numberOfSteps;
      calculatedResults.exactRiserFeetInches = formatFeetInches(calculatedResults.exactRiser);
    }
    
    // Calculate run if number of steps and tread width are provided
    if (numberOfSteps > 0 && treadWidth > 0) {
      calculatedResults.run = numberOfSteps * treadWidth;
      calculatedResults.runFeetInches = formatFeetInches(calculatedResults.run);
    }
    
    // Calculate angle and pitch if floor-to-floor and run are provided
    if (floorToFloorInches > 0 && runInches > 0) {
      calculatedResults.angle = Math.atan(floorToFloorInches / runInches) * (180 / Math.PI);
      calculatedResults.pitch = (floorToFloorInches / runInches) * 100;
    } else if (angle > 0 && floorToFloorInches > 0) {
      // Calculate run from angle
      const angleRad = angle * (Math.PI / 180);
      calculatedResults.run = floorToFloorInches / Math.tan(angleRad);
      calculatedResults.runFeetInches = formatFeetInches(calculatedResults.run);
    }
    
    // Calculate total rise and run
    if (calculatedResults.numberOfSteps && riserHeight) {
      calculatedResults.totalRise = calculatedResults.numberOfSteps * riserHeight;
      calculatedResults.totalRiseFeetInches = formatFeetInches(calculatedResults.totalRise);
    }
    
    // Format floor-to-floor for display
    if (floorToFloorInches > 0) {
      calculatedResults.floorToFloorFeetInches = formatFeetInches(floorToFloorInches);
    }

    setStairResults(calculatedResults);
  };

  const handleStairInputChange = (key, value) => {
    setStairInputs(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Auto-calculate on input change
    const updatedInputs = { ...stairInputs, [key]: value };
    
    // Basic validation
    if (key === 'floorToFloor' || key === 'riserHeight' || key === 'treadWidth' || 
        key === 'numberOfSteps' || key === 'run' || key === 'angle') {
      setTimeout(() => {
        const floorToFloorInches = parseFeetInches(updatedInputs.floorToFloor);
        const riserHeight = parseFloat(updatedInputs.riserHeight) || 0;
        
        if (floorToFloorInches > 0 && riserHeight > 0) {
          const tempResults = { ...stairResults };
          tempResults.numberOfSteps = Math.ceil(floorToFloorInches / riserHeight);
          tempResults.exactRiser = floorToFloorInches / tempResults.numberOfSteps;
          tempResults.exactRiserFeetInches = formatFeetInches(tempResults.exactRiser);
          setStairResults(tempResults);
        }
      }, 100);
    }
  };

  const handleNumberPadClick = (value) => {
    if (!activeInput) return;
    const current = stairInputs[activeInput] || '';
    handleStairInputChange(activeInput, `${current}${value}`);
  };

  const clearEntry = () => {
    if (activeInput) {
      handleStairInputChange(activeInput, '');
    } else {
      setStairResults(null);
    }
  };

  const resetStairCalculator = () => {
    setStairInputs({
      floorToFloor: '',
      riserHeight: '',
      treadWidth: '',
      numberOfSteps: '',
      run: '',
      pitch: '',
      angle: '',
      nose: '1.25',
      firstStep: '0',
      mode: 'feet-inches',
      measurement: 'feet'
    });
    setStairResults(null);
  };

  const copyStairResults = () => {
    if (stairResults) {
      const text = `Stair Calculator Results:\nFloor-to-Floor: ${stairResults.floorToFloorFeetInches || formatFeetInches(parseFeetInches(stairInputs.floorToFloor))}\nNumber of Steps: ${stairResults.numberOfSteps || 'N/A'}\nRiser Height: ${stairResults.exactRiserFeetInches || 'N/A'}\nTread Width: ${stairInputs.treadWidth || 'N/A'} in\nTotal Run: ${stairResults.runFeetInches || 'N/A'}\nStair Angle: ${stairResults.angle ? stairResults.angle.toFixed(1) + '°' : 'N/A'}\nPitch: ${stairResults.pitch ? stairResults.pitch.toFixed(1) + '%' : 'N/A'}`;
      navigator.clipboard.writeText(text);
      alert('Stair results copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

     <Sidebar onToggle={setIsSidebarCollapsed} />

      
      <div className={`mt-14 transition-all duration-300 p-6 ml-0 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
        
        {/* Combined Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Combined Title Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                  <p className="text-gray-600 mt-1">Real-time insights and project analytics</p>
                  
                  {/* Breadcrumb Navigation */}
                  <div className="flex items-center space-x-2 text-sm mt-3">
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-blue-600 font-semibold">Overview</span>
                  </div>
                </div>
              </div>
              
              {/* Right side: User profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${user.avatarColor} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {user.initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2"
                  >
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${user.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                          {user.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500 mt-1">{user.company}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">My Profile</div>
                          <div className="text-xs text-gray-500">View & edit profile</div>
                        </div>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Billing</div>
                          <div className="text-xs text-gray-500">Manage subscription</div>
                        </div>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Settings</div>
                          <div className="text-xs text-gray-500">App preferences</div>
                        </div>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <Moon className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Dark Mode</div>
                          <div className="text-xs text-gray-500">Toggle theme</div>
                        </div>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Help & Support</div>
                          <div className="text-xs text-gray-500">Documentation & FAQs</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Logout Section */}
                    <div className="border-t border-gray-100 pt-2">
                      <button 
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-left"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">Sign Out</div>
                          <div className="text-xs text-red-500">End current session</div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Top Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {/* Left side: Search and controls */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search projects, estimates..."
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                  <select 
                    className="px-3 py-2.5 text-sm bg-transparent border-none focus:ring-0"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="ytd">Year to Date</option>
                  </select>
                </div>
                
                <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Right side: Action buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowJobberCalculator(!showJobberCalculator)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {showJobberCalculator ? 'Hide Calculator' : 'Material Calc'}
                </button>
                <button 
                  onClick={() => setShowStairCalculator(!showStairCalculator)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {showStairCalculator ? 'Hide Stair Calc' : 'Stair Calculator'}
                </button>
                <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center shadow-sm">
                  <Grid className="w-4 h-4 mr-2" />
                  Add Widget
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* JOBBER CALCULATOR WIDGET */}
        {showJobberCalculator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Jobber Calculator</h2>
                    <p className="text-gray-600 text-sm">Calculate material requirements and costs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={copyJobberResult}
                    disabled={!jobberResult}
                    className={`p-2 rounded-lg ${jobberResult ? 'hover:bg-blue-100 text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                    title="Copy Results"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={resetJobberCalculator}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                    title="Reset Calculator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowJobberCalculator(false)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                    title="Close Calculator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Ruler className="w-4 h-4 mr-2 text-blue-600" />
                    Material Dimensions
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 1200"
                        value={jobberInputs.length}
                        onChange={(e) => setJobberInputs({...jobberInputs, length: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 800"
                        value={jobberInputs.width}
                        onChange={(e) => setJobberInputs({...jobberInputs, width: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (mm)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 50"
                        value={jobberInputs.height}
                        onChange={(e) => setJobberInputs({...jobberInputs, height: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={jobberInputs.quantity}
                        onChange={(e) => setJobberInputs({...jobberInputs, quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={jobberInputs.materialType}
                        onChange={(e) => setJobberInputs({...jobberInputs, materialType: e.target.value})}
                      >
                        <option value="steel">Steel</option>
                        <option value="aluminum">Aluminum</option>
                        <option value="wood">Wood</option>
                        <option value="concrete">Concrete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Percent className="w-3 h-3 mr-1" />
                        Waste Factor
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={jobberInputs.wasteFactor}
                          onChange={(e) => setJobberInputs({...jobberInputs, wasteFactor: e.target.value})}
                        />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg">%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={calculateJobber}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate Material & Cost
                  </button>
                </div>

                {/* Results Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-green-600" />
                    Calculation Results
                  </h3>
                  
                  {jobberResult ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Volume</span>
                          <span className="text-lg font-bold text-blue-600">{jobberResult.volume} m³</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Weight</span>
                          <span className="text-lg font-bold text-green-600">{jobberResult.weight} kg</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Material Cost</span>
                          <span className="text-lg font-bold text-yellow-600">${jobberResult.materialCost}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Waste Cost ({jobberInputs.wasteFactor}%)</span>
                          <span className="text-lg font-bold text-red-600">${jobberResult.wasteCost}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Labor Cost</span>
                          <span className="text-lg font-bold text-purple-600">${jobberResult.laborCost}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                          <span className="text-sm font-medium text-gray-700">Total Estimated Cost</span>
                          <span className="text-xl font-bold text-indigo-700">${jobberResult.totalCost}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                      <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Enter dimensions and click Calculate to see results</p>
                      <p className="text-sm text-gray-500 mt-2">Supports steel, aluminum, wood, and concrete materials</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">Quick Tips</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="text-xs text-gray-600 p-2 bg-white/50 rounded-lg">
                    • Enter dimensions in millimeters (mm)
                  </div>
                  <div className="text-xs text-gray-600 p-2 bg-white/50 rounded-lg">
                    • Waste factor accounts for cutting/material loss
                  </div>
                  <div className="text-xs text-gray-600 p-2 bg-white/50 rounded-lg">
                    • Labor cost is estimated at 40% of material cost
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAIR CALCULATOR WIDGET - Exact Match to Reference Image */}
        {showStairCalculator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6 border border-gray-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Stair Calculator</h2>
                    <p className="text-gray-600 text-sm">Professional stair dimension calculator - Feet & Inches</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={copyStairResults}
                    disabled={!stairResults}
                    className={`p-2 rounded-lg ${stairResults ? 'hover:bg-gray-200 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}
                    title="Copy Results"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={resetStairCalculator}
                    className="p-2 hover:bg-gray-200 text-gray-600 rounded-lg"
                    title="Reset Calculator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowStairCalculator(false)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                    title="Close Calculator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stair Calculator Interface - Exact Match to Reference Image */}
              <div className="bg-white rounded-xl border border-gray-300 p-4 shadow-inner">
                {/* Top Header - Exact Match */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <h3 className="text-lg font-bold text-gray-900">STAIRS</h3>
                    <span className="text-gray-500">|</span>
                    <div className="text-sm font-medium text-gray-700">
                      <span>9 ft. : 10</span>
                      <span className="mx-1">:</span>
                      <span>0/16 inch</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Enter values in feet-inches format (e.g., 9'10") or decimal inches
                  </div>
                </div>

                {/* Mode Selection - Reference colors */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <span className="py-2 text-xs font-semibold rounded-full bg-amber-500 text-black text-center">mode</span>
                  <button 
                    className={`py-2 text-xs font-semibold rounded-full ${stairInputs.mode === 'feet-inches' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => handleStairInputChange('mode', 'feet-inches')}
                  >
                    MEM ↓
                  </button>
                  <button className="py-2 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">13</button>
                  <button className="py-2 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">14</button>
                  <button className="py-2 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">15</button>
                  <button 
                    className={`py-2 text-xs font-semibold rounded-full ${stairInputs.mode === 'decimal-inch' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => handleStairInputChange('mode', 'decimal-inch')}
                  >
                    DEC
                  </button>
                  <button 
                    className={`py-2 text-xs font-semibold rounded-full ${stairInputs.mode === 'feet-inches' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => handleStairInputChange('mode', 'feet-inches')}
                  >
                    FIS
                  </button>
                </div>

                {/* Input Grid - Exact Match to Reference Layout */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {/* Row 1 - FL-FL, Run, Pitch, Nose, CE/C */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">FL-FL</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="floorToFloor"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 9'10"
                        value={stairInputs.floorToFloor}
                        onChange={(e) => handleStairInputChange('floorToFloor', e.target.value)}
                        onFocus={() => setActiveInput('floorToFloor')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">Run</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="run"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 11'6"
                        value={stairInputs.run}
                        onChange={(e) => handleStairInputChange('run', e.target.value)}
                        onFocus={() => setActiveInput('run')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">pitch</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="pitch"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="°"
                        value={stairInputs.pitch}
                        onChange={(e) => handleStairInputChange('pitch', e.target.value)}
                        onFocus={() => setActiveInput('pitch')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">°</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">nose</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="nose"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="in"
                        value={stairInputs.nose}
                        onChange={(e) => handleStairInputChange('nose', e.target.value)}
                        onFocus={() => setActiveInput('nose')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button onClick={clearEntry} className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full flex items-center justify-center text-xs">CE/C</button>
                  </div>

                  {/* Row 2 - riserH, stringr, angle, 1stStp, INCH */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">riserH</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="riserHeight"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 7.5"
                        value={stairInputs.riserHeight}
                        onChange={(e) => handleStairInputChange('riserHeight', e.target.value)}
                        onFocus={() => setActiveInput('riserHeight')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">stringr</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="stringer"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ft-In"
                        value={stairInputs.stringer}
                        onChange={(e) => handleStairInputChange('stringer', e.target.value)}
                        onFocus={() => setActiveInput('stringer')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">ft</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">angle</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="angle"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="°"
                        value={stairInputs.angle}
                        onChange={(e) => handleStairInputChange('angle', e.target.value)}
                        onFocus={() => setActiveInput('angle')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">°</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">1stStp</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="firstStep"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="in"
                        value={stairInputs.firstStep}
                        onChange={(e) => handleStairInputChange('firstStep', e.target.value)}
                        onFocus={() => setActiveInput('firstStep')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => handleStairInputChange('measurement', 'inches')} className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full flex items-center justify-center text-xs">INCH</button>
                  </div>

                  {/* Row 3 - trdWith, steps, Unit Display, MET */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">trdWth</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="treadWidth"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 10"
                        value={stairInputs.treadWidth}
                        onChange={(e) => handleStairInputChange('treadWidth', e.target.value)}
                        onFocus={() => setActiveInput('treadWidth')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">in</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">steps</span></div>
                    <div className="relative">
                      <input
                        type="text"
                        name="numberOfSteps"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Count"
                        value={stairInputs.numberOfSteps}
                        onChange={(e) => handleStairInputChange('numberOfSteps', e.target.value)}
                        onFocus={() => setActiveInput('numberOfSteps')}
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">#</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Display Units</label>
                    <div className="flex space-x-2">
                      <button 
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${stairInputs.measurement === 'feet' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => handleStairInputChange('measurement', 'feet')}
                      >
                        Feet-Inches
                      </button>
                      <button 
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${stairInputs.measurement === 'inches' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => handleStairInputChange('measurement', 'inches')}
                      >
                        Decimal Inches
                      </button>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => handleStairInputChange('measurement', 'metric')} className="w-full h-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full flex items-center justify-center text-xs">MET</button>
                  </div>
                </div>

                {/* Number Pad - Exact Match to Reference */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('7')}>7</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('8')}>8</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('9')}>9</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">→</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">rem</button>
                  
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('4')}>4</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('5')}>5</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('6')}>6</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">+/-</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">/</button>
                  
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('1')}>1</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('2')}>2</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('3')}>3</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">X</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">+</button>
                  
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('.')}>.</button>
                  <button className="py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-xs font-semibold" onClick={() => handleNumberPadClick('0')}>0</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">+</button>
                  <button className="py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">-</button>
                  <button className="py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs" onClick={calculateStairs}>=</button>
                </div>

                {/* Real-time Results Display */}
                {stairResults && (
                  <div className="mt-4 p-3 bg-[#0f2038] rounded-lg border border-[#1e3a8a]">
                    <h4 className="font-medium text-gray-100 mb-2 text-sm">Calculated Results:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {stairResults.floorToFloorFeetInches && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Floor-to-Floor:</span>
                          <span className="font-semibold text-gray-100">{formatByMeasurement(parseFeetInches(stairInputs.floorToFloor))}</span>
                        </div>
                      )}
                      {stairResults.numberOfSteps && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Number of Steps:</span>
                          <span className="font-semibold text-gray-100">{stairResults.numberOfSteps}</span>
                        </div>
                      )}
                      {stairResults.exactRiserFeetInches && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Riser Height:</span>
                          <span className="font-semibold text-gray-100">{formatByMeasurement(stairResults.exactRiser)}</span>
                        </div>
                      )}
                      {stairInputs.treadWidth && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Tread Width:</span>
                          <span className="font-semibold text-gray-100">{stairInputs.treadWidth} in</span>
                        </div>
                      )}
                      {stairResults.runFeetInches && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Run:</span>
                          <span className="font-semibold text-gray-100">{formatByMeasurement(stairResults.run)}</span>
                        </div>
                      )}
                      {stairResults.angle && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Stair Angle:</span>
                          <span className="font-semibold text-gray-100">{stairResults.angle.toFixed(1)}°</span>
                        </div>
                      )}
                      {stairResults.pitch && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Pitch:</span>
                          <span className="font-semibold text-gray-100">{stairResults.pitch.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Reference */}
                <div className="mt-4 text-xs text-gray-600">
                  <div className="flex items-center mb-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span>Format: <strong>9'10"</strong> or <strong>9.833'</strong> or <strong>118"</strong></span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>Calculations update automatically as you type</span>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={calculateStairs}
                  className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-black transition-all flex items-center shadow-md"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate Stair Dimensions
                </button>
              </div>

              {/* Stair Standards Info */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-white/70 rounded-lg">
                    <div className="font-medium text-gray-900 mb-1">Standard Riser Range</div>
                    <div className="text-gray-600">7" to 7.75" (Residential)</div>
                    <div className="text-gray-600">6" to 7.5" (Commercial)</div>
                  </div>
                  <div className="p-3 bg-white/70 rounded-lg">
                    <div className="font-medium text-gray-900 mb-1">Standard Tread Range</div>
                    <div className="text-gray-600">10" to 11" (Residential)</div>
                    <div className="text-gray-600">11" min (Commercial)</div>
                  </div>
                  <div className="p-3 bg-white/70 rounded-lg">
                    <div className="font-medium text-gray-900 mb-1">Ideal Stair Angle</div>
                    <div className="text-gray-600">30° to 35° (Residential)</div>
                    <div className="text-gray-600">20° to 30° (Commercial)</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Revenue & Expenses</h2>
                  <p className="text-gray-600">Monthly performance overview</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Expenses</span>
                  </div>
                </div>
              </div>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#3B82F6" 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Expenses" 
                      stroke="#10B981" 
                      fill="url(#colorExpenses)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Performance KPIs</h2>
              
              <div className="space-y-4">
                {kpiData.map((kpi, index) => (
                  <div key={index} className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-600">{kpi.metric}</div>
                      <div className={`flex items-center ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        <span className="text-sm font-medium">{kpi.change}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${kpi.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.random() * 60 + 40}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Project Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Project Timeline</h2>
                  <p className="text-gray-600">Monthly project count and costs</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Details <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#6b7280" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="projects" 
                      name="Projects" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="cost" 
                      name="Cost ($)" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Project Type Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Project Types</h2>
                  <p className="text-gray-600">Distribution by category</p>
                </div>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={projectTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {projectTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {projectTypeData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.type}</div>
                      <div className="text-sm text-gray-600">{item.value}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                  <p className="text-gray-600">Latest project activities and status</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Project</th>
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Type</th>
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Status</th>
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Cost</th>
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Progress</th>
                      <th className="py-3 text-left text-gray-600 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-600">{project.number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-700">{project.type}</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-gray-900">
                          ${project.cost.toLocaleString()}
                        </td>
                        <td className="py-4">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                project.status === 'completed' ? 'bg-green-500' :
                                project.status === 'in-progress' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{project.progress}%</div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors" title="More">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions & Cost Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            {/* Cost Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Cost Breakdown</h2>
              
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2">
                {costBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all group border border-blue-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">New Estimation</div>
                      <div className="text-sm text-gray-600">Create detailed cost estimate</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all group border border-green-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Import CAD</div>
                      <div className="text-sm text-gray-600">Upload DWG/DXF files</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all group border border-purple-100">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Generate Report</div>
                      <div className="text-sm text-gray-600">PDF, Excel, or CSV</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;