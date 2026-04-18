import React, { useState, useEffect } from 'react';
import { 
  Save, RotateCcw, DollarSign, Percent, Zap, 
  ShieldCheck, ArrowRight, Gauge, Layers, 
  Wrench, Hammer, RefreshCw, ChevronRight,
  Info
} from 'lucide-react';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── COMPONENTS ───────────────────────────────────────────────────────────────

/**
 * Premium numeric input for pricing variables
 * Uses Geist Mono for technical clarity
 */
const PremiumSettingInput = ({ label, icon: Icon, value, onChange, suffix, type = "number", step = "0.01" }) => (
  <div className="flex flex-col gap-1.5 group">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pl-1 group-focus-within:text-[--gpt-accent] transition-colors">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[--gpt-accent] transition-colors">
        {Icon && <Icon size={15} strokeWidth={2.5} />}
      </div>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)] outline-none transition-all font-mono text-[13px] font-medium text-slate-800 shadow-sm"
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-bold text-slate-500 uppercase">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

/**
 * Categorized container for settings
 */
const SettingSection = ({ title, subtitle, icon: Icon, children, accentColor = "var(--gpt-accent)" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden"
  >
    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
      <div className="flex items-center gap-3">
        <div 
          className="p-2.5 rounded-xl text-white shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          {Icon && <Icon size={18} />}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  
  const [config, setConfig] = useState({
    steel_price_per_lb: 0.75,
    shop_hourly_rate: 70.00,
    field_hourly_rate: 70.00,
    tax_rate: 0.06,
    galvanize_rate: 0.75,
    powder_coat_rate: 1.7587,
    mounting_embedded_rate: 5.00,
    mounting_anchored_rate: 6.00,
    anchor_bolt_rate: 0.025,
    por_rok_anchor_rate: 0.00,
    scrap_factor_pct: 10,
    galvanize_markup_pct: 10,
    stair_pan_rate: 1.00,
    welded_shop_mh: 0.5,
    welded_field_mh: 0.25,
    bolted_shop_mh: 1.0,
    bolted_field_mh: 0.5,
    grating_factor_bar_125_welded: 1.0,
    grating_factor_bar_100_welded: 1.0,
    grating_factor_mcnichols: 1.0,
    grating_factor_bar_125_bolted: 1.0,
    grating_factor_bar_100_bolted: 1.0,
    grating_factor_prefab: 1.0
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  // Global Save Implementation
  useEffect(() => {
    const onGlobalSave = () => handleSave();
    window.addEventListener('app:save', onGlobalSave);
    return () => window.removeEventListener('app:save', onGlobalSave);
  }, [config]);

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
      toast.error("Cloud parameters unreachable");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const t = toast.loading("Propagating global pricing...");
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pricing engine updated", { id: t });
      } else {
        toast.error(data.error || "Update failed", { id: t });
      }
    } catch (error) {
      toast.error("Network error", { id: t });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="text-[--gpt-accent] animate-spin" size={32} />
        <p className="text-slate-400 font-medium animate-pulse">Syncing Pricing Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 mb-6">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[--gpt-accent] animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Engine v2.4</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Rates Configuration</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchConfig}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              title="Reload from server"
            >
              <RotateCcw size={16} /> <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Core Material & Labor */}
            <SettingSection 
              title="Primary Material & Base Rates"
              subtitle="The fundamental costs driving the core estimation engine."
              icon={Gauge}
              accentColor="#10a37f"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <PremiumSettingInput 
                  label="Steel Price (Base)" icon={DollarSign} value={config.steel_price_per_lb}
                  onChange={(v) => setConfig(p => ({...p, steel_price_per_lb: parseFloat(v)}))} 
                  suffix="/ lb"
                />
                <div className="space-y-6">
                  <PremiumSettingInput 
                    label="Shop Hourly Rate" icon={DollarSign} value={config.shop_hourly_rate}
                    onChange={(v) => setConfig(p => ({...p, shop_hourly_rate: parseFloat(v)}))} 
                    suffix="/ hr"
                  />
                  <PremiumSettingInput 
                    label="Field Hourly Rate" icon={DollarSign} value={config.field_hourly_rate}
                    onChange={(v) => setConfig(p => ({...p, field_hourly_rate: parseFloat(v)}))} 
                    suffix="/ hr"
                  />
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumSettingInput 
                  label="Scrap Factor" icon={Percent} value={config.scrap_factor_pct}
                  onChange={(v) => setConfig(p => ({...p, scrap_factor_pct: parseFloat(v)}))} 
                  suffix="%"
                />
                <PremiumSettingInput 
                  label="Galv Markup" icon={Percent} value={config.galvanize_markup_pct}
                  onChange={(v) => setConfig(p => ({...p, galvanize_markup_pct: parseFloat(v)}))} 
                  suffix="%"
                />
                <PremiumSettingInput 
                  label="Stair Pan Rate" icon={DollarSign} value={config.stair_pan_rate}
                  onChange={(v) => setConfig(p => ({...p, stair_pan_rate: parseFloat(v)}))} 
                  suffix="/ lb"
                />
              </div>
            </SettingSection>

            {/* 2. Connection Labor */}
            <SettingSection 
              title="Connection Engineering"
              subtitle="Mandatory labor hours per active connection point."
              icon={Hammer}
              accentColor="#f59e0b"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Welded Construction</div>
                  <PremiumSettingInput 
                    label="Shop MH / Point" icon={Wrench} value={config.welded_shop_mh}
                    onChange={(v) => setConfig(p => ({...p, welded_shop_mh: parseFloat(v)}))} 
                    suffix="MH"
                  />
                  <PremiumSettingInput 
                    label="Field MH / Point" icon={Wrench} value={config.welded_field_mh}
                    onChange={(v) => setConfig(p => ({...p, welded_field_mh: parseFloat(v)}))} 
                    suffix="MH"
                  />
                </div>
                <div className="space-y-6">
                  <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">Bolted Construction</div>
                  <PremiumSettingInput 
                    label="Shop MH / Point" icon={Wrench} value={config.bolted_shop_mh}
                    onChange={(v) => setConfig(p => ({...p, bolted_shop_mh: parseFloat(v)}))} 
                    suffix="MH"
                  />
                  <PremiumSettingInput 
                    label="Field MH / Point" icon={Wrench} value={config.bolted_field_mh}
                    onChange={(v) => setConfig(p => ({...p, bolted_field_mh: parseFloat(v)}))} 
                    suffix="MH"
                  />
                </div>
              </div>
            </SettingSection>

            {/* 3. Grating */}
            <SettingSection 
              title="Grating & Tread Factors"
              subtitle="Multipliers applied to baseline tread material costs."
              icon={Layers}
              accentColor="#6366f1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <PremiumSettingInput 
                  label='1-1/4" Bar / Welded' value={config.grating_factor_bar_125_welded}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_bar_125_welded: parseFloat(v)}))} 
                  suffix="x Mult"
                />
                <PremiumSettingInput 
                  label='1-1/4" Bar / Bolted' value={config.grating_factor_bar_125_bolted}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_bar_125_bolted: parseFloat(v)}))} 
                  suffix="x Mult"
                />
                <PremiumSettingInput 
                  label='1" Bar / Welded' value={config.grating_factor_bar_100_welded}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_bar_100_welded: parseFloat(v)}))} 
                  suffix="x Mult"
                />
                <PremiumSettingInput 
                  label='1" Bar / Bolted' value={config.grating_factor_bar_100_bolted}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_bar_100_bolted: parseFloat(v)}))} 
                  suffix="x Mult"
                />
                <PremiumSettingInput 
                  label="McNichols Treads" value={config.grating_factor_mcnichols}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_mcnichols: parseFloat(v)}))} 
                  suffix="x Mult"
                />
                <PremiumSettingInput 
                  label="Other Prefab Treads" value={config.grating_factor_prefab}
                  onChange={(v) => setConfig(p => ({...p, grating_factor_prefab: parseFloat(v)}))} 
                  suffix="x Mult"
                />
              </div>
            </SettingSection>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Tax & Surcharges */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShieldCheck size={20} className="text-[--gpt-accent]" />
                </div>
                <h2 className="text-lg font-bold">Tax & Surcharges</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <PremiumSettingInput 
                    label="Sales Tax" icon={Percent} value={config.tax_rate * 100}
                    onChange={(v) => setConfig(p => ({...p, tax_rate: parseFloat(v) / 100}))} 
                    suffix="%"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <PremiumSettingInput 
                      label="Galv Charge" icon={DollarSign} value={config.galvanize_rate}
                      onChange={(v) => setConfig(p => ({...p, galvanize_rate: parseFloat(v)}))} 
                      suffix="/ lb"
                    />
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <PremiumSettingInput 
                      label="Powder Coat" icon={DollarSign} value={config.powder_coat_rate}
                      onChange={(v) => setConfig(p => ({...p, powder_coat_rate: parseFloat(v)}))} 
                      suffix="/ lb"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mounting & Anchors */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 font-bold text-slate-800">
                <Zap size={18} className="text-blue-500" />
                <span>Mounting & Hardware</span>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <PremiumSettingInput 
                    label="Embedded" icon={DollarSign} value={config.mounting_embedded_rate}
                    onChange={(v) => setConfig(p => ({...p, mounting_embedded_rate: parseFloat(v)}))} 
                    suffix="/ ea"
                  />
                  <PremiumSettingInput 
                    label="Anchored" icon={DollarSign} value={config.mounting_anchored_rate}
                    onChange={(v) => setConfig(p => ({...p, mounting_anchored_rate: parseFloat(v)}))} 
                    suffix="/ ea"
                  />
                </div>
                <div className="h-px bg-slate-50" />
                <PremiumSettingInput 
                  label="Bolt Rate" icon={DollarSign} value={config.anchor_bolt_rate}
                  onChange={(v) => setConfig(p => ({...p, anchor_bolt_rate: parseFloat(v)}))} 
                  suffix="/ lb"
                />
                <PremiumSettingInput 
                  label="POR ROK Anchors" icon={DollarSign} value={config.por_rok_anchor_rate}
                  onChange={(v) => setConfig(p => ({...p, por_rok_anchor_rate: parseFloat(v)}))} 
                  suffix="Fixed"
                />
              </div>
            </div>

            {/* System Info */}
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <div className="flex gap-3">
                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-bold text-blue-900 mb-1">Global Propagation</h4>
                  <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
                    Changes made here propagate to the estimation engine immediately. Active projects will reflect new pricing upon next recalculation or save.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

