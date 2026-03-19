import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import API_BASE_URL from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import QuickManageModal from '../../common/QuickManageModal';
import { calculateStairGeometry, debounce } from '../../../services/estimationService';

// Fallback hardcoded lists (used while loading or if API fails)
const DEFAULT_STAIR_TYPES = [
  { value: 'pan-concrete',  label: 'PAN PLATE CONC. FILLED' },
  { value: 'grating-tread', label: 'GRATING TREAD' },
  { value: 'non-metal',     label: 'NON METAL STAIR' },
];

const DEFAULT_STRINGER_SIZES  = ['W8x31', 'W10x33', 'W12x35', 'W12x40', 'W12x50', 'W14x43', 'MC12x10.6', 'C12x20.7', 'C15x33.9'];
const DEFAULT_CONNECTION_TYPES = ['Welded', 'Bolted'];
const DEFAULT_FINISH_OPTIONS   = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

const DEFAULT_GRATING_TYPES = [
  '1 1/4" Bar grating/Welded',
  '1 1/4" Bar grating/Bolted',
  '1" Bar grating/Welded',
  '1" Bar grating/Bolted',
  'McNichols treads',
  'Other Pre-fabricated Treads'
];

export default function StairConfig({ stair = {}, onChange = () => {}, isFlightMode = false }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdowns, setDropdowns] = useState({
    stairTypes: DEFAULT_STAIR_TYPES,
    gratingTypes: DEFAULT_GRATING_TYPES,
    stringerSizes: DEFAULT_STRINGER_SIZES,
    finishes: DEFAULT_FINISH_OPTIONS,
    connections: DEFAULT_CONNECTION_TYPES,
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  // Fetch dynamic lists from Admin Dictionary
  const loadAll = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [st, gt, ss, fo, ct, sg] = await Promise.all([
      fetchList('stair_type'),
      fetchList('grating_type'),
      fetchList('stringer_size'),
      fetchList('finish_option'),
      fetchList('connection_type'),
      fetchList('steel_grade_stair')
    ]);

    setDropdowns({
      stairTypes: st,
      gratingTypes: gt.map(i => i.label),
      stringerSizes: ss.map(i => i.label || i.value),
      finishes: fo.map(i => i.label),
      connections: ct.map(i => i.label),
      steelGrades: sg.length > 0 ? sg.map(i => i.label) : ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
    });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openManage = (category, label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickModal({ isOpen: true, category, label, rect });
  };
  const unit = 'ft / in';

  const [form, setForm] = useState({
    stairNumber:     stair.stairNumber   || '',
    stairCategory:   stair.stairCategory || 'Commercial', // Commercial vs Industrial
    stairType:       stair.stairType     || 'pan-concrete', 
    panPlThk:        stair.panPlThk      || '',
    gratingType:     stair.gratingType   || '',
    stairWidth:      stair.stairWidth    || '',
    run:             stair.run           || '',
    rise:            stair.rise          || '',
    totalHeight:     stair.totalHeight   || '',
    numRisers:       stair.numRisers     || '',
    slope:           stair.slope         || '',
    angle:           stair.angle         || '',
    stringerType:    stair.stringerType  || 'Rolled', // Rolled vs Plate
    stringerSize:    stair.stringerSize  || '',
    steelGrade:      stair.steelGrade    || 'A992',
    plateThk:        stair.plateThk      || '',
    plateWidth:      stair.plateWidth    || '',
    nsStringerBot:   stair.nsStringerBot || '',
    nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
    fsStringerBot:   stair.fsStringerBot || '',
    fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
    nsStringerTop:   stair.nsStringerTop || '',
    nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
    fsStringerTop:   stair.fsStringerTop || '',
    fsStringerConnTop: stair.fsStringerConnTop || 'Welded',
    finish:          stair.finish         || 'Primer',

    ...stair
  });

  // Sync state if stair data changes from outside (duplication/undo)
  useEffect(() => {
    if (stair) {
      setForm(f => ({ ...f, ...stair }));
    }
  }, [stair]);

  // ── Live geometry calculation via backend API (NO frontend math) ──────
  // Debounced so we don't fire on every keystroke
  const debouncedCalc = useRef(
    debounce(async (run, rise, height) => {
      if (!run || !rise || parseFloat(run) <= 0 || parseFloat(rise) <= 0) return;
      const geo = await calculateStairGeometry({
        height: height ? (parseFloat(height) || 0) : (parseFloat(rise) * (parseFloat(form.numRisers) || 1)),
        rise: parseFloat(rise),
        run: parseFloat(run),
      });
      if (geo.success !== false) {
        setForm(f => ({
          ...f,
          numRisers: (f.numRisers === '' || !f.numRisers) ? String(geo.risers) : f.numRisers,
          slope:     (f.slope === '' || !f.slope) ? String(geo.slope)   : f.slope,
          angle:     (f.angle === '' || !f.angle) ? String(geo.angle)   : f.angle,
        }));
      }
    }, 400)
  ).current;

  useEffect(() => {
    debouncedCalc(form.run, form.rise, form.totalHeight);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.run, form.rise, form.totalHeight]);

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onChange(updated);
  };

  const UnitInput = ({ id, value, label, onChange, placeholder, hint, dtTag, dtClass }) => (
    <div className="form-field">
      <label className="form-label">
        {label} 
        {dtTag && <span className={`data-badge ${dtClass}`}></span>}
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
      <div className="radio-group">
        {dropdowns.connections.map(c => {
          const val = (c.value || c);
          const isSelected = form[propName]?.toLowerCase() === val?.toLowerCase();
          return (
            <div key={val}
                 className={`radio-option ${isSelected ? 'selected' : ''}`}
                 onClick={() => set(propName, val)}
            >
              {c.label || c}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Identification ─────────────────────────────────────────── */}
      {/* ── Identification & Configuration ─────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Identification</div>
        <div className="form-grid form-grid-4">
          {/* Identity removed because it is already shown in the section header */}
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
              <label className="form-label">
                Stair Type <span className="data-badge dt-string"></span>
                {isAdmin && (
                  <button 
                    onClick={(e) => openManage('stair_type', 'Stair Types', e)} 
                    className="quick-edit-btn" 
                    title="Manage Options"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </label>
              <select className="form-select data-type-string" id="stair-type" value={form.stairType} onChange={e => set('stairType', e.target.value)}>
                {dropdowns.stairTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Conditional properties based on Stair Type */}
          <div className="form-grid form-grid-2" style={{ marginTop: '16px', padding: '16px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            {(form.stairType === 'pan-concrete') && (
              <div className="form-field fade-in">
                <label className="form-label">Pan Pl. Thk <span className="data-badge dt-float"></span></label>
                <div className="form-input-with-unit data-type-float">
                  <input type="number" step="0.01" value={form.panPlThk} onChange={e => set('panPlThk', e.target.value)} placeholder="e.g. 0.125" />
                  <span className="form-input-unit">in</span>
                </div>
              </div>
            )}
            
            {(form.stairType === 'grating-tread') && (
              <div className="form-field fade-in">
                <label className="form-label">
                  Grating Tread Type <span className="data-badge dt-string"></span>
                  {isAdmin && (
                    <button 
                      onClick={(e) => openManage('grating_type', 'Grating Tread Types', e)} 
                      className="quick-edit-btn" 
                      title="Manage Options"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                </label>
                <select className="form-select data-type-string" value={form.gratingType} onChange={e => set('gratingType', e.target.value)}>
                  <option value="">— Select Grating Type —</option>
                  {dropdowns.gratingTypes.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
            
            {(form.stairType === 'non-metal') && (
              <div style={{ padding: '8px', color: '#856404', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', fontSize: '13px', fontStyle: 'italic', gridColumn: 'span 2' }}>
                All tread configuration cells are faded (NON METAL STAIR selected).
              </div>
            )}
          </div>
        </div>

      {/* ── Geometry ───────────────────────────────────────────────── */}
      <div className={`form-section ${form.stairType === 'non-metal' ? 'section-faded' : ''}`}>
        <div className="form-section-title">Stair Geometry</div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          <UnitInput id="stair-width" label="Stair Width" value={form.stairWidth} onChange={v => set('stairWidth', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-run"   label="Run"         value={form.run} onChange={v => set('run', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-rise"  label="Rise"        value={form.rise} onChange={v => set('rise', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-height" label="Total Height" value={form.totalHeight} onChange={v => set('totalHeight', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          
          <div className="form-field">
            <label className="form-label">No. of Risers <span className="data-badge dt-int"></span></label>
            <input className="form-input data-type-int auto-calculation" type="number" value={form.numRisers} onChange={e => set('numRisers', e.target.value)} placeholder="Auto" />
          </div>

          <div className="form-field">
            <label className="form-label">Slope <span className="data-badge dt-float"></span></label>
            <input className="form-input data-type-float auto-calculation" value={form.slope} onChange={e => set('slope', e.target.value)} placeholder="e.g. 1 : 1.5" />
          </div>

          <div className="form-field">
            <label className="form-label">Angle <span className="data-badge dt-float"></span></label>
            <div className="form-input-with-unit data-type-float">
               <input id="stair-angle" className="auto-calculation" type="number" step="0.1" value={form.angle} onChange={e => set('angle', e.target.value)} placeholder="Auto" />
               <span className="form-input-unit">deg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stringers ──────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Stringer Configuration</div>
        <div className="form-grid form-grid-5" style={{ marginBottom: '16px' }}>
          <div className="form-field">
            <label className="form-label">Stringer Profile Type</label>
            <div className="radio-group">
              <div 
                className={`radio-option ${form.stringerType === 'Rolled' ? 'selected' : ''}`}
                onClick={() => set('stringerType', 'Rolled')}
              >
                Rolled shapes
              </div>
              <div 
                className={`radio-option ${form.stringerType === 'Plate' ? 'selected' : ''}`}
                onClick={() => set('stringerType', 'Plate')}
              >
                Plate Profile
              </div>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              Steel Grade <span className="data-badge dt-string"></span>
              {isAdmin && (
                <button 
                  onClick={(e) => openManage('steel_grade_stair', 'Stair Steel Grades', e)} 
                  className="quick-edit-btn" 
                  title="Manage Options"
                >
                  <Settings size={14} />
                </button>
              )}
            </label>
            <select className="form-select data-type-string" value={form.steelGrade} onChange={e => set('steelGrade', e.target.value)}>
              {dropdowns.steelGrades.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>

          {form.stringerType === 'Rolled' ? (
            <div className="form-field fade-in" style={{ gridColumn: 'span 3' }}>
              <label className="form-label">
                Rolled Stringer Size <span className="data-badge dt-string"></span>
                {isAdmin && (
                  <button 
                    onClick={(e) => openManage('stringer_size', 'Stringer Sizes', e)} 
                    className="quick-edit-btn" 
                    title="Manage Options"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </label>
              <select className="form-select data-type-string" id="stringer-size" value={form.stringerSize} onChange={e => set('stringerSize', e.target.value)}>
                <option value="">— Select from Profile Data Base —</option>
                {dropdowns.stringerSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="form-field fade-in">
                <label className="form-label">Plate Thickness <span className="data-badge dt-string"></span></label>
                <input 
                  className="form-input data-type-string" 
                  value={form.plateThk} 
                  onChange={e => set('plateThk', e.target.value)} 
                  placeholder="e.g. 1/2" 
                />
              </div>
              <div className="form-field fade-in" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Plate Width <span className="data-badge dt-string"></span></label>
                <input 
                  className="form-input data-type-string" 
                  value={form.plateWidth} 
                  onChange={e => set('plateWidth', e.target.value)} 
                  placeholder="e.g. 12" 
                />
              </div>
            </>
          )}
        </div>
        
        <div className="form-grid form-grid-8 gap-y-4">
          <UnitInput id="ns-bot" label="N/S Extent @Bot" value={form.nsStringerBot} onChange={v => set('nsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="N/S Conn @Bot" propName="nsStringerConnBot" />
          
          <UnitInput id="fs-bot" label="F/S Extent @Bot" value={form.fsStringerBot} onChange={v => set('fsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="F/S Conn @Bot" propName="fsStringerConnBot" />
          
          <UnitInput id="ns-top" label="N/S Extent @Top"  value={form.nsStringerTop} onChange={v => set('nsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="N/S Conn @Top" propName="nsStringerConnTop" />
          
          <UnitInput id="fs-top" label="F/S Extent @Top"  value={form.fsStringerTop} onChange={v => set('fsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="F/S Conn @Top" propName="fsStringerConnTop" />
        </div>
      </div>


      {/* ── Finish ─────────────────────────────────────────────────── */}
      <div className="form-grid form-grid-4">
        <div className="form-section" style={{ marginBottom: 0 }}>
          <div className="form-section-title">
            Finish Specification <span className="data-badge dt-string"></span>
            {isAdmin && (
              <button 
                onClick={(e) => openManage('finish_option', 'Finish Options', e)} 
                className="quick-edit-btn" 
                title="Manage Options"
              >
                <Settings size={14} />
              </button>
            )}
          </div>
          <select
            className="form-select data-type-string"
            id="stair-finish"
            value={form.finish}
            onChange={e => set('finish', e.target.value)}
          >
            {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* ── Backend Calculation Results (Read-Only) ─────────────────────── */}
      {stair.flightCalcResult && stair.flightCalcResult.success && (() => {
        const r = stair.flightCalcResult;
        const Cell = ({ label, value, unit, color = '#1e40af' }) => (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: color === '#1e40af' ? '#1e3a8a' : color, fontVariantNumeric: 'tabular-nums' }}>
              {value !== undefined && value !== null ? value : '—'}
              {unit && <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: 3 }}>{unit}</span>}
            </div>
          </div>
        );
        return (
          <div style={{ marginTop: 16 }}>
            {/* Geometry Row */}
            <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius: 8, border: '1px solid #bae6fd', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 10 }}>
              <Cell label="Step Slope" value={r.geometry?.stepSlopeIn} unit="in" color="#0369a1" />
              <Cell label="Angle" value={r.geometry?.angleDeg} unit="°" color="#0369a1" />
              <Cell label="Stringer LF" value={r.stringer?.totalLF} unit="ft" color="#0369a1" />
              <Cell label="Pan Area" value={r.panPlate?.areaSqFt} unit="ft²" color="#0369a1" />
            </div>
            {/* Steel Weight Row */}
            <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', borderRadius: 8, border: '1px solid #fed7aa', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 10 }}>
              <Cell label="Stringer Steel (w/11%)" value={r.stringer?.burdenedWeightLbs} unit="lb" color="#c2410c" />
              <Cell label="Pan Steel (w/11%)" value={r.panPlate?.burdenedWeightLbs} unit="lb" color="#c2410c" />
              <Cell label="Total Steel" value={r.summary?.totalSteelLbs} unit="lb" color="#9a3412" />
              <Cell label="Galv Cost" value={r.finish?.galvMaterialCost || 0} unit="$" color="#c2410c" />
            </div>
            {/* Labor + Cost Row */}
            <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 8, border: '1px solid #86efac', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <Cell label="Shop Hrs" value={r.labor?.totalShopHrs} unit="hrs" color="#15803d" />
              <Cell label="Field Hrs" value={r.labor?.totalFieldHrs} unit="hrs" color="#15803d" />
              <Cell label={`Shop ($${r.labor?.shopRatePerHr}/hr)`} value={r.labor?.shopLaborCost} unit="$" color="#166534" />
              <Cell label={`Field ($${r.labor?.fieldRatePerHr}/hr)`} value={r.labor?.fieldLaborCost} unit="$" color="#166534" />
            </div>
            {/* Grand Total */}
            <div style={{ marginTop: 8, padding: '10px 16px', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)', borderRadius: 8, border: '1px solid #c4b5fd', display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Subtotal</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#4c1d95' }}>${r.summary?.subtotal?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Tax ({(r.summary?.taxRate * 100).toFixed(0)}%)</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#6d28d9' }}>${r.summary?.taxAmount?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase', marginLeft: 'auto' }}>TOTAL ESTIMATED COST</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#4c1d95' }}>${r.summary?.totalEstimatedCost?.toLocaleString()}</div>
            </div>
          </div>
        );
      })()}

      <QuickManageModal 
        isOpen={quickModal.isOpen}
        onClose={() => setQuickModal({ ...quickModal, isOpen: false })}
        category={quickModal.category}
        categoryLabel={quickModal.label}
        onUpdate={loadAll}
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
        .auto-calculation {
          background-color: #f0f7ff !important;
          border-color: #bcd9ff !important;
          font-weight: 500;
        }
        .section-faded {
          opacity: 0.6;
          pointer-events: none;
          filter: grayscale(0.5);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
