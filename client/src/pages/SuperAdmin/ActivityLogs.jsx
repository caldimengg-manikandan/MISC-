// client/src/pages/SuperAdmin/ActivityLogs.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  Clock, 
  User, 
  Target, 
  Eye, 
  RefreshCcw,
  FileJson,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/logs');
      setLogs(res.data.logs);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.actor_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.target_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-indigo-600 bg-indigo-50 border-indigo-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Trail</h2>
          <p className="text-slate-500 mt-1">Immutable record of all superadmin administrative actions.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-3 bg-white hover:bg-slate-50 text-slate-500 rounded-xl transition-all border border-slate-200 shadow-sm"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by admin, action, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs List */}
        <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <RefreshCcw className="w-10 h-10 text-slate-300 animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Decrypting audit records...</p>
            </div>
          ) : filteredLogs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedLog(log)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                selectedLog?.id === log.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border ${getActionColor(log.action)}`}>
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${selectedLog?.id === log.id ? 'text-indigo-900' : 'text-slate-900'}`}>{log.action}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">{log.target_name || `ID:${log.target_id}`}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter">
                    <User className="w-3 h-3 text-slate-300" />
                    {log.actor_email} • {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <Eye className={`w-4 h-4 transition-all ${selectedLog?.id === log.id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit sticky top-0 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-600" />
            Payload Detail
          </h3>
          
          {selectedLog ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Timestamp</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-300" />
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Action Type</p>
                  <p className={`text-sm font-semibold ${selectedLog.action.includes('CREATE') ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {selectedLog.action}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Target Resource</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-xs">{selectedLog.target_type} : {selectedLog.target_name || selectedLog.target_id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">JSON Payload</p>
                <pre className="text-[11px] font-mono text-indigo-700 p-4 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto whitespace-pre-wrap max-h-64">
                  {JSON.stringify(JSON.parse(selectedLog.detail || '{}'), null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm italic">Select a record to inspect the technical payload.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;

