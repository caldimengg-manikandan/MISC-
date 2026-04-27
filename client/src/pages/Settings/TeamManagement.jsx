// client/src/pages/Settings/TeamManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  RefreshCw, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  LogOut,
  Ban,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [data, setData] = useState({ estimators: [], license: null });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/users', { email: newEmail, name: newName });
      toast.success(`Invite sent to ${newEmail}`);
      setIsModalOpen(false);
      setNewEmail('');
      setNewName('');
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invitation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this estimator? They will lose access immediately.')) return;
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      toast.success('Estimator deactivated');
      fetchTeam();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleForceLogout = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/force-logout`);
      toast.success('Estimator logged out');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto p-10"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl">
              <Users size={32} />
            </div>
            Team Management
          </h1>
          <p className="text-slate-500 mt-3 text-lg">Manage estimator accounts and collaborative access.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={data.license?.availableSlots === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2"
        >
          <UserPlus size={18} />
          Invite Estimator
        </button>
      </div>

      {/* License Summary Mini-Bar */}
      {data.license && (
        <div className="mb-8 p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seats Used</p>
              <p className="text-xl font-black">{data.license.usedSlots} / {data.license.maxEstimators}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available</p>
              <p className="text-xl font-black text-emerald-400">{data.license.availableSlots}</p>
            </div>
          </div>
          {data.license.availableSlots === 0 && (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">License Limit Reached</span>
            </div>
          )}
        </div>
      )}

      {/* Team Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimator Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && data.estimators.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center text-slate-400 italic">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-20" />
                  Syncing team directory...
                </td>
              </tr>
            ) : data.estimators.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center text-slate-400 italic">
                  No estimators found. Start by inviting your first team member.
                </td>
              </tr>
            ) : data.estimators.map((est) => (
              <tr key={est.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black">
                      {est.name ? est.name[0].toUpperCase() : est.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{est.name || 'Pending Invite'}</p>
                      <p className="text-xs text-slate-500 font-medium">{est.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    est.subscriptionStatus === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {est.subscriptionStatus}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={14} className="opacity-50" />
                    <span className="text-xs font-medium">
                      {est.session_at ? new Date(est.session_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 invisible group-hover:visible transition-all">
                    <button 
                      onClick={() => handleForceLogout(est.id)}
                      title="Force Logout"
                      className="p-2 hover:bg-amber-50 text-amber-600 rounded-xl transition-colors border border-transparent hover:border-amber-100"
                    >
                      <LogOut size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeactivate(est.id)}
                      title="Deactivate Account"
                      className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Invite Estimator</h3>
                  <p className="text-sm text-slate-500 font-medium">Add a new collaborator to your team.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="john@company.com"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Send Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamManagement;
