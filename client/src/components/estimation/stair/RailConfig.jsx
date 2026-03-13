// src/components/estimation/stair/RailConfig.jsx
import React, { useState } from 'react';

const FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv + Painted', 'Powder Coated'];

const RAIL_CONFIGS = {
  guardRail: {
    types:    ['Standard Guard Rail', 'Industrial Guard Rail', 'Ornamental Guard Rail'],
    mountings:['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted Bolted', 'Side Mounted Welded', 'Embedded', 'Anchored'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPostSpacing: true,
  },
  wallRail: {
    types:    ['Standard Wall Rail', 'Handrail — Continuous', 'ADA Compliant'],
    mountings:['Anchored with Bracket', 'Welded'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPostSpacing: false,
  },
  grabRail: {
    types:    ['Standard Grab Rail', 'ADA Grab Rail', 'Custom Grab Rail'],
    mountings:['Wall Mounted', 'Floor Mounted', 'Ceiling Mounted'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPostSpacing: false,
  },
  caneRail: {
    types:    ['Standard Cane Rail', 'Continuous Cane Rail'],
    mountings:['Anchored to Floor'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPostSpacing: true,
  },
};

export default function RailConfig({ type = 'guardRail' }) {
  const config = RAIL_CONFIGS[type] || RAIL_CONFIGS.guardRail;

  const [form, setForm] = useState({
    railType:           '',
    railLength:         '',
    mountingType:       config.mountings[0],
    intermediateRails:  '',
    postSpacing:        '',
    toeplateRequired:   'No',
    toeplateLength:     '',
    finish:             'Primer',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const postQty = (form.railLength && form.postSpacing)
    ? Math.ceil(parseFloat(form.railLength) / parseFloat(form.postSpacing)) + 1 || ''
    : '';

  return (
    <div>
      {/* ── Type & Length ───────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Rail Specification</div>
        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label className="form-label">Rail Type <span className="required">*</span></label>
            <select
              className="form-select"
              id={`${type}-type`}
              value={form.railType}
              onChange={e => set('railType', e.target.value)}
            >
              <option value="">— Select Type —</option>
              {config.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Rail Length <span className="required">*</span></label>
            <div className="form-input-with-unit">
              <input
                id={`${type}-length`}
                type="number"
                step="0.01"
                value={form.railLength}
                onChange={e => set('railLength', e.target.value)}
                placeholder="0.00"
              />
              <span className="form-input-unit">ft</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Post & Intermediate Rails ───────────────────────────────── */}
      {(config.hasPostSpacing || config.hasIntermediateRails) && (
        <div className="form-section">
          <div className="form-section-title">Post &amp; Rail Configuration</div>
          <div className="form-grid form-grid-3">
            {config.hasIntermediateRails && (
              <div className="form-field">
                <label className="form-label">No. of Intermediate Rails</label>
                <input
                  className="form-input"
                  id={`${type}-intermediate-rails`}
                  type="number"
                  min="0"
                  value={form.intermediateRails}
                  onChange={e => set('intermediateRails', e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
            )}

            {config.hasPostSpacing && (
              <div className="form-field">
                <label className="form-label">Post Spacing</label>
                <div className="form-input-with-unit">
                  <input
                    id={`${type}-post-spacing`}
                    type="number"
                    step="0.01"
                    value={form.postSpacing}
                    onChange={e => set('postSpacing', e.target.value)}
                    placeholder="0.00"
                  />
                  <span className="form-input-unit">ft</span>
                </div>
              </div>
            )}

            {postQty && (
              <div className="form-field">
                <label className="form-label">Post Quantity (Auto)</label>
                <div className="computed-field" style={{ height: '36px' }}>
                  <div>
                    <div className="computed-label">⚙ Posts</div>
                    <div className="computed-value" style={{ fontSize: '14px' }}>{postQty}</div>
                  </div>
                  <span className="computed-unit">posts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mounting Type ───────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Mounting Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {config.mountings.map(m => (
            <div
              key={m}
              onClick={() => set('mountingType', m)}
              id={`${type}-mount-${m.replace(/\s+/g, '-').toLowerCase()}`}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${form.mountingType === m ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                background: form.mountingType === m ? 'var(--color-primary-50)' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: form.mountingType === m ? 600 : 400,
                color: form.mountingType === m ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                transition: 'all var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '10px' }}>{form.mountingType === m ? '●' : '○'}</span>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* ── Toe Plate ───────────────────────────────────────────────── */}
      {config.hasToeplate && (
        <div className="form-section">
          <div className="form-section-title">Toe Plate</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label className="form-label">Toe Plate Required</label>
              <div className="radio-group" id={`${type}-toeplate`}>
                {['Yes', 'No'].map(v => (
                  <div
                    key={v}
                    className={`radio-option ${form.toeplateRequired === v ? 'selected' : ''}`}
                    onClick={() => set('toeplateRequired', v)}
                  >
                    {v === 'Yes' ? '✓' : '✕'} {v}
                  </div>
                ))}
              </div>
            </div>

            {form.toeplateRequired === 'Yes' && (
              <div className="form-field">
                <label className="form-label">Toe Plate Length</label>
                <div className="form-input-with-unit">
                  <input
                    id={`${type}-toeplate-length`}
                    type="number"
                    step="0.01"
                    value={form.toeplateLength}
                    onChange={e => set('toeplateLength', e.target.value)}
                    placeholder="0.00"
                  />
                  <span className="form-input-unit">ft</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Finish ─────────────────────────────────────────────────── */}
      <div className="form-section" style={{ marginBottom: 0 }}>
        <div className="form-section-title">Finish Specification</div>
        <select
          className="form-select"
          id={`${type}-finish`}
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
