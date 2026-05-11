// src/modules/Stair/components/AdditionalCostsModal.jsx
// Excel-like Additional Costs Modal
// ─ Hardcoded Engine based on Misc_Bid_Summary_-_ARS.xlsx
// ─ Global Labor Rates (Shop / Field / Por-Rok / Trucks)
// ─ Custom Items Table (Mat $, Shop Hrs, Field Hrs) -> Auto-calculates Mounting Cost
// ─ Conditional Labor Adjustments (Overnights vs Travel) with manual overrides
// ─ Scope Adjustments (Safety, Detailing, Tax) using precise formulas
// ─ Markups (Overhead & Profit) applied to Subtotal
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtNoComma = (v) =>
  Number(v || 0).toFixed(2);


const DELIVERY_OPTIONS = [
  { key: 'none', label: 'No Delivery',              cost: 0 },
  { key: 'galv', label: 'To Galv / Powder Coater',  cost: 350 },
  { key: 'job',  label: 'To Job Site',               cost: 750 },
];

/* ─── Helper Components ─────────────────────────────────────────────── */
const NumCell = ({ value, onChange, step = '1', className = '', min = 0, max = 99999999 }) => (
  <input
    type="number"
    className={`acm-cell-input ${className}`}
    value={value === 0 ? '' : value}
    step={step}
    min={min}
    max={max}
    onChange={(e) => {
      let v = parseFloat(e.target.value) || 0;
      if (v < min) v = min;
      if (v > max) v = max;
      onChange(v);
    }}
    onFocus={(e) => e.target.select()}
  />
);

const TextCell = ({ value, onChange, placeholder = '' }) => (
  <input
    type="text"
    className="acm-cell-input"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

/* ─── Override Input Cell ────────────────────────────────────────────── */
function OverrideInput({ value, placeholderVal, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <span className="acm-dollar-prefix">$</span>
      <input
        type="number"
        className="acm-override-input"
        placeholder={fmtNoComma(placeholderVal)}
        value={value}
        step="0.01"
        onChange={(e) => onChange(e.target.value)}
      />

    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────────── */
export default function AdditionalCostsModal({ baseTotal, estimationBreakdown, initialData, onApply, onClose }) {
  const dragControls = useDragControls();
  const [usedBaseTotal, setUsedBaseTotal] = useState(initialData?.usedBaseTotal ?? baseTotal);

  const [globalVars, setGlobalVars] = useState(initialData?.globalVars || {
    shopRate: 75,
    fieldRate: 75,
    porRokRate: 38,
    trucks: 1,
    overnightRate: 85,
    travelRate: 58
  });

  // 2. Custom Items (Excel Rows 1-29)
  const [customItems, setCustomItems] = useState(
    initialData?.customItems || Array.from({ length: 10 }, (_, i) => ({
      id: `ci-${i}-${Date.now()}`,
      name: '',
      finish: '',
      drawing: '',
      material: 0,
      shopHrs: 0,
      fieldHrs: 0,
      included: false,
      isEngineItem: false
    }))
  );

  /* 3. Delivery */
  const [delivery, setDelivery] = useState(() => {
    if (Array.isArray(initialData?.delivery)) return initialData.delivery;
    if (initialData?.delivery && initialData.delivery !== 'none') return [initialData.delivery];
    return [];
  });


  /* 4. Labor Adjustments (Overrides) */
  const [manualOvernights, setManualOvernights] = useState(initialData?.manualOvernights || '');
  const [manualTravel, setManualTravel] = useState(initialData?.manualTravel || '');
  const [manualDailyTravel, setManualDailyTravel] = useState(initialData?.manualDailyTravel || '');

  /* 5. Scope Adjustment Percentages */
  const [safetyPct, setSafetyPct] = useState(initialData?.safetyPct ?? 10);
  const [detailingPct, setDetailingPct] = useState(initialData?.detailingPct ?? 10);
  const [taxPct, setTaxPct] = useState(initialData?.taxPct ?? 6);

  /* 6. Markups */
  const [overheadPct, setOverheadPct] = useState(initialData?.overheadPct ?? 12);
  const [profitPct, setProfitPct] = useState(initialData?.profitPct ?? 15);

  /* ── Custom Item handlers ── */
  const { shopRate, fieldRate, porRokRate, trucks, overnightRate, travelRate } = globalVars;
  const updateGlobal = (key, val) => setGlobalVars(prev => ({ ...prev, [key]: val }));

  /* ── Custom Item handlers ── */
  const updateCI = (id, patch) => {
    setCustomItems((prev) => {
      const newItems = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      // Auto-add a row if the last row was just edited and it's not empty
      const lastItem = newItems[newItems.length - 1];
      if (newItems.length < 29 && (lastItem.name || lastItem.material || lastItem.shopHrs || lastItem.fieldHrs)) {
        newItems.push({
          id: `ci-${newItems.length}-${Date.now()}`,
          name: '',
          finish: '',
          drawing: '',
          material: 0,
          shopHrs: 0,
          fieldHrs: 0,
          included: false,
          isEngineItem: false
        });
      }
      return newItems;
    });
  };

  const deleteCI = (id) => {
    setCustomItems((prev) => {
      if (prev.length <= 1) return prev; // Keep at least one row
      return prev.filter((i) => i.id !== id);
    });
  };

  const calcCIMounting = (item) => item.fieldHrs * porRokRate;
  const calcCI = (item) => (Number(item.material) || 0) + (Number(item.shopHrs) * shopRate) + (Number(item.fieldHrs) * fieldRate) + calcCIMounting(item);

  const importFromEstimation = () => {
    if (!estimationBreakdown) return;
    
    const newItems = [];
    
    // Helper to extract material components
    const getMat = (s) => (
      (s.systemCalc?.steelPriceBase || 0) + 
      (s.systemCalc?.pansMaterialPrice || 0) + 
      (s.systemCalc?.gratingTotalCost || 0) + 
      (s.systemCalc?.galvanizeCost || 0) + 
      (s.systemCalc?.anchorBoltsCost || 0)
    );

    // Stairs
    (estimationBreakdown.stairs || []).forEach(s => {
      newItems.push({
        id: `eng-s-${s.id}-${Date.now()}`,
        name: s.label || 'Stair',
        finish: s.finish || '',
        drawing: '',
        material: Math.round(getMat(s) * 100) / 100,
        shopHrs: s.shopHours || 0,
        fieldHrs: s.fieldHours || 0,
        included: true,
        isEngineItem: true
      });
      (s.flights || []).forEach(f => {
        newItems.push({
          id: `eng-f-${f.id}-${Date.now()}`,
          name: f.label || 'Flight',
          finish: f.finish || s.finish || '',
          drawing: '',
          material: Math.round(getMat(f) * 100) / 100,
          shopHrs: f.shopHours || 0,
          fieldHrs: f.fieldHours || 0,
          included: true,
          isEngineItem: true
        });
      });
    });

    // Platforms
    (estimationBreakdown.platforms || []).forEach(p => {
      newItems.push({
        id: `eng-p-${p.id}-${Date.now()}`,
        name: p.label || p.platformType || 'Platform',
        finish: p.finish || '',
        drawing: '',
        material: Math.round(getMat(p) * 100) / 100,
        shopHrs: p.shopHours || 0,
        fieldHrs: p.fieldHours || 0,
        included: true,
        isEngineItem: true
      });
    });

    // Rails
    (estimationBreakdown.rails || []).forEach(r => {
      newItems.push({
        id: `eng-r-${r.id}-${Date.now()}`,
        name: r.label || r.railType || 'Rail',
        finish: r.finish || '',
        drawing: '',
        material: Math.round(getMat(r) * 100) / 100,
        shopHrs: r.shopHours || 0,
        fieldHrs: r.fieldHours || 0,
        included: true,
        isEngineItem: true
      });
    });

    // Add 5 empty rows for extras
    for(let i=0; i<5; i++) {
      newItems.push({ id: `ci-extra-${i}-${Date.now()}`, name: '', finish: '', drawing: '', material: 0, shopHrs: 0, fieldHrs: 0, included: false, isEngineItem: false });
    }

    setCustomItems(newItems);
    // 🔄 USER REQUEST: Keep the base total as the starting point. 
    // Imported engine items are for reference only and won't be re-added to the total.
    // setUsedBaseTotal(0); 
  };


  /* ── Derived Engine Calculations ── */
  const isEngine = (item) => item.isEngineItem || (item.id && String(item.id).startsWith('eng-'));

  // 🔄 USER REQUEST: "Engine Items" (imported items) show values but do NOT contribute to calculation.
  const ciIncluded = customItems.filter((i) => i.included && !isEngine(i));
  const totalMaterial = ciIncluded.reduce((s, i) => s + i.material, 0);
  const totalShopHrs = ciIncluded.reduce((s, i) => s + i.shopHrs, 0);
  const totalFieldHrs = ciIncluded.reduce((s, i) => s + i.fieldHrs, 0);
  const totalMounting = ciIncluded.reduce((s, i) => s + calcCIMounting(i), 0);
  const totalLineItemsCost = ciIncluded.reduce((s, i) => s + calcCI(i), 0);
  const totalPW = totalFieldHrs / 8;

  // Delivery
  const deliveryCost = delivery.reduce((sum, key) => {
    const opt = DELIVERY_OPTIONS.find(o => o.key === key);
    return sum + (opt?.cost || 0);
  }, 0);


  // Conditional Labor
  const totalDays = totalFieldHrs / 8;
  const isOvernights = totalDays > 3;
  const jobDaysRounded = Math.ceil(totalDays);

  const calcOvernights = isOvernights ? totalDays * overnightRate : 0;
  // Formula: (Days / 2.5) * Trucks * TravelRate
  const calcDailyTravel = isOvernights ? (totalDays / 2.5) * trucks * travelRate : 0;
  // Travel formula when under threshold: (Days / 2.5) * Trucks * TravelRate * 8 (to match hourly-like scaling in spreadsheet)
  // Actually, plan says: ((totalFieldHours / 8 / 2.5) * trucks * 58)
  const calcTravel = !isOvernights ? (totalDays / 2.5) * trucks * travelRate : 0;

  const finalOvernights = manualOvernights !== '' ? parseFloat(manualOvernights) || 0 : calcOvernights;
  const finalTravel = manualTravel !== '' ? parseFloat(manualTravel) || 0 : calcTravel;
  const finalDailyTravel = manualDailyTravel !== '' ? parseFloat(manualDailyTravel) || 0 : calcDailyTravel;

  // Scope Adjustments
  const calcSafety = totalFieldHrs * (fieldRate + porRokRate) * (safetyPct / 100);
  const calcDetailing = totalLineItemsCost * (detailingPct / 100);
  const calcTax = totalMaterial * (taxPct / 100);

  // Totals
  const subTotal = usedBaseTotal + totalLineItemsCost + deliveryCost + finalOvernights + finalTravel + finalDailyTravel + calcSafety + calcDetailing + calcTax;

  const overheadAmt = subTotal * (overheadPct / 100);
  const profitAmt = (subTotal + overheadAmt) * (profitPct / 100);
  const jobTotal = subTotal + overheadAmt + profitAmt;

  /* ── Overlay click ── */
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="acm-overlay" onClick={handleOverlayClick}>
      <motion.div 
        className="acm-modal acm-modal-xl" 
        role="dialog" 
        aria-modal="true"
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
      >

        {/* ══ Header ══════════════════════════════════════════════════════ */}
        <div 
          className="acm-header" 
          onPointerDown={(e) => dragControls.start(e)}
          style={{ cursor: 'grab', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h2 className="acm-title">Additional Costs (Engine)</h2>
              <p className="acm-subtitle">Strict calculations based on extracted spreadsheet formulas</p>
            </div>
            <div className="acm-header-total-pill">
              <span className="acm-tp-label">Total Estimation Cost</span>
              <span className="acm-tp-val">${fmt(baseTotal)}</span>
            </div>
          </div>
          <button className="acm-close-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* ══ Body ════════════════════════════════════════════════════════ */}
        <div className="acm-body">

          {/* ── 1. Global Variables ── */}
          <div className="acm-section-block acm-rates-block">
            <span className="acm-section-label">Global Job Variables</span>
            <div className="acm-rates-grid">
              <div className="acm-rate-input-wrap">
                <span className="acm-rate-label">Shop Rate</span>
                <div className="acm-pct-wrap"><span className="acm-pct-sign">$</span>
                  <input type="number" className="acm-pct-input" value={shopRate} onChange={(e) => updateGlobal('shopRate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                </div>
              </div>
              <div className="acm-rate-input-wrap">
                <span className="acm-rate-label">Field Rate</span>
                <div className="acm-pct-wrap"><span className="acm-pct-sign">$</span>
                  <input type="number" className="acm-pct-input" value={fieldRate} onChange={(e) => updateGlobal('fieldRate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                </div>
              </div>
              <div className="acm-rate-input-wrap">
                <span className="acm-rate-label">Por-Rok / P.W. Rate</span>
                <div className="acm-pct-wrap"><span className="acm-pct-sign">$</span>
                  <input type="number" className="acm-pct-input" value={porRokRate} onChange={(e) => updateGlobal('porRokRate', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                </div>
              </div>
              <div className="acm-rate-input-wrap">
                <span className="acm-rate-label">Trucks</span>
                <div className="acm-pct-wrap">
                  <input type="number" className="acm-pct-input" value={trucks} onChange={(e) => updateGlobal('trucks', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Line Items Table ── */}
          <div className="acm-section-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="acm-section-label">Custom Fabrications <span className="acm-count-badge">{ciIncluded.length}</span></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {estimationBreakdown && (
                  <button className="acm-sync-btn" onClick={importFromEstimation} title="Import materials, shop and field hours from the engine result">
                    ⚡ Import from Estimation
                  </button>
                )}
                {usedBaseTotal === 0 && (
                  <button className="acm-sync-btn acm-btn-ghost" onClick={() => setUsedBaseTotal(baseTotal)}>
                    Reset Base Total
                  </button>
                )}
              </div>
            </div>

            {customItems.length > 0 && (
              <div className="acm-items-table acm-ci-table">
                <div className="acm-ci-hdr">
                   <div className="acm-tc-chk" />
                  <div className="acm-tc-item">ITEM #</div>
                  <div className="acm-tc-name">Description</div>
                  <div className="acm-tc-finish">Finish</div>
                  <div className="acm-tc-dwg">Drawing</div>
                  <div className="acm-tc-mat">Material $</div>
                  <div className="acm-tc-hrs">Shop (${fmt(shopRate)})</div>
                  <div className="acm-tc-hrs">Field (${fmt(fieldRate)})</div>
                  <div className="acm-tc-hrs">P.W.</div>
                  <div className="acm-tc-total">Cost</div>
                  <div className="acm-tc-del" />
                </div>

                {customItems.map((item, idx) => (
                  <div key={item.id} className={`acm-ci-row ${item.included ? '' : 'row-excluded'}`}>
                     <div className="acm-tc-chk">
                      <input type="checkbox" className="acm-checkbox" checked={item.included} onChange={() => updateCI(item.id, { included: !item.included })} />
                    </div>
                   <div className="acm-tc-item">{idx + 1}</div>
                    <div className="acm-tc-name">
                      <TextCell value={item.name} onChange={(v) => updateCI(item.id, { name: v, included: v ? true : item.included })} placeholder="Item description..." />
                    </div>
                    <div className="acm-tc-finish">
                      <TextCell value={item.finish} onChange={(v) => updateCI(item.id, { finish: v })} placeholder="None" />
                    </div>
                    <div className="acm-tc-dwg">
                      <TextCell value={item.drawing} onChange={(v) => updateCI(item.id, { drawing: v })} placeholder="N/A" />
                    </div>
                    <div className="acm-tc-mat">
                      <NumCell value={item.material} step="0.01" onChange={(v) => updateCI(item.id, { material: v })} className="acm-price-input" />
                    </div>
                    <div className="acm-tc-hrs">
                      <NumCell value={item.shopHrs} step="0.5" onChange={(v) => updateCI(item.id, { shopHrs: v })} className="acm-price-input" />
                    </div>
                    <div className="acm-tc-hrs">
                      <NumCell value={item.fieldHrs} step="0.5" onChange={(v) => updateCI(item.id, { fieldHrs: v })} className="acm-price-input" />
                    </div>
                    <div className="acm-tc-hrs acm-muted">{fmt(item.fieldHrs / 8)}</div>
                    <div className="acm-tc-total acm-money">
                      {isEngine(item) ? (
                        <span style={{ opacity: 0.6, fontSize: '11px', fontStyle: 'italic' }}>Informative</span>
                      ) : (
                        `$${fmt(calcCI(item))}`
                      )}
                    </div>
                    <div className="acm-tc-del">
                      <button className="acm-del-btn" onClick={() => deleteCI(item.id)} title="Remove"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                
                {/* Summary Totals Row */}
                {/* Summary Totals Row */}
                <div className="acm-ci-totals-row">
                  <div className="acm-ci-totals-label" style={{ gridColumn: 'span 3' }}>Totals</div>
                  <div className="acm-tc-mat acm-money">${fmt(totalMaterial)}</div>
                  <div className="acm-tc-hrs">{totalShopHrs}</div>
                  <div className="acm-tc-hrs">{totalFieldHrs}</div>
                  <div className="acm-tc-hrs">{fmt(totalPW)}</div>
                  <div className="acm-tc-total acm-money">${fmt(totalLineItemsCost)}</div>
                  <div className="acm-tc-del" />
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="acm-add-line-btn" onClick={() => {
                setCustomItems(prev => [
                  ...prev,
                  { id: `ci-${prev.length}-${Date.now()}`, name: '', finish: '', drawing: '', material: 0, shopHrs: 0, fieldHrs: 0, included: false, isEngineItem: false }
                ]);
              }}>
                <Plus size={14} /> Add Row
              </button>
              <span className="acm-muted" style={{ fontSize: '11px' }}>Rows automatically added as you type. "Engine" items show breakdown but don't add to cost.</span>
            </div>
          </div>

          {/* ── 3. Labor & Delivery Adjustments ── */}
          <div className="acm-grid-2">
            <div className="acm-section-block">
              <span className="acm-section-label">Labor Adjustments</span>
              <div className="acm-adj-table">
                <div className="acm-adj-hdr acm-labor-hdr">
                  <div className="acm-col-name">Item</div>
                  <div className="acm-col-pct">Cond.</div>
                  <div className="acm-col-base">Calculated</div>
                  <div className="acm-col-amt">Manual Override</div>
                </div>
                {/* Overnights */}
                <div className={`acm-adj-row ${isOvernights ? '' : 'acm-muted'}`}>
                  <div className="acm-col-name">
                    <div className="acm-adj-title">Overnights</div>
                    <div className="acm-adj-breakdown">{fmt(totalDays)} Days × ${fmt(overnightRate)}/day</div>
                    <div className="acm-adj-reason">{isOvernights ? `Active: ${fmt(totalFieldHrs)} hrs > 24hr threshold` : `Inactive: Under 24hr threshold`}</div>
                  </div>
                  <div className="acm-col-pct">
                    <span className={`acm-cond-badge ${isOvernights ? 'active' : 'inactive'}`}>
                      {isOvernights ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div className="acm-col-base">${fmt(calcOvernights)}</div>
                  <div className="acm-col-amt">
                    <div className="acm-override-wrap">
                      <OverrideInput value={manualOvernights} placeholderVal={calcOvernights} onChange={setManualOvernights} />
                      <span className="acm-override-hint">Override</span>
                    </div>
                  </div>
                </div>
                {/* Travel */}
                <div className={`acm-adj-row ${!isOvernights ? '' : 'acm-muted'}`}>
                  <div className="acm-col-name">
                    <div className="acm-adj-title">Travel Cost</div>
                    <div className="acm-adj-breakdown">Mutually exclusive with Overnights</div>
                    <div className="acm-adj-reason">{!isOvernights ? `Active: Under 24hr threshold` : `Inactive: Exceeds 3 days`}</div>
                  </div>
                  <div className="acm-col-pct">
                    <span className={`acm-cond-badge ${!isOvernights ? 'active' : 'inactive'}`}>
                      {!isOvernights ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div className="acm-col-base">${fmt(calcTravel)}</div>
                  <div className="acm-col-amt">
                    <div className="acm-override-wrap">
                      <OverrideInput value={manualTravel} placeholderVal={calcTravel} onChange={setManualTravel} />
                      <span className="acm-override-hint">Override</span>
                    </div>
                  </div>
                </div>
                {/* Daily Travel */}
                <div className={`acm-adj-row ${isOvernights ? '' : 'acm-muted'}`}>
                  <div className="acm-col-name">
                    <div className="acm-adj-title">Daily Travel</div>
                    <div className="acm-adj-breakdown">({fmt(totalDays / 2.5)} fact. × {trucks} Trk.) × {jobDaysRounded} Days × ${fmt(travelRate)}</div>
                    <div className="acm-adj-reason">{isOvernights ? `Active: ${fmt(totalFieldHrs)} hrs > 24hr threshold` : `Inactive: Under 24hr threshold`}</div>
                  </div>
                  <div className="acm-col-pct">
                    <span className={`acm-cond-badge ${isOvernights ? 'active' : 'inactive'}`}>
                      {isOvernights ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div className="acm-col-base">${fmt(calcDailyTravel)}</div>
                  <div className="acm-col-amt">
                    <div className="acm-override-wrap">
                      <OverrideInput value={manualDailyTravel} placeholderVal={calcDailyTravel} onChange={setManualDailyTravel} />
                      <span className="acm-override-hint">Override</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="acm-section-block">
              <span className="acm-section-label">Delivery Options</span>
              <div className="acm-radio-list">
                {DELIVERY_OPTIONS.filter(o => o.key !== 'none').map((opt) => (
                  <label key={opt.key} className={`acm-radio-row ${delivery.includes(opt.key) ? 'selected' : ''}`}>
                    <input 
                      type="checkbox" 
                      name="acm-delivery" 
                      value={opt.key} 
                      checked={delivery.includes(opt.key)} 
                      onChange={() => {
                        setDelivery(prev => 
                          prev.includes(opt.key) 
                            ? prev.filter(k => k !== opt.key) 
                            : [...prev, opt.key]
                        );
                      }} 
                    />
                    <span className="acm-radio-label">{opt.label}</span>
                    {opt.cost > 0 && <span className="acm-radio-cost">+${fmt(opt.cost)}</span>}
                  </label>
                ))}
                {delivery.length === 0 && (
                  <div className="acm-muted" style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                    No delivery options selected.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── 4. Scope Adjustments ── */}
          <div className="acm-section-block">
            <span className="acm-section-label">Scope Adjustments</span>
            <div className="acm-adj-table">
              <div className="acm-adj-hdr acm-scope-hdr">
                <div className="acm-col-name">Adjustment</div>
                <div className="acm-col-pct">Rate %</div>
                <div className="acm-col-base">Applied To</div>
                <div className="acm-col-amt">Amount</div>
              </div>
              <div className="acm-adj-row">
                <div className="acm-col-name">
                  <div className="acm-adj-title">Safety Costs</div>
                  <div className="acm-adj-breakdown">Formula: {fmt(totalFieldHrs)} hrs × (${fmt(fieldRate)} + ${fmt(porRokRate)})</div>
                </div>
                <div className="acm-col-pct">
                  <div className="acm-pct-wrap"><input type="number" className="acm-pct-input" value={safetyPct} onChange={(e) => setSafetyPct(e.target.value)} /><span className="acm-pct-sign">%</span></div>
                </div>
                <div className="acm-col-base acm-muted">Field + PorRok</div>
                <div className="acm-col-amt acm-money">${fmt(calcSafety)}</div>
              </div>
              <div className="acm-adj-row">
                <div className="acm-col-name">
                  <div className="acm-adj-title">Detailing</div>
                  <div className="acm-adj-breakdown">Applied to total custom items (${fmt(totalLineItemsCost)})</div>
                </div>
                <div className="acm-col-pct">
                  <div className="acm-pct-wrap"><input type="number" className="acm-pct-input" value={detailingPct} onChange={(e) => setDetailingPct(e.target.value)} /><span className="acm-pct-sign">%</span></div>
                </div>
                <div className="acm-col-base acm-muted">Line Items</div>
                <div className="acm-col-amt acm-money">${fmt(calcDetailing)}</div>
              </div>
              <div className="acm-adj-row">
                <div className="acm-col-name">
                  <div className="acm-adj-title">Material Tax</div>
                  <div className="acm-adj-breakdown">Applied to Materials Only (${fmt(totalMaterial)})</div>
                </div>
                <div className="acm-col-pct">
                  <div className="acm-pct-wrap"><input type="number" className="acm-pct-input" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} /><span className="acm-pct-sign">%</span></div>
                </div>
                <div className="acm-col-base acm-muted">Materials Only</div>
                <div className="acm-col-amt acm-money">${fmt(calcTax)}</div>
              </div>
            </div>
          </div>

          {/* ── 5. Markups (Overhead & Profit) ── */}
          <div className="acm-section-block">
            <span className="acm-section-label">Markups</span>
            <div className="acm-markup-grid">
              <div className="acm-markup-card">
                <div className="acm-markup-info">
                  <span className="acm-markup-name">Overhead</span>
                  <span className="acm-markup-desc">Applied to Sub Total</span>
                </div>
                <div className="acm-pct-wrap">
                  <input type="number" className="acm-pct-input acm-markup-input" value={overheadPct} min={0} step={0.1} onChange={(e) => setOverheadPct(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                  <span className="acm-pct-sign">%</span>
                </div>
                <div className="acm-markup-amt">${fmt(overheadAmt)}</div>
              </div>
              <div className="acm-markup-card">
                <div className="acm-markup-info">
                  <span className="acm-markup-name">Profit</span>
                  <span className="acm-markup-desc">Applied to (Sub + Overhead)</span>
                </div>
                <div className="acm-pct-wrap">
                  <input type="number" className="acm-pct-input acm-markup-input" value={profitPct} min={0} step={0.1} onChange={(e) => setProfitPct(parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} />
                  <span className="acm-pct-sign">%</span>
                </div>
                <div className="acm-markup-amt">${fmt(profitAmt)}</div>
              </div>
            </div>
          </div>

        </div>{/* /body */}

        {/* ══ Footer ══════════════════════════════════════════════════════ */}
        <div className="acm-footer">
          {/* Running breakdown */}
          <div className="acm-footer-breakdown">
            <div className="acm-breakdown-row">
              <span>Sub Total (Base + Items + Labor + Scope + Del)</span>
              <span>${fmt(subTotal)}</span>
            </div>
            {overheadAmt > 0 && (
              <div className="acm-breakdown-row">
                <span>Overhead</span>
                <span>+ ${fmt(overheadAmt)}</span>
              </div>
            )}
            {profitAmt > 0 && (
              <div className="acm-breakdown-row">
                <span>Profit</span>
                <span>+ ${fmt(profitAmt)}</span>
              </div>
            )}
            <div className="acm-breakdown-row acm-new-total-row">
              <span>Job Total</span>
              <span className="acm-new-total-val">${fmt(jobTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="acm-footer-actions">
            <button className="acm-btn-outline" onClick={onClose}>Cancel</button>
            <button className="acm-btn-primary" onClick={() => onApply({
              total: jobTotal,
              usedBaseTotal,
              globalVars,
              customItems,
              delivery,
              manualOvernights,
              manualTravel,
              manualDailyTravel,
              safetyPct,
              detailingPct,
              taxPct,
              overheadPct,
              profitPct
            })}>

              Apply Changes
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
