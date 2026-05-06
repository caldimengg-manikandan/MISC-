import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import EstimationPreviewCard from '../../components/common/EstimationPreviewCard';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import SearchableSelect from '../../components/common/SearchableSelect';
import QuickManageModal from '../../components/common/QuickManageModal';
import { GUARD_RAIL_DRAWINGS } from '../../config/guardRailDrawings';

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];
const DEFAULT_STEEL_GRADES = ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'];
const DEFAULT_MOUNTING_OPTIONS = ['Bolted to Stringer', 'Welded to Stringer', 'Side Mounted Bolted', 'Side Mounted Welded', 'Embedded', 'Anchored'];

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

// ── Suggestion Engine Helpers ──────────────────────────────────────────
const parseRailAttributes = (label) => {
  if (!label || label.includes("Optional Kick Plate")) return null;
  // Wall/Grab Rails check - removed to allow parsing line counts for auto-settings
  // if (label.toLowerCase().includes('wall bolted') || label.toLowerCase().includes('on guardrail')) return null;

  return {
    lines: label.match(/^(\d+)-Line/)?.[1] ? parseInt(label.match(/^(\d+)-Line/)[1]) : null,
    pipeSize: label.includes('1 1/4') ? '1.25' : (label.includes('1 1/2') ? '1.5' : null),
    postType: (label.includes('SCH 80') || label.includes('SCH. 80')) ? 'SCH80' : 'SCH40',
    infill: label.match(/1\/2" picket|w\/1\/2/i) ? 'picket_half'
           : label.match(/3\/4" picket|w\/3\/4/i) ? 'picket_three_quarter'
           : label.match(/MESH/i) ? 'mesh'
           : 'pipe'
  };
};

const scoreMatch = (railAttrs, filters) => {
  if (!railAttrs) return 0;

  // Hard fail — lines or pipeSize must match if set
  if (filters.lines !== null && railAttrs.lines !== filters.lines) return 0;
  if (filters.pipeSize !== null && railAttrs.pipeSize !== filters.pipeSize) return 0;

  // Soft mismatch — postType or infill differs
  const postMatch = filters.postType === null || railAttrs.postType === filters.postType;
  const infillMatch = filters.infill === null || railAttrs.infill === filters.infill;

  if (postMatch && infillMatch) return 2; // exact match
  return 1; // partial match
};




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

export default function RailConfig({ type = 'guardRail', data, onChange, onFocus }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superadmin';

  const [dropdowns, setDropdowns] = useState({
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'],
    finishes: [],
    mountings: [],
    guardRailTypes: [],
    wallRailTypes: [],
    grabRailTypes: [],
    caneRailTypes: []
  });
  
  const [isEditingSpacing, setIsEditingSpacing] = useState(false);

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  const load = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const token = localStorage.getItem('steel_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${category}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      fetchList('steel_grade_stair')
    ]);

    setDropdowns({
      finishes: fo.length > 0 ? fo.map(i => i.label) : DEFAULT_FINISH_OPTIONS,
      mountings: mo.length > 0 ? mo.map(i => i.label) : DEFAULT_MOUNTING_OPTIONS,
      guardRailTypes: grt.length > 0 ? grt.map(i => i.label) : RAIL_CONFIGS.guardRail.types,
      wallRailTypes: wrt.length > 0 ? wrt.map(i => i.label) : RAIL_CONFIGS.wallRail.types,
      grabRailTypes: gbt.length > 0 ? gbt.map(i => i.label) : RAIL_CONFIGS.grabRail.types,
      caneRailTypes: crt.length > 0 ? crt.map(i => i.label) : RAIL_CONFIGS.caneRail.types,
      steelGrades: sg.length > 0 ? sg.map(i => i.label) : DEFAULT_STEEL_GRADES
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
    intermediateRails: (data?.intermediateRails !== undefined && data?.intermediateRails !== null) ? data.intermediateRails : (type === 'caneRail' ? '0' : ''),
    postSpacing: data?.postSpacing || { value: '4', unit: 'FT' },
    postQty: (data?.postQty !== undefined && data?.postQty !== null) ? data.postQty : '',
    toeplateRequired: data?.toeplateRequired || 'No',
    toeplateLength: data?.toeplateLength || { value: '', unit: 'FT' },
    finish: data?.finish || 'Primer',
    selectionSource: data?.selectionSource || (data?.railType ? 'manual' : null),
    filters: data?.filters || { lines: 2, pipeSize: '1.25', postType: 'SCH40', infill: 'pipe' },
    intRailSource: data?.intRailSource || (data?.intermediateRails !== undefined && data?.intermediateRails !== '' ? 'manual' : 'auto'),
    postQtySource: data?.postQtySource || (data?.postQty !== undefined && data?.postQty !== '' ? 'manual' : 'auto'),
    ...data
  });

  const [parsedTypes, setParsedTypes] = useState({});

  useEffect(() => {
    // Cache parsed attributes for the guard rail types
    const cache = {};
    const allTypes = [...(dropdowns.guardRailTypes || []), ...(dropdowns.caneRailTypes || [])];
    allTypes.forEach(label => {
      cache[label] = parseRailAttributes(label);
    });
    setParsedTypes(cache);
  }, [dropdowns.guardRailTypes, dropdowns.caneRailTypes]);

  // Initial page load / save project restore fix
  useEffect(() => {
    if (data && data.railType && !data.selectionSource && form.selectionSource !== 'manual') {
      setForm(f => ({ ...f, selectionSource: 'manual' }));
    }
  }, []); // Only on mount


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

  // Auto-selection of first type removed as per user request to always ask to select.

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

  // Suggestion Engine Logic
  const getBestMatch = useCallback(() => {
    if (type !== 'guardRail' && type !== 'caneRail') return null;
    let best = null;

    const typesList = dropdowns[`${type}Types`] || [];
    typesList.forEach(label => {
      const attrs = parsedTypes[label];
      const score = scoreMatch(attrs, form.filters);
      if (score === 2 && !best) {
        best = label;
      }
    });
    return best;
  }, [type, dropdowns.guardRailTypes, dropdowns.caneRailTypes, parsedTypes, form.filters]);

  useEffect(() => {
    if (type !== 'guardRail' && type !== 'caneRail') return;
    const bestMatch = getBestMatch();

    // null -> 'auto'
    if (form.selectionSource === null && bestMatch) {
      const updated = { ...form, railType: bestMatch, selectionSource: 'auto' };
      setForm(updated);
      if (onChange) onChange(updated);
    }
    // 'auto' -> 'auto' (silently updates)
    else if (form.selectionSource === 'auto' && bestMatch && form.railType !== bestMatch) {
      const updated = { ...form, railType: bestMatch };
      setForm(updated);
      if (onChange) onChange(updated);
    }
  }, [form.filters, form.selectionSource, type, getBestMatch]);

  // Track the previous rail type so we can detect a type change
  const prevRailTypeRef = React.useRef(form.railType);

  useEffect(() => {
    if ((type === 'guardRail' || type === 'caneRail') && form.railType && parsedTypes[form.railType]) {
      const attrs = parsedTypes[form.railType];
      const typeChanged = prevRailTypeRef.current !== form.railType;
      prevRailTypeRef.current = form.railType;

      if (attrs && attrs.lines) {
        const lines = parseInt(attrs.lines);
        if (lines > 0) {
          const suggestedInt = (lines - 1).toString();
          // Always auto-set when type changes; respect 'manual' only if type didn't change
          if (typeChanged || form.intRailSource !== 'manual') {
            const updated = { 
              ...form, 
              intermediateRails: suggestedInt, 
              intRailSource: 'auto',
              postQtySource: typeChanged ? 'auto' : form.postQtySource 
            };
            setForm(updated);
            if (onChange) onChange(updated);
          }
        }
      }
    }
  }, [form.railType, parsedTypes, type]);
  
  // Sync background-calculated posts to local state when in auto mode
  useEffect(() => {
    if (form.postQtySource === 'auto' && data?.systemCalc?.posts !== undefined) {
      const autoVal = data.systemCalc.posts.toString();
      if (form.postQty !== autoVal) {
        setForm(f => ({ ...f, postQty: autoVal }));
      }
    }
  }, [data?.systemCalc?.posts, form.postQtySource]);

  const handleManualSelection = (val) => {
    const updated = { ...form, railType: val, selectionSource: 'manual' };
    setForm(updated);
    if (onChange) onChange(updated);
  };

  const handleBlurReset = () => {
    const val = form.railLength?.value;
    if (val === '' || val === '0' || val === 0) {
      const updated = { ...form, selectionSource: null, railType: '', intermediateRails: '' };
      setForm(updated);
      if (onChange) onChange(updated);
    }
  };

  const bestMatch = getBestMatch();
  const currentScore = parsedTypes[form.railType] ? scoreMatch(parsedTypes[form.railType], form.filters) : 0;
  const showAmber = form.selectionSource === 'manual' && bestMatch && form.railType !== bestMatch;
  const showGreen = form.selectionSource === 'auto' && currentScore === 2;
  const showMountingWarning = form.railType && !form.mountingType;

  return (
    <div onPointerDown={onFocus}>
      <div className="form-section">
        <div className="form-section-title">
          {type === 'guardRail' ? 'Guard Rail Specifications' : 'Rail Specifications'}
        </div>

        {/* Suggestion Filters - OPTION B */}
        {(type === 'guardRail' || type === 'caneRail') && (
          <div className="suggestion-filters-box">
            <div className="filters-header">
              <span className="filters-title">Suggestion Filters</span>
              <span className="filters-hint">Narrow down rail types by criteria</span>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Lines</label>
                <div className="segmented-control">
                  {[1, 2, 3, 8].map(v => (
                    <button
                      key={v}
                      className={form.filters.lines === v ? 'active' : ''}
                      onClick={() => set('filters', { ...form.filters, lines: v })}
                    >
                      {`${v}-Line`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Pipe Size</label>
                <div className="segmented-control">
                  {['1.25', '1.5'].map(v => (
                    <button
                      key={v}
                      className={form.filters.pipeSize === v ? 'active' : ''}
                      onClick={() => set('filters', { ...form.filters, pipeSize: v })}
                    >
                      {v === '1.25' ? '1 1/4"' : '1 1/2"'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Post Type</label>
                <div className="segmented-control">
                  {['SCH40', 'SCH80'].map(v => (
                    <button
                      key={v}
                      className={form.filters.postType === v ? 'active' : ''}
                      onClick={() => set('filters', { ...form.filters, postType: v })}
                    >
                      {v === 'SCH40' ? 'SCH 40' : 'SCH 80'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Infill</label>
                <div className="segmented-control wrapable" data-group="infill">
                  {['pipe', 'picket_half', 'picket_three_quarter', 'mesh'].map(v => (
                    <button
                      key={v}
                      className={form.filters.infill === v ? 'active' : ''}
                      onClick={() => set('filters', { ...form.filters, infill: v })}
                    >
                      {v === 'pipe' ? 'Pipe' : v === 'picket_half' ? '½" Picket' : v === 'picket_three_quarter' ? '¾" Picket' : 'Mesh'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banners */}
        {showGreen && (
          <div className="suggestion-banner banner-green">
            <span className="banner-icon">✓</span>
            <span className="banner-text">Recommended for your inputs</span>
          </div>
        )}
        {showAmber && (
          <div className="suggestion-banner banner-amber">
            <span className="banner-icon">⚠</span>
            <span className="banner-text">Selected rail may not match current inputs</span>
            <button 
              className="banner-action-btn"
              onClick={() => {
                const updated = { ...form, railType: bestMatch, selectionSource: 'auto' };
                setForm(updated);
                if (onChange) onChange(updated);
              }}
            >
              Apply
            </button>
          </div>
        )}
        {showMountingWarning && (
          <div className="suggestion-banner banner-amber" style={{ padding: '6px 12px', marginBottom: '12px' }}>
            <span className="banner-icon">⚠</span>
            <span className="banner-text" style={{ fontSize: '12px' }}>Mounting type required for accurate post/anchor cost calculation</span>
          </div>
        )}

        {/* Primary Inputs Grid */}
        <div className="rail-specs-grid">
          <div className="form-field" style={{ gridColumn: 'span 2' }}>
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
            <SearchableSelect
              options={(dropdowns[`${type}Types`] || config.types).map(t => {
                const attrs = parsedTypes[t];
                const score = (type === 'guardRail' || type === 'caneRail') ? scoreMatch(attrs, form.filters) : 1;
                const isRec = (type === 'guardRail' || type === 'caneRail') && score === 2;
                return { 
                  value: t, 
                  label: `${t} ${isRec ? ' ★ (REC)' : ''}`,
                  opacity: score === 0 ? 0.4 : 1
                };
              })}
              valueKey="value"
              displayKey="label"
              value={form.railType}
              onSelect={opt => handleManualSelection(opt?.value || '')}
              placeholder="— Select Type —"
            />
          </div>

          <UnitInput
            id={`${type}-length`}
            label={type === 'guardRail' ? 'Guard Rail length' : 'Rail Length'}
            value={form.railLength}
            onChange={v => set('railLength', v)}
            onBlur={handleBlurReset}
          />


          <div className="form-field">
            <label className="form-label">
              Steel Grade
              {isAdmin && (
                <button
                  onClick={(e) => openManage('steel_grade_stair', 'Steel Grades', e)}
                  className="quick-edit-btn"
                  title="Manage Options"
                >
                  <Settings size={12} />
                </button>
              )}
            </label>
            <SearchableSelect
              className="compact-select"
              options={dropdowns.steelGrades.map(sg => ({ value: sg, label: sg }))}
              valueKey="value"
              displayKey="label"
              value={form.steelGrade}
              onSelect={opt => set('steelGrade', opt?.value || '')}
              placeholder="— Select Grade —"
            />
          </div>

          {!config.lbsPerFt && (
            <div className="form-field">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Actual Spacing
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isEditingSpacing) {
                      setIsEditingSpacing(false);
                    } else if (window.confirm("This value is automatically calculated based on length. Are you sure you want to manually adjust the spacing?")) {
                      setIsEditingSpacing(true);
                    }
                  }}
                  style={{ 
                    border: 'none', 
                    background: isEditingSpacing ? 'var(--accent-blue)' : 'var(--color-neutral-100)', 
                    color: isEditingSpacing ? 'white' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isEditingSpacing ? '✅ DONE' : '✎ EDIT'}
                </motion.button>
              </label>
              
              {isEditingSpacing ? (
                <div className="form-input-with-unit">
                  <input
                    type="text"
                    className="arch-input"
                    value={form.postSpacing?.value || ''}
                    onChange={e => set('postSpacing', { ...form.postSpacing, value: e.target.value })}
                    onFocus={e => e.target.select()}
                    placeholder="4"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="form-input-unit unit-active"
                    onClick={() => set('postSpacing', { ...form.postSpacing, unit: form.postSpacing?.unit === 'FT' ? 'IN' : 'FT' })}
                  >
                    {form.postSpacing?.unit || 'FT'}
                  </button>
                </div>
              ) : (
                <input
                  className="form-input auto-calculation field-auto"
                  type="text"
                  value={data?.systemCalc?.actualSpacing ? `${Number(data.systemCalc.actualSpacing).toFixed(3)} ft` : 'N/A'}
                  readOnly
                />
              )}
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
              onChange={(e) => {
                const updated = { ...form, intermediateRails: e.target.value, intRailSource: 'manual' };
                setForm(updated);
                if (onChange) onChange(updated);
              }}
              onFocus={e => e.target.select()}
              placeholder="0"
            />
            {/* Auto-set hint */}
            {(type === 'guardRail' || type === 'caneRail') && form.intRailSource !== 'manual' && form.railType && parsedTypes[form.railType]?.lines && (
              <span style={{ display: 'block', marginTop: '3px', fontSize: '10px', color: 'var(--color-text-tertiary, #94a3b8)', fontStyle: 'italic' }}>
                Auto: based on {parsedTypes[form.railType].lines}-Line type
              </span>
            )}
            {/* Manual override amber note */}
            {(type === 'guardRail' || type === 'caneRail') && form.intRailSource === 'manual' && data?.systemCalc?.intRailDelta !== undefined && data.systemCalc.intRailDelta !== 0 && (
              <span style={{ display: 'block', marginTop: '3px', fontSize: '10px', color: '#92400e', fontStyle: 'italic', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                Custom count — steel lbs/LF adjusted proportionally
              </span>
            )}
            {(type === 'guardRail' || type === 'caneRail') && form.intRailSource === 'manual' && (data?.systemCalc?.intRailDelta === 0 || data?.systemCalc?.intRailDelta === undefined) && form.railType && parsedTypes[form.railType]?.lines && (
              <span style={{ display: 'block', marginTop: '3px', fontSize: '10px', color: '#92400e', fontStyle: 'italic' }}>
                Custom count
              </span>
            )}
          </div>

          <div className="form-field" style={{ display: config.hasPosts ? 'block' : 'none' }}>
            <label className="form-label">
              Post Qty
            </label>
            <input
              className={`form-input ${form.postQtySource === 'manual' ? '' : 'auto-calculation field-auto'}`}
              type="number"
              value={form.postQty || ''}
              onChange={(e) => {
                const updated = { ...form, postQty: e.target.value, postQtySource: 'manual' };
                setForm(updated);
                if (onChange) onChange(updated);
              }}
              onFocus={e => e.target.select()}
              placeholder="0"
            />
            {/* Manual override indicator */}
            {form.postQtySource === 'manual' && (
              <span style={{ display: 'block', marginTop: '3px', fontSize: '10px', color: '#92400e', fontStyle: 'italic', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                Custom count — cost/weight adjusted accordingly
              </span>
            )}
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
        <div className="rail-options-grid mt-4">
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
            <label className={`form-label ${showMountingWarning ? 'text-amber-600 font-bold' : ''}`}>Mounting</label>
            <SearchableSelect
              className={`compact-select ${showMountingWarning ? 'border-amber-400 bg-amber-50' : ''}`}
              options={dropdowns.mountings.map(m => ({ value: m, label: m }))}
              valueKey="value"
              displayKey="label"
              value={form.mountingType}
              onSelect={opt => set('mountingType', opt?.value || '')}
              placeholder="— Select —"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Finish Specification</label>
            <SearchableSelect
              className="compact-select"
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


      {/* ── Real-time Preview Engine Results (EXCEL MISC ALIGNED) ─────────────────────── */}
      {data?.systemCalc && form.railType && form.railType !== '' && (
        <div className="mt-6">
          <EstimationPreviewCard 
            systemCalc={data.systemCalc} 
            totalCost={data.totalCost} 
            unitType="LF"
            finishName={form.finish}
            hidePricePerRiser={true}
            title="Rail Configuration Preview"
            mountingType={form.mountingType}
          />
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

      <style>{`
        .rail-specs-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .rail-options-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
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

        /* Suggestion Filters Overhaul */
        .suggestion-filters-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }
        .suggestion-filters-box::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }
        .filters-title {
          font-weight: 800;
          font-size: 12px;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filters-title::before {
          content: '🔍';
          font-size: 14px;
        }
        .filters-hint {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
        }
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .filter-group label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .segmented-control {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          border: 1px solid #e2e8f0;
          height: 42px; /* Fixed height for consistency */
          align-items: center;
        }
        .segmented-control button {
          flex: 1;
          height: 100%;
          border: none;
          background: transparent;
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .segmented-control button:hover:not(.active) {
          background: #e2e8f0;
          color: #1e293b;
        }
        .segmented-control button.active {
          background: #3b82f6;
          color: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2);
        }
        .segmented-control.wrapable {
          display: grid;
          height: auto; /* Allow multi-row */
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .segmented-control.wrapable button {
          height: 34px; /* Slightly shorter for grid items */
        }

        /* Banner Styles */
        .suggestion-banner {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 600;
          gap: 12px;
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .banner-green {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #166534;
          box-shadow: 0 2px 4px rgba(22, 101, 52, 0.05);
        }
        .banner-amber {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
          box-shadow: 0 2px 4px rgba(146, 64, 14, 0.05);
        }
        .banner-icon { font-size: 16px; }
        .banner-text { flex: 1; }
        .banner-action-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
        }
        .banner-action-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.4);
        }
        .banner-action-btn:active {
          transform: translateY(0);
        }

      `}</style>
    </div>
  );
}

