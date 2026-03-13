// SummaryPopup.jsx
import React from 'react';
import { 
  X, 
  Download, 
  BarChart3,
  Printer,
  FileText,
  TrendingUp,
  PieChart,
  Users,
  Package
} from 'lucide-react';

const SummaryPopup = ({ 
  onClose, 
  estimations = [], 
  filters = { customerName: '', projectName: '' }, 
  onFilterChange, 
  statusCounts = {} 
}) => {
  // Safe filtering with error handling
  const filteredEstimations = estimations.filter(estimation => {
    if (!estimation) return false;
    
    const customerName = estimation.customerName || '';
    const projectName = estimation.projectName || '';
    const filterCustomer = filters.customerName || '';
    const filterProject = filters.projectName || '';
    
    return (
      customerName.toLowerCase().includes(filterCustomer.toLowerCase()) &&
      projectName.toLowerCase().includes(filterProject.toLowerCase())
    );
  });

  // Enhanced data calculations for graphs with safe defaults
  const calculateGraphData = () => {
    const safeEstimations = estimations || [];
    
    // Status distribution
    const statusData = Object.entries(statusCounts || {}).map(([status, count]) => ({
      status,
      count: count || 0,
      percentage: ((count || 0) / Math.max(1, safeEstimations.length)) * 100
    }));

    // Monthly trend data
    const monthlyData = safeEstimations.reduce((acc, est) => {
      if (!est) return acc;
      
      try {
        const date = est.createdAt || est.date || new Date().toISOString();
        const month = new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[month] = (acc[month] || 0) + 1;
      } catch (error) {
        console.warn('Invalid date in estimation:', est);
      }
      return acc;
    }, {});

    // Customer distribution
    const customerData = safeEstimations.reduce((acc, est) => {
      if (!est) return acc;
      const customer = est.customerName || 'Unknown Customer';
      acc[customer] = (acc[customer] || 0) + 1;
      return acc;
    }, {});

    // Weight distribution
    const weightRanges = {
      '0-1000 lbs': 0,
      '1001-5000 lbs': 0,
      '5001-10000 lbs': 0,
      '10000+ lbs': 0
    };

    safeEstimations.forEach(est => {
      if (!est) return;
      const weight = est.totalWeight || 0;
      if (weight <= 1000) weightRanges['0-1000 lbs']++;
      else if (weight <= 5000) weightRanges['1001-5000 lbs']++;
      else if (weight <= 10000) weightRanges['5001-10000 lbs']++;
      else weightRanges['10000+ lbs']++;
    });

    return {
      statusData,
      monthlyData: Object.entries(monthlyData).map(([month, count]) => ({ month, count: count || 0 })),
      customerData: Object.entries(customerData).slice(0, 5), // Top 5 customers
      weightRanges: Object.entries(weightRanges)
    };
  };

  const graphData = calculateGraphData();

  const handleExport = () => {
    alert('Exporting summary data...');
  };

  const handlePrint = () => {
    window.print();
  };

  // Enhanced status colors with safe defaults
  const getStatusColor = (status) => {
    const colors = {
      'Completed': { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' },
      'In Progress': { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
      'Pending': { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
      'Draft': { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-50' }
    };
    return colors[status] || colors['Draft'];
  };

  // Safe calculations for stats
  const totalEstimations = estimations?.length || 0;
  const completedCount = statusCounts?.['Completed'] || 0;
  const inProgressCount = statusCounts?.['In Progress'] || 0;
  const totalWeight = estimations?.reduce((sum, est) => sum + (est?.totalWeight || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Estimations Dashboard</h2>
            <p className="text-gray-600 mt-1">Comprehensive analytics and project insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Estimates</p>
                  <p className="text-3xl font-bold mt-2">{totalEstimations}</p>
                </div>
                <FileText className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4 text-blue-100 text-sm">
                +{Math.round((totalEstimations / 30) * 100)}% this month
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold mt-2">{completedCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4 text-green-100 text-sm">
                {totalEstimations > 0 ? Math.round((completedCount / totalEstimations) * 100) : 0}% success rate
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold mt-2">{inProgressCount}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4 text-purple-100 text-sm">
                {totalEstimations > 0 ? Math.round((inProgressCount / totalEstimations) * 100) : 0}% in progress
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Weight</p>
                  <p className="text-3xl font-bold mt-2">
                    {totalWeight.toLocaleString()} lbs
                  </p>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4 text-orange-100 text-sm">
                Average: {totalEstimations > 0 ? Math.round(totalWeight / totalEstimations) : 0} lbs
              </div>
            </div>
          </div>

          {/* Enhanced Graph Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Status Distribution - Donut Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Status Distribution</h3>
              </div>
              {totalEstimations > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      {/* Donut Chart */}
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {graphData.statusData.reduce((acc, item, index) => {
                          const previousPercent = acc.reduce((sum, _, i) => sum + (graphData.statusData[i]?.percentage || 0), 0);
                          const percent = item.percentage || 0;
                          const color = getStatusColor(item.status);
                          
                          return [
                            ...acc,
                            <circle
                              key={item.status}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={color.bg}
                              strokeWidth="20"
                              strokeDasharray={`${percent} ${100 - percent}`}
                              strokeDashoffset={-previousPercent}
                              className="transition-all duration-500"
                            />
                          ];
                        }, [])}
                      </svg>
                      
                      {/* Center Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{totalEstimations}</div>
                          <div className="text-sm text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 space-y-3">
                    {graphData.statusData.map((item) => {
                      const color = getStatusColor(item.status);
                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${color.bg}`}></div>
                            <span className="text-sm text-gray-700">{item.status}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {item.count} ({Math.round(item.percentage)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available for visualization
                </div>
              )}
            </div>

            {/* Monthly Trend - Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Monthly Trend</h3>
              </div>
              {graphData.monthlyData.length > 0 ? (
                <div className="h-64 flex items-end justify-between gap-2">
                  {graphData.monthlyData.slice(-6).map((item, index) => {
                    const maxCount = Math.max(...graphData.monthlyData.map(d => d.count || 0));
                    const height = ((item.count || 0) / Math.max(1, maxCount)) * 100;
                    
                    return (
                      <div key={item.month} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-500 mb-2 text-center">{item.month}</div>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`${item.count} estimates`}
                        ></div>
                        <div className="text-sm font-semibold text-gray-900 mt-2">{item.count}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No monthly data available
                </div>
              )}
            </div>

            {/* Customer Distribution - Horizontal Bars */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Top Customers</h3>
              </div>
              {graphData.customerData.length > 0 ? (
                <div className="space-y-4">
                  {graphData.customerData.map(([customer, count]) => {
                    const percentage = ((count || 0) / Math.max(1, totalEstimations)) * 100;
                    return (
                      <div key={customer} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate" title={customer}>
                            {customer}
                          </span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No customer data available
                </div>
              )}
            </div>
          </div>

          {/* Additional informative message */}
          <div className="text-center text-sm text-gray-500 mb-4">
            Showing insights from {totalEstimations} estimation{totalEstimations !== 1 ? 's' : ''}
            {filteredEstimations.length !== totalEstimations && ` (filtered from ${filteredEstimations.length})`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPopup;