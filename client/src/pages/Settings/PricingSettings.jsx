import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, DollarSign, Percent, Zap, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SettingInput = ({ label, icon, value, onChange, type = "number", step = "0.01", suffix = "" }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

export default function PricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    company_logo: '',
    scrap_factor_pct: 10,
    galvanize_markup_pct: 10,
    stair_pan_rate: 1.00,
    welded_shop_mh: 0.5,
    welded_field_mh: 0.25,
    bolted_shop_mh: 1.0,
    bolted_field_mh: 0.5
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, company_logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
        setConfig(data.data);
      }
    } catch (error) {
      toast.error("Failed to load pricing configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const saveToast = toast.loading("Updating global pricing...");
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
        toast.success("Pricing configurations updated successfully!", { id: saveToast });
      } else {
        toast.error(data.error || "Failed to update", { id: saveToast });
      }
    } catch (error) {
      toast.error("Error connecting to server", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pricing Settings</h1>
          <p className="text-slate-500 mt-1">Configure global rates and factors for all estimations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchConfig}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold transition-all"
          >
            <RotateCcw size={18} /> Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg transition-all disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Material & Labor Rates */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Primary Rates</h2>
          </div>

          <SettingInput 
            label="Price Per LB (Steel)" 
            icon={<DollarSign size={18} />} 
            value={config.steel_price_per_lb}
            onChange={(val) => setConfig(prev => ({ ...prev, steel_price_per_lb: parseFloat(val) }))}
            suffix="/ lb"
          />

          <SettingInput 
            label="Shop Hourly Rate" 
            icon={<DollarSign size={18} />} 
            value={config.shop_hourly_rate}
            onChange={(val) => setConfig(prev => ({ ...prev, shop_hourly_rate: parseFloat(val) }))}
            suffix="/ hr"
          />

          <SettingInput 
            label="Field Hourly Rate" 
            icon={<DollarSign size={18} />} 
            value={config.field_hourly_rate}
            onChange={(val) => setConfig(prev => ({ ...prev, field_hourly_rate: parseFloat(val) }))}
            suffix="/ hr"
          />

          <div className="h-px bg-slate-100 my-2"></div>

          <SettingInput 
            label="Scrap Factor" 
            icon={<Percent size={18} />} 
            value={config.scrap_factor_pct}
            onChange={(val) => setConfig(prev => ({ ...prev, scrap_factor_pct: parseFloat(val) || 0 }))}
            suffix="%"
          />

          <SettingInput 
            label="Galvanize Markup" 
            icon={<Percent size={18} />} 
            value={config.galvanize_markup_pct}
            onChange={(val) => setConfig(prev => ({ ...prev, galvanize_markup_pct: parseFloat(val) || 0 }))}
            suffix="%"
          />

          <SettingInput 
            label="Stair Pan Rate" 
            icon={<DollarSign size={18} />} 
            value={config.stair_pan_rate}
            onChange={(val) => setConfig(prev => ({ ...prev, stair_pan_rate: parseFloat(val) || 0 }))}
            suffix="/ lb"
          />
        </div>

        {/* Factors & Surcharges */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Tax & Surcharges</h2>
          </div>

          <SettingInput 
            label="Sales Tax" 
            icon={<Percent size={18} />} 
            value={config.tax_rate * 100}
            onChange={(val) => setConfig(prev => ({ ...prev, tax_rate: parseFloat(val) / 100 }))}
            suffix="%"
          />

          <div className="grid grid-cols-2 gap-4">
            <SettingInput 
              label="Galvanize Charge" 
              icon={<DollarSign size={18} />} 
              value={config.galvanize_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, galvanize_rate: parseFloat(val) || 0 }))}
              suffix="/ lb"
            />

            <SettingInput 
              label="Powder Coat Charge" 
              icon={<DollarSign size={18} />} 
              value={config.powder_coat_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, powder_coat_rate: parseFloat(val) || 0 }))}
              suffix="/ lb"
            />
          </div>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Mounting Rates</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SettingInput 
              label="Embedded Rate" 
              icon={<DollarSign size={18} />} 
              value={config.mounting_embedded_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, mounting_embedded_rate: parseFloat(val) || 0 }))}
              suffix="/ ea"
            />
            <SettingInput 
              label="Anchored Rate" 
              icon={<DollarSign size={18} />} 
              value={config.mounting_anchored_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, mounting_anchored_rate: parseFloat(val) || 0 }))}
              suffix="/ ea"
            />
          </div>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Anchor Bolt Rates</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SettingInput 
              label="Bolt Rate (per lb)" 
              icon={<DollarSign size={18} />} 
              value={config.anchor_bolt_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, anchor_bolt_rate: parseFloat(val) || 0 }))}
              suffix="/ lb"
            />
            <SettingInput 
              label="POR ROK Anchors" 
              icon={<DollarSign size={18} />} 
              value={config.por_rok_anchor_rate}
              onChange={(val) => setConfig(prev => ({ ...prev, por_rok_anchor_rate: parseFloat(val) || 0 }))}
              suffix="Fixed"
            />
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-800 font-medium leading-relaxed">
              <strong>Notice:</strong> These values are applied company-wide. Changing them will affect the real-time previews of all active projects immediately.
            </p>
          </div>
        </div>

        {/* Connection Labor Rates */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Connection Labor Rates</h2>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-2">
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              These rates apply to N/S and F/S stringer connection points. Set by your shop standards.<br/>
              Rates per active connection point (extent &gt; 0).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <SettingInput 
                label="Welded — Shop MH" 
                icon={<DollarSign size={18} />} 
                value={config.welded_shop_mh}
                onChange={(val) => setConfig(prev => ({ ...prev, welded_shop_mh: parseFloat(val) || 0 }))}
                suffix="MH / pt"
              />
              <SettingInput 
                label="Welded — Field MH" 
                icon={<DollarSign size={18} />} 
                value={config.welded_field_mh}
                onChange={(val) => setConfig(prev => ({ ...prev, welded_field_mh: parseFloat(val) || 0 }))}
                suffix="MH / pt"
              />
            </div>
            <div className="flex flex-col gap-4">
              <SettingInput 
                label="Bolted — Shop MH" 
                icon={<DollarSign size={18} />} 
                value={config.bolted_shop_mh}
                onChange={(val) => setConfig(prev => ({ ...prev, bolted_shop_mh: parseFloat(val) || 0 }))}
                suffix="MH / pt"
              />
              <SettingInput 
                label="Bolted — Field MH" 
                icon={<DollarSign size={18} />} 
                value={config.bolted_field_mh}
                onChange={(val) => setConfig(prev => ({ ...prev, bolted_field_mh: parseFloat(val) || 0 }))}
                suffix="MH / pt"
              />
            </div>
          </div>
        </div>

        {/* Grating Tread Type Factors */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Grating Tread Type Factors</h2>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-2">
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Multiplier applied to the base grating tread price (set by stair width). Default 1.00 matches Excel standard pricing. Modify to apply type-specific cost differences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <SettingInput 
                label="1 1/4&quot; Bar grating/Welded" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_bar_125_welded}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_bar_125_welded: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
              <SettingInput 
                label="1&quot; Bar grating/Welded" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_bar_100_welded}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_bar_100_welded: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
              <SettingInput 
                label="McNichols treads" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_mcnichols}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_mcnichols: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
            </div>
            <div className="flex flex-col gap-4">
              <SettingInput 
                label="1 1/4&quot; Bar grating/Bolted" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_bar_125_bolted}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_bar_125_bolted: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
              <SettingInput 
                label="1&quot; Bar grating/Bolted" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_bar_100_bolted}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_bar_100_bolted: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
              <SettingInput 
                label="Other Pre-fabricated Treads" 
                icon={<DollarSign size={18} />} 
                value={config.grating_factor_prefab}
                onChange={(val) => setConfig(prev => ({ ...prev, grating_factor_prefab: Math.max(0.01, parseFloat(val) || 1.00) }))}
                suffix="&times;"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

