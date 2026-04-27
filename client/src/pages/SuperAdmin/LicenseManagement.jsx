// client/src/pages/SuperAdmin/LicenseManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Users,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LicenseManagement = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New License Form State
  const [formData, setFormData] = useState({
    adminEmail: '',
    licenseType: 'professional',
    maxEstimators: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/licenses');
      setLicenses(res.data.licenses);
    } catch (err) {
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCreateLicense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/superadmin/licenses', formData);
      toast.success('License created and invite sent!');
      setIsModalOpen(false);
      fetchLicenses();
      // Reset form
      setFormData({
        adminEmail: '',
        licenseType: 'professional',
        maxEstimators: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create license');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/superadmin/licenses/${id}`, { isActive: !currentStatus });
      toast.success(`License ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchLicenses();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filteredLicenses = licenses.filter(l => {
    const matchesSearch = (l.admin_email || l.invite_email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (l.license_key || '').toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'active') return matchesSearch && l.is_active && new Date(l.valid_until) >= new Date();
    if (statusFilter === 'expired') return matchesSearch && (new Date(l.valid_until) < new Date());
    if (statusFilter === 'inactive') return matchesSearch && !l.is_active;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">License Management</h2>
          <p className="text-slate-500 mt-1">Issue and manage organization-level access keys.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Create New License
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by email, key or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'expired', 'inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                statusFilter === f 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Admin / Key</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Validity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && licenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Syncing with license vault...</p>
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-500 italic">
                    No licenses found matching your criteria.
                  </td>
                </tr>
              ) : filteredLicenses.map((license) => {
                const isExpired = new Date(license.valid_until) < new Date();
                const isActive = license.is_active && !isExpired;
                
                return (
                  <tr key={license.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-0.5">
                          {license.admin_email || license.invite_email}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 tracking-wider">
                          {license.license_key}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                        license.license_type === 'enterprise' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : license.license_type === 'professional'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {license.license_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>{license.estimators_used || 0} / {license.max_estimators}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>Ends {new Date(license.valid_until).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Active
                        </span>
                      ) : isExpired ? (
                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                          <AlertCircle className="w-4 h-4" />
                          Expired
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                          <ShieldAlert className="w-4 h-4" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleStatus(license.id, license.is_active)}
                          title={license.is_active ? 'Deactivate' : 'Activate'}
                          className={`p-2 rounded-lg border transition-all ${
                            license.is_active 
                              ? 'hover:bg-rose-50 hover:text-rose-600 border-slate-200' 
                              : 'hover:bg-emerald-50 hover:text-emerald-600 border-slate-200'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Plus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Create New License</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateLicense} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 ml-1">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email"
                      required
                      placeholder="admin@company.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1">Tier</label>
                    <select 
                      value={formData.licenseType}
                      onChange={(e) => setFormData({...formData, licenseType: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1">Estimator Slots</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.maxEstimators}
                      onChange={(e) => setFormData({...formData, maxEstimators: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1">Valid From</label>
                    <input 
                      type="date"
                      required
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1">Valid Until</label>
                    <input 
                      type="date"
                      required
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 ml-1">Private Notes</label>
                  <textarea 
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Reference, contract number, etc."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Issue License & Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LicenseManagement;
