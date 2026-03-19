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
    platformLength: data?.platformLength || '',
    platformWidth: data?.platformWidth || '',
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
        <div className="form-field">
          <label className="form-label">Length (ft)</label>
          <div className="form-input-with-unit data-type-ft-in">
            <input
              type="number"
              step="0.1"
              value={form.platformLength}
              onChange={e => set('platformLength', e.target.value)}
              placeholder="0.0"
            />
            <span className="form-input-unit">ft</span>
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Width (ft)</label>
          <div className="form-input-with-unit data-type-ft-in">
            <input
              type="number"
              step="0.1"
              value={form.platformWidth}
              onChange={e => set('platformWidth', e.target.value)}
              placeholder="0.0"
            />
            <span className="form-input-unit">ft</span>
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Area (sq.ft) <span style={{ fontSize: '10px', color: 'var(--color-primary-500)', fontWeight: 600 }}>← Backend</span></label>
          <div className="computed-field data-type-float" style={{ borderLeftWidth: '4px', height: '36px', opacity: calcArea !== null ? 1 : 0.45 }}>
            <div className="computed-value" style={{ fontSize: '14px', fontWeight: '700' }}>
              {calcArea !== null ? calcArea : '—'}
            </div>
            <span className="computed-unit">ft²</span>
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

      {/* ── Backend Computed Results (Read-Only) ────────────────────── */}
      {(calcSteel !== null || calcShop !== null || calcField !== null) && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '8px',
          border: '1px solid #bae6fd',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Steel Weight</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0c4a6e', fontVariantNumeric: 'tabular-nums' }}>{calcSteel ?? '—'} <span style={{ fontSize: '11px', fontWeight: 400 }}>lb</span></div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shop Labor</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0c4a6e', fontVariantNumeric: 'tabular-nums' }}>{calcShop ?? '—'} <span style={{ fontSize: '11px', fontWeight: 400 }}>hrs</span></div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Field Labor</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0c4a6e', fontVariantNumeric: 'tabular-nums' }}>{calcField ?? '—'} <span style={{ fontSize: '11px', fontWeight: 400 }}>hrs</span></div>
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
