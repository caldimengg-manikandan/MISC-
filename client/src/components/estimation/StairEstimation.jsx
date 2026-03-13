// src/components/estimation/StairEstimation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import StairConfig    from './stair/StairConfig';
import LandingConfig  from './stair/LandingConfig';
import RailConfig     from './stair/RailConfig';

let uid = 1;
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'guardRail',  label: 'Guard Rail',  badge: 'GUARD',  icon: '🛡' },
  { key: 'wallRail',   label: 'Wall Rail',   badge: 'WALL',   icon: '🔘' },
  { key: 'grabRail',   label: 'Grab Rail',   badge: 'GRAB',   icon: '✊' },
  { key: 'caneRail',   label: 'Cane Rail',   badge: 'CANE',   icon: '🦯' },
];

// ── Collapsible Wrapper ─────────────────────────────────────────────────────
function CollapsibleSection({ badge, title, subtitle, onDelete, onDuplicate, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={() => setOpen(o => !o)}>
        <div className="collapsible-header-left">
          <span className="collapsible-type-badge">{badge}</span>
          <div>
            <div className="collapsible-title">{title}</div>
            {subtitle && <div className="collapsible-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="collapsible-header-right" onClick={e => e.stopPropagation()}>
          <div className="collapsible-actions">
            {onDuplicate && (
              <button className="icon-btn" title="Duplicate" onClick={onDuplicate}>⎘</button>
            )}
            {onDelete && (
              <button className="icon-btn danger" title="Delete" onClick={onDelete}>✕</button>
            )}
          </div>
          <span className={`expand-chevron ${open ? 'open' : ''}`}>▾</span>
        </div>
      </div>
      {open && (
        <div className="collapsible-body fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Stair Item (groups stair + its flights, landings, rails) ───────────────
function StairItem({ stair, onDeleteStair, onChange }) {
  const [flights,   setFlights]   = useState([{ id: makeId(), label: 'Flight 1' }]);
  const [landings,  setLandings]  = useState([]);
  const [rails,     setRails]     = useState([]);

  const addFlight  = () => setFlights(f => [...f, { id: makeId(), label: `Flight ${f.length + 1}` }]);
  const addLanding = () => setLandings(l => [...l, { id: makeId(), label: `Landing ${l.length + 1}` }]);
  const addRail    = (type) => setRails(r => [...r, { id: makeId(), type, label: `${RAIL_TYPES.find(t => t.key === type).label} ${r.filter(x => x.type === type).length + 1}` }]);

  const deleteFlight  = (id) => setFlights(f => f.filter(x => x.id !== id));
  const deleteLanding = (id) => setLandings(l => l.filter(x => x.id !== id));
  const deleteRail    = (id) => setRails(r => r.filter(x => x.id !== id));

  const railMeta = (r) => RAIL_TYPES.find(t => t.key === r.type);

  return (
    <CollapsibleSection
      badge="STAIR"
      title={stair.label}
      subtitle={stair.stairType || 'Configure stair properties below'}
      onDelete={onDeleteStair}
      defaultOpen={true}
    >
      {/* Stair Config Form */}
      <StairConfig stair={stair} onChange={onChange} />

      <div className="divider" />

      {/* ── Flights ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Flights ({flights.length})
          </span>
          <button className="add-btn" onClick={addFlight} id="add-flight">
            + Add Flight
          </button>
        </div>

        {flights.map(fl => (
          <CollapsibleSection
            key={fl.id}
            badge="FLIGHT"
            title={fl.label}
            subtitle="Stair flight geometry"
            onDelete={() => deleteFlight(fl.id)}
            defaultOpen={false}
          >
            <StairConfig stair={{ ...stair, ...fl }} onChange={() => {}} isFlightMode />
          </CollapsibleSection>
        ))}
      </div>

      {/* ── Landings ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Landings ({landings.length})
          </span>
          <button className="add-btn" onClick={addLanding} id="add-landing">
            + Add Landing
          </button>
        </div>

        {landings.map(l => (
          <CollapsibleSection
            key={l.id}
            badge="LANDING"
            title={l.label}
            subtitle="Platform dimensions and type"
            onDelete={() => deleteLanding(l.id)}
            defaultOpen={false}
          >
            <LandingConfig />
          </CollapsibleSection>
        ))}

        {landings.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>
            No landings added — click "+ Add Landing" to begin.
          </div>
        )}
      </div>

      {/* ── Rails ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Rails ({rails.length})
          </span>
        </div>

        {/* Rail type add buttons */}
        <div className="add-section-row">
          {RAIL_TYPES.map(rt => (
            <button
              key={rt.key}
              className="add-btn"
              onClick={() => addRail(rt.key)}
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
                onDelete={() => deleteRail(r.id)}
                defaultOpen={false}
              >
                <RailConfig type={r.type} />
              </CollapsibleSection>
            );
          })}
        </div>

        {rails.length === 0 && (
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
    { id: makeId(), label: 'Stair 1', stairType: '', drawingRef: '' }
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

  const addStair = () => setStairs(s => [
    ...s,
    { id: makeId(), label: `Stair ${s.length + 1}`, stairType: '', drawingRef: '' }
  ]);

  const deleteStair = (id) => setStairs(s => s.filter(x => x.id !== id));

  const updateStair = (id, changes) =>
    setStairs(s => s.map(x => x.id === id ? { ...x, ...changes } : x));

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
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        {[
          { icon: '🪜', label: 'Stairs',   value: stairs.length },
          { icon: '🛡', label: 'Guard Rails', value: 0 },
          { icon: '🏗', label: 'Landings',  value: 0 },
          { icon: '🔧', label: 'Rails Total', value: 0 },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Stair Sections */}
      {stairs.map(stair => (
        <StairItem
          key={stair.id}
          stair={stair}
          onDeleteStair={() => deleteStair(stair.id)}
          onChange={changes => updateStair(stair.id, changes)}
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
