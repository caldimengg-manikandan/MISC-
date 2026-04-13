import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Building, Zap, Image as ImageIcon, 
  Database, ShieldAlert, Cpu, Globe, Save, RefreshCw 
} from 'lucide-react';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [config, setConfig] = useState({
    company_name: 'Stair Fabrication Engine',
    company_logo: '',
    support_email: 'support@sf-engine.com',
    system_version: '2.4.0-stable',
    last_backup: '2024-04-12 04:00 AM'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConfig(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      toast.error("Failed to load system config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedConfig) => {
    const t = toast.loading("Updating system settings...");
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...config, ...updatedConfig })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("System configurations updated", { id: t });
        setConfig(prev => ({ ...prev, ...updatedConfig }));
      }
    } catch (err) {
      toast.error("Save failed", { id: t });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSave({ company_logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const executeBatchRecalculate = async () => {
    if (window.confirm("CRITICAL: This will overwrite pricing data for ALL historical projects. Proceed?")) {
      const t = toast.loading("Executing batch propagation...");
      try {
        const token = localStorage.getItem('steel_token');
        const res = await fetch(`${API_BASE_URL}/api/admin/recalculate-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message, { id: t, duration: 5000 });
        }
      } catch (err) {
        toast.error("Operation failed", { id: t });
      }
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Initializing System Context...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto p-10"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
           <div className="p-3 bg-slate-900 text-white rounded-2xl"><Settings size={32} /></div>
           System Settings
        </h1>
        <p className="text-slate-500 mt-3 text-lg">Global administration, branding, and system maintenance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Branding & Core */}
        <div className="lg:col-span-12 space-y-10">
           
           {/* Branding Card */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                 <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                    <Building size={20} className="text-blue-600" /> Organization Branding
                 </h2>
                 <p className="text-sm text-slate-500 mb-8 font-medium">Customize how your company appears on official SFE reports and invitations.</p>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Company Name</label>
                       <input 
                         type="text" 
                         value={config.company_name}
                         onChange={(e) => setConfig({...config, company_name: e.target.value})}
                         onBlur={() => handleSave({ company_name: config.company_name })}
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Support Contact</label>
                       <input 
                         type="email" 
                         value={config.support_email}
                         onChange={(e) => setConfig({...config, support_email: e.target.value})}
                         onBlur={() => handleSave({ support_email: config.support_email })}
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                 <div className="w-40 h-40 bg-white shadow-xl rounded-3xl mb-6 flex items-center justify-center overflow-hidden border border-slate-100">
                    {config.company_logo ? (
                       <img src={config.company_logo} alt="Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                       <ImageIcon size={48} className="text-slate-200" />
                    )}
                 </div>
                 <label className="px-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl font-black text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-all active:scale-95">
                    Choose New Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                 </label>
                 <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-tighter">Recommended: PNG / SVG with transparent background</p>
              </div>
           </div>

           {/* Maintenance & Integrity */}
           <div className="bg-slate-900 p-12 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Database size={200} /></div>
              
              <div className="relative z-10">
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <ShieldAlert size={28} className="text-red-500" /> System Integrity
                 </h2>
                 <p className="text-slate-400 font-medium mb-12">Critical maintenance operations for system-wide data synchronization.</p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-all">
                       <h3 className="font-bold text-lg mb-2">Pricing Propagation</h3>
                       <p className="text-xs text-slate-400 mb-6 leading-relaxed">Overwrite historical pricing for all project estimations using current global rates. Use after updating steel price or shop rates.</p>
                       <button 
                         onClick={executeBatchRecalculate}
                         className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-xl font-black text-sm shadow-xl shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95"
                       >
                          <RefreshCw size={16} /> Run Global Batch
                       </button>
                    </div>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl opacity-50 cursor-not-allowed">
                       <h3 className="font-bold text-lg mb-2">Snapshot & Backup</h3>
                       <p className="text-xs text-slate-400 mb-6 leading-relaxed">Archive current system state and export a local database dump. Managed by automated schedule.</p>
                       <div className="text-[10px] font-black uppercase text-blue-400">Next Sync: 2026-04-13 @ 04:00</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Environment Metadata */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Cpu size={20} /></div>
                 <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Version</div>
                    <div className="text-slate-800 font-black">{config.system_version}</div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Globe size={20} /></div>
                 <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</div>
                    <div className="text-slate-800 font-black">Local / Dev Internal</div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                 <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Database size={20} /></div>
                 <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DB Type</div>
                    <div className="text-slate-800 font-black">MSSQL Server</div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </motion.div>
  );
}
