import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import QuickManageModal from '../../components/common/QuickManageModal';
import { GUARD_RAIL_DRAWINGS } from '../../config/guardRailDrawings';

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

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
      '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH 80 Posts',
      '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts',
      '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts',
      '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post ',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post ',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post ',
      '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post ',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post ',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post ',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post ',
      '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post ',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH. 80 Post',
      '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH. 80 Post',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST',
      '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2" SCH 40 RAILS AND SCH 80 POST',
      'Optional Kick Plate 4\'x4\''
    ],
    mountings: ['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted Bolted', 'Side Mounted Welded', 'Embedded', 'Anchored'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPosts: true,
    hasBrackets: false
  },
  wallRail: {
    types: [
      '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe',
      '1-Line Hand Railing wall bolted - 1 1/2" SCH 40  pipe'
    ],
    mountings: ['Anchored to wall w/bracket', 'Welded'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPosts: false,
    hasBrackets: true
  },
  grabRail: {
    types: [
      '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe',
      '1-Line Handrailing on Guardrail - 1 1/2" SCH 40 pipe'
    ],
    mountings: ['Welded w/bracket'],
    hasToeplate: false,
    hasIntermediateRails: false,
    hasPosts: false,
    hasBrackets: true
  },
  caneRail: {
    types: ['Standard Cane Rail', 'Continuous Cane Rail'],
    mountings: ['Anchored to Floor'],
    hasToeplate: true,
    hasIntermediateRails: true,
    hasPosts: true,
    hasBrackets: false
  },
};

const DEFAULT_MOUNTING_OPTIONS = ['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted Bolted', 'Side Mounted Welded', 'Embedded', 'Anchored'];

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

export default function RailConfig({ type = 'guardRail', data, onChange, onFocus }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdowns, setDropdowns] = useState({
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'],
    finishes: [],
    mountings: [],
    guardRailTypes: [],
    wallRailTypes: [],
    grabRailTypes: [],
    caneRailTypes: []
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  const load = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [fo, mo, grt, wrt, gbt, crt, sg] = await Promise.all([
      fetchList('finish_option'),
      fetchList('mounting_type'),
      fetchList('guardRail_type'),
      fetchList('wallRail_type'),
      fetchList('grabRail_type'),
      fetchList('caneRail_type'),
      fetchList('steel_grade_rail')
    ]);

    setDropdowns({
      finishes: fo.length > 0 ? fo.map(i => i.label) : DEFAULT_FINISH_OPTIONS,
      mountings: mo.length > 0 ? mo.map(i => i.label) : DEFAULT_MOUNTING_OPTIONS,
      guardRailTypes: grt.length > 0 ? grt.map(i => i.label) : RAIL_CONFIGS.guardRail.types,
      wallRailTypes: wrt.length > 0 ? wrt.map(i => i.label) : RAIL_CONFIGS.wallRail.types,
      grabRailTypes: gbt.length > 0 ? gbt.map(i => i.label) : RAIL_CONFIGS.grabRail.types,
      caneRailTypes: crt.length > 0 ? crt.map(i => i.label) : RAIL_CONFIGS.caneRail.types,
      steelGrades: sg.length > 0 ? sg.map(i => i.label) : ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
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
    railType: data?.railType || '',
    railLength: data?.railLength || { value: '', unit: 'FT' },
    steelGrade: data?.steelGrade || 'A36',
    mountingType: data?.mountingType || '',
    intermediateRails: data?.intermediateRails || (type === 'caneRail' ? '0' : ''),
    postSpacing: data?.postSpacing || { value: '', unit: 'FT' },
    postQty: data?.postQty || '',
    toeplateRequired: data?.toeplateRequired || 'No',
    toeplateLength: data?.toeplateLength || { value: '', unit: 'FT' },
    finish: data?.finish || 'Primer',
    ...data
  });

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

  // ── Default Syncing Logic (Non-Mathematical) ──
  useEffect(() => {
    if (!form.railType && (dropdowns[`${type}Types`]?.length > 0 || config.types.length > 0)) {
      set('railType', dropdowns[`${type}Types`]?.[0] || config.types?.[0]);
    }
  }, [dropdowns, type, form.railType, config.types]);

  useEffect(() => {
    if (type === 'caneRail' && form.intermediateRails === '') {
      set('intermediateRails', '0');
    }
  }, [type, form.intermediateRails]);

  useEffect(() => {
    if (form.toeplateRequired === 'Yes' && (!form.toeplateLength?.value || form.toeplateLength?.value === '0') && form.railLength?.value) {
      set('toeplateLength', form.railLength);
    }
  }, [form.toeplateRequired, form.railLength]);

  return (
    <div onPointerDown={onFocus}>
      <div className="form-section">
        <div className="form-section-title">
          {type === 'guardRail' ? 'Guard Rail Specifications' : 'Rail Specifications'}
        </div>

        {/* Primary Inputs Grid */}
        <div className="rail-specs-grid">
          <div className="form-field">
            <label className="form-label">
              {type === 'guardRail' ? 'Guard Rail Type' : 'Rail Type'} <span className="required">*</span>
              {isAdmin && (
                <button
                  onClick={(e) => openManage(`${type}_type`, `${type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Types`, e)}
                  className="quick-edit-btn"
                  title="Manage Options"
                >
                  <Settings size={14} />
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

          <UnitInput
            id={`${type}-length`}
            label={type === 'guardRail' ? 'Guard Rail length' : 'Rail Length'}
            value={form.railLength}
            onChange={v => set('railLength', v)}
          />

          <div className="form-field">
            <label className="form-label">Steel Grade</label>
            <select
              className="form-select compact-select"
              value={form.steelGrade}
              onChange={e => set('steelGrade', e.target.value)}
            >
              {dropdowns.steelGrades.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>

          {!config.lbsPerFt && (
            <div className="form-field">
              <label className="form-label">
                Actual Spacing
              </label>
              <input
                className="form-input auto-calculation field-auto"
                type="text"
                value={data?.systemCalc?.actualSpacing ? `${Number(data.systemCalc.actualSpacing).toFixed(3)} ft` : 'N/A'}
                readOnly
              />
            </div>
          )}

          <div className="form-field" style={{ display: config.hasIntermediateRails ? 'block' : 'none' }}>
            <label className="form-label">
              Intermediate Rails
            </label>
            <input
              className="form-input data-type-int"
              type="number"
              value={form.intermediateRails || ''}
              onChange={(e) => set('intermediateRails', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="form-field" style={{ display: config.hasPosts ? 'block' : 'none' }}>
            <label className="form-label">
              Post Qty
            </label>
            <input
              className="form-input auto-calculation field-auto"
              type="number"
              value={data?.systemCalc?.posts || 0}
              readOnly
            />
          </div>

          {config.hasBrackets && (
            <div className="form-field">
              <label className="form-label">
                Bracket Qty
              </label>
              <input
                className="form-input auto-calculation field-auto"
                type="number"
                value={data?.systemCalc?.bracketQty || 0}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Row 2: Secondary Options */}
        <div className="rail-options-grid mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {config.hasToeplate && (
            <>
              <div className="form-field">
                <label className="form-label">Toe plate reqd</label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '36px' }}>
                  {['Yes', 'No'].map(v => (
                    <label 
                      key={v} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: form.toeplateRequired === v ? '#0F172A' : '#64748B',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name={`toeplateRequired-${data?.id || type}`}
                        value={v}
                        checked={form.toeplateRequired === v}
                        onChange={() => set('toeplateRequired', v)}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          cursor: 'pointer', 
                          accentColor: '#3B82F6'
                        }}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {form.toeplateRequired === 'Yes' && (
                <>
                  <UnitInput
                    id={`${type}-toe-width`}
                    label="Toe Width"
                    value={form.toeWidth || { value: '4', unit: 'IN' }}
                    onChange={v => set('toeWidth', v)}
                  />
                  <UnitInput
                    id={`${type}-toe-length`}
                    label="Toe Length"
                    value={form.toeplateLength}
                    onChange={v => set('toeplateLength', v)}
                  />
                </>
              )}
            </>
          )}

          <div className="form-field">
            <label className="form-label">Mounting</label>
            <select
              className="form-select compact-select"
              value={form.mountingType}
              onChange={e => set('mountingType', e.target.value)}
            >
              <option value="">— Select —</option>
              {dropdowns.mountings.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Finish Specification</label>
            <select
              className="form-select compact-select"
              value={form.finish}
              onChange={e => set('finish', e.target.value)}
            >
              <option value="">— Select Finish —</option>
              {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, paddingBottom: 16, borderBottom: '1px dashed #CBD5E1' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>STEEL LBS /<br />LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.steelLbsPerLF || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>SHOP MH /<br />LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.shopMH || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>FIELD MH /<br />LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.fieldMH || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>STEEL<br />(+SCRAP)</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C' }}>{Number(data.systemCalc.steelWithScrap || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>TOTAL STEEL<br />lbs.</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0369A1' }}>{Number(data.systemCalc.totalSteel || 0).toFixed(3)}</div>
                </div>
              </div>

              {/* 🛡️ SFE TOTAL HOURS & COST */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Shop Total Hrs</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.shopTotalHrs || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Field Total Hrs</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(data.systemCalc.fieldTotalHrs || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Galvanize Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C' }}>${Number(data.systemCalc.galvanizeTotalCost || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Mounting Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>${Number(data.systemCalc.mountingCharge || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>

          </div>
        </div>
      )}
      <div style={{ marginTop: '8px', textAlign: 'right' }}>

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
              ([])
        }
      />

      <style jsx>{`
        .rail-specs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .rail-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .mt-4 { margin-top: 16px; }
        .backend-results-grid {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .results-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .results-value { font-size: 16px; font-weight: 700; color: #1e293b; }
        .quick-edit-btn { margin-left: 4px; border: none; background: none; cursor: pointer; color: #64748b; }
        .quick-edit-btn:hover { color: #1e293b; }
      `}</style>
    </div>
  );
}
