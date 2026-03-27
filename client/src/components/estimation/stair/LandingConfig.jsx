import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import API_BASE_URL from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import QuickManageModal from '../../common/QuickManageModal';

const DEFAULT_PLATFORM_TYPES = [
  { value: 'pan-lte8',    label: 'Metal Pan Platform  ≤ 8 ft' },
  { value: 'pan-8-10',    label: 'Metal Pan Platform  8 – 10 ft' },
  { value: 'pan-10-12',   label: 'Metal Pan Platform  10 – 12 ft' },
  { value: 'grating-lte8',label: 'Grating Platform  ≤ 8 ft' },
  { value: 'grating-8-10',label: 'Grating Platform  8 – 10 ft' },
];

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv + Painted', 'Powder Coated'];

// ── Unit Input Helper (Consistent with StairConfig) ─────────
const UnitInput = ({ id, value, label, onChange, placeholder, hint }) => {
  const { value: val, unit } = value || { value: '', unit: 'FT' };
  
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="form-input-with-unit">
        <input
          id={id}
          type="text"
          className="arch-input"
          value={val}
          onChange={e => onChange({ value: e.target.value, unit })}
          placeholder={placeholder || '0'}
        />
        <button 
          type="button"
          className="form-input-unit unit-active"
          style={{ cursor: 'pointer', border: 'none' }}
          onClick={() => onChange({ value: val, unit: unit === 'FT' ? 'IN' : 'FT' })}
        >
          {unit}
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default function LandingConfig({ data, onChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdowns, setDropdowns] = useState({
    platformTypes: DEFAULT_PLATFORM_TYPES,
    finishes: DEFAULT_FINISH_OPTIONS
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  const load = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [pt, fo] = await Promise.all([
      fetchList('platform_type'),
      fetchList('finish_option')
    ]);
    setDropdowns({
      platformTypes: pt,
      finishes: fo.map(i => i.label)
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openManage = (category, label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickModal({ isOpen: true, category, label, rect });
  };

  const [form, setForm] = useState({
    landingNumber: data?.landingNumber || '',
    platformLength: data?.platformLength || { value: '', unit: 'FT' },
    platformWidth: data?.platformWidth || { value: '', unit: 'FT' },
    platformType: data?.platformType || '',
    finish: data?.finish || 'Primer',
    ...data
  });

  // Sync state if data changes from outside (e.g. duplication)
  useEffect(() => {
    if (data) {
      setForm(f => ({ ...f, ...data }));
    }
  }, [data]);

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    if (onChange) onChange(updated);
  };

  // Area and labor MUST come from backend — never computed in frontend.
  // Parent passes backend results via data.calcArea, data.calcSteel, etc.
  const calcArea      = data?.calcArea      ?? null;
  const calcSteel     = data?.calcSteel     ?? null;
  const calcShop      = data?.calcShop      ?? null;
  const calcField     = data?.calcField     ?? null;

  return (
    <div>
      {/* ── Compressed Configuration Header ────────────────────────── */}
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-field">
          <label className="form-label">Landing Number</label>
          <input
            className="form-input data-type-string compact-input"
            value={form.landingNumber}
            onChange={e => set('landingNumber', e.target.value)}
            placeholder="e.g. L-01"
          />
        </div>
        <UnitInput 
          id="landing-length"
          label="Length"
          value={form.platformLength}
          onChange={v => set('platformLength', v)}
        />
        <UnitInput 
          id="landing-width"
          label="Width"
          value={form.platformWidth}
          onChange={v => set('platformWidth', v)}
        />
        <div className="form-field">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒 Area (sq.ft)</span>
            <span className="system-calc-badge">SYSTEM-CALC</span>
          </label>
          <div className="form-input-with-unit">
            <input
              type="number"
              className="auto-calculation field-auto"
              value={data?.systemCalc?.area || ''}
              readOnly
              placeholder="0.0"
            />
            <span className="form-input-unit">FT²</span>
          </div>
        </div>
      </div>


      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-field">
          <label className="form-label">
            Platform Type
            {isAdmin && (
              <button onClick={(e) => openManage('platform_type', 'Platform Types', e)} className="quick-edit-btn" title="Manage Options">
                <Settings size={12} />
              </button>
            )}
          </label>
          <select
            className="form-select data-type-string compact-select"
            value={form.platformType}
            onChange={e => set('platformType', e.target.value)}
          >
            <option value="">— Select Type —</option>
            {dropdowns.platformTypes.map(pt => (
              <option key={pt.value || pt._id} value={pt.value || pt.label}>{pt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">
            Finish Specification
            {isAdmin && (
              <button onClick={(e) => openManage('finish_option', 'Finish Options', e)} className="quick-edit-btn" title="Manage Options">
                <Settings size={12} />
              </button>
            )}
          </label>
          <select
            className="form-select data-type-string compact-select"
            value={form.finish}
            onChange={e => set('finish', e.target.value)}
          >
            {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* ── Real-time Preview Engine Results (EXCEL SFE ALIGNED) ─────────────────────── */}
      {data?.systemCalc && (
        <div style={{ marginTop: 24, display: 'grid', gap: '16px' }}>
          <div className="summary-card card-glow-purple" style={{ 
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            borderTop: '4px solid #8B5CF6'
          }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* 🛡️ SFE PER UNIT SECTION (EXCEL ALIGNED) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingBottom: 16, borderBottom: '1px dashed #CBD5E1' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>STEEL LBS/LF/<br/>SF/RISER</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.steelPerLF || 12.000).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>SHOP<br/>MH/LF/ SF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.shopMHPF || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>FIELD<br/>MH/LF/ SF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.fieldMHPF || 0).toFixed(3)}</div>
                </div>
              </div>

              {/* 🛡️ SFE TOTALS SECTION (EXCEL ALIGNED) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Total Steel lbs.</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F97316' }}>{Number(data.systemCalc.baseSteelLbs || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>STEEL (+10% SCRAP) LBS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#7C3AED' }}>{Number(data.systemCalc.finalScrapWeight || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>SHOP HOURS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.shopTotalHrs || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>FIELD HOURS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.fieldTotalHrs || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Galvanize Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C' }}>${Number(data.systemCalc.galvanizeTotalCost || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
             <span className="system-calc-badge" style={{ opacity: 0.6, background: '#A78BFA', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', color: '#0F172A', fontWeight: 900 }}>ENGINE v1.02 • INDUSTRY STANDARD FLOW</span>
          </div>
        </div>
      )}

      <QuickManageModal 
        isOpen={quickModal.isOpen}
        onClose={() => setQuickModal({ ...quickModal, isOpen: false })}
        category={quickModal.category}
        categoryLabel={quickModal.label}
        onUpdate={load}
        triggerRect={quickModal.rect}
      />


      <style jsx>{`
        .quick-edit-btn {
          margin-left: 8px; background: hsla(var(--brand-h), var(--brand-s), 50%, 0.1); 
          border: 1px solid hsla(var(--brand-h), var(--brand-s), 50%, 0.2); 
          cursor: pointer; color: var(--color-primary-600); 
          padding: 4px; border-radius: 6px;
          display: inline-flex; align-items: center; vertical-align: middle;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-edit-btn:hover { 
          background: var(--color-primary-500); 
          color: white;
          transform: translateY(-1px) rotate(30deg);
          box-shadow: 0 4px 12px hsla(var(--brand-h), var(--brand-s), 50%, 0.3);
        }
      `}</style>
    </div>
  );
}
