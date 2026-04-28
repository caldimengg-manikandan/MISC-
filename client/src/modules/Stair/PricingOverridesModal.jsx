import React from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Save, RefreshCw } from 'lucide-react';

export default function PricingOverridesModal({ isOpen, onClose, localConfig, setLocalConfig, globalConfig, onApply }) {
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

  const getEffective = (key) => localConfig[key] ?? globalConfig[key];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Local Pricing Overrides</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 text-blue-600">Strictly isolated to this project context</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100 font-medium leading-relaxed">
            Overriding these rates applies ONLY to the present project. 
            <b> Values in brackets ( ) are the active global defaults.</b>
          </p>

          <div className="space-y-6">
            {/* Section: Material Rates */}
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Material Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Steel Price / lb</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.steel_price_per_lb ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.steel_price_per_lb ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="0.01" 
                      placeholder={`${globalConfig.steel_price_per_lb || '0.75'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.steel_price_per_lb ?? ''}
                      onChange={(e) => setConfigVal('steel_price_per_lb', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stair Pan / lb</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.stair_pan_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.stair_pan_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="0.01" 
                      placeholder={`${globalConfig.stair_pan_rate || '1.00'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.stair_pan_rate ?? ''}
                      onChange={(e) => setConfigVal('stair_pan_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Finishing Rates */}
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Finishing Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Galvanize / lb</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.galvanize_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.galvanize_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="0.01" 
                      placeholder={`${globalConfig.galvanize_rate || '0.75'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.galvanize_rate ?? ''}
                      onChange={(e) => setConfigVal('galvanize_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Powder Coat / lb</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.powder_coat_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.powder_coat_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="0.01" 
                      placeholder={`${globalConfig.powder_coat_rate || '1.75'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.powder_coat_rate ?? ''}
                      onChange={(e) => setConfigVal('powder_coat_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Labor Rates */}
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Labor Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shop Labor / hr</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.shop_hourly_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.shop_hourly_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="1.00" 
                      placeholder={`${globalConfig.shop_hourly_rate || '70'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.shop_hourly_rate ?? ''}
                      onChange={(e) => setConfigVal('shop_hourly_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Field Labor / hr</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.field_hourly_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.field_hourly_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="1.00" 
                      placeholder={`${globalConfig.field_hourly_rate || '70'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.field_hourly_rate ?? ''}
                      onChange={(e) => setConfigVal('field_hourly_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Mounting Rates */}
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Mounting Rates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Embedded / ea</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.mounting_embedded_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.mounting_embedded_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="1.00" 
                      placeholder={`${globalConfig.mounting_embedded_rate || '5'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.mounting_embedded_rate ?? ''}
                      onChange={(e) => setConfigVal('mounting_embedded_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anchored / ea</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.mounting_anchored_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.mounting_anchored_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="1.00" 
                      placeholder={`${globalConfig.mounting_anchored_rate || '6'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.mounting_anchored_rate ?? ''}
                      onChange={(e) => setConfigVal('mounting_anchored_rate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anchor Bolt / lb</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.anchor_bolt_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <DollarSign size={14} className={localConfig.anchor_bolt_rate ? 'text-blue-500' : 'text-slate-400'} />
                    </div>
                    <input 
                      type="number" step="0.001" 
                      placeholder={`${globalConfig.anchor_bolt_rate || '0.025'} (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.anchor_bolt_rate ?? ''}
                      onChange={(e) => setConfigVal('anchor_bolt_rate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Calculation Factors */}
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Calculation Factors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scrap Factor (%)</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.scrap_factor_pct ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <span className={`text-xs font-black ${localConfig.scrap_factor_pct ? 'text-blue-500' : 'text-slate-400'}`}>%</span>
                    </div>
                    <input 
                      type="number" step="1" 
                      placeholder={`${globalConfig.scrap_factor_pct || '10'}% (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.scrap_factor_pct ?? ''}
                      onChange={(e) => setConfigVal('scrap_factor_pct', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tax Rate (%)</label>
                  <div className={`flex items-center border-2 rounded-lg overflow-hidden transition-all ${localConfig.tax_rate ? 'bg-blue-50 border-blue-200 shadow-[0_0_12px_rgba(37,99,235,0.08)]' : 'bg-slate-50 border-slate-100 focus-within:border-slate-300 focus-within:shadow-sm'}`}>
                    <div className="w-10 h-10 border-r border-slate-200 bg-white/50 flex items-center justify-center shrink-0">
                      <span className={`text-xs font-black ${localConfig.tax_rate ? 'text-blue-500' : 'text-slate-400'}`}>%</span>
                    </div>
                    <input 
                      type="number" step="0.1" 
                      placeholder={`${(globalConfig.tax_rate * 100 || 6).toFixed(1)}% (Global)`}
                      className="w-full pl-4 pr-3 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0 text-slate-700"
                      value={localConfig.tax_rate ? (localConfig.tax_rate * 100).toFixed(1) : ''}
                      onChange={(e) => setConfigVal('tax_rate', parseFloat(e.target.value) / 100)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
          <button 
            onClick={handleClear} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Reset all fields to global defaults"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => { onApply(); onClose(); }} 
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-black bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] rounded-xl transition-all active:scale-95"
            >
              <Save size={16} /> Save Overrides
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

