// client/src/components/dashboard/OwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, DollarSign, TrendingUp, TrendingDown,
  Building2, FileText, Calculator, PieChart, Download,
  Calendar, Target, Award, Clock, Filter, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import API_BASE_URL from '../../config/api';

const OwnerDashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeTrials: 0,
    expiredTrials: 0,
    totalRevenue: 0,
    monthlyRevenue: []
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Fetch owner analytics
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const response = await fetch(`${API_BASE_URL}/api/owner/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch owner data:', error);
    }
  };

  // Mock data for demonstration
  const revenueData = [
    { month: 'Jan', revenue: 42000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 61000 },
    { month: 'Apr', revenue: 58000 },
    { month: 'May', revenue: 72000 },
    { month: 'Jun', revenue: 85000 },
  ];

  const userDistribution = [
    { type: 'Active Trials', value: 65, color: '#3B82F6' },
    { type: 'Expired Trials', value: 20, color: '#EF4444' },
    { type: 'Paid Users', value: 15, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Sidebar onToggle={setIsSidebarCollapsed} />
      <div className={`p-6 ml-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Owner Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Business insights and user analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-3xl font-bold text-gray-900">248</div>
              <div className="text-sm text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% this month
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Active Trials</div>
              <div className="text-3xl font-bold text-gray-900">156</div>
              <div className="text-sm text-blue-600">62.9% of total</div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Monthly Revenue</div>
              <div className="text-3xl font-bold text-gray-900">$8,450</div>
              <div className="text-sm text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +18.2% from last month
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-3xl font-bold text-gray-900">8.4%</div>
              <div className="text-sm text-red-600 flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                -1.2% from last month
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
              <p className="text-gray-600">Monthly revenue performance</p>
            </div>
            <button className="flex items-center text-blue-600 hover:text-blue-800">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Distribution</h2>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {userDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
            <p className="text-gray-600">Latest user registrations and trial status</p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-gray-600 font-medium text-sm">User</th>
                <th className="py-3 text-left text-gray-600 font-medium text-sm">Company</th>
                <th className="py-3 text-left text-gray-600 font-medium text-sm">Status</th>
                <th className="py-3 text-left text-gray-600 font-medium text-sm">Trial Ends</th>
                <th className="py-3 text-left text-gray-600 font-medium text-sm">Usage</th>
                <th className="py-3 text-left text-gray-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Smith', email: 'john@steelco.com', company: 'SteelCo Inc', status: 'active', trialEnds: '2024-02-15', usage: '65%' },
                { name: 'Sarah Johnson', email: 'sarah@buildright.com', company: 'BuildRight', status: 'active', trialEnds: '2024-02-20', usage: '42%' },
                { name: 'Mike Chen', email: 'mike@prefab.com', company: 'Prefab Solutions', status: 'expired', trialEnds: '2024-01-30', usage: '100%' },
                { name: 'Emma Wilson', email: 'emma@arcdesign.com', company: 'Arc Design', status: 'active', trialEnds: '2024-03-01', usage: '23%' },
                { name: 'David Lee', email: 'david@structeng.com', company: 'StructEng', status: 'converted', trialEnds: 'N/A', usage: 'Paid' },
              ].map((user, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-700">{user.company}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-700">{user.trialEnds}</td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-100 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            user.usage === 'Paid' ? 'bg-purple-500' :
                            parseInt(user.usage) > 80 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: user.usage === 'Paid' ? '100%' : user.usage }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{user.usage}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <button className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      Manage
                    </button>
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

export default OwnerDashboard;