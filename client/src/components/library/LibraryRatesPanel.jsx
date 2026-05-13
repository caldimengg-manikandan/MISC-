// client/src/components/library/LibraryRatesPanel.jsx
// Embedded Pricing Engine inside the Library Hub.
// Reads/writes to /api/v1/admin/config — no new backend routes needed.

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Percent, Wrench, Zap, Shield,
  ChevronDown, ChevronRight, RefreshCw, Save,
  Info, AlertTriangle, CheckCircle, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

// ── Helper: API call ───────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('steel_token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ── Sub-component: Collapsible Section ────────────────────────────────────────
function RatesSection({ title, subtitle, icon: Icon, accentColor = '#10a37f', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="lib-rates-section">
      <button
        className="lib-rates-section-header"
        onClick={() => setOpen(o => !o)}
        style={{ '--section-accent': accentColor }}
      >
        <span className="lib-rates-section-icon" style={{ background: accentColor }}>
          <Icon size={14} />
        </span>
        <span className="lib-rates-section-title">{title}</span>
        {subtitle && <span className="lib-rates-section-sub">{subtitle}</span>}
        <span className="lib-rates-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && <div className="lib-rates-section-body">{children}</div>}
    </div>
  );
}

// ── Sub-component: Rate Input ─────────────────────────────────────────────────
function RateInput({ label, value, onChange, suffix, step = '0.01', min = '0', readOnly = false, highlight = false }) {
  return (
    <div className={`lib-rates-field ${highlight ? 'highlight' : ''}`}>
      <label className="lib-rates-label">{label}</label>
      <div className="lib-rates-input-wrap">
        <input
          type="number"
          className="lib-rates-input"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          step={step}
          min={min}
          readOnly={readOnly}
        />
        {suffix && <span className="lib-rates-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Sub-component: Section Divider ────────────────────────────────────────────
function RateDivider({ label }) {
  return (
    <div className="lib-rates-divider">
      <span>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LibraryRatesPanel({ readOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [gratingTypes, setGratingTypes] = useState([]);

  const [config, setConfig] = useState({
    steel_price_per_lb:            0.75,
    shop_hourly_rate:              70.00,
    field_hourly_rate:             70.00,
    scrap_factor_pct:              10,
    galvanize_markup_pct:          10,
    stair_pan_rate:                1.00,
    tax_rate:                      0.06,
    galvanize_rate:                0.75,
    primer_rate:                   0.00,
    powder_coat_rate:              1.7587,
    mounting_embedded_rate:        5.00,
    mounting_anchored_rate:        6.00,
    anchor_bolt_rate:              0.025,
    por_rok_anchor_rate:           0.00,
    welded_shop_mh:                0.5,
    welded_field_mh:               0.25,
    bolted_shop_mh:                1.0,
    bolted_field_mh:               0.5,
    grating_factor_bar_125_welded: 1.0,
    grating_factor_bar_125_bolted: 1.0,
    grating_factor_bar_100_welded: 1.0,
    grating_factor_bar_100_bolted: 1.0,
    grating_factor_mcnichols:      1.0,
    grating_factor_prefab:         1.0,
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, dictRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/admin/config`, {
          headers: authHeaders(),
        }),
        fetch(`${API_BASE_URL}/api/v1/dictionary/grating_type`, {
          headers: authHeaders(),
        }),
      ]);

      const configData = await configRes.json();
      if (configData.success) {
        setConfig(prev => ({ ...prev, ...configData.data }));
      }

      const dictData = await dictRes.json();
      if (dictData.success) setGratingTypes(dictData.data || []);
    } catch {
      toast.error('Could not load pricing configuration');
    } finally {
      setLoading(false);
      setDirty(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // ── Field setter (marks dirty) ────────────────────────────────────────────
  const set = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    setDirty(true);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (readOnly) return;
    setSaving(true);
    const t = toast.loading('Saving pricing configuration…');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/config`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pricing engine updated — changes propagate to all future calculations.', { id: t, duration: 4000 });
        setDirty(false);
      } else {
        toast.error(data.error || 'Save failed', { id: t });
      }
    } catch {
      toast.error('Network error', { id: t });
    } finally {
      setSaving(false);
    }
  }, [config, readOnly]);

  // ── Grating factor helpers ────────────────────────────────────────────────
  const getGratingGroups = () => {
    const getBaseSpec = (label) => label.replace(/\s+x?\s*\d+'-\d+"?.*$/, '').trim();
    const groups = {};
    gratingTypes.forEach(gt => {
      const base = getBaseSpec(gt.label);
      if (!groups[base]) groups[base] = [];
      groups[base].push(gt);
    });
    return groups;
  };

  const getLegacyKey = (label) => {
    const legacyMapping = {
      '1-1/4" Bar / Welded': 'grating_factor_bar_125_welded',
      '1-1/4" Bar / Bolted': 'grating_factor_bar_125_bolted',
      '1" Bar / Welded':     'grating_factor_bar_100_welded',
      '1" Bar / Bolted':     'grating_factor_bar_100_bolted',
      'McNichols':           'grating_factor_mcnichols',
      'Prefab':              'grating_factor_prefab',
    };
    for (const [legacyLabel, key] of Object.entries(legacyMapping)) {
      if (label.toLowerCase().includes(legacyLabel.toLowerCase())) return key;
    }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `grating_factor_${slug}`;
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="lib-rates-loading">
        <RefreshCw size={20} className="lib-rates-spin" />
        <span>Loading pricing configuration…</span>
      </div>
    );
  }

  return (
    <div className="lib-rates-root">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="lib-rates-toolbar">
        <div className="lib-rates-toolbar-left">
          <span className="lib-rates-engine-badge">
            <span className="lib-rates-engine-dot" />
            SYSTEM CONFIG
          </span>
          <span className="lib-rates-toolbar-title">Global Estimation Constants</span>
        </div>
        <div className="lib-rates-toolbar-right">
          {dirty && !readOnly && (
            <span className="lib-rates-dirty-hint">
              <AlertTriangle size={12} />
              Unsaved changes
            </span>
          )}
          <button
            className="lib-btn lib-btn-ghost lib-btn-icon"
            onClick={fetchConfig}
            title="Reload from server"
          >
            <RefreshCw size={13} />
          </button>
          {!readOnly && (
            <button
              className="lib-btn lib-btn-primary"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? <RefreshCw size={12} className="lib-rates-spin" /> : <Save size={12} />}
              Save Configuration
            </button>
          )}
        </div>
      </div>

      {/* ── Info Banner ──────────────────────────────────────────────────── */}
      <div className="lib-rates-info-banner">
        <Info size={13} />
        <span>These values are <strong>global constants</strong>. For item-specific pricing (Finishes, Mounting, Rail Types), edit the <strong>Price</strong> and <strong>Labor</strong> columns in the corresponding Library categories.</span>
      </div>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <div className="lib-rates-sections">

        {/* 1. Material & Labor */}
        <RatesSection title="Base Material & Labor" subtitle="Core system-wide rates" icon={DollarSign} accentColor="#10a37f">
          <div className="lib-rates-grid lib-rates-grid-3">
            <RateInput label="Steel Price" value={config.steel_price_per_lb} onChange={v => set('steel_price_per_lb', v)} suffix="$/lb" step="0.001" readOnly={readOnly} highlight />
            <RateInput label="Shop Hourly Rate" value={config.shop_hourly_rate} onChange={v => set('shop_hourly_rate', v)} suffix="$/hr" readOnly={readOnly} highlight />
            <RateInput label="Field Hourly Rate" value={config.field_hourly_rate} onChange={v => set('field_hourly_rate', v)} suffix="$/hr" readOnly={readOnly} highlight />
          </div>
          <div className="lib-rates-grid lib-rates-grid-3" style={{ marginTop: 16 }}>
            <RateInput label="Scrap Factor" value={config.scrap_factor_pct} onChange={v => set('scrap_factor_pct', v)} suffix="%" step="0.5" readOnly={readOnly} />
            <RateInput label="Galv Markup" value={config.galvanize_markup_pct} onChange={v => set('galvanize_markup_pct', v)} suffix="%" step="0.5" readOnly={readOnly} />
            <RateInput label="Stair Pan Rate" value={config.stair_pan_rate} onChange={v => set('stair_pan_rate', v)} suffix="$/lb" step="0.01" readOnly={readOnly} />
          </div>
        </RatesSection>

        {/* 2. Global Surcharges */}
        <RatesSection title="Global Surcharges" subtitle="Tax and small hardware rates" icon={Shield} accentColor="#6366f1" defaultOpen>
          <div className="lib-rates-grid lib-rates-grid-3">
            <RateInput label="Sales Tax" value={(config.tax_rate * 100).toFixed(2)} onChange={v => set('tax_rate', parseFloat(v) / 100)} suffix="%" step="0.1" readOnly={readOnly} highlight />
            <RateInput label="Anchor Bolt Rate" value={config.anchor_bolt_rate} onChange={v => set('anchor_bolt_rate', v)} suffix="$/lb" step="0.005" readOnly={readOnly} />
            <RateInput label="POR ROK Anchors" value={config.por_rok_anchor_rate} onChange={v => set('por_rok_anchor_rate', v)} suffix="fixed" step="0.01" readOnly={readOnly} />
          </div>
        </RatesSection>

        {/* 3. Connection Overrides (Fallback) */}
        <RatesSection title="Connection Logic (Fallback)" subtitle="Used only if connection dictionary is empty" icon={Wrench} accentColor="#f59e0b" defaultOpen={false}>
          <div className="lib-rates-grid lib-rates-grid-2">
            <div>
              <RateDivider label="Welded" />
              <div className="lib-rates-grid lib-rates-grid-2">
                <RateInput label="Shop MH" value={config.welded_shop_mh} onChange={v => set('welded_shop_mh', v)} suffix="MH" step="0.05" readOnly={readOnly} />
                <RateInput label="Field MH" value={config.welded_field_mh} onChange={v => set('welded_field_mh', v)} suffix="MH" step="0.05" readOnly={readOnly} />
              </div>
            </div>
            <div>
              <RateDivider label="Bolted" />
              <div className="lib-rates-grid lib-rates-grid-2">
                <RateInput label="Shop MH" value={config.bolted_shop_mh} onChange={v => set('bolted_shop_mh', v)} suffix="MH" step="0.05" readOnly={readOnly} />
                <RateInput label="Field MH" value={config.bolted_field_mh} onChange={v => set('bolted_field_mh', v)} suffix="MH" step="0.05" readOnly={readOnly} />
              </div>
            </div>
          </div>
        </RatesSection>

      </div>

      {/* ── Read-only notice ──────────────────────────────────────────────── */}
      {readOnly && (
        <div className="lib-rates-readonly-notice">
          <CheckCircle size={13} />
          <span>You are viewing configuration in read-only mode. Contact an administrator to make changes.</span>
        </div>
      )}
    </div>
  );
}
