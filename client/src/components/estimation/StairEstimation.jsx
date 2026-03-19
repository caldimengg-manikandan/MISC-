// src/components/estimation/StairEstimation.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import StairConfig from './stair/StairConfig';
import LandingConfig from './stair/LandingConfig';
import RailConfig from './stair/RailConfig';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

let uid = 100; // Start from 100 to avoid collision with DB-restored IDs
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'guardRail', label: 'Guard Rail', badge: 'GUARD', icon: '🛡' },
  { key: 'wallRail', label: 'Wall Rail', badge: 'WALL', icon: '🔘' },
  { key: 'grabRail', label: 'Grab Rail', badge: 'GRAB', icon: '✊' },
  { key: 'caneRail', label: 'Cane Rail', badge: 'CANE', icon: '🦯' },
];

// Helper: restore numeric IDs from saved data, ensuring all fields required by the UI are present
const restoreStairs = (savedStairs) => {
  if (!Array.isArray(savedStairs)) return [];
  return savedStairs.map((s, si) => ({
    ...s,
    id:      s.id      ?? makeId(),
    label:   s.label   || s.stairName || `Stair ${si + 1}`,
    history: s.history ?? { lastDeleted: null },
    flights:  (s.flights  || []).map((f, fi) => ({
      ...f,
      id:    f.id    ?? makeId(),
      label: f.label || `Flight ${fi + 2}`,
    })),
    landings: (s.landings || []).map((l, li) => ({
      ...l,
      id:    l.id    ?? makeId(),
      label: l.label || `Landing ${li + 1}`,
    })),
    rails: (s.rails || []).map((r, ri) => {
      const meta = RAIL_TYPES.find(t => t.key === r.type);
      return {
        ...r,
        id:    r.id    ?? makeId(),
        label: r.label || (meta ? `${meta.label} ${ri + 1}` : `Rail ${ri + 1}`),
      };
    }),
  }));
};



// ── Collapsible Wrapper ─────────────────────────────────────────────────────
function CollapsibleSection({ badge, subBadge, title, subtitle, onDelete, onDuplicate, children, defaultOpen = true, headerClass = "" }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div 
      layout
      className="collapsible-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`collapsible-header ${headerClass}`} onClick={() => setOpen(o => !o)}>
        <div className="collapsible-header-left">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <span className="collapsible-type-badge">{badge}</span>
            {subBadge && <span className="collapsible-type-badge" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', fontSize: '8.5px', padding: '1px 5px' }}>{subBadge}</span>}
          </div>
          <div>
            <div className="collapsible-title" style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>{title}</div>
            {subtitle && <div className="collapsible-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="collapsible-header-right" onClick={e => e.stopPropagation()}>
          <div className="collapsible-actions">
            {onDuplicate && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="icon-btn" title="Duplicate/Copy" onClick={onDuplicate}>
                <span style={{ fontSize: '14px' }}>📋</span>
              </motion.button>
            )}
            {onDelete && (
              <motion.button whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }} whileTap={{ scale: 0.9 }} className="icon-btn danger" title="Delete" onClick={onDelete}>
                <span style={{ fontSize: '14px' }}>✕</span>
              </motion.button>
            )}
          </div>
          <span className={`expand-chevron ${open ? 'open' : ''}`} style={{ fontSize: '18px', marginLeft: '12px' }}>▾</span>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="collapsible-body">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stair Item (groups stair + its flights, landings, rails) ───────────────
function StairItem({ 
  stair, 
  onDeleteStair, 
  onDuplicateStair,
  onUpdateStair,
  onAddFlight,
  onCopyLastFlight,
  onAddLanding,
  onAddRail,
  onUpdateSubItem,
  onDuplicateSubItem,
  onDeleteSubItem,
  onUndoDeleteSubItem,
  history
}) {
  const flights = stair.flights || [];
  const landings = stair.landings || [];
  const rails = stair.rails || [];

  const railMeta = (r) => RAIL_TYPES.find(t => t.key === r.type);

  return (
    <CollapsibleSection
      badge="STAIR"
      subBadge="FLIGHT 1"
      title={stair.label}
      subtitle={stair.stairType || 'Primary Stair Flight Configuration'}
      onDelete={onDeleteStair}
      onDuplicate={onDuplicateStair}
      defaultOpen={true}
      headerClass="header-stair"
    >
      {/* Stair Config Form */}
      <StairConfig stair={stair} onChange={onUpdateStair} />

      <div className="divider" />

      {/* ── Flights ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Flights ({flights.length + 1})
          </span>
          {history.lastDeleted?.type === 'flight' && (
            <button className="text-btn" onClick={() => onUndoDeleteSubItem('flight')} style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
              ↩ Undo Delete
            </button>
          )}
        </div>

        {flights.map(fl => (
          <CollapsibleSection
            key={fl.id}
            badge="FLIGHT"
            title={fl.label}
            subtitle="Stair flight geometry"
            onDelete={() => onDeleteSubItem('flight', fl.id)}
            onDuplicate={() => onDuplicateSubItem('flight', fl.id)}
            defaultOpen={false}
            headerClass="header-flight"
          >
            <StairConfig
              stair={{ ...stair, ...fl }}
              onChange={(changes) => onUpdateSubItem('flight', fl.id, changes)}
              isFlightMode
            />
          </CollapsibleSection>
        ))}
        {/* Flight actions kept in a single linear row aligned with rails workflow */}
        <div className="add-section-row" style={{ marginTop: flights.length ? '16px' : '8px', justifyContent: 'flex-start' }}>
          <button className="add-btn ghost" onClick={onCopyLastFlight} id="copy-flight">
            ⎘ Copy from Above
          </button>
          <button className="add-btn" onClick={onAddFlight} id="add-flight">
            + Add Flight
          </button>
        </div>
      </div>

      {/* ── Landings ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Landings ({landings.length})
            </span>
            {history.lastDeleted?.type === 'landing' && (
              <button className="text-btn" onClick={() => onUndoDeleteSubItem('landing')} style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                ↩ Undo Delete
              </button>
            )}
          </div>
          <button className="add-btn" onClick={onAddLanding} id="add-landing">
            + Add Landing
          </button>
        </div>

        {landings.map(l => (
          <CollapsibleSection
            key={l.id}
            badge="LANDING"
            title={l.label}
            subtitle="Platform dimensions and type"
            onDelete={() => onDeleteSubItem('landing', l.id)}
            onDuplicate={() => onDuplicateSubItem('landing', l.id)}
            defaultOpen={false}
            headerClass="header-landing"
          >
            <LandingConfig
              data={l}
              onChange={(changes) => onUpdateSubItem('landing', l.id, changes)}
            />
          </CollapsibleSection>
        ))}

        {landings.length === 0 && !history.lastDeleted?.type === 'landing' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>
            No landings added — click "+ Add Landing" to begin.
          </div>
        )}

        {/* Add landing control below list */}
        {landings.length > 0 && (
          <div className="add-section-row" style={{ marginTop: '16px' }}>
            <button className="add-btn" onClick={onAddLanding}>
              + Add Landing
            </button>
          </div>
        )}
      </div>

      {/* ── Rails ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Rails ({rails.length})
            </span>
            {history.lastDeleted?.type === 'rail' && (
              <button className="text-btn" onClick={() => onUndoDeleteSubItem('rail')} style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                ↩ Undo Delete
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          {rails.map(r => {
            const meta = railMeta(r);
            return (
              <CollapsibleSection
                key={r.id}
                badge={meta.badge}
                title={r.label}
                subtitle={`${meta.label} configuration`}
                onDelete={() => onDeleteSubItem('rail', r.id)}
                onDuplicate={() => onDuplicateSubItem('rail', r.id)}
                defaultOpen={false}
                headerClass={`header-${r.type.replace('Rail', '')}`}
              >
                <RailConfig
                  type={r.type}
                  data={r}
                  onChange={(changes) => onUpdateSubItem('rail', r.id, changes)}
                />
              </CollapsibleSection>
            );
          })}
        </div>

        {rails.length === 0 && !history.lastDeleted?.type === 'rail' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px', marginTop: '8px' }}>
            No rails added — use the buttons below to add rail types.
          </div>
        )}

        {/* Rail type add buttons (positioned after existing rails for easier workflow) */}
        <div className="add-section-row" style={{ marginTop: rails.length ? '16px' : '8px' }}>
          {RAIL_TYPES.map(rt => (
            <button
              key={rt.key}
              className="add-btn"
              onClick={() => onAddRail(rt.key)}
              id={`add-${rt.key}`}
            >
              {rt.icon} + {rt.label}
            </button>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function StairEstimation() {
  const [stairs, setStairs] = useState([
    { 
      id: makeId(), 
      label: 'Stair 1', 
      stairType: '', 
      drawingRef: '', 
      flights: [], 
      landings: [], 
      rails: [],
      history: { lastDeleted: null },
      template: 'custom'
    }
  ]);
  const [projectData, setProjectData] = useState({ projectName: '', projectNumber: '', projectId: null });
  const [templateModal, setTemplateModal] = useState({ isOpen: false, nextLabel: 'Stair 1' });
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimationResult, setEstimationResult] = useState(null);
  const stairsRef = useRef(stairs);
  stairsRef.current = stairs;

  // ── Load project info + stair data from DB on mount ───────────────────────
  useEffect(() => {
    const savedInfo = localStorage.getItem('steelProjectInfo');
    if (!savedInfo) return;
    try {
      const parsed = JSON.parse(savedInfo);
      setProjectData({
        projectName:   parsed.projectName   || '',
        projectNumber: parsed.projectNumber || '',
        projectId:     parsed.id            || null,
      });

      const projectId = parsed.id;
      if (!projectId) return;

      const token = localStorage.getItem('steel_token');
      if (!token) return;

      // Fetch full project from DB to restore stairs/rails
      fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.project) {
            const proj = data.project;
            // Update project data with full DB fields
            setProjectData(prev => ({
              ...prev,
              projectId: proj.id,
              projectName:   proj.projectName   || prev.projectName,
              projectNumber: proj.projectNumber || prev.projectNumber,
            }));

            // Restore stairs from DB
            const raw = proj.stairs;
            const saved = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : null);
            if (saved && saved.length > 0) {
              const restored = restoreStairs(saved);
              if (restored.length > 0) {
                setStairs(restored);
                toast.success(`Loaded ${restored.length} stair(s) from database`);
              }
            }
          }
        })
        .catch(err => console.error('Failed to load project stairs:', err));
    } catch (e) {
      console.error('Failed to parse project info:', e);
    }
  }, []);

  // ── Save stairs to DB ─────────────────────────────────────────────────────
  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('steel_token');
      if (!token) { toast.error('Please log in first'); return; }

      const savedInfo = localStorage.getItem('steelProjectInfo');
      const parsed = savedInfo ? JSON.parse(savedInfo) : {};
      const projectId = projectData.projectId || parsed.id;

      if (!projectId) {
        toast.error('No project selected. Please select a project from Project Info first.');
        return;
      }

      // Strip history (not needed in DB)
      const stairsToSave = stairsRef.current.map(({ history, ...s }) => s);

      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stairs: stairsToSave })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Changes saved to database ✓');
      } else {
        toast.error(data.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [projectData.projectId]);

  // ── Calculate Estimation via backend ─────────────────────────────────────
  const calculateEstimation = useCallback(async () => {
    setCalculating(true);
    try {
      const token = localStorage.getItem('steel_token');

      // Build rail payloads from stairs
      const rails = [];
      stairsRef.current.forEach(stair => {
        (stair.rails || []).forEach(r => {
          rails.push({
            rail_type_id: r.railType || r.type || '',
            length: parseFloat(r.railLength) || 0,
            spacing: parseFloat(r.postSpacing) || 4,
          });
        });
      });

      const payload = {
        rails,
        platforms: [],
        stringers: [],
        pricing_map: {},
        labor_rates: {},
        finish_rate_per_lb: 0,
      };

      const res = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success !== false) {
        setEstimationResult(data);
        toast.success('Estimation calculated ✓');
      } else {
        toast.error(data.error || 'Calculation failed');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      toast.error('Calculation failed: ' + err.message);
    } finally {
      setCalculating(false);
    }
  }, []);

  // ── Live per-change calculation (debounced 400ms) ─────────────────────────
  // Fires whenever stair data changes; embeds calc results back into each rail + landing.
  const liveCalcTimer = useRef(null);
  const isUpdatingFromCalc = useRef(false); // prevents infinite loop

  const triggerLiveCalc = useCallback((latestStairs) => {
    clearTimeout(liveCalcTimer.current);
    liveCalcTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('steel_token');

      // ── Build payloads for rails and platforms (generic /api/calculate) ──
      const railPayloads = [];
      latestStairs.forEach((stair, si) => {
        (stair.rails || []).forEach((r, ri) => {
          if (!r.rail_type_id && !r.railType) return;
          railPayloads.push({
            _ref: { si, ri },
            rail_type_id: r.rail_type_id || r.railType || null,
            length: parseFloat(r.railLength) || 0,
            spacing: parseFloat(r.postSpacing) || 4,
          });
        });
      });

      const platformPayloads = [];
      latestStairs.forEach((stair, si) => {
        (stair.landings || []).forEach((l, li) => {
          if (!l.platform_type_id && !l.platformType) return;
          platformPayloads.push({
            _ref: { si, li },
            platform_type_id: l.platform_type_id || l.platformType || null,
            length: parseFloat(l.platformLength) || 0,
            width: parseFloat(l.platformWidth) || 0,
          });
        });
      });

      const stairPayloads = latestStairs
        .filter(s => s.rise && s.run)
        .map(s => ({
          height: s.totalHeight ? parseFloat(s.totalHeight) : (parseFloat(s.rise) * (parseFloat(s.numRisers) || 1)),
          rise: parseFloat(s.rise) || 0,
          run: parseFloat(s.run) || 0,
        }));

      // ── Per-stair FLIGHT calculation (stringer + pan plate) ─────────────
      // Only fires when enough inputs are provided
      const flightPromises = latestStairs.map(async (stair, si) => {
        const hasEnough = stair.rise && stair.run && stair.numRisers && stair.stairWidth && stair.stringerSize;
        if (!hasEnough) return { si, result: null };

        try {
          const res = await fetch(`${API_BASE_URL}/api/calculate/stair-flight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              stairWidthFt:      parseFloat(stair.stairWidth) || 0,
              riseIn:            parseFloat(stair.rise) || 0,
              runIn:             parseFloat(stair.run) || 0,
              numRisers:         parseInt(stair.numRisers) || 0,
              stringerProfileId: stair.stringerSize,
              stairType:         stair.stairType || 'pan-concrete',
              extentBotNSIn:     parseFloat(stair.nsStringerBot) || 0,
              extentBotFSIn:     parseFloat(stair.fsStringerBot) || 0,
              extentTopNSIn:     parseFloat(stair.nsStringerTop) || 0,
              extentTopFSIn:     parseFloat(stair.fsStringerTop) || 0,
              connectionTypeBot: stair.nsStringerConnBot || 'WELDED',
              connectionTypeTop: stair.nsStringerConnTop || 'WELDED',
              finish:            stair.finish || 'PRIMER',
            }),
          });
          const data = await res.json();
          return { si, result: data.success ? data : null };
        } catch { return { si, result: null }; }
      });

      // ── Generic rails/platforms/geometry calc ────────────────────────────
      const genericPromise = (railPayloads.length > 0 || platformPayloads.length > 0 || stairPayloads.length > 0)
        ? fetch(`${API_BASE_URL}/api/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              rails: railPayloads,
              platforms: platformPayloads,
              stairs: stairPayloads,
              stringers: [],
              pricing_map: {},
              labor_rates: {},
              finish_rate_per_lb: 0,
            }),
          }).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      const [flightResults, genericResult] = await Promise.all([
        Promise.all(flightPromises),
        genericPromise,
      ]);

      if (genericResult?.success === false && flightResults.every(f => !f.result)) return;

      // Embed all results back into stair state
      isUpdatingFromCalc.current = true;
      setStairs(prev => {
        const next = prev.map(s => ({ ...s, rails: [...(s.rails || [])], landings: [...(s.landings || [])] }));

        // Rails from generic calc
        (genericResult?.breakdown?.rail?.items || []).forEach((item, idx) => {
          const ref = railPayloads[idx]?._ref;
          if (!ref) return;
          const rail = next[ref.si]?.rails?.[ref.ri];
          if (rail) {
            next[ref.si].rails[ref.ri] = {
              ...rail,
              calcPostQty: item.postQty   ?? 0,
              calcSteel:   item.steelWeight ?? 0,
              calcShop:    item.shopLabor  ?? 0,
              calcField:   item.fieldLabor ?? 0,
            };
          }
        });

        // Platforms / landings from generic calc
        (genericResult?.breakdown?.platform?.items || []).forEach((item, idx) => {
          const ref = platformPayloads[idx]?._ref;
          if (!ref) return;
          const landing = next[ref.si]?.landings?.[ref.li];
          if (landing) {
            next[ref.si].landings[ref.li] = {
              ...landing,
              calcArea:  item.area ?? 0,
              calcSteel: item.steelWeight ?? 0,
              calcShop:  item.shopLabor  ?? 0,
              calcField: item.fieldLabor ?? 0,
            };
          }
        });

        // Stair Geometry from generic calc
        (genericResult?.breakdown?.stairGeometry || []).forEach((geo, idx) => {
           // We don't have a direct ref because we mapped them sequentially
           // But they are in the same order as latestStairs (filtered by rise/run)
           // Actually, it's easier to find the index of the stair that has rise/run
           const originalIndex = latestStairs.findIndex((s, i) => s.rise && s.run && !next[i]._processedGeometric);
           if (originalIndex !== -1) {
              const s = next[originalIndex];
              next[originalIndex] = {
                ...s,
                _processedGeometric: true, // internal flag for this loop
                // ONLY set if they are Auto or empty
                numRisers: (s.numRisers === '' || !s.numRisers) ? String(geo.risers) : s.numRisers,
                slope:     (s.slope === '' || !s.slope) ? String(geo.slope) : s.slope,
                angle:     (s.angle === '' || !s.angle) ? String(geo.angle) : s.angle,
              };
           }
        });

        // Remove temp flags
        next.forEach(s => delete s._processedGeometric);

        // Stair flight results (stringer + pan plate + labor)
        flightResults.forEach(({ si, result }) => {
          if (!result) return;
          next[si] = {
            ...next[si],
            // Geometry (read-only display fields)
            calcSlopeIn:   result.geometry?.stepSlopeIn,
            calcAngleDeg:  result.geometry?.angleDeg,
            // Stringer
            calcStringerLF:    result.stringer?.totalLF,
            calcStringerSteel: result.stringer?.burdenedWeightLbs,
            // Pan plate
            calcPanArea:   result.panPlate?.areaSqFt,
            calcPanSteel:  result.panPlate?.burdenedWeightLbs,
            // Labor
            calcShopHrs:   result.labor?.totalShopHrs,
            calcFieldHrs:  result.labor?.totalFieldHrs,
            calcShopCost:  result.labor?.shopLaborCost,
            calcFieldCost: result.labor?.fieldLaborCost,
            // Totals
            calcTotalSteel:    result.summary?.totalSteelLbs,
            calcSubtotal:      result.summary?.subtotal,
            calcTax:           result.summary?.taxAmount,
            calcTotalCost:     result.summary?.totalEstimatedCost,
            // Full result for summary panel
            flightCalcResult: result,
          };
        });

        return next;
      });

      // Update global totals with generic calc result
      if (genericResult) setEstimationResult(genericResult);

    }, 400);
  }, []);

  // Trigger live calc whenever stairs change, but NOT when we wrote calc results ourselves
  useEffect(() => {
    if (isUpdatingFromCalc.current) {
      isUpdatingFromCalc.current = false;
      return;
    }
    if (stairs.length === 0) return;
    triggerLiveCalc(stairs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stairs]);


  const openTemplateModal = () => {

    const nextNum = stairs.length > 0 
      ? Math.max(...stairs.map(s => {
          const m = s.label.match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        })) + 1 
      : 1;
    setTemplateModal({
      isOpen: true,
      nextLabel: `Stair ${nextNum}`
    });
  };

  const applyTemplateDefaults = (template) => {
    // Lightweight geometry defaults per template. These act as sensible starting points
    // and can be edited by the engineer in the main form.
    switch (template) {
      case 'commercial':
        return {
          stairCategory: 'Commercial',
          stairType: 'pan-concrete',
          stairWidth: '4.0',
          run: '11.0',
          rise: '7.0'
        };
      case 'industrial':
        return {
          stairCategory: 'Industrial',
          stairType: 'grating-tread',
          stairWidth: '3.0',
          run: '10.0',
          rise: '7.5'
        };
      default:
        return {
          stairCategory: 'Commercial',
          stairType: 'pan-concrete'
        };
    }
  };

  const addStair = (template = 'custom') => {
    const nextNum = stairs.length > 0 
      ? Math.max(...stairs.map(s => {
          const m = s.label.match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        })) + 1 
      : 1;

    const templateDefaults = applyTemplateDefaults(template);

    setStairs(s => [
      ...s,
      { 
        id: makeId(), 
        label: `Stair ${nextNum}`, 
        stairType: templateDefaults.stairType || '', 
        drawingRef: '',
        flights: [],
        landings: [],
        rails: [],
        history: { lastDeleted: null },
        template,
        ...templateDefaults
      }
    ]);
  };

  const duplicateStair = (id) => {
    const target = stairs.find(s => s.id === id);
    if (!target) return;
    
    const nextNum = Math.max(...stairs.map(s => {
      const m = s.label.match(/\d+/);
      return m ? parseInt(m[0]) : 0;
    })) + 1;

    // Deep copy helper for nested objects (flights, landings, rails)
    const deepClone = (items) => items.map(item => ({ ...item, id: makeId() }));

    setStairs(s => [
      ...s,
      { 
        ...target, 
        id: makeId(), 
        label: `Stair ${nextNum}`,
        flights: deepClone(target.flights || []),
        landings: deepClone(target.landings || []),
        rails: deepClone(target.rails || []),
        history: { lastDeleted: null }
      }
    ]);
  };

  const deleteStair = (id) => setStairs(s => s.filter(x => x.id !== id));

  const updateStair = (id, changes) =>
    setStairs(s => s.map(x => x.id === id ? { ...x, ...changes } : x));

  // ── Sub-Item Handlers (Lifting state up) ──────────────────────────────
  
  const addSubItem = (stairId, type, extra = {}) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      
      let nextNum = 1;
      const items = s[type + 's'] || [];
      
      if (type === 'flight') {
        nextNum = items.length > 0 
          ? Math.max(...items.map(f => {
              const m = f.label.match(/\d+/);
              return m ? parseInt(m[0]) : 0;
            })) + 1 
          : 2;
      } else {
        nextNum = items.length > 0 
          ? Math.max(...items.map(l => {
              const m = l.label.match(/\d+/);
              return m ? parseInt(m[0]) : 0;
            })) + 1 
          : 1;
      }

      let label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextNum}`;
      if (type === 'rail' && extra.type) {
        const meta = RAIL_TYPES.find(t => t.key === extra.type);
        const sameTypeRails = items.filter(r => r.type === extra.type);
        nextNum = sameTypeRails.length > 0
          ? Math.max(...sameTypeRails.map(r => {
              const m = r.label.match(/\d+/);
              return m ? parseInt(m[0]) : 0;
            })) + 1
          : 1;
        label = `${meta.label} ${nextNum}`;
      }

      return {
        ...s,
        [type + 's']: [...items, { id: makeId(), label, ...extra }]
      };
    }));
  };

  const copyLastFlight = (stairId) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const flights = s.flights || [];
      if (flights.length === 0) {
        const nextNum = 2;
        return { ...s, flights: [...flights, { id: makeId(), label: `Flight ${nextNum}` }] };
      }
      const last = flights[flights.length - 1];
      const nextNum = Math.max(...flights.map(f => {
        const m = f.label.match(/\d+/);
        return m ? parseInt(m[0]) : 0;
      })) + 1;
      return { ...s, flights: [...flights, { ...last, id: makeId(), label: `Flight ${nextNum}` }] };
    }));
  };

  const updateSubItem = (stairId, type, itemId, data) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const key = type + 's';
      return {
        ...s,
        [key]: s[key].map(item => item.id === itemId ? { ...item, ...data } : item)
      };
    }));
  };

  const duplicateSubItem = (stairId, type, itemId) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const key = type + 's';
      const items = s[key];
      const target = items.find(x => x.id === itemId);
      
      let nextNum = Math.max(...items.map(item => {
        const m = item.label.match(/\d+/);
        return m ? parseInt(m[0]) : 0;
      })) + 1;

      let label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextNum}`;
      if (type === 'rail') {
        const sameTypeRails = items.filter(r => r.type === target.type);
        const meta = RAIL_TYPES.find(t => t.key === target.type);
        nextNum = Math.max(...sameTypeRails.map(r => {
          const m = r.label.match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        })) + 1;
        label = `${meta.label} ${nextNum}`;
      }

      return {
        ...s,
        [key]: [...items, { ...target, id: makeId(), label }]
      };
    }));
  };

  const deleteSubItem = (stairId, type, itemId) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const key = type + 's';
      const deleted = s[key].find(x => x.id === itemId);
      return {
        ...s,
        [key]: s[key].filter(x => x.id !== itemId),
        history: { lastDeleted: { type, data: deleted } }
      };
    }));
  };

  const undoDeleteSubItem = (stairId, type) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId || !s.history.lastDeleted || s.history.lastDeleted.type !== type) return s;
      const key = type + 's';
      return {
        ...s,
        [key]: [...s[key], s.history.lastDeleted.data],
        history: { lastDeleted: null }
      };
    }));
  };

  // Summary stats
  const totalStairs = stairs.length;
  const totalGuardRails = stairs.reduce(
    (sum, s) => sum + (s.rails?.filter(r => r.type === 'guardRail').length || 0),
    0
  );
  const totalLandings = stairs.reduce(
    (sum, s) => sum + (s.landings?.length || 0),
    0
  );
  const totalRails = stairs.reduce(
    (sum, s) => sum + (s.rails?.length || 0),
    0
  );

  // Use estimation result for weight/cost if available
  const estimatedSteelWeight = estimationResult?.totalSteel ?? stairs.reduce((sum, s) => sum + (s.estimatedSteelWeight || 0), 0);
  const estimatedCost = estimationResult?.totalEstimatedCost ?? stairs.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Stair &amp; Railings — Estimation</h1>
            <p className="page-subtitle">Configure stair assemblies including flights, landings, and all rail types</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="info-chip chip-blue">📐 {totalStairs} Stair{totalStairs !== 1 ? 's' : ''}</span>
            <button
              className="header-btn header-btn-outline"
              id="btn-calculate"
              onClick={calculateEstimation}
              disabled={calculating}
            >
              {calculating ? '⏳ Calculating...' : '🔢 Calculate'}
            </button>
            <button
              className="header-btn header-btn-accent"
              id="btn-save-changes"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
            <button className="header-btn header-btn-primary" id="btn-add-stair" onClick={openTemplateModal}>
              + Add Stair
            </button>
          </div>
        </div>
      </div>

      {/* Auto-imported Project Info matched to Reference (Cyan / STRING) */}
      {(projectData.projectName || projectData.projectNumber) && (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {projectData.projectName && (
            <div className="computed-field data-type-string" style={{ borderLeftWidth: '4px', background: '#e6ffff' }}>
              <div>
                <div className="computed-label" style={{ color: '#008b8b' }}>PROJECT NAME</div>
                <div className="computed-value" style={{ color: '#006666' }}>{projectData.projectName}</div>
              </div>
            </div>
          )}
          {projectData.projectNumber && (
            <div className="computed-field data-type-string" style={{ borderLeftWidth: '4px', background: '#e6ffff' }}>
              <div>
                <div className="computed-label" style={{ color: '#008b8b' }}>PROJECT NUMBER</div>
                <div className="computed-value" style={{ color: '#006666' }}>{projectData.projectNumber}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', marginBottom: '24px', gap: '12px' }}>
        {[
          { icon: '🪜', label: 'Stairs', value: totalStairs, color: 'hsl(220, 90%, 50%)' },
          { icon: '🛡', label: 'Guard Rails', value: totalGuardRails, color: 'hsl(258, 90%, 60%)' },
          { icon: '🏗', label: 'Landings', value: totalLandings, color: 'hsl(160, 84%, 39%)' },
          { icon: '🔧', label: 'Total Rails', value: totalRails, color: 'hsl(35, 100%, 55%)' },
          { icon: '⚖️', label: 'Weight', value: estimatedSteelWeight > 0 ? `${estimatedSteelWeight.toFixed(1)} lb` : '—', color: 'hsl(210, 70%, 40%)' },
          { icon: '💲', label: 'Cost', value: estimatedCost > 0 ? `$${estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0', color: 'hsl(142, 76%, 36%)' },
        ].map((s, idx) => (
          <motion.div 
            key={s.label} 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
            style={{ 
              borderLeft: `3px solid ${s.color}`,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div className="stat-card-icon" style={{ background: `${s.color}10`, padding: '6px', borderRadius: '8px', width: 'fit-content', fontSize: '16px' }}>{s.icon}</div>
            <div className="stat-card-label" style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color, fontSize: '16px', fontWeight: 800 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Navigation for large projects */}
      {stairs.length > 1 && (
        <div className="eng-card" style={{ marginBottom: '24px' }}>
          <div className="flex items-center justify-between mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div className="text-sm font-semibold text-gray-800">Quick Navigation</div>
            <div className="text-xs text-gray-500">Jump to a stair or rail section</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {stairs.map(stair => (
              <button
                key={stair.id}
                type="button"
                className="chip-outline"
                onClick={() => {
                  const el = document.getElementById(`stair-${stair.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {stair.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stair Sections */}
      {stairs.map(stair => (
        <div key={stair.id} id={`stair-${stair.id}`}>
          <StairItem
            stair={stair}
            history={stair.history}
            onDeleteStair={() => deleteStair(stair.id)}
            onDuplicateStair={() => duplicateStair(stair.id)}
            onUpdateStair={changes => updateStair(stair.id, changes)}
            onAddFlight={() => addSubItem(stair.id, 'flight')}
            onCopyLastFlight={() => copyLastFlight(stair.id)}
            onAddLanding={() => addSubItem(stair.id, 'landing')}
            onAddRail={(type) => addSubItem(stair.id, 'rail', { type })}
            onUpdateSubItem={(type, id, data) => updateSubItem(stair.id, type, id, data)}
            onDuplicateSubItem={(type, id) => duplicateSubItem(stair.id, type, id)}
            onDeleteSubItem={(type, id) => deleteSubItem(stair.id, type, id)}
            onUndoDeleteSubItem={(type) => undoDeleteSubItem(stair.id, type)}
          />
        </div>
      ))}

      {stairs.length === 0 && (
        <div className="eng-card">
          <div className="empty-state">
            <div className="empty-state-icon">🪜</div>
            <div className="empty-state-title">No Stairs Added</div>
            <div className="empty-state-sub">Click "+ Add Stair" to begin configuring your stair estimate.</div>
            <button className="header-btn header-btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }} onClick={openTemplateModal}>
              + Add First Stair
            </button>
          </div>
        </div>
      )}

      {/* Bottom Add Row */}
      {stairs.length > 0 && (
        <div className="add-section-row" style={{ marginTop: '20px' }}>
          <button className="add-btn" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openTemplateModal} id="add-stair-bottom">
            + Add Another Stair
          </button>
        </div>
      )}

      {/* Stair Template Modal */}
      {templateModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-header">
              <h2 className="modal-title">Select Stair Template</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setTemplateModal(prev => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">
              Choose a starting template for <strong>{templateModal.nextLabel}</strong>. All values can be refined after creation.
            </p>
            <div className="template-grid">
              <button
                type="button"
                className="template-card"
                onClick={() => {
                  addStair('commercial');
                  setTemplateModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <div className="template-icon">🏢</div>
                <div className="template-title">Commercial Stair</div>
                <div className="template-body">Standard width, pan concrete treads, office / public use.</div>
              </button>
              <button
                type="button"
                className="template-card"
                onClick={() => {
                  addStair('industrial');
                  setTemplateModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <div className="template-icon">🏭</div>
                <div className="template-title">Industrial Stair</div>
                <div className="template-body">Grating treads, heavier duty geometry for plants.</div>
              </button>
              <button
                type="button"
                className="template-card"
                onClick={() => {
                  addStair('custom');
                  setTemplateModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <div className="template-icon">✏️</div>
                <div className="template-title">Custom Stair</div>
                <div className="template-body">Start with a minimal configuration and define everything.</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
