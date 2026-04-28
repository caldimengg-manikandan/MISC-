import React, { useState, useEffect, useCallback } from 'react';
import { useEstimation } from '../../contexts/EstimationContext';
import SearchableSelect from '../../components/common/SearchableSelect';
import { Settings } from 'lucide-react';
import EstimationPreviewCard from '../../components/common/EstimationPreviewCard';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import QuickManageModal from '../../components/common/QuickManageModal';

const DEFAULT_PLATFORM_TYPES = [
  { value: 'pan-lte8',    label: 'Metal Pan Platform  ≤ 8 ft' },
  { value: 'pan-8-10',    label: 'Metal Pan Platform  8 – 10 ft' },
  { value: 'pan-10-12',   label: 'Metal Pan Platform  10 – 12 ft' },
  { value: 'grating-lte8',label: 'Grating Platform  ≤ 8 ft' },
  { value: 'grating-8-10',label: 'Grating Platform  8 – 10 ft' },
];

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv + Painted', 'Powder Coated'];

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

export default function LandingConfig({ data, parentStairType, onChange, onFocus }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'superadmin';

  const [dropdowns, setDropdowns] = useState({
    platformTypes: DEFAULT_PLATFORM_TYPES,
    finishes: DEFAULT_FINISH_OPTIONS
  });

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

    const [pt, fo] = await Promise.all([
      fetchList('platform_type'),
      fetchList('finish_option')
    ]);
    setDropdowns({
      platformTypes: pt,
      finishes: fo.map(i => i.label)
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openManage = (category, label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickModal({ isOpen: true, category, label, rect });
  };

  const [form, setForm] = useState({
    landingNumber: data?.landingNumber || '',
    platformLength: data?.platformLength || { value: '', unit: 'FT' },
    platformWidth: data?.platformWidth || { value: '', unit: 'FT' },
    platformType: data?.platformType || '',
    finish: data?.finish || 'Primer',
    selectionSource: data?.selectionSource || (data?.platformType ? 'manual' : 'auto'),
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

  // --- Smart Auto-Suggest for Platform Type ---
  const isGrating = (parentStairType || '').toLowerCase().includes('grating');
  const widthVal = parseFloat(form.platformWidth?.value) || 0;
  const widthFt = form.platformWidth?.unit === 'IN' ? widthVal / 12 : widthVal;

  let recommendedPlatformType = null;
  let platformWarning = null;
  let platformWarningType = 'info';

  if (widthFt > 0) {
    if (isGrating) {
      if (widthFt <= 8) recommendedPlatformType = "Grating pan stair platform 8'-0\" wide";
      else if (widthFt <= 10) recommendedPlatformType = "Grating pan stair platform 10'-0\" wide";
      else {
        platformWarning = "No grating platform above 10 ft in catalogue";
        platformWarningType = "warning";
      }
    } else { // default to Pan 
      if (widthFt <= 8) recommendedPlatformType = "Metal pan stair platform 8'-0\" wide";
      else if (widthFt <= 10) recommendedPlatformType = "Metal pan stair platform 10'-0\" wide";
      else if (widthFt <= 12) recommendedPlatformType = "Metal pan stair platform 12'-0\" wide";
      else {
        platformWarning = "Width exceeds catalogue (max 12 ft)";
        platformWarningType = "warning";
      }
    }
  }

  // Find exact string match in dropdown Options
  let resolvedRecommendedValue = null;
  if (recommendedPlatformType) {
    const matchedOpt = dropdowns.platformTypes.find(opt => 
      (opt.label || opt.value || opt).toString().trim().toLowerCase() === recommendedPlatformType.toLowerCase() ||
      (opt.value || opt.label || opt).toString().trim().toLowerCase() === recommendedPlatformType.toLowerCase()
    );
    resolvedRecommendedValue = matchedOpt ? (matchedOpt.value || matchedOpt.label || matchedOpt) : recommendedPlatformType;
  }

  useEffect(() => {
    if (!resolvedRecommendedValue) return;
    if (form.selectionSource === 'auto' && form.platformType !== resolvedRecommendedValue) {
      setForm(f => {
        const updated = { ...f, platformType: resolvedRecommendedValue };
        if (onChange) onChange(updated);
        return updated;
      });
    }
  }, [resolvedRecommendedValue, form.selectionSource, form.platformType]);

  if (resolvedRecommendedValue) {
    if (!form.platformType || form.platformType !== resolvedRecommendedValue) {
      platformWarning = `Selected type may not match geometry.\nSuggested: ${recommendedPlatformType}`;
      platformWarningType = 'warning';
    } else {
      platformWarning = `Recommended based on your geometry`;
      platformWarningType = 'success';
    }
  }



  // Area and labor MUST come from backend — never computed in frontend.
  // Parent passes backend results via data.calcArea, data.calcSteel, etc.
  const calcArea      = data?.calcArea      ?? null;
  const calcSteel     = data?.calcSteel     ?? null;
  const calcShop      = data?.calcShop      ?? null;
  const calcField     = data?.calcField     ?? null;

  return (
    <div onPointerDown={onFocus}>
      {/* ── Compressed Configuration Header ────────────────────────── */}
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-field">
          <label className="form-label">Landing Number</label>
          <input
            className="form-input data-type-string compact-input"
            value={form.landingNumber}
            onChange={e => set('landingNumber', e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="e.g. L-01"
          />
        </div>
        <UnitInput 
          id="landing-length"
          label="Length"
          value={form.platformLength}
          onChange={v => set('platformLength', v)}
        />
        <UnitInput 
          id="landing-width"
          label="Width"
          value={form.platformWidth}
          onChange={v => set('platformWidth', v)}
        />
        <div className="form-field">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒 Area (sq.ft)</span>
            <span className="sc-auto-label">AUTO</span>
          </label>
          <div className="form-input-with-unit">
            <input
              type="number"
              className="auto-calculation field-auto"
              value={data?.systemCalc?.area || ''}
              readOnly
              placeholder="0.0"
            />
            <span className="form-input-unit">FT²</span>
          </div>
        </div>
      </div>


      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-field">
          <label className="form-label">
            Platform Type
            {isAdmin && (
              <button onClick={(e) => openManage('platform_type', 'Platform Types', e)} className="quick-edit-btn" title="Manage Options">
                <Settings size={12} />
              </button>
            )}
          </label>
          <SearchableSelect
            className="data-type-string compact-select"
            options={dropdowns.platformTypes.map(pt => ({ value: pt.value || pt.label || pt, label: pt.label || pt.value || pt }))}
            valueKey="value"
            displayKey="label"
            value={form.platformType}
            onSelect={opt => {
              const updated = { ...form, platformType: opt?.value || '', selectionSource: 'manual' };
              setForm(updated);
              if (onChange) onChange(updated);
            }}
            placeholder="— Select Type —"
          />
          {platformWarning && (
            <div style={{
              marginTop: '6px', fontSize: '10.5px', padding: '8px 12px', borderRadius: '4px',
              backgroundColor: platformWarningType === 'warning' ? '#FEF3C7' : '#D1FAE5',
              color: platformWarningType === 'warning' ? '#92400E' : '#065F46',
              border: `1px solid ${platformWarningType === 'warning' ? '#FDE68A' : '#A7F3D0'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                {platformWarning.split('\n').map((line, i) => (
                  <div key={i} style={{ fontWeight: i === 0 && platformWarningType === 'warning' ? '700' : '500' }}>
                    {line}
                  </div>
                ))}
              </div>
              {platformWarningType === 'warning' && recommendedPlatformType && (
                <button
                  onClick={() => {
                    const updated = { ...form, platformType: recommendedPlatformType, selectionSource: 'auto' };
                    setForm(updated);
                    if (onChange) onChange(updated);
                  }}
                  style={{
                    backgroundColor: '#D97706',
                    color: 'white',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Apply
                </button>
              )}
            </div>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Finish Specification
            {isAdmin && (
              <button onClick={(e) => openManage('finish_option', 'Finish Options', e)} className="quick-edit-btn" title="Manage Options">
                <Settings size={12} />
              </button>
            )}
          </label>
          <SearchableSelect
            className="data-type-string compact-select"
            options={dropdowns.finishes.map(f => ({ value: f, label: f }))}
            valueKey="value"
            displayKey="label"
            value={form.finish}
            onSelect={opt => set('finish', opt?.value || '')}
            placeholder="— Select Finish —"
          />
        </div>
      </div>

      {/* ── Real-time Preview Engine Results (EXCEL MISC ALIGNED) ─────────────────────── */}
      {data?.systemCalc && form.platformType && form.platformType !== '' && (
        <div className="mt-6">
          <EstimationPreviewCard 
            systemCalc={data.systemCalc} 
            totalCost={data.totalCost} 
            unitType="SF"
            finishName={form.finish}
            hidePricePerRiser={true}
            title="Landing Configuration Preview"
          />
        </div>
      )}

      <QuickManageModal 
        isOpen={quickModal.isOpen}
        onClose={() => setQuickModal({ ...quickModal, isOpen: false })}
        category={quickModal.category}
        categoryLabel={quickModal.label}
        onUpdate={load}
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
      `}</style>
    </div>
  );
}

