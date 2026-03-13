// src/components/estimation/stair/StairConfig.jsx
import React, { useState, useEffect } from 'react';

const STAIR_TYPES = [
  { value: 'pan-concrete',  label: 'Pan Plate — Concrete Filled' },
  { value: 'grating-tread', label: 'Grating Tread' },
  { value: 'non-metal',     label: 'Non-Metal Stair' },
];

const STRINGER_SIZES  = ['W8x31', 'W10x33', 'W12x35', 'W12x40', 'W12x50', 'W14x43', 'MC12x10.6', 'C12x20.7', 'C15x33.9'];
const CONNECTION_TYPES = ['Welded', 'Bolted'];
const FINISH_OPTIONS   = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

const GRATING_TYPES = [
  '1 1/4" Bar grating / Welded',
  '1 1/4" Bar grating / Bolted',
  '1" Bar grating / Welded',
  '1" Bar grating / Bolted',
  'McNichols Treads',
  'Other Pre-fabricated Treads'
];

export default function StairConfig({ stair = {}, onChange = () => {}, isFlightMode = false }) {
  const unit = 'ft / in';

  const [form, setForm] = useState({
    stairNumber:     stair.stairNumber   || '',
    drawingRef:      stair.drawingRef    || '',
    stairCategory:   stair.stairCategory || 'Commercial', // Commercial vs Industrial
    stairType:       stair.stairType     || 'pan-concrete', 
    panPlThk:        stair.panPlThk      || '',
    gratingType:     stair.gratingType   || '',
    stairWidth:      stair.stairWidth    || '',
    run:             stair.run           || '',
    rise:            stair.rise          || '',
    angle:           stair.angle         || '',
    stringerType:    stair.stringerType  || 'Rolled', // Rolled vs Plate
    stringerSize:    stair.stringerSize  || '',
    plateSize:       stair.plateSize     || '',
    nsStringerBot:   stair.nsStringerBot || '',
    nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
    fsStringerBot:   stair.fsStringerBot || '',
    fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
    nsStringerTop:   stair.nsStringerTop || '',
    nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
    fsStringerTop:   stair.fsStringerTop || '',
    fsStringerConnTop: stair.fsStringerConnTop || 'Welded',
    finish:          stair.finish         || 'Primer',
  });

  // Auto-calculated fields
  const numRisers = (form.run && form.rise)
    ? Math.ceil(parseFloat(form.run) / parseFloat(form.rise)) || ''
    : '';

  const slope = (form.run && form.rise)
    ? `1 : ${(parseFloat(form.run) / parseFloat(form.rise)).toFixed(2)}`
    : '';

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onChange(updated);
  };

  const UnitInput = ({ id, value, label, onChange, placeholder, hint, dtTag, dtClass }) => (
    <div className="form-field">
      <label className="form-label">
        {label} 
        {dtTag && <span className={`data-badge ${dtClass}`}>{dtTag}</span>}
      </label>
      <div className={`form-input-with-unit ${dtClass ? `data-type-${dtClass.replace('dt-','')}` : ''}`}>
        <input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '0.00'}
          type="number"
          step="0.01"
          min="0"
        />
        <span className="form-input-unit">{unit}</span>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  // Connection block helper
  const ConnBlock = ({ label, propName }) => (
    <div className="form-field" style={{ marginTop: '8px' }}>
      <label className="form-label">{label}</label>
      <div className="radio-group" style={{ maxWidth: '160px' }}>
        {CONNECTION_TYPES.map(c => (
          <div key={c}
               className={`radio-option ${form[propName] === c ? 'selected' : ''}`}
               onClick={() => set(propName, c)}
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Identification ─────────────────────────────────────────── */}
      {/* ── Identification & Configuration ─────────────────────────── */}
      {!isFlightMode && (
        <div className="form-section">
          <div className="form-section-title">Identification</div>
          <div className="form-grid form-grid-4">
            <div className="form-field">
              <label className="form-label">Flight # <span className="data-badge dt-string">STRING</span></label>
              <input className="form-input data-type-string" id="stair-number" value={form.stairNumber} onChange={e => set('stairNumber', e.target.value)} placeholder="e.g. S-01" />
            </div>
            <div className="form-field">
              <label className="form-label">DWG. REF. <span className="data-badge dt-string">STRING</span></label>
              <input className="form-input data-type-string" id="drawing-ref" value={form.drawingRef} onChange={e => set('drawingRef', e.target.value)} placeholder="e.g. DWG-A-101" />
            </div>
            
            <div className="form-field">
              <label className="form-label">Stair Category</label>
              <div className="radio-group">
                {['Commercial', 'Industrial'].map(cat => (
                  <div key={cat}
                       className={`radio-option ${form.stairCategory === cat ? 'selected' : ''}`}
                       onClick={() => set('stairCategory', cat)}
                  >
                    {cat} Stair
                  </div>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Stair Type <span className="data-badge dt-string">STRING</span></label>
              <select className="form-select data-type-string" id="stair-type" value={form.stairType} onChange={e => set('stairType', e.target.value)}>
                {STAIR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Conditional properties based on Stair Type */}
          <div className="form-grid form-grid-2" style={{ marginTop: '16px', padding: '16px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            {(form.stairType === 'pan-concrete') && (
              <div className="form-field fade-in">
                <label className="form-label">Pan Pl. Thk <span className="data-badge dt-float">FLOAT</span></label>
                <div className="form-input-with-unit data-type-float">
                  <input type="number" step="0.01" value={form.panPlThk} onChange={e => set('panPlThk', e.target.value)} placeholder="e.g. 0.125" />
                  <span className="form-input-unit">in</span>
                </div>
              </div>
            )}
            
            {(form.stairType === 'grating-tread') && (
              <div className="form-field fade-in">
                <label className="form-label">Grating Tread Type <span className="data-badge dt-string">STRING</span></label>
                <select className="form-select data-type-string" value={form.gratingType} onChange={e => set('gratingType', e.target.value)}>
                  <option value="">— Select Grating Type —</option>
                  {GRATING_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
            
            {(form.stairType === 'non-metal') && (
              <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                All tread configuration cells are faded (Non-Metal Stair selected).
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Geometry ───────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Stair Geometry</div>
        <div className="form-grid form-grid-4">
          <UnitInput id="stair-width" label="Stair Width" value={form.stairWidth} onChange={v => set('stairWidth', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-run"   label="Run"         value={form.run} onChange={v => set('run', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-rise"  label="Rise"        value={form.rise} onChange={v => set('rise', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          
          <div className="form-field">
            <label className="form-label">Angle <span className="data-badge dt-float">FLOAT</span></label>
            <div className="form-input-with-unit data-type-float">
               <input id="stair-angle" type="number" step="0.5" value={form.angle} onChange={e => set('angle', e.target.value)} placeholder="Auto" />
               <span className="form-input-unit">deg</span>
            </div>
          </div>
        </div>

        {/* Auto-calculated values */}
        {(numRisers || slope) && (
          <div className="form-grid form-grid-2" style={{ marginTop: '12px' }}>
            <div className="computed-field data-type-int" style={{ borderLeftWidth: '4px' }}>
              <div>
                <div className="computed-label">NO. OF RISERS <span className="data-badge dt-int">INTEGER</span></div>
                <div className="computed-value">{numRisers || '—'}</div>
              </div>
            </div>
            <div className="computed-field data-type-float" style={{ borderLeftWidth: '4px' }}>
              <div>
                <div className="computed-label">SLOPE <span className="data-badge dt-float">FLOAT</span></div>
                <div className="computed-value">{slope || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stringers ──────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Stringer Configuration</div>
        <div className="form-grid form-grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-field">
            <label className="form-label">Stringer Profile Type</label>
            <div className="radio-group" style={{ maxWidth: '300px' }}>
              <div 
                className={`radio-option ${form.stringerType === 'Rolled' ? 'selected' : ''}`}
                onClick={() => set('stringerType', 'Rolled')}
              >
                1. Rolled shapes
              </div>
              <div 
                className={`radio-option ${form.stringerType === 'Plate' ? 'selected' : ''}`}
                onClick={() => set('stringerType', 'Plate')}
              >
                2. Plate Profile
              </div>
            </div>
          </div>

          {form.stringerType === 'Rolled' ? (
            <div className="form-field fade-in">
              <label className="form-label">Rolled Stringer Size <span className="data-badge dt-string">STRING</span></label>
              <select className="form-select data-type-string" id="stringer-size" value={form.stringerSize} onChange={e => set('stringerSize', e.target.value)}>
                <option value="">— Select from Profile Data Base —</option>
                {STRINGER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <div className="form-field fade-in">
              <label className="form-label">Plate Size (PL thk x Width) <span className="data-badge dt-string">STRING</span></label>
              <input 
                className="form-input data-type-string" 
                value={form.plateSize} 
                onChange={e => set('plateSize', e.target.value)} 
                placeholder="e.g. 1/2 x 12" 
              />
            </div>
          )}
        </div>
        
        <div className="form-grid form-grid-4 gap-y-6">
          <div>
             <UnitInput id="ns-bot" label="N/S Extent At Bot." value={form.nsStringerBot} onChange={v => set('nsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
             <ConnBlock label="N/S Stringer Conn At Bot." propName="nsStringerConnBot" />
          </div>
          <div>
             <UnitInput id="fs-bot" label="F/S Extent At Bot." value={form.fsStringerBot} onChange={v => set('fsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
             <ConnBlock label="F/S Stringer Conn At Bot." propName="fsStringerConnBot" />
          </div>
          <div>
             <UnitInput id="ns-top" label="N/S Extent At Top"  value={form.nsStringerTop} onChange={v => set('nsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
             <ConnBlock label="N/S Stringer Conn At Top" propName="nsStringerConnTop" />
          </div>
          <div>
             <UnitInput id="fs-top" label="F/S Extent At Top"  value={form.fsStringerTop} onChange={v => set('fsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
             <ConnBlock label="F/S Stringer Conn At Top" propName="fsStringerConnTop" />
          </div>
        </div>
      </div>

      {/* ── Finish ─────────────────────────────────────────────────── */}
      <div className="form-grid form-grid-4">
        <div className="form-section" style={{ marginBottom: 0 }}>
          <div className="form-section-title">Finish <span className="data-badge dt-string">STRING</span></div>
          <select
            className="form-select data-type-string"
            id="stair-finish"
            value={form.finish}
            onChange={e => set('finish', e.target.value)}
          >
            {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

    </div>
  );
}
