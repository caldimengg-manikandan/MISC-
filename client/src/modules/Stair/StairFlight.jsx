import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Check, AlertTriangle } from 'lucide-react';
import SearchableSelect from '../../components/common/SearchableSelect';
import EstimationPreviewCard from '../../components/common/EstimationPreviewCard';
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
          onFocus={e => e.target.select()}
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

const ConnBlock = ({ label, propName, value, options, onChange, style = {} }) => (
  <div className="form-field" style={{ marginTop: '0px', ...style }}>
    <label className="form-label" style={{ fontSize: '10px' }}>{label}</label>
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
      stairTypes: st.length > 0 ? st : DEFAULT_STAIR_TYPES,
      gratingTypes: gt.length > 0 ? gt.map(i => i.label || i.value) : DEFAULT_GRATING_TYPES,
      stringerSizes: ss.length > 0 ? ss.map(i => i.label || i.value) : DEFAULT_STRINGER_SIZES,
      stringerSizesData: ss,
      finishes: fo.length > 0 ? fo.map(i => i.label || i.value) : DEFAULT_FINISH_OPTIONS,
      connections: ct.length > 0 ? ct.map(i => i.label || i.value) : DEFAULT_CONNECTION_TYPES,
      steelGrades: sg.length > 0 ? sg.map(i => i.label || i.value) : ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
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
    panPlThk:        stair.panPlThk      || { value: '0', unit: 'IN' },
    gratingType:     stair.gratingType   || '',
    stairWidth:      stair.stairWidth    || { value: '', unit: 'FT' },
    run:             stair.run           || { value: '', unit: 'IN' },
    rise:            stair.rise          || { value: '', unit: 'IN' },
    totalHeight:     stair.totalHeight   || { value: '', unit: 'FT' },
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
    mountingType:    stair.mountingType   || '',
    selectionSource: stair.selectionSource || (stair.stringerSize ? 'manual' : 'auto'),

    ...stair
  });

  // Sync state if stair data changes from outside (duplication/undo)
  useEffect(() => {
    if (stair) {
      setForm(f => ({ ...f, ...stair }));
    }
  }, [stair]);

  // Remove old isStringerPreferred function

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onChange(updated);
  };

  // Helper to identify stair type regardless of slug/label from different DB versions
  const isPanStair = form.stairType?.toLowerCase().trim() === 'pan-concrete' || form.stairType?.toLowerCase().trim().includes('pan plate');
  const isGratingStair = form.stairType?.toLowerCase().trim() === 'grating-tread' || form.stairType?.toLowerCase().trim().includes('grating');
  const isNonMetalStair = form.stairType?.toLowerCase().trim() === 'non-metal' || form.stairType?.toLowerCase().trim().includes('non metal');

  // --- Smart Auto-Suggest for Rolled Stringer Size ---
  const widthVal = parseFloat(form.stairWidth?.value) || 0;
  const stairWidthFt = form.stairWidth?.unit === 'IN' ? widthVal / 12 : widthVal;
  
  const risersCount = parseFloat(form.systemCalc?.risers) || 0;
  
  const riseVal = parseFloat(form.rise?.value) || 0;
  const riseIn = form.rise?.unit === 'FT' ? riseVal * 12 : riseVal;
  
  const runVal = parseFloat(form.run?.value) || 0;
  const runIn = form.run?.unit === 'FT' ? runVal * 12 : runVal;

  const totalHeightIn = risersCount * riseIn;
  const totalRunIn = risersCount * runIn;
  const stringerLengthFt = risersCount > 0 ? (Math.sqrt(Math.pow(totalHeightIn, 2) + Math.pow(totalRunIn, 2)) / 12) : 0;

  // Resolve Buckets
  let widthBucket = null;
  if (stairWidthFt > 0) {
    if (stairWidthFt <= 4.0) widthBucket = 4;
    else if (stairWidthFt <= 5.0) widthBucket = 5;
    else if (stairWidthFt <= 6.0) widthBucket = 6;
  }

  // Score Stringers
  const stringerData = dropdowns.stringerSizesData || [];
  const scoredStringers = stringerData.map(opt => {
    let score = 0;
    if (opt.widthMax !== null && opt.widthMax === widthBucket) score += 1;
    if (opt.spanMin !== null && opt.spanMax !== null && stringerLengthFt >= opt.spanMin && stringerLengthFt < opt.spanMax) score += 1;
    return { ...opt, score };
  });

  const bestMatchList = scoredStringers.filter(s => s.score === 2);
  let bestMatch = null;
  if (bestMatchList.length > 0) {
    bestMatch = bestMatchList.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.spanMin - stringerLengthFt);
      const currDiff = Math.abs(curr.spanMin - stringerLengthFt);
      return currDiff < prevDiff ? curr : prev;
    });
  }

  const recommendedStringerStr = bestMatch ? (bestMatch.label || bestMatch.value) : null;
  
  // 🛠️ AUTO-SUGGEST FIX: Automatically apply recommendation ONLY if selectionSource is 'auto'
  useEffect(() => {
    if (!recommendedStringerStr) return;
    
    // CASE A: User has NOT manually overridden. Silently update to match new geometry.
    if (form.selectionSource === 'auto' && form.stringerSize !== recommendedStringerStr) {
      set('stringerSize', recommendedStringerStr);
    }
  }, [recommendedStringerStr, form.selectionSource, form.stringerSize]);

  let stringerWarning = null;
  let stringerWarningType = 'info';
  const selectedScore = form.stringerSize ? scoredStringers.find(s => (s.label || s.value) === form.stringerSize)?.score : null;

  if (bestMatch) {
    if (!form.stringerSize || selectedScore === 0) {
      stringerWarning = `Selected stringer type may not match your stair geometry.\nSuggested: ${recommendedStringerStr}`;
      stringerWarningType = 'warning';
    } else {
      stringerWarning = `Recommended based on your geometry`;
      stringerWarningType = 'success';
    }
  } else if (stairWidthFt > 6) {
    stringerWarning = `Width exceeds catalogue (max 6 ft). Add a custom stringer type to proceed.`;
    stringerWarningType = 'warning';
  } else if (stringerLengthFt > 0) {
    stringerWarning = `No exact match — select manually or add a custom type in Manage Stringer Sizes`;
    stringerWarningType = 'warning';
  }

  return (
    <div onPointerDown={onFocus}>
      {/* ── Identification ─────────────────────────────────────────── */}
      <div className="form-section">
        <div className="form-section-title">Identification</div>
        <div className="form-grid form-grid-5">
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
            <SearchableSelect 
              options={dropdowns.stairTypes}
              valueKey="value"
              displayKey="label"
              value={form.stairType}
              onSelect={opt => set('stairType', opt?.value || '')}
              placeholder="— Select Stair Type —"
            />
          </div>


          {/* ── Conditional Pan / Tread Inputs (Same Line) ─────────────────────────────────── */}
          {isPanStair && (
            <UnitInput 
              id="pan-thk" 
              label="Pan Pl. Thk" 
              value={form.panPlThk || { value: '0', unit: 'IN' }} 
              onChange={v => set('panPlThk', v)} 
              dtTag="DIM" 
              dtClass="dt-float" 
            />
          )}

          {isGratingStair && (
            <div className="form-field fade-in">
              <label className="form-label">
                Grating Tread Type <span className="data-badge dt-string"></span>
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
              <SearchableSelect 
                options={dropdowns.gratingTypes.map(g => ({ value: g, label: g }))}
                valueKey="value"
                displayKey="label"
                value={form.gratingType}
                onSelect={opt => set('gratingType', opt?.value || '')}
                placeholder="— Select Grating Type —"
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">
              Finish Specification
              {isAdmin && (
                <button 
                  onClick={(e) => openManage('finish_option', 'Finish Options', e)} 
                  className="quick-edit-btn" 
                  title="Manage Options"
                >
                  <Settings size={14} />
                </button>
              )}
            </label>
            <SearchableSelect 
              options={dropdowns.finishes.map(f => ({ value: f, label: f }))}
              valueKey="value"
              displayKey="label"
              value={form.finish}
              onSelect={opt => set('finish', opt?.value || '')}
              placeholder="— Select Finish —"
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Mounting Type
              {isAdmin && (
                <button onClick={(e) => openManage('mounting_type', 'Mounting Types', e)} className="quick-edit-btn" title="Manage Options">
                  <Settings size={14} />
                </button>
              )}
            </label>
            <SearchableSelect 
              options={[
                { value: 'anchored', label: 'Anchored' },
                { value: 'embedded', label: 'Embedded' }
              ]}
              valueKey="value"
              displayKey="label"
              value={form.mountingType}
              onSelect={opt => set('mountingType', opt?.value || '')}
              placeholder="— Select Mounting —"
            />
          </div>
        </div>
      </div>

      {/* ── Geometry ───────────────────────────────────────────────── */}
      <div className={`form-section ${isNonMetalStair ? 'section-faded' : ''}`}>
        <div className="form-section-title">Stair Geometry</div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px' }}>
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
              <span>Angle</span>

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

          <div className="form-field flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl bg-slate-50" style={{ gridColumn: 'span 2' }}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Computed Geometry Profile</div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {form.angle ? (() => {
                const angle = Number(form.systemCalc?.angle || form.angle || 32);
                const rad = angle * Math.PI / 180;
                // Triangle corners: right-angle at bottom-left
                const ox = 14, oy = 72;  // origin (bottom-left)
                const bx = 86, by = 72;  // bottom-right
                const tx = 14, ty = 72 - Math.round(72 * Math.tan(rad) / (1 + Math.tan(rad) * 0.6));
                // Clamped top point
                const topY = Math.max(10, 72 - Math.round((bx - ox) * Math.tan(rad)));
                const topYFinal = Math.max(8, topY);
                return (
                  <svg width="110" height="86" viewBox="0 0 110 86" style={{ transition: 'all 0.4s ease', flexShrink: 0 }}>
                    {/* Grid background - engineering paper */}
                    <defs>
                      <pattern id="eng-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="110" height="86" fill="url(#eng-grid)" rx="4"/>

                    {/* Triangle fill */}
                    <polygon
                      points={`${ox},${72} ${bx},${72} ${ox},${topYFinal}`}
                      fill="rgba(59,130,246,0.07)"
                      stroke="none"
                    />

                    {/* Stringer (hypotenuse) — bold accent */}
                    <line x1={bx} y1={72} x2={ox} y2={topYFinal}
                      stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>

                    {/* Height (vertical side) */}
                    <line x1={ox} y1={72} x2={ox} y2={topYFinal}
                      stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,2"/>

                    {/* Run (horizontal base) */}
                    <line x1={ox} y1={72} x2={bx} y2={72}
                      stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,2"/>

                    {/* Right-angle box at origin */}
                    <path d={`M ${ox} ${72 - 7} L ${ox + 7} ${72 - 7} L ${ox + 7} ${72}`}
                      fill="none" stroke="#64748B" strokeWidth="1" strokeLinecap="round"/>

                    {/* Angle arc at bottom-right corner */}
                    <path
                      d={`M ${bx - 14} ${72} A 14 14 0 0 0 ${bx - 14 * Math.cos(rad)} ${72 - 14 * Math.sin(rad)}`}
                      fill="rgba(59,130,246,0.12)" stroke="#3B82F6" strokeWidth="1" fillRule="evenodd"
                    />

                    {/* Angle label */}
                    <text
                      x={bx - 26}
                      y={72 - 4}
                      fontSize="7"
                      fontWeight="700"
                      fill="#3B82F6"
                      fontFamily="'Geist Mono', monospace"
                      textAnchor="middle"
                    >
                      {angle.toFixed(1)}°
                    </text>

                    {/* Side labels */}
                    {/* Height label (left of vertical) */}
                    <text x={ox - 3} y={(72 + topYFinal) / 2} fontSize="6" fill="#10B981" fontWeight="700"
                      fontFamily="sans-serif" textAnchor="end" dominantBaseline="middle">H</text>
                    {/* Run label (below horizontal) */}
                    <text x={(ox + bx) / 2} y={80} fontSize="6" fill="#F59E0B" fontWeight="700"
                      fontFamily="sans-serif" textAnchor="middle">R</text>
                    {/* Stringer label (along hypotenuse) */}
                    <text
                      x={(ox + bx) / 2 + 4}
                      y={(topYFinal + 72) / 2 - 6}
                      fontSize="6"
                      fill="#3B82F6"
                      fontWeight="700"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      transform={`rotate(${-angle}, ${(ox + bx) / 2 + 4}, ${(topYFinal + 72) / 2 - 6})`}
                    >S</text>
                  </svg>
                );
              })() : (
                <div className="h-10 w-14 flex items-center justify-center text-slate-300 text-xs">—</div>
              )}

              {/* Dimension values */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#10B981', flexShrink: 0 }}/>
                  <span style={{ color: 'var(--gpt-text-muted)', minWidth: '52px' }}>Height:</span>
                  <strong style={{ color: 'var(--gpt-text-primary)', fontFamily: "'Geist Mono', monospace", fontSize: '11px' }}>{(totalHeightIn / 12).toFixed(2)} ft</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B', flexShrink: 0 }}/>
                  <span style={{ color: 'var(--gpt-text-muted)', minWidth: '52px' }}>Run:</span>
                  <strong style={{ color: 'var(--gpt-text-primary)', fontFamily: "'Geist Mono', monospace", fontSize: '11px' }}>{(totalRunIn / 12).toFixed(2)} ft</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#3B82F6', flexShrink: 0 }}/>
                  <span style={{ color: 'var(--gpt-text-muted)', minWidth: '52px' }}>Stringer:</span>
                  <strong style={{ color: 'var(--gpt-text-primary)', fontFamily: "'Geist Mono', monospace", fontSize: '11px' }}>{stringerLengthFt.toFixed(2)} ft</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Extents moved from bottom stringer section to here per user request */}
          <UnitInput id="ns-top" label="N/S Extent @Top" value={form.nsStringerTop} onChange={v => set('nsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="fs-top" label="F/S Extent @Top" value={form.fsStringerTop} onChange={v => set('fsStringerTop', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="ns-bot" label="N/S Extent @Bot" value={form.nsStringerBot} onChange={v => set('nsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="fs-bot" label="F/S Extent @Bot" value={form.fsStringerBot} onChange={v => set('fsStringerBot', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          
          <div style={{ gridColumn: 'span 2' }}>
            <ConnBlock 
              label="Connection (All)" 
              propName="shared-conn" 
              value={form.nsStringerConnTop} 
              options={dropdowns.connections} 
              onChange={v => {
                const updated = { 
                  ...form, 
                  nsStringerConnTop: v, fsStringerConnTop: v,
                  nsStringerConnBot: v, fsStringerConnBot: v 
                };
                setForm(updated);
                onChange(updated);
              }} 
            />
          </div>
        </div>
      </div>

      {/* ── Stringers ──────────────────────────────────────────────── */}
      <div className={`form-section ${isNonMetalStair ? 'section-faded' : ''}`}>
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
            <SearchableSelect 
              options={dropdowns.steelGrades.map(s => ({ value: s, label: s }))}
              valueKey="value"
              displayKey="label"
              value={form.steelGrade}
              onSelect={opt => set('steelGrade', opt?.value || '')}
              placeholder="— Select Grade —"
            />
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

              {stringerWarning && (
                <div style={{ 
                  margin: '4px 0 8px 0', 
                  padding: '8px 12px', 
                  fontSize: '11px', 
                  borderRadius: '6px', 
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: stringerWarningType === 'success' ? '#ECFDF5' : '#FFFBEB',
                  color: stringerWarningType === 'success' ? '#059669' : '#D97706',
                  border: `1px solid ${stringerWarningType === 'success' ? '#A7F3D0' : '#FDE68A'}`
                }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{stringerWarning}</div>
                  {stringerWarningType === 'warning' && bestMatch && form.selectionSource === 'manual' && (
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        const updated = { ...form, stringerSize: recommendedStringerStr, selectionSource: 'auto' };
                        setForm(updated);
                        onChange(updated);
                      }}
                      style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Apply
                    </button>
                  )}
                </div>
              )}

              <SearchableSelect 
                options={dropdowns.stringerSizes.map(lbl => {
                  const spec = stringerData.find(s => (s.label || s.value) === lbl);
                  const isRec = lbl === recommendedStringerStr;
                  return { 
                    value: lbl, 
                    label: `${lbl}${isRec ? ' ★ (REC)' : ''}`,
                    isRec 
                  };
                })}
                valueKey="value"
                displayKey="label"
                value={form.stringerSize}
                onSelect={opt => {
                  const val = opt?.value || '';
                  const updated = { ...form, stringerSize: val, selectionSource: 'manual' };
                  setForm(updated);
                  onChange(updated);
                }}
                placeholder="— Select from Profile Data Base —"
              />
            </div>
          ) : (
            <>
              <div className="form-field fade-in">
                <label className="form-label">Plate Thickness <span className="data-badge dt-string"></span></label>
                <input 
                  className="form-input data-type-string" 
                  value={form.plateThk} 
                  onChange={e => set('plateThk', e.target.value)} 
                  onFocus={e => e.target.select()}
                  placeholder="e.g. 1/2" 
                />
              </div>
              <div className="form-field fade-in" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Plate Width <span className="data-badge dt-string"></span></label>
                <input 
                  className="form-input data-type-string" 
                  value={form.plateWidth} 
                  onChange={e => set('plateWidth', e.target.value)} 
                  onFocus={e => e.target.select()}
                  placeholder="e.g. 12" 
                />
              </div>
            </>
          )}
        </div>

      </div>




      {/* ── Real-time Preview Engine Results (EXCEL MISC ALIGNED) ─────────────────────── */}
      {form.systemCalc && (form.stringerType === 'Rolled' ? (form.stringerSize && form.stringerSize !== '') : (form.plateThk && form.plateWidth)) && (
        <div className={`mt-6 ${form.stairType === 'non-metal' ? 'section-faded' : ''}`}>
          <EstimationPreviewCard 
            systemCalc={form.systemCalc} 
            totalCost={form.totalCost} 
            stairType={form.stairType}
            finishName={form.finish}
          />
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

      <style>{`
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
    </div>
  );
}
