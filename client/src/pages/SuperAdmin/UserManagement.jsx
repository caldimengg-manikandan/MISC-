// client/src/pages/SuperAdmin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  ShieldAlert,
  LogOut,
  RefreshCcw,
  Ban,
  Activity,
  UserCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load user records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure? This will disable account access immediately.')) return;
    try {
      await api.patch(`/superadmin/users/${id}/deactivate`);
      toast.success('User access revoked');
      fetchUsers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleForceLogout = async (id) => {
    try {
      await api.patch(`/superadmin/users/${id}/force-logout`);
      toast.success('Session invalidated');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/superadmin/users/${id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error('Role update failed');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.name || u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.company || '').toLowerCase().includes(search.toLowerCase());
    
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Registry</h2>
          <p className="text-slate-500 mt-1">Manage all accounts and root permissions across tenants.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by email, name or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'superadmin', 'admin', 'estimator'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                roleFilter === r 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {r}s
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role / Access</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Retrieving user database...</p>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${
                        user.role === 'superadmin' ? 'bg-rose-500 border-rose-100' : 
                        user.role === 'admin' ? 'bg-indigo-500 border-indigo-100' : 
                        'bg-blue-500 border-blue-100'
                      }`}>
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-0.5">{user.name || user.full_name || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                        user.role === 'superadmin' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : user.role === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                      {user.license_type && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {user.license_type} License
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      <span>{user.company || 'Private Tenant'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-slate-700">
                        {user.session_at ? new Date(user.session_at).toLocaleDateString() : 'Never logged in'}
                      </p>
                      {user.session_at && (
                        <p className="text-[10px] text-slate-400">{new Date(user.session_at).toLocaleTimeString()}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      user.subscriptionStatus === 'active' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {user.subscriptionStatus === 'active' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {user.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleForceLogout(user.id)}
                        title="Force Logout"
                        className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-lg border border-slate-200 transition-all text-slate-400"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeactivate(user.id)}
                        title="Deactivate Account"
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200 transition-all text-slate-400"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <div className="relative group/menu">
                        <button className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl invisible group-hover/menu:visible z-50 overflow-hidden">
                          <button 
                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'superadmin' : 'admin')}
                            className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Change Role
                          </button>
                          <button className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 border-t border-slate-100">
                            <Mail className="w-3.5 h-3.5" />
                            Send Reset Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
