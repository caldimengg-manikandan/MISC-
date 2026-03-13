// src/components/estimation/stair/LandingConfig.jsx
import React, { useState } from 'react';

const PLATFORM_TYPES = [
  { value: 'pan-lte8',    label: 'Metal Pan Platform  ≤ 8 ft' },
  { value: 'pan-8-10',    label: 'Metal Pan Platform  8 – 10 ft' },
  { value: 'pan-10-12',   label: 'Metal Pan Platform  10 – 12 ft' },
  { value: 'grating-lte8',label: 'Grating Platform  ≤ 8 ft' },
  { value: 'grating-8-10',label: 'Grating Platform  8 – 10 ft' },
];

const FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv + Painted', 'Powder Coated'];

export default function LandingConfig() {
  const [form, setForm] = useState({
    landingNumber: '',
    platformLength: '',
    platformWidth: '',
    platformType: '',
    finish: 'Primer',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
            <label className="form-label">Landing Number <span className="data-badge dt-string">STRING</span></label>
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
            <label className="form-label">Platform Length <span className="data-badge dt-ft-in">FT-IN</span></label>
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
            <label className="form-label">Platform Width <span className="data-badge dt-ft-in">FT-IN</span></label>
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
              <label className="form-label">Area (Auto-Calculated) <span className="data-badge dt-float">FLOAT</span></label>
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
        <div className="form-section-title">Platform Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {PLATFORM_TYPES.map(pt => (
            <div
              key={pt.value}
              onClick={() => set('platformType', pt.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${form.platformType === pt.value ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                background: form.platformType === pt.value ? 'var(--color-primary-50)' : 'white',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: form.platformType === pt.value ? 600 : 400,
                color: form.platformType === pt.value ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                transition: 'all var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              id={`platform-type-${pt.value}`}
            >
              <span style={{ fontSize: '11px', opacity: 0.7 }}>
                {form.platformType === pt.value ? '●' : '○'}
              </span>
              {pt.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Finish ─────────────────────────────────────────────────── */}
      <div className="form-section" style={{ marginBottom: 0 }}>
        <div className="form-section-title">Finish Specification <span className="data-badge dt-string">STRING</span></div>
        <select
          className="form-select data-type-string"
          id="landing-finish"
          value={form.finish}
          onChange={e => set('finish', e.target.value)}
          style={{ maxWidth: '260px' }}
        >
          {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    </div>
  );
}
