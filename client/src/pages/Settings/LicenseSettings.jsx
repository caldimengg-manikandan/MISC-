// client/src/pages/Settings/LicenseSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Key, 
  Calendar, 
  Users, 
  AlertCircle,
  CreditCard,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LicenseSettings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const res = await api.get('/admin/users');
        setData(res.data.license);
      } catch (err) {
        toast.error('Failed to load license details');
      } finally {
        setLoading(false);
      }
    };
    fetchLicense();
  }, []);

  if (loading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
      <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
      <span className="text-slate-400 font-medium">Reading License Vault...</span>
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center text-slate-500">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No active license found for your account.</p>
    </div>
  );

  const expiryDate = new Date(data.validUntil);
  const isExpired = expiryDate < new Date();
  const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-10"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <ShieldCheck size={32} />
          </div>
          License & Usage
        </h1>
        <p className="text-slate-500 mt-3 text-lg">Manage your organization's subscription and estimator seat limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* License Status Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Key size={100} className="text-indigo-600" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                data.isActive && !isExpired 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {data.isActive && !isExpired ? 'Active Status' : 'Attention Required'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-1">Standard Pro Plan</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">Official enterprise license for MISC Engineering</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Until</p>
                  <p className="font-bold">{expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renewal Period</p>
                  <p className={`font-bold ${daysLeft < 30 ? 'text-amber-600' : ''}`}>
                    {isExpired ? 'Expired' : `${daysLeft} days remaining`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <Users size={24} className="text-blue-400" /> Estimator Seats
          </h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slot Utilization</p>
                  <p className="text-2xl font-black">{data.usedSlots} <span className="text-slate-500 font-medium">/ {data.maxEstimators}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-blue-400">
                    {Math.round((data.usedSlots / data.maxEstimators) * 100)}%
                  </p>
                </div>
              </div>
              
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(data.usedSlots / data.maxEstimators) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                You have <span className="text-white">{data.availableSlots}</span> seat{data.availableSlots !== 1 ? 's' : ''} available. 
                Deactivate old estimators in <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/settings/team')}>Team Management</span> to free up slots.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <CreditCard className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">Need more seats?</h3>
            <p className="text-sm text-slate-600 font-medium">Upgrade to Enterprise for unlimited estimators and dedicated support.</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2">
          Contact Support <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default LicenseSettings;
