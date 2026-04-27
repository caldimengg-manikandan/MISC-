// client/src/pages/SuperAdmin/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Key, 
  Activity, 
  Database,
  TrendingUp,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2`} />
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 bg-${color}-50/50 rounded-2xl border border-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
  </motion.div>
);

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/superadmin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin mr-3" />
      Loading system metrics...
    </div>
  );

  const stats = data?.metrics || {};
  const recentLogs = data?.recentActivity || [];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Global Overview</h2>
          <p className="text-slate-500 mt-1">Real-time health and license metrics across all tenants.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
          <Clock className="w-3 h-3" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Admins" 
          value={stats.total_admins || 0} 
          icon={Users} 
          color="blue" 
          trend="+12%" 
        />
        <StatCard 
          title="Active Licenses" 
          value={stats.active_licenses || 0} 
          icon={Key} 
          color="indigo" 
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats.expiring_soon || 0} 
          icon={AlertCircle} 
          color="amber" 
        />
        <StatCard 
          title="Recent Activity" 
          value={stats.activity_last_7d || 0} 
          icon={Activity} 
          color="emerald" 
          trend="+5%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            System Resource Distribution
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Estimator Slots Used</span>
                <span className="text-slate-900 font-medium">{stats.total_estimators || 0} active</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[35%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.2)]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Platform Utilization</span>
                <span className="text-slate-900 font-medium">{Math.min(100, (stats.total_admins / 50) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[18%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent System Activity</h3>
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-blue-600">{log.action}</span> by {log.actor_email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!recentLogs.length) && <p className="text-slate-500 text-sm italic">No recent activity logs.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
