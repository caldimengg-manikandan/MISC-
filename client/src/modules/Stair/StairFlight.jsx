import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Check, AlertTriangle } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import QuickManageModal from '../../components/common/QuickManageModal';
import { calculateStairGeometry, debounce } from '../../services/estimationService';
import { normalizeToInches, normalizeToFeet, parseArchitecturalInput } from '../../utils/mathUtils';

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

// ── Internal Helpers (Defined outside to prevent Focus Loss) ─────────

const UnitInput = ({ id, value, label, onChange, placeholder, hint, dtTag, dtClass }) => {
  const { value: val, unit } = value;
  
  return (
    <div className="form-field">
      <label className="form-label">
        {label} {dtTag && <span className={`data-badge ${dtClass}`}></span>}
      </label>
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

const ConnBlock = ({ label, propName, value, options, onChange }) => (
  <div className="form-field" style={{ marginTop: '8px' }}>
    <label className="form-label">{label}</label>
    <div className="radio-group" style={{ display: 'flex', gap: '12px' }}>
      {options.map(c => {
        const val = (c.value || c);
        const name = `${propName}-${label.replace(/\s+/g, '-')}-${value?.slice(-6)}`;
        const isSelected = value?.toLowerCase() === val?.toLowerCase();
        return (
          <label 
            key={val}
            className={`radio-option ${isSelected ? 'selected' : ''}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #E2E8F0',
              background: isSelected ? '#F1F5F9' : '#FFFFFF',
              borderColor: isSelected ? '#3B82F6' : '#E2E8F0',
              fontSize: '12px',
              fontWeight: 600,
              flex: 1,
              transition: 'all 0.2s',
              color: isSelected ? '#1E293B' : '#64748B'
            }}
          >
            <input
              type="radio"
              name={name}
              value={val}
              checked={isSelected}
              onChange={() => onChange(val)}
              style={{ accentColor: '#3B82F6' }}
            />
            {c.label || c}
          </label>
        );
      })}
    </div>
  </div>
);

export default function StairConfig({ stair = {}, onChange = () => {}, isFlightMode = false, onFocus = () => {} }) {
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
    stairCategory:   stair.stairCategory || 'Commercial', 
    stairType:       stair.stairType     || 'pan-concrete', 
    panPlThk:        stair.panPlThk      || '',
    gratingType:     stair.gratingType   || '',
    stairWidth:      stair.stairWidth    || { value: '', unit: 'FT' },
    run:             stair.run           || { value: '', unit: 'IN' },
    rise:            stair.rise          || { value: '', unit: 'IN' },
    totalHeight:     stair.totalHeight   || { value: '', unit: 'IN' },
    numRisers:       stair.numRisers     || '',
    slope:           stair.slope         || '',
    angle:           stair.angle         || '',
    stringerType:    stair.stringerType  || 'Rolled', 
    stringerSize:    stair.stringerSize  || '',
    steelGrade:      stair.steelGrade    || 'A36',
    plateThk:        stair.plateThk      || '',
    plateWidth:      stair.plateWidth    || '',
    nsStringerBot:   stair.nsStringerBot || { value: '', unit: 'FT' },
    nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
    fsStringerBot:   stair.fsStringerBot || { value: '', unit: 'FT' },
    fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
    nsStringerTop:   stair.nsStringerTop || { value: '', unit: 'FT' },
    nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
    fsStringerTop:   stair.fsStringerTop || { value: '', unit: 'FT' },
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

  const isStringerPreferred = (size) => {
    const stringerLF = parseFloat(form.systemCalc?.stringerLF) || 0;
    const slopeFt = stringerLF / 2;
    if (slopeFt > 12) {
      return size.includes('12') || size.includes('14') || size.includes('15');
    }
    return false;
  };

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onChange(updated);
  };

  return (
    <div onPointerDown={onFocus}>
      {/* ── Identification ─────────────────────────────────────────── */}
      {/* ── Identification & Configuration ─────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Identification</div>
        <div className="form-grid form-grid-4">
          {/* Identity removed because it is already shown in the section header */}
          <div className="form-field">
            <label className="form-label">Stair Category</label>
              <div className="radio-group" style={{ display: 'flex', gap: '12px' }}>
                {['Commercial', 'Industrial'].map(cat => (
                  <label key={cat}
                       className={`radio-option ${form.stairCategory === cat ? 'selected' : ''}`}
                       style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '8px', 
                         cursor: 'pointer', 
                         flex: 1,
                         padding: '10px',
                         borderRadius: '8px',
                         border: '1.5px solid #E2E8F0',
                         borderColor: form.stairCategory === cat ? '#3B82F6' : '#E2E8F0',
                         background: form.stairCategory === cat ? '#EFF6FF' : '#FFFFFF',
                         fontSize: '13px',
                         fontWeight: 700,
                         transition: 'all 0.2s',
                         color: form.stairCategory === cat ? '#1D4ED8' : '#64748B'
                       }}
                  >
                    <input
                      type="radio"
                      name={`stairCategory-${stair?.id || 'default'}`}
                      value={cat}
                      checked={form.stairCategory === cat}
                      onChange={() => set('stairCategory', cat)}
                      style={{ accentColor: '#2563EB' }}
                    />
                    {cat} Stair
                  </label>
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

          {/* ── Pan / Tread Configuration ─────────────────────────────────── */}
          <div className="form-grid form-grid-3" style={{ marginTop: '16px', padding: '16px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div className="form-field">
              <label className="form-label">Pan Type <span className="data-badge dt-string"></span></label>
              <select className="form-select" value={form.panType || 'pan-concrete'} onChange={e => set('panType', e.target.value)}>
                <option value="pan-concrete">Pan Plate (Concrete Filled)</option>
                <option value="grating-tread">Grating Tread</option>
                <option value="checker-plate">Checker Plate</option>
                <option value="bar-grating">Bar Grating</option>
                <option value="other">Other</option>
              </select>
            </div>

            <UnitInput 
              id="pan-thk" 
              label="Pan Pl. Thk" 
              value={form.panPlThk || { value: '', unit: 'IN' }} 
              onChange={v => set('panPlThk', v)} 
              dtTag="DIM" 
              dtClass="dt-float" 
            />

            {(form.panType === 'grating-tread') && (
              <div className="form-field fade-in">
                <label className="form-label">
                  Grating Type <span className="data-badge dt-string"></span>
                  {isAdmin && (
                    <button 
                      onClick={(e) => openManage('grating_type', 'Grating Types', e)} 
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
          </div>
        </div>

      {/* ── Geometry ───────────────────────────────────────────────── */}
      <div className={`form-section ${form.stairType === 'non-metal' ? 'section-faded' : ''}`}>
        <div className="form-section-title">Stair Geometry</div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          <UnitInput id="stair-width" label="Stair Width" value={form.stairWidth} onChange={v => set('stairWidth', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-run"   label="Run"         value={form.run} onChange={v => set('run', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-rise"  label="Rise"        value={form.rise} onChange={v => set('rise', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-height" label="Total Height" value={form.totalHeight} onChange={v => set('totalHeight', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          
          <div className="form-field logic-connector">
            <label className="form-label">Risers</label>
            <input className="form-input auto-calculation" type="number" value={form.systemCalc?.risers || ''} readOnly placeholder="Auto" />
          </div>

          <div className="form-field">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Slope (deg)</span>

            </label>
            <div className="relative flex items-center">
               <div className={`form-input-with-unit w-full ${form.systemCalc?.slope ? (form.systemCalc.isCompliant ? 'field-auto' : 'warning-glow') : ''}`}
                    style={{ 
                      borderColor: form.systemCalc?.slope ? (form.systemCalc.isCompliant ? 'var(--accent-blue)' : '#F59E0B') : 'var(--input-border)',
                      background: form.systemCalc?.slope && form.systemCalc.isCompliant ? 'var(--color-secondary-50)' : '#FFFFFF'
                    }}
               >
                  <input 
                    id="stair-slope-deg" 
                    className="auto-calculation field-auto" 
                    type="number" 
                    step="0.01" 
                    value={form.systemCalc?.slope || ''} 
                    readOnly 
                    placeholder="Auto" 
                    style={{ color: form.systemCalc?.slope ? (form.systemCalc.isCompliant ? 'var(--color-secondary-800)' : '#F59E0B') : 'inherit' }}
                  />
                  <span className="form-input-unit">deg</span>
               </div>
               {form.systemCalc?.slope && (
                 <div className="absolute right-12 flex items-center">
                   {form.systemCalc.isCompliant ? (
                     <Check size={16} className="text-[#10B981]" />
                   ) : (
                     <AlertTriangle size={16} className="text-[#F59E0B]" />
                   )}
                 </div>
               )}
            </div>
          </div>

          <div className="form-field flex flex-col items-center justify-center p-2 border border-slate-200 rounded-lg bg-slate-50">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Geometry Profile</div>
            {form.angle ? (
              <svg width="60" height="40" viewBox="0 0 60 40" style={{ transition: 'all 0.5s ease' }}>
                <path 
                  d={`M 5 35 L 55 35 L 5 10 Z`} 
                  fill="rgba(14, 165, 233, 0.1)" 
                  stroke="var(--accent-blue)" 
                  strokeWidth="2" 
                  strokeLinejoin="round"
                  style={{ transformOrigin: '5px 35px', transform: `rotate(${- (Number(form.systemCalc?.angle || 32) - 32)}deg)` }}
                />
                <text x="30" y="30" fontSize="6" fill="#64748B" textAnchor="middle">{Number(form.systemCalc?.angle || 0).toFixed(1)}°</text>
              </svg>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center text-slate-300">?</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stringers ──────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Stringer Configuration</div>
        <div className="form-grid form-grid-5" style={{ marginBottom: '16px' }}>
          <div className="form-field">
            <label className="form-label">Stringer Profile Type</label>
            <div className="radio-group" style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'Rolled', label: 'Rolled shapes' },
                { value: 'Plate', label: 'Plate Profile' }
              ].map(opt => (
              <label 
                key={opt.value}
                className={`radio-option ${form.stringerType === opt.value ? 'selected' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  borderColor: form.stringerType === opt.value ? '#3B82F6' : '#E2E8F0',
                  background: form.stringerType === opt.value ? '#F0F9FF' : '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  color: form.stringerType === opt.value ? '#0369A1' : '#64748B'
                }}
              >
                <input
                  type="radio"
                  name={`stringerType-${stair?.id || 'default'}`}
                  value={opt.value}
                  checked={form.stringerType === opt.value}
                  onChange={() => set('stringerType', opt.value)}
                  style={{ accentColor: '#0EA5E9' }}
                />
                {opt.label}
              </label>
              ))}
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
                {form.hasDeflectionWarning && (
                  <span style={{ color: '#F59E0B', fontSize: '9px', fontWeight: 900, marginLeft: 8, textShadow: '0 0 5px rgba(245, 158, 11, 0.3)' }}>
                    ⚠️ Warning: Deflection Potential (Consider W10+)
                  </span>
                )}
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
              <select className="form-select" id="stringer-size" value={form.stringerSize} onChange={e => set('stringerSize', e.target.value)}>
                <option value="">— Select from Profile Data Base —</option>
                {dropdowns.stringerSizes.map(s => {
                  const preferred = isStringerPreferred(s);
                  return (
                    <option key={s} value={s} style={{ fontWeight: preferred ? 800 : 400, color: preferred ? 'var(--accent-blue)' : 'inherit' }}>
                      {s} {preferred ? '★ (REC)' : ''}
                    </option>
                  );
                })}
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
          <ConnBlock label="N/S Conn @Bot" propName="nsStringerConnBot" value={form.nsStringerConnBot} options={dropdowns.connections} onChange={v => set('nsStringerConnBot', v)} />
          
          <UnitInput id="fs-bot" label="F/S Extent @Bot" value={form.fsStringerBot} onChange={v => set('fsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="F/S Conn @Bot" propName="fsStringerConnBot" value={form.fsStringerConnBot} options={dropdowns.connections} onChange={v => set('fsStringerConnBot', v)} />
          
          <UnitInput id="ns-top" label="N/S Extent @Top"  value={form.nsStringerTop} onChange={v => set('nsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="N/S Conn @Top" propName="nsStringerConnTop" value={form.nsStringerConnTop} options={dropdowns.connections} onChange={v => set('nsStringerConnTop', v)} />
          
          <UnitInput id="fs-top" label="F/S Extent @Top"  value={form.fsStringerTop} onChange={v => set('fsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <ConnBlock label="F/S Conn @Top" propName="fsStringerConnTop" value={form.fsStringerConnTop} options={dropdowns.connections} onChange={v => set('fsStringerConnTop', v)} />
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

      {/* ── Real-time Preview Engine Results (EXCEL SFE ALIGNED) ─────────────────────── */}
      {form.systemCalc && (
        <div style={{ marginTop: 24, display: 'grid', gap: '16px' }}>
          <div className="summary-card card-glow-blue" style={{ 
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            borderTop: '4px solid var(--accent-blue)'
          }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* 🛡️ SFE PER UNIT SECTION (EXCEL ALIGNED) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, paddingBottom: 16, borderBottom: '1px dashed #CBD5E1' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>STEEL LBS /<br/>LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc.steelLbsPerLF || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>SHOP MH /<br/>LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc.shopMH || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>FIELD MH /<br/>LF</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc.fieldMH || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>STEEL<br/>(+10%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C' }}>{Number(form.systemCalc.steelWithScrap || 0).toFixed(3)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, lineHeight: '1.2' }}>TOTAL STEEL<br/>lbs.</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0369A1' }}>{Number(form.systemCalc.totalSteel || 0).toFixed(3)}</div>
                </div>
              </div>

              {/* 🛡️ SFE TOTAL HOURS & COST */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Shop Total Hrs</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc.shopTotalHrs || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Field Total Hrs</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc.fieldTotalHrs || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Galvanize Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C' }}>${Number(form.systemCalc.galvanizeTotalCost || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Total Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>${Number(form.totalCost || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>

          </div>
        </div>
      )}

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
        .toggle-btn {
          font-size: 9px; padding: 2px 4px; background: #eee; border: 1px solid #ccc; cursor: pointer; border-radius: 4px; margin-left: 2px;
          transition: all 0.2s ease; font-weight: 600; color: #666;
        }
        .toggle-btn.active { background: var(--color-primary-500); color: white; border-color: var(--color-primary-600); }
        .toggle-btn:hover { background: #ddd; }
        .toggle-btn.active:hover { background: var(--color-primary-600); }
        .unit-toggle-small { display: flex; gap: 2px; }
        .arch-input {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -0.5px;
          color: var(--color-primary-900);
        }
      `}</style>
      {/* ── Real-time Preview ── */}
      {!form.systemCalc && (
        <div style={{ marginTop: 24 }}>
          <div className="summary-card card-glow-blue" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4,1fr)', 
            gap: 12,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #A78BFA'
          }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Stringer LF</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc?.stringerLF || 0).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.7 }}>ft</span></div>
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Steel</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc?.totalWeight || 0).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.7 }}>lb</span></div>
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Pans Total Steel</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Number(form.systemCalc?.pansTotalSteelLbs || 0).toFixed(1)} <span style={{ fontSize: '10px', opacity: 0.7 }}>lb</span></div>
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Labor Hrs</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{(Number(form.systemCalc?.shopHours || 0) + Number(form.systemCalc?.fieldHours || 0)).toFixed(1)} <span style={{ fontSize: '10px', opacity: 0.7 }}>hrs</span></div>
            </div>
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>

          </div>
        </div>
      )}
    </div>
  );
}
