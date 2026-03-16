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

  const area = (form.platformLength && form.platformWidth)
    ? (parseFloat(form.platformLength) * parseFloat(form.platformWidth)).toFixed(2)
    : null;

  return (
    <div>
      {/* ── Identification ─────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Identification</div>
        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label className="form-label">Landing Number <span className="data-badge dt-string"></span></label>
            <input
              className="form-input data-type-string"
              id="landing-number"
              value={form.landingNumber}
              onChange={e => set('landingNumber', e.target.value)}
              placeholder="e.g. L-01"
            />
          </div>
        </div>
      </div>

      {/* ── Dimensions ─────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Platform Dimensions</div>
        <div className="form-grid form-grid-3">
          <div className="form-field">
            <label className="form-label">Platform Length <span className="data-badge dt-ft-in"></span></label>
            <div className="form-input-with-unit data-type-ft-in">
              <input
                id="platform-length"
                type="number"
                step="0.01"
                value={form.platformLength}
                onChange={e => set('platformLength', e.target.value)}
                placeholder="0.00"
              />
              <span className="form-input-unit">ft</span>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Platform Width <span className="data-badge dt-ft-in"></span></label>
            <div className="form-input-with-unit data-type-ft-in">
              <input
                id="platform-width"
                type="number"
                step="0.01"
                value={form.platformWidth}
                onChange={e => set('platformWidth', e.target.value)}
                placeholder="0.00"
              />
              <span className="form-input-unit">ft</span>
            </div>
          </div>

          {area && (
            <div className="form-field" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label">Area (Auto-Calculated) <span className="data-badge dt-float"></span></label>
              <div className="computed-field data-type-float" style={{ borderLeftWidth: '4px', height: '36px' }}>
                <div>
                  <div className="computed-label">⚙ Area</div>
                  <div className="computed-value" style={{ fontSize: '14px' }}>{area}</div>
                </div>
                <span className="computed-unit">ft²</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Platform Type ───────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">
          Platform Type
          {isAdmin && <button onClick={(e) => openManage('platform_type', 'Platform Types', e)} className="quick-edit-btn" title="Manage Options"><Settings size={12} /></button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {dropdowns.platformTypes.map(pt => (
            <div
              key={pt.value}
              onClick={() => set('platformType', pt.value)}
              className={`radio-option ${form.platformType === pt.value ? 'selected' : ''}`}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${form.platformType === pt.value ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                background: form.platformType === pt.value ? 'var(--color-primary-50)' : 'white',
                cursor: 'pointer',
                fontSize: '12.5px',
                transition: 'all var(--transition)',
              }}
              id={`platform-type-${pt.value}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>{pt.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Finish ─────────────────────────────────────────────────── */}
      <div className="form-section" style={{ marginBottom: 0 }}>
        <div className="form-section-title">
          Finish Specification <span className="data-badge dt-string"></span>
          {isAdmin && <button onClick={(e) => openManage('finish_option', 'Finish Options', e)} className="quick-edit-btn" title="Manage Options"><Settings size={12} /></button>}
        </div>
        <select
          className="form-select data-type-string"
          id="landing-finish"
          value={form.finish}
          onChange={e => set('finish', e.target.value)}
          style={{ maxWidth: '260px' }}
        >
          {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
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
          margin-left: 8px; background: none; border: none; cursor: pointer;
          color: var(--color-primary-500); padding: 2px; border-radius: 4px;
          display: inline-flex; align-items: center; vertical-align: middle;
          transition: all 0.2s; border: 1px solid transparent;
        }
        .quick-edit-btn:hover { background: var(--color-primary-50); border-color: var(--color-primary-200); }
      `}</style>
    </div>
  );
}
