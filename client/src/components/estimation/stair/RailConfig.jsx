import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import API_BASE_URL from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import QuickManageModal from '../../common/QuickManageModal';

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv + Painted', 'Powder Coated'];

const RAIL_CONFIGS = {
  guardRail: {
    types: [
      '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe',
      '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe',
      '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post',
      '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post',
      '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post',
      '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post',
      '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post',
      '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post',
      '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts',
      '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts',
      '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH. 80 Posts',
      '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts',
      '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts',
      '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND SCH 80 POST'
    ],
    mountings:['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted Bolted', 'Side Mounted Welded', 'Embedded', 'Anchored'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPostSpacing: true,
  },
  wallRail: {
    types: [
      '1-Line Wall Railing wall bolted - 1 1/4" SCH 40 pipe',
      '1-Line Wall Railing wall bolted - 1 1/2" SCH 40 pipe'
    ],
    mountings: ['Anchored to wall w/bracket', 'Welded'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPostSpacing: false,
    hasPostQty: false
  },
  grabRail: {
    types: [
      '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe',
      '1-Line Hand Railing wall bolted - 1 1/2" SCH 40 pipe'
    ],
    mountings: ['Welded w/bracket'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPostSpacing: false,
    hasPostQty: false
  },
  caneRail: {
    types:    ['Standard Cane Rail', 'Continuous Cane Rail'],
    mountings:['Anchored to Floor'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPostSpacing: true,
    hasPostQty: true
  },
};

const DEFAULT_MOUNTING_OPTIONS = ['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted w/bolted', 'Side mounted w/welded', 'Embedded', 'Anchored'];

export default function RailConfig({ type = 'guardRail', data, onChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdowns, setDropdowns] = useState({
    finishes: DEFAULT_FINISH_OPTIONS,
    mountings: DEFAULT_MOUNTING_OPTIONS,
    guardRailTypes: RAIL_CONFIGS.guardRail.types,
    wallRailTypes: RAIL_CONFIGS.wallRail.types,
    grabRailTypes: RAIL_CONFIGS.grabRail.types,
    caneRailTypes: RAIL_CONFIGS.caneRail.types
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  const load = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [fo, mo, grt, wrt, gbt, crt] = await Promise.all([
      fetchList('finish_option'),
      fetchList('mounting_type'),
      fetchList('guardRail_type'),
      fetchList('wallRail_type'),
      fetchList('grabRail_type'),
      fetchList('caneRail_type')
    ]);
    
    setDropdowns({ 
      finishes: fo.length > 0 ? fo.map(i => i.label) : DEFAULT_FINISH_OPTIONS,
      mountings: mo.length > 0 ? mo.map(i => i.label) : DEFAULT_MOUNTING_OPTIONS,
      guardRailTypes: grt.length > 0 ? grt.map(i => i.label) : RAIL_CONFIGS.guardRail.types,
      wallRailTypes: wrt.length > 0 ? wrt.map(i => i.label) : RAIL_CONFIGS.wallRail.types,
      grabRailTypes: gbt.length > 0 ? gbt.map(i => i.label) : RAIL_CONFIGS.grabRail.types,
      caneRailTypes: crt.length > 0 ? crt.map(i => i.label) : RAIL_CONFIGS.caneRail.types
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openManage = (category, label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickModal({ isOpen: true, category, label, rect });
  };

  const config = RAIL_CONFIGS[type] || RAIL_CONFIGS.guardRail;

  const [form, setForm] = useState({
    railType:           data?.railType || '',
    railLength:         data?.railLength || '',
    mountingType:       data?.mountingType || (config.mountings[0] || ''),
    intermediateRails:  data?.intermediateRails || '',
    postSpacing:        data?.postSpacing || '',
    postQty:            data?.postQty || '',
    toeplateRequired:   data?.toeplateRequired || 'No',
    toeplateLength:     data?.toeplateLength || '',
    finish:             data?.finish || 'Primer',
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

  // Auto-calculation logic
  const calculatedPostQty = (form.railLength && form.postSpacing)
    ? Math.ceil(parseFloat(form.railLength) / parseFloat(form.postSpacing)) + 1 || ''
    : '';

  return (
    <div>
      {/* ── Main Specification Grid ────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">
          {type === 'guardRail' ? 'Guard Rail Specifications' : 'Rail Specifications'}
        </div>
        
        {/* Row 1: Primary Inputs */}
        <div className="rail-specs-grid">
          <div className="form-field">
            <label className="form-label">
              {type === 'guardRail' ? 'Guard Rail Type' : 'Rail Type'} <span className="required">*</span>
              {isAdmin && (
                <button onClick={(e) => openManage(`${type}_type`, `${type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Types`, e)} className="quick-edit-btn" title="Manage Options">
                  <Settings size={12} />
                </button>
              )}
            </label>
            <select
              className="form-select"
              id={`${type}-type`}
              value={form.railType}
              onChange={e => set('railType', e.target.value)}
            >
              <option value="">— Select Type —</option>
              {(dropdowns[`${type}Types`] || config.types).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">{type === 'guardRail' ? 'Guard Rail length' : 'Rail Length'}</label>
            <div className="form-input-with-unit compact-input">
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

          {config.hasIntermediateRails && (
            <div className="form-field">
              <label className="form-label">No. of Intermediate Rails</label>
              <input
                className="form-input compact-input"
                id={`${type}-intermediate-rails`}
                type="number"
                min="0"
                value={form.intermediateRails}
                onChange={e => set('intermediateRails', e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {config.hasPostSpacing && (
            <div className="form-field">
              <label className="form-label">Post spacing</label>
              <div className="form-input-with-unit compact-input">
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

          {config.hasPostQty !== false && (
            <div className="form-field">
              <label className="form-label">Post Qty</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input compact-input"
                  id={`${type}-post-qty`}
                  type="number"
                  value={form.postQty}
                  onChange={e => set('postQty', e.target.value)}
                  placeholder={calculatedPostQty ? `Auto: ${calculatedPostQty}` : 'Qty'}
                />
                {calculatedPostQty && !form.postQty && (
                  <div style={{ fontSize: '10px', color: 'var(--color-primary-600)', marginTop: '2px', position: 'absolute' }}>
                    Auto: {calculatedPostQty}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Secondary Options */}
        <div className="rail-options-grid mt-4">
          {config.hasToeplate && (
            <div className="form-field">
              <label className="form-label">Toe pl{type === 'guardRail' ? '(PL. 1/4X4)' : ''} reqd</label>
              <div className="radio-group compact" id={`${type}-toeplate`}>
                {['Yes', 'No'].map(v => (
                  <div
                    key={v}
                    className={`radio-option ${form.toeplateRequired === v ? 'selected' : ''}`}
                    onClick={() => set('toeplateRequired', v)}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.toeplateRequired === 'Yes' && (
            <div className="form-field">
              <label className="form-label">Toe plate length</label>
              <div className="form-input-with-unit compact-input">
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

          <div className="form-field">
            <label className="form-label">
              {type === 'guardRail' ? 'Guard Rail Mounting type' : 'Mounting Type'}
              {isAdmin && (
                <button onClick={(e) => openManage('mounting_type', 'Mounting Types', e)} className="quick-edit-btn" title="Manage Options">
                  <Settings size={12} />
                </button>
              )}
            </label>
            <select
              className="form-select compact-select"
              id={`${type}-mounting`}
              value={form.mountingType}
              onChange={e => set('mountingType', e.target.value)}
            >
              <option value="">— Select Mounting —</option>
              {(type === 'guardRail' ? dropdowns.mountings : config.mountings).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              FINISH
              {isAdmin && <button onClick={(e) => openManage('finish_option', 'Finish Options', e)} className="quick-edit-btn" title="Manage Options"><Settings size={12} /></button>}
            </label>
            <select
              className="form-select compact-select"
              id={`${type}-finish`}
              value={form.finish}
              onChange={e => set('finish', e.target.value)}
            >
              {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      <QuickManageModal 
        isOpen={quickModal.isOpen}
        onClose={() => setQuickModal({ ...quickModal, isOpen: false })}
        category={quickModal.category}
        categoryLabel={quickModal.label}
        onUpdate={load}
        triggerRect={quickModal.rect}
        defaultOptions={
          quickModal.category === 'finish_option' ? DEFAULT_FINISH_OPTIONS :
          quickModal.category === 'mounting_type' ? DEFAULT_MOUNTING_OPTIONS :
          (RAIL_CONFIGS[quickModal.category.split('_')[0]]?.types || [])
        }
      />

      <style jsx>{`
        .rail-specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          align-items: start;
        }
        .rail-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          align-items: start;
        }
        .compact-input {
          max-width: 100px;
        }
        .compact-select {
          max-width: 100%;
        }
        .mt-4 { margin-top: 16px; }
        .radio-group.compact {
          gap: 4px;
        }
        .radio-group.compact .radio-option {
          padding: 6px 12px;
          font-size: 11px;
        }
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
