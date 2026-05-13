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

import PanPlateWeightCalculationService from '../../services/PanPlateWeightCalculationService';
import StringerWeightCalculationService from '../../services/StringerWeightCalculationService';
import PanPlateLaborCalculationService from '../../services/PanPlateLaborCalculationService';

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
const DEFAULT_CONNECTION_TYPES = [
  'Type-1(Single support)', 
  'Type-2(Dual support)', 
  'Type-3(bent plate)', 
  'Type-(Welded)', 
  'Welded', 
  'Bolted'
];
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
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'],
    panPlateConfigs: []
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  // Thickness handling (GAUGE OR MANUAL)
  const [thicknessSource, setThicknessSource] = useState('gauge');  // 'gauge' or 'manual'
  const [selectedGauge, setSelectedGauge] = useState('12ga');
  const [manualThicknessInches, setManualThicknessInches] = useState('0.1046');

  // Calculation results
  const [panPlateWeightResult, setPanPlateWeightResult] = useState(null);
  const [panPlateLaborResult, setPanPlateLaborResult] = useState(null);
  const [stringerWeightResult, setStringerWeightResult] = useState(null);

  // Gauge thickness lookup table
  const GAUGE_THICKNESS = {
    '7ga': 0.1793,
    '10ga': 0.1345,
    '11ga': 0.1196,
    '12ga': 0.1046,
    '14ga': 0.0747,
    '16ga': 0.0598,
    '18ga': 0.0478,
    '20ga': 0.0359,
    '22ga': 0.0299,
    '24ga': 0.0239
  };

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

    const [st, gt, ss, fo, ct, sg, mt, ppc] = await Promise.all([
      fetchList('stair_type'),
      fetchList('grating_type'),
      fetchList('stringer_size'),
      fetchList('finish_option'),
      fetchList('connection_type'),
      fetchList('material_type'),
      fetchList('mounting_type'),
      fetchList('pan_plate_config')
    ]);

    setDropdowns({
      stairTypes: st.length > 0 ? st : DEFAULT_STAIR_TYPES,
      gratingTypes: gt.length > 0 ? gt.map(i => i.label || i.value) : DEFAULT_GRATING_TYPES,
      stringerSizes: ss.length > 0 ? ss.map(i => i.description || (i.label && i.label.length > 5 ? i.label : (i.value || i.label))) : DEFAULT_STRINGER_SIZES,
      stringerSizesData: ss,
      finishes: fo.length > 0 ? [...new Set(fo.map(i => i.label || i.value))] : DEFAULT_FINISH_OPTIONS,
      connections: ct.length > 0 ? ct.map(i => i.label || i.value) : DEFAULT_CONNECTION_TYPES,
      mountingTypes: mt.length > 0 ? mt : [
        { value: 'anchored', label: 'Anchored' },
        { value: 'embedded', label: 'Embedded' }
      ],
      steelGrades: sg.length > 0 ? sg : ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'],
      panPlateConfigs: ppc || []
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
    panPlThk: (stair.panPlThk && stair.panPlThk.value) ? stair.panPlThk : { value: '0.1046', unit: 'IN' },
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
    materialGradeId: stair.materialGradeId || '',
    gaugeId: stair.gaugeId || '',
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
    panPlateConfigId: stair.panPlateConfigId || '',
    selectionSource: (stair.selectionSource) || (stair.stringerSize && stair.stringerSize !== '' ? 'manual' : 'auto'),
    panPlateSelectionSource: (stair.panPlateSelectionSource) || (stair.panPlateConfigId && stair.panPlateConfigId !== '' ? 'manual' : 'auto'),
    applicationType: stair.applicationType || 'Commercial / Standard Duty'
  });

  const [recommendedPanPlateConfig, setRecommendedPanPlateConfig] = useState(null);
  const [panPlateValidationMessage, setPanPlateValidationMessage] = useState('');

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
          materialGradeId: withDefault('materialGradeId', ''),
          panPlateConfigId: withDefault('panPlateConfigId', ''),
          panPlateSelectionSource: withDefault('panPlateSelectionSource', 'auto'),
          applicationType: withDefault('applicationType', 'Commercial / Standard Duty'),
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

  // --- Smart Auto-Suggest for Pan Plate Configuration ---
  useEffect(() => {
    const fetchPanPlateRecommendation = async () => {
      if (!isPanStair || stairWidthFt <= 0 || totalRunFt <= 0) return;
      try {
        const token = localStorage.getItem('steel_token');
        const appType = encodeURIComponent(form.applicationType || 'Commercial / Standard Duty');
        const gaugeToMatch = thicknessSource === 'gauge' ? selectedGauge : '';
        const res = await fetch(
          `${API_BASE_URL}/api/v1/calculate/pan-plate-recommendation?width=${stairWidthFt}&length=${totalRunFt}&stairType=${form.stairType}&applicationType=${appType}&gauge=${gaugeToMatch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && data.recommendation) {
          setRecommendedPanPlateConfig(data.recommendation);
          const recId = data.recommendation.id || data.recommendation.value;
          const recLabel = data.recommendation.label || '';

          if (form.panPlateSelectionSource === 'auto' && form.panPlateConfigId !== recId) {
            // Smart Suggest Pan Support Type based on Recommendation
            let suggestedSupport = form.connectionType;
            if (recLabel.includes('TYPE-1')) suggestedSupport = 'Type-1(Single support)';
            if (recLabel.includes('TYPE-2')) suggestedSupport = 'Type-2(Dual support)';

            setForm(f => ({ 
              ...f, 
              panPlateConfigId: recId,
              connectionType: suggestedSupport
            }));
            onChange({ ...form, panPlateConfigId: recId, connectionType: suggestedSupport });
          }
        }
      } catch (e) {
        console.error('Failed to fetch pan plate recommendation:', e);
      }
    };
    fetchPanPlateRecommendation();
  }, [stairWidthFt, totalRunFt, form.stairType, form.applicationType, form.panPlateSelectionSource, isPanStair, selectedGauge, thicknessSource]);

  // Support Type Options Mapping
  const supportTypeOptions = isPanStair 
    ? [
        { value: 'Type-1(Single support)', label: 'Type-1(Single support)' },
        { value: 'Type-2(Dual support)', label: 'Type-2(Dual support)' },
        { value: 'Type-3(bent plate)', label: 'Type-3(bent plate)' },
        { value: 'Type-4(Welded)', label: 'Type-4(Welded)' }
      ]
    : dropdowns.connections.map(c => ({ 
        value: c.label || c.value || c, 
        label: c.label || c.value || c 
      }));

  useEffect(() => {
    const validatePanPlateSelection = async () => {
      if (!isPanStair || !form.panPlateConfigId || stairWidthFt <= 0 || totalRunFt <= 0) {
        setPanPlateValidationMessage('');
        return;
      }
      try {
        const token = localStorage.getItem('steel_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/calculate/validate-pan-plate-dimensions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configId: form.panPlateConfigId,
            width: stairWidthFt,
            length: totalRunFt,
            applicationType: form.applicationType || 'Commercial / Standard Duty'
          })
        });
        const data = await res.json();
        if (!data.valid && data.issues && data.issues.length > 0) {
          setPanPlateValidationMessage(data.issues.join(' • '));
        } else {
          setPanPlateValidationMessage('');
        }
      } catch (e) {
        console.error('Failed to validate pan plate selection:', e);
      }
    };
    validatePanPlateSelection();
  }, [form.panPlateConfigId, form.applicationType, stairWidthFt, totalRunFt, isPanStair]);

  let stringerWarning = null;
  let stringerWarningType = 'info';
  const selectedScore = form.stringerSize ? scoredStringers.find(s => 
    (s.label === form.stringerSize || s.value === form.stringerSize || s.description === form.stringerSize)
  )?.score : null;

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

  const getActiveThickness = useCallback(() => {
    if (thicknessSource === 'manual') {
      return parseFloat(manualThicknessInches) || 0;
    } else {
      return GAUGE_THICKNESS[selectedGauge] || 0.1046;
    }
  }, [thicknessSource, manualThicknessInches, selectedGauge]);

  const getProfileWeightPerFoot = useCallback(() => {
    if (form?.stringerSize && typeof form.stringerSize === 'object') {
      if (form.stringerSize.lbsPerFoot) return parseFloat(form.stringerSize.lbsPerFoot);
      if (form.stringerSize.weight) return parseFloat(form.stringerSize.weight);
      if (form.stringerSize.weightPerFoot) return parseFloat(form.stringerSize.weightPerFoot);
      if (form.stringerSize.lbPerFt) return parseFloat(form.stringerSize.lbPerFt);
    }
    
    if (typeof form?.stringerSize === 'string') {
      const match = form.stringerSize.match(/x\s*([\d.]+)/i);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
      console.warn(`stringerSize is string '${form.stringerSize}', using fallback weight of 10.6 lbs/ft`);
      return 10.6;
    }
    
    return 10.6; // MC 12 X 10.6 default
  }, [form?.stringerSize]);

  const calculateAllMetrics = useCallback(() => {
    try {
      const panPlateConfig = dropdowns.panPlateConfigs?.find(
        config => (config.id || config.value) === form.panPlateConfigId
      ) || null;
      
      if (!panPlateConfig) {
        console.warn('Pan plate config not found for ID:', form.panPlateConfigId);
        return;
      }
      
      const activeThickness = getActiveThickness();
      const profileWeight = getProfileWeightPerFoot();
      
      // Calculate inputs properly using form mappings
      const riserHeightInches = parseFloat(form.rise?.value) || 0;
      const treadWidthInches = parseFloat(form.run?.value) || 0;
      const stairWidthFeet = parseToFeet(form.stairWidth) || 0;
      const stairLengthFeet = parseToFeet(form.stringerLength) || form.systemCalc?.stringerLengthFt || 0;
      const numberOfRisers = parseFloat(form.numRisers) || form.systemCalc?.risers || 0;
      
      const panWeightService = new PanPlateWeightCalculationService();
      const numberOfTreads = Math.max(0, (parseFloat(numberOfRisers) || 0) - 1);
      const panWeightResult = panWeightService.calculatePanPlateWeight(
        panPlateConfig,
        riserHeightInches,
        treadWidthInches,
        stairWidthFeet,
        activeThickness,
        thicknessSource,
        0.75,
        numberOfTreads   // ← Pass total tread count for full-stair weight
      );
      setPanPlateWeightResult(panWeightResult);
      
      const panLaborService = new PanPlateLaborCalculationService();
      const panLaborResult = panLaborService.calculateLaborCost(
        stairWidthFeet,
        stairLengthFeet,
        panPlateConfig,
        90,
        125
      );
      setPanPlateLaborResult(panLaborResult);
      
      const stringerService = new StringerWeightCalculationService();
      const stringerResult = stringerService.calculateStringerWeight(
        profileWeight,
        stairLengthFeet,
        numberOfRisers,
        2,
        0.75
      );
      setStringerWeightResult(stringerResult);
      
      if (panWeightResult.success && panLaborResult.success && stringerResult.success) {
        onChange?.({
          ...form,
          panPlateThickness: activeThickness,
          panPlateThicknessSource: thicknessSource,
          // ✅ Write gauge label & thickness back to form so payload builder can use them
          panPlateGauge: thicknessSource === 'gauge' ? selectedGauge : null,
          panPlateWeight: panWeightResult.panPlateWeight,
          panPlateWeightWithScrap: panWeightResult.panPlateWeightWithScrap,
          panPlateMaterialCost: panWeightResult.materialCost,
          panPlateScrapCost: panWeightResult.scrapCost,
          panPlateShopHours: panLaborResult.shopHours,
          panPlateShopCost: panLaborResult.shopCost,
          panPlateFieldHours: panLaborResult.fieldHours,
          panPlateFieldCost: panLaborResult.fieldCost,
          stringerWeight: stringerResult.totalWeightAllStringers,
          stringerWeightWithScrap: stringerResult.totalWeightWithScrap,
          stringerMaterialCost: stringerResult.materialCost,
          stringerScrapCost: stringerResult.scrapCost
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [
    dropdowns.panPlateConfigs, form, getActiveThickness, getProfileWeightPerFoot, thicknessSource, onChange
  ]);

  useEffect(() => {
    // We check either direct input form strings or the parsed systemCalc variables to avoid missing data cases.
    if (form?.stairType === 'PAN PLATE CONC. FILLED' &&
        form?.panPlateConfigId &&
        form?.stairWidth && 
        form?.rise && 
        form?.run && 
        (form?.stringerLength || form?.systemCalc?.stringerLengthFt)) {
      calculateAllMetrics();
    }
  }, [
    form?.panPlateConfigId,
    form?.stairWidth,
    form?.rise,
    form?.run,
    form?.stringerLength,
    form?.systemCalc?.stringerLengthFt,
    form?.stringerSize,
    thicknessSource,
    selectedGauge,
    manualThicknessInches
  ]);

  return (
    <div onPointerDown={onFocus}>
      {/* ── Identification ─────────────────────────────────────────── */}
      <div className="subtle-group">
        <div className="group-header">Identification</div>
        <div className="form-grid form-grid-4">
          <div className="form-field">
            <label className="form-label">
              Stair Type
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

          {isPanStair && (
            <div className="form-field fade-in">
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
          )}



          <div className="form-field">
            <label className="form-label">
              {isPanStair ? 'Pan support type' : 'Connection Type'}
              {isAdmin && (
                <button
                  onClick={(e) => openManage('connection_type', 'Connection Types', e)}
                  className="quick-edit-btn"
                  title="Manage Options"
                >
                  <Settings size={14} />
                </button>
              )}
            </label>
            <SearchableSelect
              options={supportTypeOptions}
              valueKey="value"
              displayKey="label"
              value={form.connectionType}
              onSelect={opt => set('connectionType', opt?.value || '')}
              placeholder="— Select Connection —"
            />
          </div>



          {/* ── Conditional Pan / Tread Inputs (Same Line) ─────────────────────────────────── */}
          {isPanStair && (
            <>

              {/* Pan Plate Config auto-selected field */}
              <div className="form-field">
                <label className="form-label">
                  Pan Plate Configuration
                  {isAdmin && (
                    <button
                      onClick={(e) => openManage('pan_plate_config', 'Pan Plate Configs', e)}
                      className="quick-edit-btn"
                      title="Manage Options"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                </label>

                {recommendedPanPlateConfig && (
                  <div className="recommendation-banner fade-in" style={{ 
                    marginBottom: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: form.panPlateSelectionSource === 'manual' ? '#F1F5F9' : '#ECFDF5',
                    borderColor: form.panPlateSelectionSource === 'manual' ? '#E2E8F0' : '#A7F3D0',
                    color: form.panPlateSelectionSource === 'manual' ? '#64748B' : '#059669'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Check size={14} style={{ marginRight: '6px' }}/>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>
                        Recommended: {Number(stairWidthFt).toFixed(0)}'W × {Number(totalRunFt).toFixed(2)}'L 
                        {recommendedPanPlateConfig.label?.includes('TYPE-1') && ' · Single Support'}
                        {recommendedPanPlateConfig.label?.includes('TYPE-2') && ' · Dual Support'}
                      </span>
                    </div>
                    {form.panPlateSelectionSource === 'manual' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const recId = recommendedPanPlateConfig.id || recommendedPanPlateConfig.value;
                          const updated = { ...form, panPlateConfigId: recId, panPlateSelectionSource: 'auto' };
                          setForm(updated);
                          onChange(updated);
                          toast.success('Applied recommendation');
                        }}
                        style={{
                          background: '#3B82F6', color: 'white', border: 'none',
                          padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '10px', fontWeight: 700, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        Use Recommended
                      </button>
                    )}
                  </div>
                )}
                {form.panPlateSelectionSource === 'manual' && !panPlateValidationMessage && form.panPlateConfigId && (
                  <div className="info-banner fade-in" style={{ marginBottom: '8px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                    <Settings size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>
                    Manually overridden
                  </div>
                )}
                {panPlateValidationMessage && (
                  <div className="warning-banner fade-in" style={{ marginBottom: '8px' }}>
                    <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>
                    {panPlateValidationMessage}
                  </div>
                )}

                <SearchableSelect
                  options={dropdowns.panPlateConfigs.map(c => {
                    // Strip the [bracketed range] from the label if it exists
                    const cleanLabel = (c.label || '').replace(/\s*\[.*\]\s*$/, '').trim();
                    return { value: c.id || c.value, label: cleanLabel };
                  })}
                  valueKey="value"
                  displayKey="label"
                  value={form.panPlateConfigId}
                  onSelect={opt => {
                    const updated = { ...form, panPlateConfigId: opt?.value || '', panPlateSelectionSource: 'manual' };
                    setForm(updated);
                    onChange(updated);
                  }}
                  placeholder="— Select Pan Plate Config —"
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Plate Thickness
                  <span className="data-badge dt-string"></span>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-input-with-unit" style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                    <input 
                      type="text"
                      className="arch-input"
                      style={{ 
                        height: '42px', 
                        border: 'none', 
                        padding: '0 12px',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#1E293B',
                        width: '100%'
                      }}
                      value={thicknessSource === 'gauge' ? selectedGauge : manualThicknessInches}
                      onChange={(e) => {
                        const val = e.target.value;
                        const clean = val.toLowerCase().trim();
                        
                        const isExplicitGauge = clean.includes('ga') || clean.includes('gauge');
                        const numVal = parseFloat(clean);
                        const isLikelyGauge = !isNaN(numVal) && numVal >= 7 && !clean.includes('.');

                        if (isExplicitGauge || isLikelyGauge) {
                          setThicknessSource('gauge');
                          const match = clean.match(/(\d+)/);
                          if (match) {
                            setSelectedGauge(`${match[1]}ga`);
                          } else {
                            setSelectedGauge(val);
                          }
                        } else {
                          setThicknessSource('manual');
                          setManualThicknessInches(val);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g. 12ga or 0.1046"
                    />
                    <span className="form-input-unit" style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 700, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                      {thicknessSource === 'gauge' ? 'GA' : 'IN'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isGratingStair && (
            <div className="form-field fade-in">
              <label className="form-label">
                Grating Tread Type
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
              options={dropdowns.steelGrades.map(s => ({ value: s.id || s, label: s.label || s }))}
              valueKey="value"
              displayKey="label"
              value={form.materialGradeId || form.steelGrade}
              onSelect={opt => {
                setForm(prev => ({
                  ...prev,
                  materialGradeId: opt?.value || '',
                  steelGrade: opt?.label || ''
                }));
                onChange({ ...form, materialGradeId: opt?.value || '', steelGrade: opt?.label || '' });
              }}
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

              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.05em' }}>HARDWARE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Connections / Hardware Weight:</span>
                <span>{(form.systemCalc.separatedCosts.total.weight - form.systemCalc.separatedCosts.stringer.weight - (form.systemCalc.separatedCosts.grating?.weight || 0) - (form.systemCalc.separatedCosts.panPlate?.weight || 0)).toFixed(1)} lbs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Connections / Bolts Cost:</span>
                <span>${(Number(form.systemCalc.anchorBoltsCost || 0) + Number(form.systemCalc.porRokCost || 0)).toFixed(2)}</span>
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

          {/* Minimal Estimation Results Indicator */}
          <div className="fade-in" style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '11px', color: '#64748B', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            {stringerWeightResult?.success && (
              <span>Stringer: <strong>{stringerWeightResult.display.total}</strong></span>
            )}
            {(!panPlateWeightResult?.success && !stringerWeightResult?.success) && (
              <span style={{ fontStyle: 'italic' }}>Awaiting configuration...</span>
            )}
          </div>

          <EstimationPreviewCard
            systemCalc={{
              ...form.systemCalc,
              shopTotalHrs: form.systemCalc.stringerShopHrs,
              fieldTotalHrs: form.systemCalc.stringerFieldHrs
            }}
            totalCost={form.totalCost}
            stairType={form.stairType}
            finishName={form.finish}
            hidePorRok={true}
            hideAnchorBolts={true}
            minimal={true}
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
        userRole={user?.role}
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

