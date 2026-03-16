// src/components/estimation/StairEstimation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import StairConfig from './stair/StairConfig';
import LandingConfig from './stair/LandingConfig';
import RailConfig from './stair/RailConfig';
import { motion, AnimatePresence } from 'framer-motion';

let uid = 1;
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'guardRail', label: 'Guard Rail', badge: 'GUARD', icon: '🛡' },
  { key: 'wallRail', label: 'Wall Rail', badge: 'WALL', icon: '🔘' },
  { key: 'grabRail', label: 'Grab Rail', badge: 'GRAB', icon: '✊' },
  { key: 'caneRail', label: 'Cane Rail', badge: 'CANE', icon: '🦯' },
];

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Flights ({flights.length + 1})
            </span>
            {history.lastDeleted?.type === 'flight' && (
              <button className="text-btn" onClick={() => onUndoDeleteSubItem('flight')} style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                ↩ Undo Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="add-btn ghost" onClick={onCopyLastFlight} id="copy-flight">
              ⎘ Copy from Above
            </button>
            <button className="add-btn" onClick={onAddFlight} id="add-flight">
              + Add Flight
            </button>
          </div>
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

        {/* Rail type add buttons */}
        <div className="add-section-row">
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
            No rails added — use the buttons above to add rail types.
          </div>
        )}
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
      history: { lastDeleted: null }
    }
  ]);
  const [projectData, setProjectData] = useState({ projectName: '', projectNumber: '' });

  useEffect(() => {
    const savedInfo = localStorage.getItem('steelProjectInfo');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setProjectData({
          projectName: parsed.projectName || '',
          projectNumber: parsed.projectNumber || ''
        });
      } catch (e) {
        console.error('Failed to parse project info:', e);
      }
    }
  }, []);

  const addStair = () => {
    const nextNum = stairs.length > 0 
      ? Math.max(...stairs.map(s => {
          const m = s.label.match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        })) + 1 
      : 1;
    setStairs(s => [
      ...s,
      { 
        id: makeId(), 
        label: `Stair ${nextNum}`, 
        stairType: '', 
        drawingRef: '',
        flights: [],
        landings: [],
        rails: [],
        history: { lastDeleted: null }
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
            <button className="header-btn header-btn-primary" id="btn-add-stair" onClick={addStair}>
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
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px', gap: '20px' }}>
        {[
          { icon: '🪜', label: 'Stairs',   value: stairs.length, color: 'hsl(220, 90%, 50%)' },
          { icon: '🛡', label: 'Guard Rails', value: 0, color: 'hsl(0, 84%, 60%)' },
          { icon: '🏗', label: 'Landings',  value: 0, color: 'hsl(160, 84%, 39%)' },
          { icon: '🔧', label: 'Rails Total', value: 0, color: 'hsl(35, 100%, 55%)' },
        ].map((s, idx) => (
          <motion.div 
            key={s.label} 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
            style={{ borderLeft: `4px solid ${s.color}` }}
          >
            <div className="stat-card-icon" style={{ background: `${s.color}15`, padding: '8px', borderRadius: '8px', width: 'fit-content' }}>{s.icon}</div>
            <div className="stat-card-label" style={{ fontWeight: 600 }}>{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Stair Sections */}
      {stairs.map(stair => (
        <StairItem
          key={stair.id}
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
      ))}

      {stairs.length === 0 && (
        <div className="eng-card">
          <div className="empty-state">
            <div className="empty-state-icon">🪜</div>
            <div className="empty-state-title">No Stairs Added</div>
            <div className="empty-state-sub">Click "+ Add Stair" to begin configuring your stair estimate.</div>
            <button className="header-btn header-btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }} onClick={addStair}>
              + Add First Stair
            </button>
          </div>
        </div>
      )}

      {/* Bottom Add Row */}
      {stairs.length > 0 && (
        <div className="add-section-row" style={{ marginTop: '20px' }}>
          <button className="add-btn" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={addStair} id="add-stair-bottom">
            + Add Another Stair
          </button>
        </div>
      )}
    </div>
  );
}
