// src/components/estimation/StairEstimation.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import StairConfig from './stair/StairConfig';
import LandingConfig from './stair/LandingConfig';
import RailConfig from './stair/RailConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Plus, Building2, Factory, PenTool, 
  Shield, Circle, Hand, GripHorizontal, Activity 
} from 'lucide-react';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import { useProject } from '../../contexts/ProjectContext';
import { calculateStair } from '../../services/stairService';

let uid = 100; // Start from 100 to avoid collision with DB-restored IDs
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'guardRail', label: 'Guard Rail', badge: 'GUARD', icon: <Shield size={14}/> },
  { key: 'wallRail', label: 'Wall Rail', badge: 'WALL', icon: <Circle size={14}/> },
  { key: 'grabRail', label: 'Grab Rail', badge: 'GRAB', icon: <Hand size={14}/> },
  { key: 'caneRail', label: 'Cane Rail', badge: 'CANE', icon: <Activity size={14}/> },
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

  const getBadgeStyles = (text) => {
    if (!text) return { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' };
    const match = text.match(/\d+/);
    if (!match) return { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' };
    const num = parseInt(match[0], 10);
    const palettes = [
      { bg: '#e0e7ff', color: '#4338ca' }, // 1: indigo
      { bg: '#dcfce7', color: '#15803d' }, // 2: green
      { bg: '#fef3c7', color: '#b45309' }, // 3: amber
      { bg: '#fce7f3', color: '#be185d' }, // 4: pink
      { bg: '#e0f2fe', color: '#0369a1' }, // 5: sky
      { bg: '#f3e8ff', color: '#7e22ce' }, // 6: purple
    ];
    return palettes[(num - 1) % palettes.length];
  };

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
            {subBadge && (
              <span className="collapsible-type-badge" style={{ 
                background: getBadgeStyles(subBadge).bg, 
                color: getBadgeStyles(subBadge).color, 
                fontSize: '9.5px', 
                fontWeight: 900,
                padding: '2px 6px' 
              }}>
                {subBadge}
              </span>
            )}
          </div>
          <div>
            <div className="collapsible-title" style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>{title}</div>
            {subtitle && <div className="collapsible-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="collapsible-header-right" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="collapsible-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {onDuplicate && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="icon-btn" title="Duplicate/Copy" onClick={onDuplicate}>
                <Copy size={16} color="var(--color-primary-600)" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }} whileTap={{ scale: 0.9 }} className="icon-btn danger" title="Delete" onClick={onDelete}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>✕</span>
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
      title={<span style={{ fontWeight: '900', textTransform: 'uppercase' }}>{stair.label}</span>}
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
          <button className="add-btn ghost" onClick={onCopyLastFlight} id="copy-flight" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Copy size={14} /> Copy from Above
          </button>
          <button className="add-btn" onClick={onAddFlight} id="add-flight" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Add Flight
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
          <button className="add-btn" onClick={onAddLanding} id="add-landing" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Add Landing
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
            <button className="add-btn" onClick={onAddLanding} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add Landing
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px' }}>{rt.icon}</div>
              <Plus size={14} /> {rt.label}
            </button>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function StairEstimation() {
  const { stairs, setStairs, projectInfo, stairRequest, saveTrigger, calcTrigger } = useProject();
  const [templateModal, setTemplateModal] = useState({ isOpen: false, nextLabel: 'Stair 1' });
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimationResult, setEstimationResult] = useState(null);
  const stairsRef = useRef(stairs);
  stairsRef.current = stairs;


  // Initialize with one stair if empty
  useEffect(() => {
    if (stairs.length === 0) {
      setStairs([{ 
        id: makeId(), 
        label: 'Stair 1', 
        stairType: '', 
        drawingRef: '', 
        flights: [], 
        landings: [], 
        rails: [],
        history: { lastDeleted: null },
        template: 'custom'
      }]);
    }
  }, [stairs.length, setStairs]);

  // ── Load stair data from DB on mount ──────────────────────────────
  useEffect(() => {
    const projectId = projectInfo.id;
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
  }, [projectInfo.id, setStairs]);

  // ── Save stairs to DB ─────────────────────────────────────────────────────
  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('steel_token');
      if (!token) { toast.error('Please log in first'); return; }

      const projectId = projectInfo.id;

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
  }, [projectInfo.id]);

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

      // For manual calc, we take the primary stair as an example or could be expanded to bulk.
      const stair = stairsRef.current[0];
      if (!stair) throw new Error('No stairs to calculate');

      const data = await calculateStair(stair);
      console.log("DEBUG: Manual Calc Result:", data);
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
      // 1. Core Stair Calculation (Now handled by the single hardened endpoint)
      const next = [...latestStairs].map(s => ({ ...s }));
      let changed = false;

      for (let i = 0; i < next.length; i++) {
        const stair = next[i];
        
        // Requirements for a valid calculation
        const hasInputs = stair.rise && stair.run && stair.totalHeight && stair.stairWidth;
        if (!hasInputs) continue;

        try {
          const response = await calculateStair(stair);

          if (response.success) {
            next[i] = {
              ...stair,
              // Map all results from backend
              numRisers:   String(response.data.numRisers),
              slope:       String(response.data.slopeIn.toFixed(4)),
              angle:       String(response.data.angleDeg.toFixed(2)),
              calcStringerLF: response.data.totalStringerLengthFt,
              calcStringerSteel: response.data.stringerWeight,
              calcPanSteel:  response.data.panWeight,
              calcTotalSteel: response.data.totalWeight,
              angleWarning: response.data.angleWarning,
              // Legacy support/UI display results
              flightCalcResult: { 
                success: true, 
                data: response.data,
                warning: response.data.angleWarning,
                // Map to UI friendly structure if needed by other components
                geometry: { stepSlopeIn: response.data.slopeIn, angleDeg: response.data.angleDeg },
                stringer: { totalLF: response.data.totalStringerLengthFt, burdenedWeightLbs: response.data.stringerWeight },
                panPlate: { burdenedWeightLbs: response.data.panWeight },
                summary: { totalSteelLbs: response.data.totalWeight }
              }
            };
            changed = true;
          }
        } catch (err) {
          console.error(`Stair ${i} calc failed:`, err.message);
        }
      }

      if (changed) {
        setStairs(currentStairs => {
          return currentStairs.map(s => {
            const resultForThisStair = next.find(n => n.id === s.id);
            if (resultForThisStair && resultForThisStair.flightCalcResult) {
              return {
                ...s,
                numRisers:   resultForThisStair.numRisers,
                slope:       resultForThisStair.slope,
                angle:       resultForThisStair.angle,
                calcStringerLF: resultForThisStair.calcStringerLF,
                calcStringerSteel: resultForThisStair.calcStringerSteel,
                calcPanSteel:  resultForThisStair.calcPanSteel,
                calcTotalSteel: resultForThisStair.calcTotalSteel,
                flightCalcResult: resultForThisStair.flightCalcResult
              };
            }
            return s;
          });
        });
        isUpdatingFromCalc.current = true;
      }
    }, 500);
  }, [setStairs]);

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

  // ── Global Event Triggers (from MainLayout) ──────────────────────────────
  useEffect(() => {
    if (stairRequest > 0) openTemplateModal();
  }, [stairRequest]);

  useEffect(() => {
    if (saveTrigger > 0) saveChanges();
  }, [saveTrigger, saveChanges]);

  useEffect(() => {
    if (calcTrigger > 0) calculateEstimation();
  }, [calcTrigger, calculateEstimation]);

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
    if (!window.confirm("Are you sure you want to duplicate this stair?")) return;
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

  const deleteStair = (id) => {
    if (!window.confirm("Are you sure you want to delete this stair?")) return;
    setStairs(s => s.filter(x => x.id !== id));
  };

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
    if (!window.confirm(`Are you sure you want to duplicate this ${type}?`)) return;
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
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
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

  return (
    <div className="fade-in">
      {/* Quick Navigation moved to header */}

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
            <div className="empty-state-icon"><GripHorizontal size={32} color="var(--color-primary-600)" /></div>
            <div className="empty-state-title">No Stairs Added</div>
            <div className="empty-state-sub">Click "Add Stair" to begin configuring your stair estimate.</div>
            <button className="header-btn header-btn-primary" style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={openTemplateModal}>
              <Plus size={14} /> Add First Stair
            </button>
          </div>
        </div>
      )}

      {/* Bottom Add Row */}
      {stairs.length > 0 && (
        <div className="add-section-row" style={{ marginTop: '20px' }}>
          <button className="add-btn" style={{ fontSize: '13px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={openTemplateModal} id="add-stair-bottom">
            <Plus size={14} /> Add Another Stair
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
                <div className="template-icon"><Building2 size={24} /></div>
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
                <div className="template-icon"><Factory size={24} /></div>
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
                <div className="template-icon"><PenTool size={24} /></div>
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
