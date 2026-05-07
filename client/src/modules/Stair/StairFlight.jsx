import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Check, AlertTriangle } from 'lucide-react';
import SearchableSelect from '../../components/common/SearchableSelect';
import EstimationPreviewCard from '../../components/common/EstimationPreviewCard';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import QuickManageModal from '../../components/common/QuickManageModal';
import { calculateStairGeometry, debounce } from '../../services/estimationService';
import { normalizeToInches, normalizeToFeet, parseArchitecturalInput, parseToFeet } from '../../utils/mathUtils';
import toast from 'react-hot-toast';

// Fallback hardcoded lists (used while loading or if API fails)
const DEFAULT_STAIR_TYPES = [
  { value: 'pan-concrete', label: 'PAN PLATE CONC. FILLED' },
  { value: 'grating-tread', label: 'GRATING TREAD' },
  { value: 'non-metal', label: 'NON METAL STAIR' },
];

const DEFAULT_STRINGER_SIZES = [
  'MC12x10.6',
  'MC12x14.3',
  'C12x20.7',
  'C15x33.9',
  'MC10x8.4',
  'MC8x8.5',
  'W8x31',
  'W10x33',
  'W12x35',
  'W12x40',
  'W12x50',
  'W14x43',
  'HSS12x2x3/16',
  'HSS12x2x1/4'
];
const DEFAULT_CONNECTION_TYPES = ['Welded', 'Bolted'];
const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

const DEFAULT_GRATING_TYPES = [
  '1 1/4" Bar grating/Welded',
  '1 1/4" Bar grating/Bolted',
  '1" Bar grating/Welded',
  '1" Bar grating/Bolted',
  'McNichols treads',
  'Other Pre-fabricated Treads'
];

// ── Internal Helpers (Defined outside to prevent Focus Loss) ─────────

const UnitInput = ({ id, value, label, onChange, placeholder, hint, dtTag, dtClass, isInputOnly = false }) => {
  // 🛡️ SAFETY CHECK: Ensure value is always an object to prevent destructuring crash
  const { value: val, unit } = value || { value: '', unit: 'FT' };

  return (
    <div className="form-field">
      <label className="form-label">
        {label} 
        {dtTag && <span className={`data-badge ${dtClass}`}></span>}
        {isInputOnly && (
          <span style={{ 
            display: 'inline-block', 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: '#f59e0b', 
            marginLeft: '8px' 
          }} title="Reference input - Not yet included in computation"></span>
        )}
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
            className={`radio-option ${isSelected ? 'selected active-radio-highlight' : ''}`}
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

export default function StairConfig({ stair = {}, onChange = () => { }, isFlightMode = false, onFocus = () => { } }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superadmin';

  const [dropdowns, setDropdowns] = useState({
    stairTypes: DEFAULT_STAIR_TYPES,
    gratingTypes: DEFAULT_GRATING_TYPES,
    stringerSizes: DEFAULT_STRINGER_SIZES,
    finishes: DEFAULT_FINISH_OPTIONS,
    connections: DEFAULT_CONNECTION_TYPES,
    mountingTypes: [
      { value: 'anchored', label: 'Anchored' },
      { value: 'embedded', label: 'Embedded' }
    ],
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  // Fetch dynamic lists from Admin Dictionary
  const loadAll = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const token = localStorage.getItem('steel_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${category}`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [st, gt, ss, fo, ct, sg, mt] = await Promise.all([
      fetchList('stair_type'),
      fetchList('grating_type'),
      fetchList('stringer_size'),
      fetchList('finish_option'),
      fetchList('connection_type'),
      fetchList('steel_grade_stair'),
      fetchList('mounting_type')
    ]);

    setDropdowns({
      stairTypes: st.length > 0 ? st : DEFAULT_STAIR_TYPES,
      gratingTypes: gt.length > 0 ? gt.map(i => i.label || i.value) : DEFAULT_GRATING_TYPES,
      stringerSizes: ss.length > 0 ? ss.map(i => i.label || i.value) : DEFAULT_STRINGER_SIZES,
      stringerSizesData: ss,
      finishes: fo.length > 0 ? fo.map(i => i.label || i.value) : DEFAULT_FINISH_OPTIONS,
      connections: ct.length > 0 ? ct.map(i => i.label || i.value) : DEFAULT_CONNECTION_TYPES,
      mountingTypes: mt.length > 0 ? mt : [
        { value: 'anchored', label: 'Anchored' },
        { value: 'embedded', label: 'Embedded' }
      ],
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
    ...stair,
    stairNumber: stair.stairNumber || '',
    stairCategory: stair.stairCategory || 'Commercial',
    stairType: (stair.stairType && stair.stairType !== '') ? stair.stairType : 'pan-concrete',
    panPlThk: (stair.panPlThk && stair.panPlThk.value) ? stair.panPlThk : { value: '12ga', unit: 'IN' },
    gratingType: stair.gratingType || '',
    stairWidth: (stair.stairWidth && typeof stair.stairWidth === 'object') ? stair.stairWidth : { value: stair.stairWidth || '', unit: 'FT' },
    run: stair.run || { value: '', unit: 'IN' },
    rise: stair.rise || { value: '', unit: 'IN' },
    totalHeight: (stair.totalHeight && typeof stair.totalHeight === 'object') ? stair.totalHeight : { value: stair.totalHeight || '', unit: 'FT' },
    numRisers: stair.numRisers || '',
    slope: stair.slope || '',
    angle: stair.angle || '',
    stringerType: stair.stringerType || 'Rolled',
    stringerSize: stair.stringerSize || '',
    steelGrade: stair.steelGrade || 'A36',
    plateThk: stair.plateThk || '',
    plateWidth: stair.plateWidth || '',
    nsStringerBot: (stair.nsStringerBot && typeof stair.nsStringerBot === 'object') ? stair.nsStringerBot : { value: stair.nsStringerBot || '', unit: 'FT' },
    nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
    fsStringerBot: (stair.fsStringerBot && typeof stair.fsStringerBot === 'object') ? stair.fsStringerBot : { value: stair.fsStringerBot || '', unit: 'FT' },
    fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
    nsStringerTop: (stair.nsStringerTop && typeof stair.nsStringerTop === 'object') ? stair.nsStringerTop : { value: stair.nsStringerTop || '', unit: 'FT' },
    nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
    fsStringerTop: (stair.fsStringerTop && typeof stair.fsStringerTop === 'object') ? stair.fsStringerTop : { value: stair.fsStringerTop || '', unit: 'FT' },
    fsStringerConnTop: stair.fsStringerConnTop || 'Welded',
    stringerLength: (stair.stringerLength && typeof stair.stringerLength === 'object') ? stair.stringerLength : { value: stair.stringerLength || '', unit: 'FT' },
    finish: stair.finish || 'Primer',
    mountingType: stair.mountingType || '',
    selectionSource: (stair.selectionSource) || (stair.stringerSize && stair.stringerSize !== '' ? 'manual' : 'auto')
  });

  // Sync state if stair data changes from outside (duplication/undo)
  useEffect(() => {
    if (stair) {
      setForm(f => {
        // 🛡️ DEEP MERGE PROTECTION: Do not overwrite valid {value, unit} objects with undefined
        const safeMerge = (key, defaultUnit) => {
          if (stair[key] && typeof stair[key] === 'object' && 'value' in stair[key]) return stair[key];
          return f[key] || { value: '', unit: defaultUnit };
        };

        // 🛡️ DEFAULT VALUE PROTECTION: Ensure critical fields don't revert to undefined when synced
        const withDefault = (key, fallback) => {
          // Allow empty string to represent a cleared selection
          if (stair[key] !== undefined && stair[key] !== null && stair[key] !== '') return stair[key];
          if (f[key] !== undefined && f[key] !== null) return f[key];
          return fallback;
        };

        return {
          ...f,
          ...stair,
          stairWidth: safeMerge('stairWidth', 'FT'),
          run: safeMerge('run', 'IN'),
          rise: safeMerge('rise', 'IN'),
          totalHeight: safeMerge('totalHeight', 'FT'),
          nsStringerBot: safeMerge('nsStringerBot', 'FT'),
          fsStringerBot: safeMerge('fsStringerBot', 'FT'),
          nsStringerTop: safeMerge('nsStringerTop', 'FT'),
          fsStringerTop: safeMerge('fsStringerTop', 'FT'),
          stringerLength: safeMerge('stringerLength', 'FT'),
          panPlThk: safeMerge('panPlThk', 'IN'),
          // Fix for "not preselected" issue: ensure these fields have values
          stairCategory: withDefault('stairCategory', 'Commercial'),
          stairType: (stair.stairType && stair.stairType !== '') ? stair.stairType : (f.stairType || 'pan-concrete'),
          stringerType: withDefault('stringerType', 'Rolled'),
          steelGrade: withDefault('steelGrade', 'A36'),
          finish: withDefault('finish', 'Primer')
        };
      });
    }
  }, [stair]);

  const [gratingSelectionSource, setGratingSelectionSource] = useState(null);

  // --- Grating Filtering & Auto-Suggest ---
  const extractGratingWidth = useCallback((description) => {
    if (!description) return null;
    // Match patterns like 4'-0", 4'-6", 4', or 4-1/2'
    const matches = description.match(/(\d+'(?:-?\d*(?:\/\d+)?")?)/g);
    // The stair width is typically the last measurement in the string
    return matches ? matches[matches.length - 1] : null;
  }, []);

  const standardizeWidth = useCallback((stairWidthFt) => {
    if (!stairWidthFt) return null;
    const stairWidthInches = Math.round(stairWidthFt * 12);
    const feet = Math.floor(stairWidthInches / 12);
    const inches = stairWidthInches % 12;
    if (inches === 0) {
      return `${feet}'-0"`;
    } else {
      return `${feet}'-${inches}"`;
    }
  }, []);

  const stairWidthFt = parseToFeet(form.stairWidth);
  const stairWidthStandard = standardizeWidth(stairWidthFt);

  const allGratingOptions = dropdowns.gratingTypes.map(grating => {
    const gWidth = extractGratingWidth(grating);
    const isWidthMatch = gWidth && stairWidthStandard && (gWidth === stairWidthStandard || gWidth === stairWidthStandard.replace("'-0\"", "'"));
    
    // Also check for stringer profile match for higher specificity
    const profileMatch = form.stringerSize ? (grating.includes(form.stringerSize) || grating.includes('Standard') || grating.includes('Ohio')) : true;
    
    return { 
      value: grating, 
      label: grating, 
      isRecommended: isWidthMatch && profileMatch 
    };
  });

  const recommendedGratings = allGratingOptions.filter(o => o.isRecommended).map(o => o.value);

  useEffect(() => {
    const isGrating = ['grating-tread', '77'].includes(form.stairType) || form.stairType.toLowerCase().includes('grating');
    if (!isGrating || !stairWidthStandard) return;

    // We no longer auto-apply the grating type here to allow users to see the recommendation banner 
    // and make an explicit choice, preventing automatic calculation before a selection is made.
    // The 'Apply Recommendation' banner will handle the one-click selection if desired.
  }, [stairWidthStandard, form.stringerSize, form.stairType, recommendedGratings, form.gratingType]);


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
  const risersCount = parseFloat(form.systemCalc?.risers) || parseFloat(form.numRisers) || 0;
  const runVal = parseFloat(form.run?.value) || 0;
  const runIn = form.run?.unit === 'FT' ? runVal * 12 : runVal;
  // 📏 SPAN CALCULATION FIX: Total Horizontal Run = (Risers - 1) * Run per step
  const totalRunFt = risersCount > 0 ? ((risersCount - 1) * runIn) / 12 : 0;

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
    const label = (opt.label || opt.value || '').toLowerCase();
    const isGrating = ['grating-tread', '77'].includes(form.stairType) || form.stairType?.toLowerCase().includes('grating');
    
    // 🛡️ CRITICAL: Type Mismatch Penalty (Prevents Pan stringers on Grating stairs and vice-versa)
    const labelIsGrating = label.includes('grating');
    const labelIsPan = label.includes('pan');
    if (isGrating && labelIsPan) score -= 100;
    if (!isGrating && labelIsGrating) score -= 100;

    // Primary matches: Width and Span (Horizontal Run)
    if (opt.widthMax !== null && opt.widthMax === widthBucket) score += 20;
    if (opt.spanMin !== null && opt.spanMax !== null && totalRunFt >= opt.spanMin && totalRunFt < opt.spanMax) score += 20;

    // Secondary match: Specific keyword boost
    if (isGrating && labelIsGrating) score += 10;
    if (!isGrating && labelIsPan) score += 10;

    return { ...opt, score };
  });

  // Find best match (highest score)
  let bestMatch = null;
  const hasGeometry = stairWidthFt > 0 && risersCount > 0;
  if (hasGeometry && scoredStringers.length > 0) {
    const maxScore = Math.max(...scoredStringers.map(s => s.score));
    if (maxScore >= 20) { // Must at least match Width and Span buckets
      const topMatches = scoredStringers.filter(s => s.score === maxScore);
      bestMatch = topMatches.reduce((prev, curr) => {
        // If multiple top matches, pick the one with spanMin closest to totalRunFt
        const prevDiff = Math.abs(prev.spanMin - totalRunFt);
        const currDiff = Math.abs(curr.spanMin - totalRunFt);
        return currDiff < prevDiff ? curr : prev;
      });
    }
  }

  const recommendedStringerStr = bestMatch ? (bestMatch.label || bestMatch.value) : null;

  // 🛠️ AUTO-SUGGEST FIX: Automatically apply recommendation ONLY if selectionSource is 'auto'
  useEffect(() => {
    if (!recommendedStringerStr) return;

    // CASE A: User has NOT manually overridden. Silently update to match new geometry.
    if (form.selectionSource === 'auto' && form.stringerSize !== recommendedStringerStr) {
      console.log("🛠️ Auto-applying recommended stringer:", recommendedStringerStr);
      setForm(f => ({ ...f, stringerSize: recommendedStringerStr }));
      // We don't call onChange here to avoid infinite loops, 
      // but the next render/user action will pick it up.
      // Actually, it's better to call it to sync with parent.
      onChange({ ...form, stringerSize: recommendedStringerStr });
    }
  }, [recommendedStringerStr, form.selectionSource, form.gratingType]); // Added form.gratingType to trigger on grating changes

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
  } else if (totalRunFt > 0) {
    stringerWarning = `No exact match — select manually or add a custom type in Manage Stringer Sizes`;
    stringerWarningType = 'warning';
  }

  // --- Grating Warning Logic ---
  const recommendedGrating = recommendedGratings.length > 0 ? recommendedGratings[0] : null;
  let gratingWarning = null;
  let gratingWarningType = 'info';

  if (isGratingStair) {
    if (recommendedGrating) {
      if (!form.gratingType || !recommendedGratings.includes(form.gratingType)) {
        gratingWarning = `Selected grating may not match stair width (${stairWidthStandard}).\nSuggested: ${recommendedGrating}`;
        gratingWarningType = 'warning';
      } else {
        gratingWarning = `Correct width for ${stairWidthStandard} stair`;
        gratingWarningType = 'success';
      }
    } else if (stairWidthFt > 0 && !form.gratingType) {
      gratingWarning = `No standard grating found for ${stairWidthStandard} width. Select manually.`;
      gratingWarningType = 'warning';
    }
  }

  return (
    <div onPointerDown={onFocus}>
      {/* ── Identification ─────────────────────────────────────────── */}
      <div className="subtle-group">
        <div className="group-header">Identification</div>
        <div className="form-grid form-grid-4">
          <div className="form-field">
            <label className="form-label">Stair Category</label>
            <div className="radio-group" style={{ display: 'flex', gap: '12px' }}>
              {['Commercial', 'Industrial'].map(cat => (
                <label key={cat}
                  className={`radio-option ${form.stairCategory === cat ? 'selected active-radio-highlight' : ''}`}
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
              value={form.panPlThk}
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

              {gratingWarning && (
                <div className="fade-in" style={{
                  marginBottom: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: gratingWarningType === 'success' ? '#ECFDF5' : '#FFFBEB',
                  color: gratingWarningType === 'success' ? '#059669' : '#D97706',
                  border: `1px solid ${gratingWarningType === 'success' ? '#A7F3D0' : '#FDE68A'}`
                }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{gratingWarning}</div>
                  {gratingWarningType === 'warning' && recommendedGrating && form.gratingType !== recommendedGrating && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const updated = { ...form, gratingType: recommendedGrating };
                        setForm(updated);
                        onChange(updated);
                        setGratingSelectionSource('auto');
                        toast.success(`Applied ${recommendedGrating}`);
                      }}
                      style={{
                        background: '#3B82F6', color: 'white', border: 'none',
                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}
                    >
                      Apply Recommendation
                    </button>
                  )}
                </div>
              )}

              <SearchableSelect
                options={allGratingOptions}
                valueKey="value"
                displayKey="label"
                value={form.gratingType}
                onSelect={opt => {
                  set('gratingType', opt?.value || '');
                  setGratingSelectionSource('manual');
                }}
                placeholder="— Select Grating Type —"
              />
              {gratingSelectionSource === 'auto' && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '6px', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={12} /> Auto-suggested based on stair width
                </div>
              )}
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
        </div>
      </div>

      {/* ── Geometry ───────────────────────────────────────────────── */}
      <div className={`subtle-group ${isNonMetalStair ? 'section-faded' : ''}`}>
        <div className="group-header">Stair Geometry</div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          <UnitInput id="stair-width" label="Stair Width" value={form.stairWidth} onChange={v => set('stairWidth', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-run" label="Run" value={form.run} onChange={v => set('run', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          <UnitInput id="stair-rise" label="Rise" value={form.rise} onChange={v => set('rise', v)} dtTag="FT-IN" dtClass="dt-ft-in" />
          
          <div className="form-field">
            <label className="form-label">Risers</label>
            <input className="form-input" type="number" value={form.numRisers || ''} onChange={e => set('numRisers', e.target.value)} placeholder="0" />
          </div>

          {/* ── Total Stringer Length: Auto-Calc Display ───────── */}
          {(() => {
            const autoLengthFt = form.systemCalc?.stringerLengthFt;
            const isAutoCalc = form.systemCalc?.stringerLengthCalculated;
            const calcMethod = form.systemCalc?.stringerCalculationMethod;
            const manualVal = form.stringerLength?.value;
            const hasManual = manualVal && parseFloat(manualVal) > 0;

            if (isAutoCalc && !hasManual) {
              // ── AUTO MODE ──
              return (
                <div className="form-field">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Total Stringer Length</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'var(--accent-blue, #3B82F6)', color: '#fff',
                      fontSize: '9px', fontWeight: 800, padding: '2px 6px',
                      borderRadius: '4px', letterSpacing: '0.05em'
                    }}>AUTO</span>
                    <button
                      type="button"
                      onClick={() => set('stringerLength', { value: autoLengthFt ? autoLengthFt.toFixed(2) : '', unit: 'FT' })}
                      title="Switch to manual entry"
                      style={{
                        marginLeft: 'auto', 
                        background: '#F1F5F9', 
                        border: '1.5px solid #CBD5E1', 
                        color: '#64748B', 
                        fontSize: '10px', 
                        fontWeight: 700,
                        cursor: 'pointer', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                    >
                      Override
                    </button>
                  </label>
                  <div className="form-input-with-unit field-auto" style={{
                    borderColor: 'var(--accent-blue, #3B82F6)',
                    background: 'var(--color-secondary-50, #EFF6FF)'
                  }}>
                    <input
                      id="total-stringer-length"
                      className="auto-calculation field-auto"
                      type="text"
                      value={autoLengthFt ? autoLengthFt.toFixed(2) : ''}
                      readOnly
                      placeholder="Auto"
                      style={{ color: 'var(--color-secondary-800, #1E40AF)' }}
                      title={calcMethod === 'pythagorean-fallback'
                        ? 'Auto-calculated via Pythagorean theorem from Rise / Run / Risers'
                        : 'Auto-calculated from stair geometry'}
                    />
                    <span className="form-input-unit" style={{ color: 'var(--accent-blue, #3B82F6)', fontWeight: 700 }}>ST</span>
                  </div>
                </div>
              );
            } else {
              // ── MANUAL MODE ──
              return (
                <div className="form-field">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Total Stringer Length</span>
                    {hasManual && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: '#F59E0B', color: '#fff',
                        fontSize: '9px', fontWeight: 800, padding: '2px 6px',
                        borderRadius: '4px', letterSpacing: '0.05em'
                      }}>MANUAL</span>
                    )}
                    {isAutoCalc && (
                      <button
                        type="button"
                        onClick={() => set('stringerLength', { value: '', unit: 'FT' })}
                        title="Revert to auto-calculated value"
                        style={{
                          marginLeft: 'auto', 
                          background: 'var(--accent-blue, #3B82F6)', 
                          border: 'none',
                          color: '#fff', 
                          fontSize: '10px', 
                          fontWeight: 700,
                          cursor: 'pointer', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-blue, #3B82F6)'}
                      >
                        Use Auto
                      </button>
                    )}
                  </label>
                  <div className="form-input-with-unit">
                    <input
                      id="total-stringer-length"
                      type="text"
                      className="arch-input"
                      value={form.stringerLength?.value ?? ''}
                      onChange={e => set('stringerLength', { value: e.target.value, unit: form.stringerLength?.unit || 'FT' })}
                      onFocus={e => e.target.select()}
                      placeholder={autoLengthFt ? `Auto: ${autoLengthFt.toFixed(2)}` : '0'}
                    />
                    <button
                      type="button"
                      className="form-input-unit unit-active"
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => set('stringerLength', { value: form.stringerLength?.value ?? '', unit: (form.stringerLength?.unit || 'FT') === 'FT' ? 'IN' : 'FT' })}
                    >
                      {form.stringerLength?.unit || 'FT'}
                    </button>
                  </div>
                  {autoLengthFt && (
                    <span className="form-hint" style={{ marginTop: '4px', display: 'block', fontSize: '10px' }}>
                      Auto-calc: {autoLengthFt.toFixed(2)} ft — clear to restore
                    </span>
                  )}
                </div>
              );
            }
          })()}


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


        </div>
      </div>

      {/* ── Stringers ──────────────────────────────────────────────── */}
      <div className={`subtle-group ${isNonMetalStair ? 'section-faded' : ''}`}>
        <div className="group-header">Stringer Configuration</div>
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
                  className={`radio-option ${form.stringerType === opt.value ? 'selected active-radio-highlight' : ''}`}
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
                  {stringerWarningType === 'warning' && bestMatch && form.stringerSize !== recommendedStringerStr && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const updated = { ...form, stringerSize: recommendedStringerStr, selectionSource: 'auto' };
                        setForm(updated);
                        onChange(updated);
                        toast.success(`Applied ${recommendedStringerStr}`);
                      }}
                      style={{
                        background: '#3B82F6', color: 'white', border: 'none',
                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}
                    >
                      Apply Recommendation
                    </button>
                  )}
                </div>
              )}

              <SearchableSelect
                options={dropdowns.stringerSizes.map(lbl => {
                  const isRec = lbl === recommendedStringerStr;
                  return {
                    value: lbl,
                    label: lbl,
                    isRecommended: isRec
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
          
          {/* New Grating & Stringer Detailed Breakdown */}
          {form.systemCalc.separatedCosts && (
            <div style={{ marginBottom: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', fontFamily: "'Geist Mono', 'SF Mono', monospace", fontSize: '11px', color: '#334155' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px', letterSpacing: '0.05em' }}>STRINGERS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{form.systemCalc.separatedCosts.stringer.type} (2 stringers)</span>
                <span>{Number(form.systemCalc.separatedCosts.stringer.weight).toFixed(1)} lbs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Stringer Base Cost:</span>
                <span>${Number(form.systemCalc.separatedCosts.stringer.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              {form.systemCalc.separatedCosts.grating && (
                <>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.05em' }}>GRATING TREADS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.systemCalc.separatedCosts.grating.type}</span>
                    <span>{Number(form.systemCalc.separatedCosts.grating.weight).toFixed(1)} lbs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Quantity: {form.systemCalc.separatedCosts.grating.quantity} treads</span>
                    <span>Cost: ${Number(form.systemCalc.separatedCosts.grating.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </>
              )}

              {form.systemCalc.separatedCosts.panPlate && (
                <>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.05em' }}>PAN PLATE TREADS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.systemCalc.separatedCosts.panPlate.area} sq.ft @ {form.systemCalc.panPlatePsf || 5} psf</span>
                    <span>{Number(form.systemCalc.separatedCosts.panPlate.weight).toFixed(1)} lbs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Quantity: {form.systemCalc.separatedCosts.panPlate.quantity} treads</span>
                    <span>Cost: ${(Number(form.systemCalc.separatedCosts.panPlate.weight) * Number(form.systemCalc.steelPricePerLb || 0.75)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (included in steel)</span>
                  </div>
                </>
              )}

              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.05em' }}>HARDWARE & SCRAP</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Connections / Hardware Weight:</span>
                <span>{(form.systemCalc.separatedCosts.total.weight - form.systemCalc.separatedCosts.stringer.weight - (form.systemCalc.separatedCosts.grating?.weight || 0) - (form.systemCalc.separatedCosts.panPlate?.weight || 0)).toFixed(1)} lbs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Connections / Bolts Cost:</span>
                <span>${(Number(form.systemCalc.anchorBoltsCost || 0) + Number(form.systemCalc.porRokCost || 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Scrap Allowance ({form.systemCalc.scrapFactorPct}%):</span>
                <span>${Number(form.systemCalc.scrapPriceOnly).toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px dashed #CBD5E1', margin: '8px 0' }}></div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px', letterSpacing: '0.05em' }}>TOTAL SUMMARY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Total Net Weight:</span>
                <span>{Number(form.systemCalc.separatedCosts.total.weight).toFixed(1)} lbs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Gross Weight (incl. Scrap):</span>
                <span>{(Number(form.systemCalc.separatedCosts.total.weight) + Number(form.systemCalc.separatedCosts.total.scrapWeight)).toFixed(1)} lbs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Material Sub-Total:</span>
                <span style={{ color: '#1D9E75', fontWeight: 700 }}>${Number(form.systemCalc.separatedCosts.total.materialCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          )}

          <EstimationPreviewCard
            systemCalc={form.systemCalc}
            totalCost={form.totalCost}
            stairType={form.stairType}
            finishName={form.finish}
            hidePorRok={true}
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

