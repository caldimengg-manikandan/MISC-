import React from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Save, RefreshCw } from 'lucide-react';

export default function PricingOverridesModal({ isOpen, onClose, localConfig, setLocalConfig, onApply }) {
  if (!isOpen) return null;

  const handleClear = () => {
    setLocalConfig({});
  };

  const setConfigVal = (key, val) => {
    setLocalConfig(prev => {
      const copy = { ...prev };
      if (val === '' || val === null || isNaN(parseFloat(val))) {
        delete copy[key]; // Inherit global
      } else {
        copy[key] = parseFloat(val);
      }
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Local Pricing Overrides</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Isolated to this project</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
            Overriding these rates overrides the global Admin Pricing Settings for <b>this estimate only</b>. Leave blank to inherit global defaults.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Steel Price/lb</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" step="0.01" placeholder="Global"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.steel_price_per_lb ?? ''}
                  onChange={(e) => setConfigVal('steel_price_per_lb', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Galvanize/lb</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" step="0.01" placeholder="Global"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.galvanize_rate ?? ''}
                  onChange={(e) => setConfigVal('galvanize_rate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powder Coat/lb</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" step="0.01" placeholder="Global"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.powder_coat_rate ?? ''}
                  onChange={(e) => setConfigVal('powder_coat_rate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Labor/hr</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" step="0.50" placeholder="Global"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.shop_hourly_rate ?? ''}
                  onChange={(e) => setConfigVal('shop_hourly_rate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
          <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
            <RefreshCw size={14} /> Clear Overrides
          </button>
          <button onClick={() => { onApply(); onClose(); }} className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md rounded-lg transition-colors">
            <Save size={14} /> Apply & Recalculate
          </button>
        </div>
      </motion.div>
    </div>
  );
}
