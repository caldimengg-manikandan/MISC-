import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StairFlight from './StairFlight';
import LandingConfig from '../Landing/LandingConfig';
import RailConfig from '../Rail/RailConfig';
import KickPlateConfig from '../KickPlate/KickPlateConfig';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { FileText, Table, Scale, DollarSign, Copy, Settings, Building2, User, Mail, Phone, MapPin, Zap, X, ArrowUp, ArrowDown, ArrowRight, CornerDownRight, Plus, GripVertical, FolderOpen } from 'lucide-react';
import { normalizeToInches, normalizeToFeet, parseArchitecturalInput, parseToFeet } from '../../utils/mathUtils.js';
import { generateProposalPDF, generateFabricationExcel } from '../../services/exportService';
import PricingOverridesModal from './PricingOverridesModal';
import AllocateProjectModal from './components/AllocateProjectModal';
import EstimateReport from './ProjectEstimateReport';
import AdditionalCostsModal from './components/AdditionalCostsModal';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import './StairConfig.css';
import { useEstimation } from '../../contexts/EstimationContext';
import configManager from '../../services/configManager';

let uid = 100; // Start from 100 to avoid collision with DB-restored IDs
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'guardRail', label: 'Guard rail', badge: 'GUARD', icon: '🛡' },
  { key: 'wallRail', label: 'Wall rail', badge: 'WALL', icon: '🔘' },
  { key: 'grabRail', label: 'Grab rail', badge: 'GRAB', icon: '✊' },
  { key: 'caneRail', label: 'Cane rail', badge: 'CANE', icon: '🦯' },
  { key: 'kickPlate', label: 'Kick plate', badge: 'KICK', icon: '📐' },
];

// Helper: restore numeric IDs from saved data, ensuring all fields required by the UI are present
const restoreStairs = (savedStairs) => {
  if (!Array.isArray(savedStairs)) return [];
  return savedStairs.map((s, si) => {
    // Helper to ensure geometric fields are objects
    const toObj = (val, defaultUnit) => {
      if (val && typeof val === 'object' && 'unit' in val) return val;
      // 🔄 PERSISTENCE FIX: Nullish check instead of "||" to preserve numeric 0 as a valid input
      const displayVal = (val !== null && val !== undefined) ? val : '';
      return { value: displayVal, unit: defaultUnit };
    };

    return {
      ...s,
      id: s.id ?? makeId(),
      label: s.label || s.stairName || `Stair ${si + 1}`,
      history: s.history ?? { lastDeleted: null },

      // Geometric fields
      stairWidth: toObj(s.stairWidth, 'FT'),
      run: toObj(s.run, 'IN'),
      rise: toObj(s.rise, 'IN'),
      totalHeight: toObj(s.totalHeight, 'IN'),
      nsStringerBot: toObj(s.nsStringerBot, 'FT'),
      fsStringerBot: toObj(s.fsStringerBot, 'FT'),
      nsStringerTop: toObj(s.nsStringerTop, 'FT'),
      fsStringerTop: toObj(s.fsStringerTop, 'FT'),

      flights: (s.flights || []).map((f, fi) => ({
        ...f,
        id: f.id ?? makeId(),
        label: f.label || `Flight ${fi + 2}`,
        stairWidth: toObj(f.stairWidth, 'FT'),
        run: toObj(f.run, 'IN'),
        rise: toObj(f.rise, 'IN'),
        totalHeight: toObj(f.totalHeight, 'IN'),
        nsStringerBot: toObj(f.nsStringerBot, 'FT'),
        fsStringerBot: toObj(f.fsStringerBot, 'FT'),
        nsStringerTop: toObj(f.nsStringerTop, 'FT'),
        fsStringerTop: toObj(f.fsStringerTop, 'FT'),
      })),
      landings: (s.landings || []).map((l, li) => {
        // 🔄 PERSISTENCE FIX: Backend calc results spread 'length'/'width' (plain numbers)
        // alongside 'platformLength'/'platformWidth' ({value,unit} objects).
        // Always prefer the {value,unit} object; fall back to plain number.
        const rawLen = (l.platformLength && typeof l.platformLength === 'object') ? l.platformLength
          : (l.platformLength !== undefined && l.platformLength !== null) ? l.platformLength
            : (l.length !== undefined && l.length !== null) ? l.length : '';
        const rawWid = (l.platformWidth && typeof l.platformWidth === 'object') ? l.platformWidth
          : (l.platformWidth !== undefined && l.platformWidth !== null) ? l.platformWidth
            : (l.width !== undefined && l.width !== null) ? l.width : '';
        return {
          ...l,
          id: l.id ?? makeId(),
          label: l.label || `Landing ${li + 1}`,
          platformLength: toObj(rawLen, 'FT'),
          platformWidth: toObj(rawWid, 'FT'),
        };
      }),
      rails: (s.rails || []).map((r, ri) => {
        const meta = RAIL_TYPES.find(t => t.key === r.type);
        // 🔄 PERSISTENCE FIX: Backend may spread 'length' (plain number) alongside 'railLength' ({value,unit})
        const rawRailLen = (r.railLength && typeof r.railLength === 'object') ? r.railLength
          : (r.railLength !== undefined && r.railLength !== null) ? r.railLength
            : (r.length !== undefined && r.length !== null) ? r.length : '';
        return {
          ...r,
          id: r.id ?? makeId(),
          label: r.label || (meta ? `${meta.label} ${ri + 1}` : `Rail ${ri + 1}`),
          railLength: toObj(rawRailLen, 'FT'),
          postSpacing: toObj(r.postSpacing, 'FT'),
          toeplateLength: toObj(r.toeplateLength, 'FT'),
          widthIn: r.type === 'kickPlate' ? (r.widthIn ?? 4) : undefined,
        };
      }),
      selectionSource: s.selectionSource || (s.stringerSize ? 'manual' : 'auto'),
    };
  });
};



// ── Collapsible Wrapper ─────────────────────────────────────────────────────
function CollapsibleSection({ badge, subBadge, title, subtitle, onDelete, onDuplicate, dragControls, children, defaultOpen = true, headerClass = "", onFocus, className = "", id }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      layout
      id={id}
      className={`collapsible-section ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onPointerDown={(e) => {
        if (onFocus) onFocus();
      }}
    >
      <div className={`collapsible-header ${headerClass}`} onClick={() => setOpen(o => !o)}>
        <div className="collapsible-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {dragControls && (
            <div
              className="drag-handle"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ cursor: 'grab', color: 'var(--sf-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
              onClick={e => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            {badge && <span className="collapsible-type-badge">{badge}</span>}
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
            style={{ overflow: 'visible' }}
          >
            <div className="collapsible-body">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .blueprint-theme {
          --bg-main: #F8FAFC;
          --bg-card: #FFFFFF;
          --text-main: #1E293B;
          --text-muted: #64748B;
          --border-blueprint: #E2E8F0;
          --input-border: #CBD5E1;
          /* Technical White Palette */
          --color-primary-50: #ECFDF5;
          --color-primary-100: #D1FAE5;
          --color-primary-200: #A7F3D0;
          --color-primary-300: #6EE7B7;
          --color-primary-400: #34D399;
          --color-primary-500: #10B981;
          --color-primary-600: #059669;
          --color-primary-700: #047857;
          --color-primary-800: #065F46;
          --color-primary-900: #064E3B;

          --color-secondary-50: #EFF6FF;
          --color-secondary-100: #DBEAFE;
          --color-secondary-200: #BFDBFE;
          --color-secondary-300: #93C5FD;
          --color-secondary-400: #60A5FA;
          --color-secondary-500: #3B82F6;
          --color-secondary-600: #2563EB;
          --color-secondary-700: #1D4ED8;
          --color-secondary-800: #1E40AF;
          --color-secondary-900: #1E3A8A;

          --color-neutral-50: #F9FAFB;
          --color-neutral-100: #F3F4F6;
          --color-neutral-200: #E5E7EB;
          --color-neutral-300: #D1D5DB;
          --color-neutral-400: #9CA3AF;
          --color-neutral-500: #6B7280;
          --color-neutral-600: #4B5563;
          --color-neutral-700: #374151;
          --color-neutral-800: #1F2937;
          --color-neutral-900: #111827;

          --bg-main: var(--color-neutral-50);
          --bg-card: #FFFFFF;
          --text-main: var(--color-neutral-800);
          --text-muted: var(--color-neutral-500);
          --border-blueprint: var(--color-neutral-200);
          --input-border: var(--color-neutral-300);
          --accent-blue: var(--color-secondary-600);
          --accent-glow: rgba(59, 130, 246, 0.1); 
          --input-bg: #FFFFFF;
          --input-text: var(--color-neutral-800);
          --success-emerald: var(--color-primary-500);
          --active-glow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        body {
          margin: 0;
          background-color: var(--bg-main);
          color: var(--text-main);
          font-family: 'Inter', system-ui, sans-serif;
        }

        .form-section {
          background: var(--bg-card);
          border: 1px solid var(--border-blueprint);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .form-section-title {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 1.5px;
          color: var(--accent-blue);
          border-bottom: 1px solid var(--border-blueprint);
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-label, .field-auto {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .form-input-with-unit {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .form-input-with-unit input {
          width: 100% !important;
          padding-right: 42px !important;
        }

        .form-input-unit {
          position: absolute;
          right: 8px;
          background: var(--color-neutral-100);
          color: var(--color-neutral-500);
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          pointer-events: auto;
          letter-spacing: 0.5px;
          border: 1px solid var(--color-neutral-200);
        }

        button.form-input-unit {
          cursor: pointer;
        }
        button.form-input-unit.unit-active {
          background: var(--accent-blue);
          color: white;
          border-color: var(--accent-blue);
        }

        .form-input, .form-select, .arch-input, select, input {
          background-color: var(--input-bg) !important;
          color: var(--input-text) !important;
          border: 1px solid var(--input-border) !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          font-family: 'Inter', sans-serif !important;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }

        .form-input:focus, .form-select:focus, select:focus, input:focus {
          outline: none;
          background-color: var(--input-bg) !important;
          border-color: var(--accent-blue) !important;
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .auto-calculation, .field-auto-calc, .field-auto {
          background: var(--color-secondary-50) !important;
          border: 1.5px solid var(--accent-blue) !important;
          color: var(--color-secondary-700) !important;
          font-weight: 700 !important;
          cursor: not-allowed !important;
          filter: grayscale(0.2);
          opacity: 0.9;
          animation: calculation-shimmer 0.6s ease-out;
        }

        @keyframes calculation-shimmer {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }

        .system-calc-badge {
          display: inline-flex;
          align-items: center;
          background: var(--accent-blue);
          color: var(--color-neutral-50);
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 100px;
          text-transform: uppercase;
          margin-left: 8px;
          box-shadow: 0 0 15px var(--accent-glow);
          animation: glowPulse 2s infinite;
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 8px var(--accent-glow); }
          50% { box-shadow: 0 0 20px var(--accent-glow); }
          100% { box-shadow: 0 0 8px var(--accent-glow); }
        }

        .section-faded {
          opacity: 0.3;
          pointer-events: none;
          filter: blur(1px) grayscale(0.8);
          transition: all 0.5s ease;
        }

        .collapsible-section {
          background: var(--bg-card);
          border: 1px solid var(--border-blueprint);
          border-radius: 12px;
          overflow: visible;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .collapsible-section.active {
          border-color: var(--accent-blue);
          box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.1), 0 8px 10px -6px rgba(14, 165, 233, 0.1);
          transform: translateY(-2px);
          z-index: 10;
        }

        .collapsible-header {
          background: var(--color-neutral-50);
          border-bottom: 1px solid var(--border-blueprint);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .collapsible-header:hover {
          background: var(--color-neutral-100);
        }

        .collapsible-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .collapsible-type-badge {
          background: var(--color-secondary-100);
          color: var(--color-secondary-700);
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .collapsible-title {
          font-weight: 700;
          color: var(--text-main);
        }

        .collapsible-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .collapsible-header-right {
          display: flex;
          align-items: center;
        }

        .collapsible-actions {
          display: flex;
          gap: 4px;
        }

        .icon-btn {
          background: var(--color-neutral-100);
          border: 1px solid var(--color-neutral-200);
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-muted);
        }
        .icon-btn:hover {
          background: var(--color-neutral-200);
          border-color: var(--color-neutral-300);
          color: var(--text-main);
        }
        .icon-btn.danger:hover {
          background: var(--color-red-100); /* Assuming a red color for danger */
          border-color: var(--color-red-200);
          color: var(--color-red-700);
        }

        .expand-chevron {
          color: var(--text-muted);
          transition: transform 0.3s ease;
        }
        .expand-chevron.open {
          transform: rotate(180deg);
        }

        .collapsible-body {
          padding: 20px;
          border-top: 1px solid var(--border-blueprint);
        }

        .divider {
          height: 1px;
          background: var(--border-blueprint);
          margin: 20px 0;
        }

        .add-section-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .add-btn {
          background: var(--color-neutral-100);
          border: 1px solid var(--color-neutral-200);
          color: var(--text-main);
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .add-btn:hover {
          background: var(--color-neutral-200);
          border-color: var(--color-neutral-300);
        }
        .add-btn.ghost {
          background: transparent;
          border-color: transparent;
          color: var(--text-muted);
        }
        .add-btn.ghost:hover {
          background: var(--color-neutral-100);
          border-color: var(--color-neutral-200);
        }

        .text-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          color: var(--accent-blue);
          transition: color 0.2s ease;
        }
        .text-btn:hover {
          color: var(--color-secondary-700);
        }

        .summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-blueprint);
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .card-glow-blue { 
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.1); 
          border-top: 3px solid var(--accent-blue);
        }
        .card-glow-green { 
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); 
          border-top: 3px solid var(--success-emerald);
        }
        .card-glow-purple { 
          box-shadow: 0 0 20px rgba(167, 139, 250, 0.1); 
          border-top: 3px solid #A78BFA; /* A specific purple color */
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-blueprint);
          border-radius: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .floating-action-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-neutral-800);
          backdrop-filter: blur(12px);
          border: 1px solid var(--color-neutral-700);
          padding: 12px 24px;
          border-radius: 100px;
          display: flex;
          gap: 16px;
          align-items: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .action-btn-primary {
          background: var(--success-emerald);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 100px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .action-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        
        .action-btn-secondary {
          background: var(--accent-blue);
          color: var(--color-neutral-50);
          border: none;
          padding: 10px 24px;
          border-radius: 100px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-secondary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
        }

        .radio-option {
          background: var(--color-neutral-100);
          color: var(--text-muted);
          border: 1px solid var(--border-blueprint);
          border-radius: 8px;
        }
        .radio-option.selected {
          background: var(--color-secondary-50);
          color: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        /* Shimmer Shadow for calculation */
        .shimmer-text {
          position: relative;
          overflow: hidden;
        }
        .shimmer-text::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
}

// ── Draggable Wrapper ───────────────────────────────────────────────────────
function DraggableSubItem({ item, children }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={item} id={item.id} dragListener={false} dragControls={dragControls} style={{ listStyle: 'none' }}>
      {React.cloneElement(children, { dragControls })}
    </Reorder.Item>
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
  onMoveSubItem,
  onReorderSubItems,
  history,
  activeId,
  onFocusContext
}) {
  const { setActiveContext } = useEstimation();

  const handleFocus = (type, id, label) => {
    setActiveContext({ type, id, label });
    if (onFocusContext) onFocusContext(id);
  };

  const flights = stair.flights || [];
  const landings = stair.landings || [];
  const rails = stair.rails || [];

  const railMeta = (r) => RAIL_TYPES.find(t => t.key === r.type);

  return (
    <CollapsibleSection
      id={`stair-${stair.id}`}
      badge="STAIR"
      subBadge="FLIGHT 1"
      title={stair.label}
      subtitle={stair.stairType || 'Primary Stair Flight Configuration'}
      onDelete={onDeleteStair}
      onDuplicate={onDuplicateStair}
      defaultOpen={true}
      headerClass="header-stair"
      onFocus={() => handleFocus('stair', stair.id, stair.label)}
      className={activeId === stair.id ? 'active' : ''}
    >
      {/* Stair Config Form */}
      <StairFlight stair={stair} onChange={onUpdateStair} onFocus={() => handleFocus('stair', stair.id, stair.label)} />

      <div className="divider" />

      {/* Flights list */}
      <div style={{ marginBottom: '16px' }}>

        <Reorder.Group axis="y" values={flights} onReorder={(newOrder) => onReorderSubItems('flight', newOrder)} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {flights.map((fl, index) => (
            <DraggableSubItem key={fl.id} item={fl}>
              <CollapsibleSection
                id={`flight-${fl.id}`}
                badge="FLIGHT"
                title={fl.label}
                subtitle="Stair flight geometry"
                onDelete={() => onDeleteSubItem('flight', fl.id)}
                onDuplicate={() => onDuplicateSubItem('flight', fl.id)}
                defaultOpen={false}
                headerClass="header-flight"
                onFocus={() => handleFocus('flight', fl.id, fl.label)}
                className={activeId === fl.id ? 'active' : ''}
              >
                <StairFlight
                  stair={{
                    stairCategory: stair.stairCategory,
                    stairType: stair.stairType,
                    stringerType: stair.stringerType,
                    finish: stair.finish,
                    steelGrade: stair.steelGrade,
                    mountingType: stair.mountingType,
                    ...fl
                  }}
                  onChange={(changes) => onUpdateSubItem('flight', fl.id, changes)}
                  isFlightMode
                  onFocus={() => handleFocus('flight', fl.id, fl.label)}
                />
              </CollapsibleSection>
            </DraggableSubItem>
          ))}
        </Reorder.Group>
        {/* Flight actions moved to summary tools list */}
      </div>

      {/* Landings list */}
      <div style={{ marginBottom: '16px' }}>

        <Reorder.Group axis="y" values={landings} onReorder={(newOrder) => onReorderSubItems('landing', newOrder)} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {landings.map((l, index) => (
            <DraggableSubItem key={l.id} item={l}>
              <CollapsibleSection
                id={`landing-${l.id}`}
                badge={null}
                title={`${stair.label.toUpperCase()} - ${l.label}`}
                subtitle="Platform dimensions and type"
                onDelete={() => onDeleteSubItem('landing', l.id)}
                onDuplicate={() => onDuplicateSubItem('landing', l.id)}
                defaultOpen={false}
                headerClass="header-landing"
                onFocus={() => handleFocus('landing', l.id, l.label)}
                className={activeId === l.id ? 'active' : ''}
              >
                <LandingConfig
                  data={l}
                  parentStairType={stair.stairType}
                  onChange={(changes) => onUpdateSubItem('landing', l.id, changes)}
                  onFocus={() => handleFocus('landing', l.id, l.label)}
                />
              </CollapsibleSection>
            </DraggableSubItem>
          ))}
        </Reorder.Group>

        {landings.length === 0 && !history.lastDeleted?.type === 'landing' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>
            No landings added — click "+ Add Landing" to begin.
          </div>
        )}

        {/* Add landing control moved to summary tools list */}
      </div>

      {/* Rails list */}
      <div>

        <div style={{ marginTop: '12px' }}>
          <Reorder.Group axis="y" values={rails} onReorder={(newOrder) => onReorderSubItems('rail', newOrder)} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {rails.map((r, index) => {
              const meta = railMeta(r);
              return (
                <DraggableSubItem key={r.id} item={r}>
                  <CollapsibleSection
                    id={`rail-${r.id}`}
                    badge={null}
                    title={`${stair.label.toUpperCase()} - ${r.label}`}
                    subtitle={`${meta.label} configuration`}
                    onDelete={() => onDeleteSubItem('rail', r.id)}
                    onDuplicate={() => onDuplicateSubItem('rail', r.id)}
                    defaultOpen={false}
                    headerClass={`header-${r.type.replace('Rail', '')}`}
                    onFocus={() => handleFocus('rail', r.id, r.label)}
                    className={activeId === r.id ? 'active' : ''}
                  >
                    {r.type === 'kickPlate' ? (
                      <KickPlateConfig
                        data={r}
                        onChange={(changes) => onUpdateSubItem('rail', r.id, changes)}
                        onFocus={() => handleFocus('rail', r.id, r.label)}
                      />
                    ) : (
                      <RailConfig
                        type={r.type}
                        data={r}
                        onChange={(changes) => onUpdateSubItem('rail', r.id, changes)}
                        onFocus={() => handleFocus('rail', r.id, r.label)}
                      />
                    )}
                  </CollapsibleSection>
                </DraggableSubItem>
              );
            })}
          </Reorder.Group>
        </div>

        {rails.length === 0 && !history.lastDeleted?.type === 'rail' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px', marginTop: '8px' }}>
            No rails added — use the buttons below to add rail types.
          </div>
        )}

        {/* Rail type add buttons moved to summary tools list */}
      </div>
    </CollapsibleSection>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function StairEstimation() {
  const { projectId: urlProjectId } = useParams();
  const navigate = useNavigate();
  const initialId = makeId();
  const [activeId, setActiveId] = useState(initialId);
  const stairTabRefs = useRef({});
  const [arrowOffset, setArrowOffset] = useState(0);
  
  const updateArrowPosition = useCallback(() => {
    const activeTab = stairTabRefs.current[activeId];
    if (activeTab) {
      // Calculate center of tab relative to container
      const offset = activeTab.offsetLeft + (activeTab.offsetWidth / 2) - 30; // -30 to account for arrow width/start
      setArrowOffset(Math.max(10, offset));
      
      // Auto-scroll the tab into view if it's overflowing
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  useEffect(() => {
    updateArrowPosition();
    // Also update on window resize
    window.addEventListener('resize', updateArrowPosition);
    return () => window.removeEventListener('resize', updateArrowPosition);
  }, [updateArrowPosition]);

  const [stairs, setStairs] = useState([
    {
      id: initialId,
      label: 'Stair 1',
      stairType: '',
      drawingRef: '',
      flights: [],
      landings: [],
      rails: [],
      history: { lastDeleted: null },
      template: 'custom',
      selectionSource: 'auto'
    }
  ]);
  const [projectData, setProjectData] = useState({
    projectName: '',
    projectNumber: '',
    customerName: '',
    customerId: null,
    customerInfo: null,
    projectId: urlProjectId || null
  });
  const [loading, setLoading] = useState(!!urlProjectId);
  const [templateModal, setTemplateModal] = useState({ isOpen: false, nextLabel: 'Stair 1' });
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimationResult, setEstimationResult] = useState(null);

  // ── Unified Data Access ──
  const summaryData = estimationResult?.sfeSummary || estimationResult?.summary;

  // ── Additional Costs Modal ──
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const [additionalCosts, setAdditionalCosts]         = useState(null); // Full object: { total, items, rates, etc. }

  const [showReport, setShowReport] = useState(false); // New state for showing report
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [localConfig, setLocalConfig] = useState({});
  const [reportData, setReportData] = useState(null);   // New state for report data
  const [overallHistory, setOverallHistory] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', resolve: null });

  // Prevent accidental navigation/refresh if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to trigger browser's "Leave site?" prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const requestConfirmation = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({ isOpen: true, title, message, resolve });
    });
  };

  useEffect(() => {
    // Ensure global rates are loaded and trigger a re-render so they display in the header
    if (!configManager.initialized) {
      configManager.load().then(() => {
        setLocalConfig(prev => ({ ...prev })); // Force re-render to pick up configManager.get()
      });
    }
  }, []);

  const jumpTo = (stairId, targetId) => {
    setActiveId(stairId);
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const { fetchNotes, notes, setSelectedEstimation } = useEstimation();
  const stairsRef = useRef(stairs);
  stairsRef.current = stairs;

  // Helper to get module-specific context key
  // Helper to get module-specific context key
  const getContextKey = () => {
    const path = window.location.pathname.split('?')[0];
    // 🔄 FIX: Strip any deployment prefix (like /misc) so the key is always 'steelProjectInfo_/estimate/...'
    const normalized = path.includes('/estimate/') ? '/estimate/' + path.split('/estimate/')[1] : path;
    return `steelProjectInfo_${normalized}`;
  };

  const handleDisconnectProject = () => {
    if (window.confirm("Disconnect this estimation from the project and return to Draft Mode?")) {
      localStorage.removeItem(getContextKey());
      setSelectedEstimation(null);
      // Navigate to the same path but without the ?id=... to fully return to draft state
      navigate(window.location.pathname, { replace: true });
      window.location.reload();
    }
  };

  // ── Load project info + stair data from DB on mount ───────────────────────
  useEffect(() => {
    let active = true;

    const loadProjectData = async () => {
      const effectiveId = urlProjectId || projectData.projectId;
      console.log('StairConfig: effectiveId resolved to:', effectiveId, 'urlProjectId:', urlProjectId);

      if (!effectiveId) {
        setLoading(false);
        const savedInfo = localStorage.getItem(getContextKey());
        if (savedInfo) {
          try {
            const parsed = JSON.parse(savedInfo);
            if (parsed.id) {
              navigate(`/project/${parsed.id}/estimate/stair-railings`, { replace: true });
              return;
            }
          } catch (e) { }
        }
        setShowAllocateModal(true);
        setSelectedEstimation({ id: 'draft', projectName: 'New Estimation', isDraft: true });
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('steel_token');
      if (!token) {
        setLoading(false);
        toast.error('Authentication required');
        return;
      }

      const fetchWithRetry = async (attempt = 1) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/projects/${effectiveId}`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          });
          const data = await res.json();

          if (!active) return;

          if (data.success && data.project) {
            const proj = data.project;
            setProjectData({
              projectName: proj.projectName || 'New Estimation',
              projectNumber: proj.projectNumber || 'Draft',
              customerName: proj.LinkedCustomerName || proj.customer_name || 'Internal',
              customerId: proj.customer_id,
              projectId: proj.id,
              customerInfo: proj.customer_id ? {
                company: proj.LinkedCustomerName,
                contact: proj.contactPerson,
                email: proj.CustomerEmail,
                phone: proj.CustomerPhone,
                city: proj.CustomerCity,
                state: proj.CustomerState
              } : null
            });

            setSelectedEstimation({ id: proj.id, ...proj });
            fetchNotes(proj.id);
            restoreStairsFromDB(proj);
            setLoading(false);
          } else if (attempt < 3) {
            console.log(`StairConfig: Hydration attempt ${attempt} failed, retrying...`);
            setTimeout(() => fetchWithRetry(attempt + 1), 600);
          } else {
            setLoading(false);
            toast.error('Project not found or access denied');
            setShowAllocateModal(true);
          }
        } catch (err) {
          if (!active) return;
          console.error('Hydration failed:', err);
          if (attempt < 3) {
            setTimeout(() => fetchWithRetry(attempt + 1), 600);
          } else {
            setLoading(false);
            toast.error('Sync failed. Please check connection.');
          }
        }
      };

      fetchWithRetry();
    };

    loadProjectData();
    return () => { active = false; };
  }, [urlProjectId, fetchNotes, setSelectedEstimation, navigate]);

  // Refactored helper for DB restoration
  const restoreStairsFromDB = (proj) => {
    // 🔄 PERSISTENCE FIX: Restore calculated summary directly from DB to prevent empty state on reload
    if (proj.estimationResult) {
      setEstimationResult(proj.estimationResult);
      setReportData(proj.estimationResult);
    }
    if (proj.additionalCosts) {
      setAdditionalCosts(proj.additionalCosts);
    }
    if (proj.localConfig) {
      setLocalConfig(proj.localConfig);
    }

    const raw = proj.stairs;
    const saved = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : null);

    // 🛡️ FALLBACK: If DB has no stairs, ensure we have at least 'Stair 1'
    const finalStairs = (saved && saved.length > 0) ? saved : [
      {
        id: makeId(),
        label: 'Stair 1',
        stairType: 'pan-concrete',
        flights: [],
        landings: [],
        rails: [],
        template: 'custom'
      }
    ];

    const restored = restoreStairs(finalStairs);
    isUpdatingFromCalc.current = true; // 🛡️ Suppress dirty flagging on DB load
    setStairs(restored);
    if (restored.length > 0) setActiveId(restored[0].id);
    setIsDirty(false);
  };

  // ── Save stairs to DB ─────────────────────────────────────────────────────
  const saveChanges = useCallback(async () => {
    if (loading || isUpdatingFromCalc.current) {
      console.log('StairConfig: Save aborted (loading or hydration in progress)');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('steel_token');
      if (!token) { toast.error('Please log in first'); return; }

      const savedInfo = localStorage.getItem(getContextKey());
      const parsed = savedInfo ? JSON.parse(savedInfo) : {};
      const projectId = projectData.projectId || parsed.id;

      if (!projectId) {
        setShowAllocateModal(true);
        setSaving(false);
        return;
      }

      // Strip history to prevent bloated payloads, BUT DO NOT normalize geometric units.
      // We persist EXACTLY what the user typed ({ value: "7' 11\"", unit: 'FT' })
      const stairsToSave = stairsRef.current.map(({ history, ...s }) => {
        return {
          ...s,
          flights: (s.flights || []).map(({ history: fh, ...f }) => ({ ...f })),
          landings: (s.landings || []).map(({ history: lh, ...l }) => ({ ...l })),
          rails: (s.rails || []).map(({ history: rh, ...r }) => ({ ...r }))
        };
      });

      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          stairs: stairsToSave,
          customerName: projectData.customerName,
          customerId: projectData.customerId,
          localConfig,
          additionalCosts
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Changes saved to database ✓');
        setIsDirty(false);
        // ✨ Clean up draft after successful DB save
        localStorage.removeItem(`stair_draft_${projectId}`);
      } else {
        toast.error(data.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [projectData.projectId, projectData.customerName, projectData.customerId, localConfig, additionalCosts]);

  const handleAllocated = useCallback((data) => {
    setProjectData(prev => ({
      ...prev,
      projectId: data.id,
      projectName: data.projectName,
      projectNumber: data.projectNumber,
      customerName: data.customerName,
      customerId: data.customerId,
      customerInfo: data.customerInfo
    }));

    // Update global context
    setSelectedEstimation({
      id: data.id,
      projectName: data.projectName,
      projectNumber: data.projectNumber,
      customer_id: data.customerId,
      customer_name: data.customerName
    });

    // Write to localStorage so other modules see it
    localStorage.setItem(getContextKey(), JSON.stringify({
      id: data.id,
      projectName: data.projectName,
      projectNumber: data.projectNumber,
      customerName: data.customerName,
      customerId: data.customerId
    }));

    toast.success('Estimations can now be saved to the project ✓');
  }, [setSelectedEstimation]);

  // Global Save implementation
  useEffect(() => {
    const onGlobalSave = () => saveChanges();
    window.addEventListener('app:save', onGlobalSave);
    return () => window.removeEventListener('app:save', onGlobalSave);
  }, [saveChanges]);

  // ── Calculate Estimation via backend ─────────────────────────────────────
  const calculateEstimation = useCallback(async () => {
    // 🔄 AUTO-SAVE: If there are unsaved changes, save silently before estimating
    // No modal interruption — just save in background and proceed
    if (isDirty && projectData.projectId) {
      try {
        await saveChanges();
      } catch (_) {
        // Non-blocking: proceed with estimation even if save fails
      }
    }
    setCalculating(true);
    try {
      const token = localStorage.getItem('steel_token');

      // Build components payload — same format as triggerLiveCalc for consistency
      // ── Consolidated robust parsing helpers ──
      const toFeetFull = (field) => {
        if (!field && field !== 0) return 0;
        if (typeof field === 'number') return field;
        if (typeof field === 'object' && 'value' in field) {
          const parsed = parseArchitecturalInput(field.value, field.unit);
          return normalizeToFeet(parsed.value, parsed.unit);
        }
        return parseFloat(field) || 0;
      };
      const toInchesFull = (field) => {
        if (!field && field !== 0) return 0;
        if (typeof field === 'number') return field;
        if (typeof field === 'object' && 'value' in field) {
          const parsed = parseArchitecturalInput(field.value, field.unit);
          return normalizeToInches(parsed.value, parsed.unit);
        }
        return parseFloat(field) || 0;
      };

      const getTypeCode = (t) => {
        const s = (t || '').toLowerCase();
        if (s.includes('cane')) return 'CANE_RAIL';
        if (s.includes('grab')) return 'GRAB_RAIL';
        if (s.includes('handrail') || s.includes('hand railing')) return 'GRAB_RAIL';
        if (s.includes('wall')) return 'WALL_RAIL';
        const m = s.match(/(\d+)-line/);
        if (m) {
          const n = parseInt(m[1]);
          if (n === 8) return 'GUARD_8_LINE';
          if (n === 3) return 'GUARD_3_LINE';
          if (n === 2) return 'GUARD_2_LINE';
          if (n === 1) return 'GUARD_1_LINE';
        }
        return 'GUARD_2_LINE';
      };

      const rails = [];
      const platforms = [];
      const stairFlights = [];

      stairsRef.current.forEach(stair => {
        // ── Collect Rails ──────────────────────────────────────────
        (stair.rails || []).forEach(r => {
          const rLen = toFeetFull(r.railLength);
          const rType = r.railType || r.rail_type_id;

          // Skip incomplete/empty rails — they contribute $0 and skew totals
          if (!rLen || !rType) return;

          rails.push({
            id: r.id,
            railType: rType,
            typeCode: getTypeCode(rType),
            length: rLen,
            railLength: rLen, // backend reads either railLength or length
            maxSpacing: toFeetFull(r.postSpacing),
            postSpacing: toFeetFull(r.postSpacing),
            mountingType: r.mountingType || '',
            finish: r.finish || 'Primer',
            intermediateRails: parseInt(r.intermediateRails) || 0,
            toeplateRequired: r.toeplateRequired || 'No',
            toeWidth: toFeetFull(r.toeWidth),
            isLvlAtBot: r.isLvlAtBot || false,
            isLvlAtTop: r.isLvlAtTop || false,
          });
        });

        // ── Collect Landings/Platforms ──────────────────────────────
        (stair.landings || []).forEach(l => {
          const lLen = toFeetFull(l.platformLength);
          const lWid = toFeetFull(l.platformWidth);

          // Skip incomplete/empty landings
          if (lLen <= 0 || lWid <= 0) return;

          platforms.push({
            id: l.id,
            platformType: l.platformType || l.type || 'Standard',
            length: lLen,
            width: lWid,
            quantity: 1,
            finish: l.finish || stair.finish || 'Primer',
            mountingType: l.mountingType || stair.mountingType || '',
          });
        });

        // ── Collect Stair Flights ───────────────────────────────────
        const rise = toInchesFull(stair.rise);
        const run = toInchesFull(stair.run);
        const width = toFeetFull(stair.stairWidth);

        // Only include stairs with valid geometry
        if (rise && run && width) {
          stairFlights.push({
            id: stair.id,
            width,
            rise,
            run,
            totalHeight: toInchesFull(stair.totalHeight),
            numRisers: parseInt(stair.numRisers || stair.systemCalc?.numRisers) || 0,
            stringerSize: stair.stringerSize || '',
            stringerType: stair.stringerType || 'Rolled',
            stairType: stair.stairType !== undefined ? stair.stairType : 'PAN PLATE CONC. FILLED',
            gratingTreadType: stair.gratingType || '',
            // 🛡️ DUMMY FIELDS: Extents are for reference only and must not affect estimation
            nsStringerBot: 0,
            fsStringerBot: 0,
            nsStringerTop: 0,
            fsStringerTop: 0,
            nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
            fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
            nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
            fsStringerConnTop: stair.fsStringerConnTop || 'Welded',
            finish: stair.finish || 'Primer',
            mountingType: stair.mountingType || '',
            flights: (stair.flights || []).map(f => ({
              ...f,
              width: toFeetFull(f.stairWidth),
              rise: toInchesFull(f.rise),
              run: toInchesFull(f.run),
              totalHeight: toInchesFull(f.totalHeight),
              // Ensure extents are handled consistently even for flights
              nsStringerBot: 0,
              fsStringerBot: 0,
              nsStringerTop: 0,
              fsStringerTop: 0
            })),
          });
        }
      });

      const payload = {
        rails,
        platforms,
        stairs: stairFlights,
        config: localConfig,
        additionalCosts: additionalCosts,
        estimateId: projectData.projectId
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success !== false) {
        setEstimationResult(data);
        setReportData(data); // Set report data but don't jump to report automatically
        toast.success('Estimation calculated ✓');

        // 💾 AUTO-SAVE calculation summary back to DB immediately
        if (projectData.projectId && token) {
          fetch(`${API_BASE_URL}/api/v1/projects/${projectData.projectId}`, {
            credentials: 'include',
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
              estimationResult: data,
              additionalCosts: additionalCosts,
              totalWeight: data.totalWeight || data.summary?.totalSteelWeight,
              totalCost: additionalCosts?.total || data.totalCost || data.summary?.grandTotal
            })
          }).catch(err => console.error('Failed to auto-save estimation result:', err));
        }

        // 📜 Scroll to summary for UX
        setTimeout(() => {
          document.getElementById('calculation-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        toast.error(data.error || 'Calculation failed');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      toast.error('Calculation failed: ' + err.message);
    } finally {
      setCalculating(false);
    }
    // 🔄 FIX: Include isDirty, localConfig, and saveChanges to prevent stale closure bugs
  }, [projectData.projectId, isDirty, localConfig, saveChanges, additionalCosts]);

  // ── Live per-change calculation (debounced 400ms) ─────────────────────────
  // Fires whenever stair data changes; embeds calc results back into each rail + landing.
  const liveCalcTimer = useRef(null);
  const isUpdatingFromCalc = useRef(true); // 🛡️ Initial state TRUE to suppress dirty flag on mount

  const triggerLiveCalc = useCallback((latestStairs) => {
    clearTimeout(liveCalcTimer.current);
    liveCalcTimer.current = setTimeout(async () => {

      // ── Build Single Unified Payload ──
      const rails = [];
      const platforms = [];
      const stairs = [];

      latestStairs.forEach((stair, si) => {
        // Consolidated robust parsing helpers
        const toFeet = (field) => parseToFeet(field);
        const toInches = (field) => {
          if (!field) return 0;
          const { value, unit } = field;
          const parsed = parseArchitecturalInput(value, unit);
          return normalizeToInches(parsed.value, parsed.unit);
        };

        const rise = toInches(stair.rise);
        const run = toInches(stair.run);
        const width = toFeet(stair.stairWidth);
        const hFeet = toFeet(stair.totalHeight);

        const hasMainGeometry = (rise > 0 && run > 0 && width > 0);
        const hasSubItems = (stair.flights?.length > 0 || stair.landings?.length > 0 || stair.rails?.length > 0);

        if (hasMainGeometry || hasSubItems) {
          stairs.push({
            id: stair.id,
            risers: parseInt(stair.numRisers) || 0,
            run: stair.run,
            rise: stair.rise,
            totalHeight: stair.totalHeight,
            width: stair.stairWidth,
            stairType: stair.stairType !== undefined ? stair.stairType : 'PAN PLATE CONC. FILLED',
            panPlThk: stair.panPlThk,
            gratingTreadType: stair.gratingType || '',
            stringerSize: stair.stringerSize || '',
            stringerType: stair.stringerType || 'Rolled',
            stringerLength: stair.stringerLength,
            // 🛡️ DUMMY FIELDS: Extents are for reference only and must not affect estimation
            nsStringerBot: { value: '0', unit: 'FT' },
            fsStringerBot: { value: '0', unit: 'FT' },
            nsStringerTop: { value: '0', unit: 'FT' },
            fsStringerTop: { value: '0', unit: 'FT' },
            nsStringerConnBot: stair.nsStringerConnBot || 'Welded',
            fsStringerConnBot: stair.fsStringerConnBot || 'Welded',
            nsStringerConnTop: stair.nsStringerConnTop || 'Welded',
            fsStringerConnTop: stair.fsStringerConnTop || 'Welded',
            finish: stair.finish || 'Primer',
            mountingType: stair.mountingType || '',
            flights: (stair.flights || []).map(f => ({
              ...f,
              width: toFeet(f.stairWidth),
              rise: toInches(f.rise),
              run: toInches(f.run),
              totalHeight: toInches(f.totalHeight),
              stringerLength: f.stringerLength,
              // 🛡️ DUMMY FIELDS: Extents are for reference only and must not affect estimation
              nsStringerBot: { value: '0', unit: 'FT' },
              fsStringerBot: { value: '0', unit: 'FT' },
              nsStringerTop: { value: '0', unit: 'FT' },
              fsStringerTop: { value: '0', unit: 'FT' }
            }))
          });
        }

        // Landings / Platforms
        (stair.landings || []).forEach(l => {
          const lLen = toFeet(l.platformLength);
          const lWid = toFeet(l.platformWidth);

          // BOTH Length and Width are mandatory as per user rule
          if (lLen > 0 && lWid > 0) {
            platforms.push({
              id: l.id,
              platformType: l.platformType || l.type || 'Standard',
              length: lLen,
              width: lWid,
              quantity: 1,
              finish: l.finish || stair.finish || 'Primer',
              mountingType: l.mountingType || stair.mountingType || ''
            });
          }
        });

        // Rails
        (stair.rails || []).forEach(r => {
          const rLen = toFeet(r.railLength);
          const rType = r.railType || r.rail_type_id || (r.type === 'kickPlate' ? 'Kick Plate' : '');

          const getTypeCode = (t) => {
            const s = (t || '').toLowerCase();
            if (s.includes('kick')) return 'KICK_PLATE';
            if (s.includes('cane')) return 'CANE_RAIL';
            if (s.includes('grab')) return 'GRAB_RAIL';
            if (s.includes('handrail') || s.includes('hand railing')) return 'GRAB_RAIL';
            if (s.includes('wall')) return 'WALL_RAIL';
            const m = s.match(/(\d+)-line/);
            if (m) {
              const n = parseInt(m[1]);
              if (n === 8) return 'GUARD_8_LINE';
              if (n === 3) return 'GUARD_3_LINE';
              if (n === 2) return 'GUARD_2_LINE';
              if (n === 1) return 'GUARD_1_LINE';
            }
            return 'GUARD_2_LINE';
          };

          if (rLen && rType) {
            rails.push({
              id: r.id,
              railType: rType,
              typeCode: getTypeCode(rType),
              length: rLen,
              maxSpacing: toFeet(r.postSpacing),
              mountingType: r.mountingType || '',
              finish: r.finish || 'Primer',
              intermediateRails: parseInt(r.intermediateRails) || 0,
              toeplateRequired: r.toeplateRequired || 'No', // Keep as string "Yes"/"No" to match state expectations
              toeWidth: toFeet(r.toeWidth),
              isLvlAtBot: r.isLvlAtBot || false,
              isLvlAtTop: r.isLvlAtTop || false,
              widthIn: r.type === 'kickPlate' ? (r.width || r.widthIn || 4) : undefined
            });
          }
        });
      });

      if (rails.length === 0 && platforms.length === 0 && stairs.length === 0) return;

      const { calculateFull } = await import('../../services/estimationService');
      const result = await calculateFull({ rails, platforms, stairs, config: localConfig });

      // 📊 DEBUG LOGGING (MANDATORY)
      console.log("📤 Payload:", { rails, platforms, stairs });
      console.log("📥 Response:", result);

      if (!result.success) return;

      // ── Embed Results back into State ──
      isUpdatingFromCalc.current = true;
      setStairs(prev => {
        let stairIdx = 0;
        let landingIdx = 0;
        let railIdx = 0;

        return prev.map(s => {
          const updatedStair = { ...s };

          // Helper for results mapping (identical to payload triggers)
          const toFeet = (field) => parseToFeet(field);
          const toInches = (field) => {
            if (!field) return 0;
            const parsed = parseArchitecturalInput(field.value, field.unit);
            return normalizeToInches(parsed.value, parsed.unit);
          };

          const sRise = toInches(s.rise);
          const sRun = toInches(s.run);
          const sWidth = toFeet(s.stairWidth);

          // 1. Map Stair results
          if (sRise && sRun && sWidth) {
            const stairCalc = result.breakdown?.stairs?.[stairIdx++] || {};
            updatedStair.systemCalc = stairCalc.systemCalc || {};

            // Merge top-level results (weights, costs, hours)
            Object.assign(updatedStair, {
              totalWeight: stairCalc.totalWeight,
              shopHours: stairCalc.shopHours,
              fieldHours: stairCalc.fieldHours,
              totalCost: stairCalc.totalCost,
              isCompliant: stairCalc.isCompliant,
              slope: stairCalc.slope, // From Tekla engine
              angle: stairCalc.slope, // Match Tekla slope
              risers: stairCalc.risers,
              numRisers: stairCalc.risers, // Sync both naming conventions
              systemCalc: stairCalc.systemCalc
            });

            // ✈️ Map Flight results
            if (updatedStair.flights && stairCalc.flights) {
              updatedStair.flights = updatedStair.flights.map((fl, fi) => {
                const flCalcRaw = stairCalc.flights[fi] || {};
                // 🛡️ DUMMY FIELDS: Do NOT merge extents back from backend results
                const { 
                  nsStringerBot: _nb, fsStringerBot: _fb, 
                  nsStringerTop: _nt, fsStringerTop: _ft, 
                  width: _w, rise: _ri, run: _ru, totalHeight: _th, // Strip normalized numbers
                  stairWidth: _sw, // Strip potential name collisions
                  ...flCalc 
                } = flCalcRaw;
                return {
                  ...fl,
                  ...flCalc,
                  systemCalc: flCalc.systemCalc || {}
                };
              });
            }
          }

          // 2. Map Landing results
          if (updatedStair.landings) {
            updatedStair.landings = updatedStair.landings.map(l => {
              const lLen = toFeet(l.platformLength);
              const lWid = toFeet(l.platformWidth);

              if (lLen > 0 && lWid > 0) {
                const lCalcRaw = result.breakdown?.platforms?.[landingIdx++] || {};
                // 🔄 PERSISTENCE FIX: Strip backend geometry fields that would overwrite user inputs
                // lCalc returns {length, width} plain numbers — these must NOT replace {platformLength, platformWidth}
                const { length: _l, width: _w, ...lCalc } = lCalcRaw;
                return {
                  ...l,
                  ...lCalc,
                  systemCalc: lCalc.systemCalc || {}
                };
              } else {
                // Clear stale calculations if inputs are incomplete
                return { ...l, totalCost: 0, systemCalc: null };
              }
            });
          }

          if (updatedStair.rails) {
            updatedStair.rails = updatedStair.rails.map(r => {
              const rLen = toFeet(r.railLength);
              const rType = r.railType || r.rail_type_id || (r.type === 'kickPlate' ? 'Kick Plate' : '');

              if (rLen && rType) {
                const rCalcRaw = result.breakdown?.rails?.[railIdx++] || {};
                // 🔄 PERSISTENCE FIX: Strip backend geometry fields that would overwrite user inputs
                // rCalc returns {length, maxSpacing} plain numbers — must NOT replace {railLength, postSpacing}
                const { length: _l, maxSpacing: _ms, ...rCalc } = rCalcRaw;
                return {
                  ...r,
                  ...rCalc,
                  systemCalc: rCalc.systemCalc || {}
                };
              }
              return { ...r, totalCost: 0, systemCalc: null };
            });
          }

          return updatedStair;
        });
      });

    }, 400);
  }, [localConfig]);

  // Trigger live calc whenever stairs change, but NOT when we wrote results or restored from DB
  useEffect(() => {
    if (isUpdatingFromCalc.current) {
      isUpdatingFromCalc.current = false; // Reset suppression flag
      return;
    }
    // Only set dirty if it was a user change (not a db load/sync)
    setIsDirty(true);
    triggerLiveCalc(stairs);
  }, [stairs, triggerLiveCalc]);

  // 💾 Auto-Save Draft (to localStorage)
  useEffect(() => {
    if (isDirty && stairs.length > 0) {
      const timer = setTimeout(() => {
        const draftKey = `stair_draft_${projectData.projectId || 'global'}`;
        localStorage.setItem(draftKey, JSON.stringify(stairs));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stairs, isDirty, projectData.projectId]);


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
          stairWidth: { value: '4.0', unit: 'FT' },
          run: { value: '11.0', unit: 'IN' },
          rise: { value: '7.0', unit: 'IN' },
          panPlThk: { value: '0', unit: 'IN' },
          totalHeight: { value: '', unit: 'FT' },
          nsStringerBot: { value: '0', unit: 'FT' },
          fsStringerBot: { value: '0', unit: 'FT' },
          nsStringerTop: { value: '0', unit: 'FT' },
          fsStringerTop: { value: '0', unit: 'FT' },
          stringerType: 'Rolled',
          stringerSize: '',
          selectionSource: 'auto'
        };
      case 'industrial':
        return {
          stairCategory: 'Industrial',
          stairType: 'grating-tread',
          stairWidth: { value: '3.0', unit: 'FT' },
          run: { value: '10.0', unit: 'IN' },
          rise: { value: '7.5', unit: 'IN' },
          totalHeight: { value: '', unit: 'FT' },
          nsStringerBot: { value: '0', unit: 'FT' },
          fsStringerBot: { value: '0', unit: 'FT' },
          nsStringerTop: { value: '0', unit: 'FT' },
          fsStringerTop: { value: '0', unit: 'FT' },
          stringerType: 'Rolled',
          stringerSize: '',
          selectionSource: 'auto',
          steelGrade: 'A36'
        };
      default:
        return {
          stairCategory: 'Commercial',
          stairType: 'pan-concrete',
          stairWidth: { value: '', unit: 'FT' },
          run: { value: '', unit: 'IN' },
          rise: { value: '', unit: 'IN' },
          panPlThk: { value: '0', unit: 'IN' },
          totalHeight: { value: '', unit: 'FT' },
          nsStringerBot: { value: '', unit: 'FT' },
          fsStringerBot: { value: '', unit: 'FT' },
          nsStringerTop: { value: '', unit: 'FT' },
          fsStringerTop: { value: '', unit: 'FT' },
          stringerType: 'Rolled',
          stringerSize: '',
          selectionSource: 'auto',
          steelGrade: 'A36'
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

    const newStair = {
      id: makeId(),
      label: `Stair ${nextNum}`,
      stairType: templateDefaults.stairType || '',
      drawingRef: '',
      flights: [],
      landings: [],
      rails: [],
      history: { lastDeleted: null },
      template,
      selectionSource: 'auto',
      ...templateDefaults
    };

    setStairs(s => [...s, newStair]);
    setActiveId(newStair.id);
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

    const newStair = {
      ...target,
      id: makeId(),
      label: `Stair ${nextNum}`,
      flights: deepClone(target.flights || []),
      landings: deepClone(target.landings || []),
      rails: deepClone(target.rails || []),
      history: { lastDeleted: null }
    };

    setStairs(s => [...s, newStair]);
    setActiveId(newStair.id);
  };

  const deleteStair = (id) => {
    const deleted = stairs.find(s => s.id === id);
    setOverallHistory({ type: 'stair', data: deleted });
    const remaining = stairs.filter(x => x.id !== id);
    setStairs(remaining);

    // If we deleted the active stair, pick a new one
    if (activeId === id && remaining.length > 0) {
      setActiveId(remaining[remaining.length - 1].id);
    } else if (remaining.length === 0) {
      setActiveId(null);
    }
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

      let finalExtra = { ...extra };
      if (type === 'flight') {
        // 🔄 BEHAVIOR FIX: New flights should inherit geometry and config from parent (Flight 1)
        finalExtra = {
          stairWidth: s.stairWidth,
          run: s.run,
          rise: s.rise,
          totalHeight: s.totalHeight,
          stairType: s.stairType || 'pan-concrete',
          stairCategory: s.stairCategory || 'Commercial',
          finish: s.finish || 'Primer',
          mountingType: s.mountingType,
          stringerType: s.stringerType || 'Rolled',
          stringerSize: s.stringerSize,
          steelGrade: s.steelGrade || 'A36',
          ...extra
        };
      }

      return {
        ...s,
        [type + 's']: [...items, { id: makeId(), label, ...finalExtra }]
      };
    }));
  };

  const copyLastFlight = (stairId) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const flights = s.flights || [];
      const nextNum = Math.max(...(flights.length > 0 ? flights.map(f => {
        const m = f.label.match(/\d+/);
        return m ? parseInt(m[0]) : 0;
      }) : [1])) + 1;

      if (flights.length === 0) {
        // If no flights exist, inherit from parent stair
        return {
          ...s,
          flights: [...flights, {
            id: makeId(),
            label: `Flight ${nextNum}`,
            stairWidth: s.stairWidth,
            run: s.run,
            rise: s.rise,
            totalHeight: s.totalHeight,
            stairType: s.stairType || 'pan-concrete',
            stairCategory: s.stairCategory || 'Commercial',
            finish: s.finish || 'Primer',
            mountingType: s.mountingType,
            stringerType: s.stringerType || 'Rolled',
            stringerSize: s.stringerSize,
            steelGrade: s.steelGrade || 'A36'
          }]
        };
      }
      
      const last = flights[flights.length - 1];
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
      setOverallHistory({ type, stairId, data: deleted });
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
    setOverallHistory(null);
  };

  const moveSubItem = (stairId, type, itemId, direction) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const key = type + 's';
      const items = [...s[key]];
      const index = items.findIndex(x => x.id === itemId);
      
      if (index === -1) return s;
      if (direction === 'up' && index > 0) {
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
      } else if (direction === 'down' && index < items.length - 1) {
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
      } else {
        return s; // No change
      }
      
      setIsDirty(true);
      return { ...s, [key]: items };
    }));
  };

  const reorderSubItems = (stairId, type, newItems) => {
    setStairs(st => st.map(s => {
      if (s.id !== stairId) return s;
      const key = type + 's';
      setIsDirty(true);
      return { ...s, [key]: newItems };
    }));
  };

  const updateLocalRate = (key, value) => {
    let finalVal = parseFloat(value);
    if (isNaN(finalVal)) return;

    // Special handling for tax_rate to keep it as decimal in state but percentage in UI
    if (key === 'tax_rate') {
      finalVal = finalVal / 100;
    }

    setLocalConfig(prev => ({
      ...prev,
      [key]: finalVal
    }));
    setIsDirty(true);
  };

  const undoLastOverallAction = () => {
    if (!overallHistory) return;
    const { type, stairId, data } = overallHistory;

    if (type === 'stair') {
      setStairs(prev => [...prev, data]);
    } else {
      setStairs(st => st.map(s => {
        if (s.id !== stairId) return s;
        const key = type + 's';
        return {
          ...s,
          [key]: [...s[key], data],
          history: { lastDeleted: null }
        };
      }));
    }
    setOverallHistory(null);
    toast.success(`Restored ${type} ✓`);
  };

  // Summary stats
  const totalStairs = stairs.length;
  const getRailCount = (type) => stairs.reduce((sum, s) => sum + (s.rails?.filter(r => r.type === type).length || 0), 0);

  const counts = {
    stairs: totalStairs,
    landings: stairs.reduce((sum, s) => sum + (s.landings?.length || 0), 0),
    guard: getRailCount('guardRail'),
    wall: getRailCount('wallRail'),
    grab: getRailCount('grabRail'),
    cane: getRailCount('caneRail'),
    kick: getRailCount('kickPlate')
  };

  const totalRisers = stairs.reduce((sum, s) => {
    let r = s.systemCalc?.riseQty || 0;
    (s.flights || []).forEach(f => r += (f.systemCalc?.riseQty || 0));
    return sum + r;
  }, 0);

  // Use estimation result for weight/cost if available
  const estimatedSteelWeight = estimationResult?.summary?.totalSteelWeight ?? estimationResult?.sfeSummary?.totalSteelWeight ?? stairs.reduce((sum, s) => {
    let w = s.totalWeight || 0;
    (s.rails || []).forEach(r => w += (r.totalWeight || 0));
    (s.landings || []).forEach(l => w += (l.totalWeight || 0));
    return sum + w;
  }, 0);

  const estimatedCost = estimationResult?.summary?.grandTotal ?? estimationResult?.sfeSummary?.grandTotal ?? estimationResult?.totalEstimatedCost ?? stairs.reduce((sum, s) => {
    let c = s.totalCost || 0;
    (s.rails || []).forEach(r => c += (r.totalCost || 0));
    (s.landings || []).forEach(l => c += (l.totalCost || 0));
    return sum + c;
  }, 0);

  if (showReport) {
    return (
      <EstimateReport
        data={{
          ...reportData,
          projectData,
          rawStairs: stairs,
          additionalCosts
        }}
        onBack={() => setShowReport(false)}
      />
    );
  }

  // Inject GPT radio/form overrides that beat inline styles
  // (InlineStyles always win over CSS classes; this is the only clean solution)
  const GPT_OVERRIDE_STYLE = `
    .radio-option.selected {
      border-color: #10a37f !important;
      background: rgba(16,163,127,0.06) !important;
      color: #059669 !important;
      box-shadow: 0 0 0 3px rgba(16,163,127,0.08) !important;
    }
    .radio-option.selected input[type="radio"] { accent-color: #10a37f !important; }
    .radio-option:not(.selected) {
      border-color: #e5e5e5 !important;
      background: #ffffff !important;
      color: #6e6e80 !important;
    }
    .form-section [style*="background: \'#F8FAFC\'"],
    .form-section [style*='background: "#F8FAFC"'] { background: #ffffff !important; }
    .collapsible-body .form-section { margin-bottom: 12px !important; }
    .collapsible-body .form-section:last-child { margin-bottom: 0 !important; }
    /* Live preview card — GPT-tone metrics */
    .summary-card.card-glow-blue { border-top-color: #10a37f !important; }
    .summary-card.card-glow-purple { border-top-color: #6366f1 !important; }
    /* Slope compliance glow */
    .field-auto { border-color: rgba(16,163,127,0.3) !important; }
    /* Sub-section (Pan/Tread config) */
    .form-grid[style*="background"] { 
      background: #f9f9f9 !important; 
      border: 1px solid #e5e5e5 !important;
      border-radius: 8px !important;
    }

    .sc-stair-nav-wrapper {
      margin-bottom: 6px;
      position: relative;
    }
    .sc-quick-add-panel {
      padding: 12px 14px;
      background: var(--sf-surface);
      border: 1px solid var(--sf-border);
      border-radius: var(--sf-radius-sm);
      margin: 4px 0 8px 16px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .sc-quick-add-panel::before {
      content: '';
      position: absolute;
      left: -10px;
      top: -12px;
      bottom: 16px;
      width: 2px;
      background: var(--sf-border);
      border-radius: 2px;
    }
    .sc-quick-add-heading {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--sf-muted);
      margin-bottom: 10px;
    }
    .sc-quick-add-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    .sc-quick-stack {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
    }
    .sc-quick-add-grid:last-child {
      margin-bottom: 0 !important;
    }
    .sc-quick-add-btn {
      font-family: 'DM Sans', sans-serif !important;
      font-size: 10.5px !important;
      font-weight: 600 !important;
      padding: 6px 10px !important;
      background: var(--sf-bg) !important;
      border: 1px solid var(--sf-border) !important;
      border-radius: 6px !important;
      color: var(--sf-text) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
      width: 100% !important;
    }
    .sc-quick-add-btn:hover {
      background: var(--sf-surface);
      border-color: var(--sf-accent);
      color: var(--sf-accent);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px var(--sf-accent-dim);
    }
    .sc-overall-undo {
      background: var(--sf-accent);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      border: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px var(--sf-accent-dim);
    }
    .sc-stair-nav {
      position: relative;
    }
    .sc-stair-copy-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      padding: 4px;
      border-radius: 4px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--sf-muted);
      opacity: 0.6; /* Softly visible by default */
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sc-stair-nav:hover .sc-stair-copy-btn {
      opacity: 1;
      color: var(--sf-accent);
    }
    .sc-stair-copy-btn:hover {
      background: var(--sf-bg);
      border-color: var(--sf-border);
      color: var(--sf-accent);
      transform: translateY(-50%) scale(1.1);
    }
    .sc-nav-tag {
      margin-right: 28px; /* Make room for the copy icon */
    }
    .sc-sidebar-rates-pill {
      width: 100%;
      background: transparent !important;
      border: none !important;
      padding: 12px 0 !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      color: #71717a;
      transition: all 0.2s;
    }
    .sc-sidebar-rates-pill:hover { background: rgba(0,0,0,0.02) !important; }
    .sc-rates-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
      font-weight: 700;
      color: #111827;
    }
    .sc-dot-sep {
      display: none;
    }
    .sc-sidebar-rates-pill b {
      color: #111827;
      margin-left: 2px;
    }
    
    /* Metrics List */
    .sc-metrics-list {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 0 4px;
    }
    .sc-metric-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 500;
      color: #4b5563;
    }
    .sc-metric-val {
      color: #111827;
      font-weight: 800;
    }
    .sc-metric-total .sc-metric-val {
      color: #10a37f;
      font-size: 15px;
    }
    
    /* Cost Breakdown Styles */
    .sc-cost-breakdown {
      margin: 4px 0 10px 24px;
      padding: 8px 12px;
      border-left: 2px solid var(--sf-accent-dim);
      background: rgba(0,0,0,0.01);
      border-radius: 0 0 8px 8px;
    }
    .sc-breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 600;
      background: transparent;
      border: none;
      width: 100%;
      padding: 4px 6px;
      cursor: pointer;
      text-align: left;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .sc-breakdown-item:last-child { margin-bottom: 0; }
    .sc-breakdown-item:hover {
      background: var(--sf-accent-dim);
      color: var(--sf-accent);
    }
    .bc-branch {
      color: var(--sf-accent);
      margin-right: 8px;
      opacity: 0.5;
    }
    .bc-val {
      color: #0f172a;
      font-weight: 800;
      font-family: 'Geist Mono', monospace;
      font-size: 11.5px;
    }
    .sc-nav-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      font-family: 'Geist Mono', monospace;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .active .sc-nav-tag {
      background: #10a37f;
      color: white;
    }
    .sc-nav-weight {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      margin-right: 8px;
    }
    .active .sc-nav-weight {
      color: rgba(255,255,255,0.7);
    }
    
    /* KPI and Sidebar Rates */
    .sc-kpi-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .sc-kpi-card.sc-kpi-outline {
      background: transparent;
      border: 1px solid var(--sf-border);
      box-shadow: none;
    }
    .sc-sidebar-rates-pill {
      width: 100%;
      background: var(--sf-bg);
      border: 1px solid var(--sf-border);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      color: var(--sf-muted);
      transition: all 0.2s;
    }
    .sc-sidebar-rates-pill:hover {
      border-color: var(--sf-accent);
      background: white;
    }
    .sc-header-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 2px;
    }
    .sc-header-rates {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
      padding: 6px 14px;
      background: #f8fafc;
      border-radius: 100px;
      border: 1px solid #e2e8f0;
      width: fit-content;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .sc-rate-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .sc-rate-item b {
      font-family: 'Geist Mono', monospace;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
    }
    /* Color-coding for rates */
    .rate-steel b { color: #2563eb; background: rgba(37, 99, 235, 0.05); }
    .rate-shop b  { color: #059669; background: rgba(5, 150, 105, 0.05); }
    .rate-field b { color: #0d9488; background: rgba(13, 148, 136, 0.05); }
    .rate-scrap b { color: #d97706; background: rgba(217, 119, 6, 0.05); }
    .rate-tax b   { color: #7c3aed; background: rgba(124, 58, 237, 0.05); }

    .sc-rate-input {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-weight: 800;
      font-family: 'Geist Mono', monospace;
      width: 58px;
      padding: 2px 4px;
      border-radius: 4px;
      transition: all 0.2s;
      text-align: center;
      font-size: 11px;
    }
    .sc-rate-input:focus {
      border-color: #10a37f;
      outline: none;
      box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.1);
    }
    .sc-rate-unit {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 700;
      margin-left: -2px;
    }
    .sc-rate-edit-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      font-size: 9px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 100px;
      cursor: pointer;
      transition: all 0.2s;
      margin-left: 8px;
      text-transform: uppercase;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .sc-rate-edit-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .sc-rate-edit-btn.active {
      background: #10a37f;
      color: white;
      border-color: #10a37f;
    }
    .sc-dot-sep {
      opacity: 0.3;
      font-weight: 900;
      color: #cbd5e1;
    }
    .sc-est-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }
    .sc-est-table th {
      padding: 12px 14px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      border-bottom: 2px solid #f1f5f9;
      background: #f8fafc;
      white-space: nowrap;
    }
    .sc-est-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
      vertical-align: middle;
      font-weight: 500;
    }
    .sc-row-label {
      text-align: right;
      font-weight: 700 !important;
      color: #1e293b !important;
      font-size: 12.5px !important;
      background: #fdfdfd;
      width: 220px;
    }
    .sc-num-cell {
      text-align: center;
      font-family: 'Geist Mono', monospace;
      font-weight: 600;
      color: #0f172a;
    }
    .sc-money {
      color: #10a37f !important;
      font-weight: 800 !important;
    }
    .sc-total-num {
      font-size: 16px !important;
      color: #10a37f !important;
      font-weight: 900 !important;
    }
    .sc-col-shaded {
      background: #fcfcfc !important;
    }
    .sc-yes-badge {
      background: #10a37f !important;
      color: white !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      font-size: 9px !important;
      font-weight: 900 !important;
    }
    .sc-totals-box {
      margin: 24px 24px 24px auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      width: 420px;
    }
    .sc-total-row {
      padding: 14px 20px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .sc-grand-total {
      background: #0f172a !important;
      padding: 18px 20px !important;
    }
    .sc-grand-total span:first-child {
      color: rgba(255,255,255,0.7);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 11px;
    }
    .sc-grand-total .pulsing-total {
      font-size: 28px !important;
      font-weight: 900 !important;
      background: linear-gradient(135deg, #10a37f 0%, #34d399 100%) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }
    .sc-adj-total-row {
      background: #f0fdfa;
      border-top: 1px solid #10a37f;
    }
    .sc-adj-total-val {
      font-size: 20px;
      font-weight: 900;
      color: #10a37f;
    }

    /* Classic Confirm Modal Styling */
    .sc-confirm-modal {
      width: 420px;
      max-width: 90%;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 50px rgba(0,0,0,0.12);
      border: 1px solid #e5e7eb;
      margin: auto;
    }
    .sc-confirm-header {
      padding: 24px 28px 12px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .sc-confirm-icon {
      width: 36px;
      height: 36px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #d97706;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .sc-confirm-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .sc-confirm-body {
      padding: 4px 28px 24px;
      font-size: 14px;
      color: #71717a;
      line-height: 1.55;
    }
    .sc-confirm-actions {
      padding: 16px 20px;
      background: #fafafa;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f0f0f0;
    }
    .confirm-btn-outline {
      padding: 9px 18px;
      border-radius: 9px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .confirm-btn-outline:hover {
      background: #f9fafb;
      color: #111827;
      border-color: #d1d5db;
    }
    .confirm-btn-solid {
      padding: 9px 18px;
      border-radius: 9px;
      background: #111827;
      color: white;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .confirm-btn-solid:hover {
      background: #000000;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
  `;

  return (
    <>
      <style>{GPT_OVERRIDE_STYLE}</style>

      {/* 🧊 HYDRATION OVERLAY 🧊 */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100000,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: '40px', height: '40px', border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
            <h2 style={{ marginTop: '20px', fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Hydrating Project Data
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Synchronizing your estimation state with the server...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="stair-page">


        {/* ══ LEFT RAIL ══════════════════════════════════════════════════════ */}
        <aside className="sc-rail">

          {/* Draft Mode / Create Project CTA */}
          {!projectData.projectId && (
            <div className="sc-rail-section" style={{ borderBottom: '2px solid #fbbf24', background: '#fffbeb', margin: '-16px -16px 16px -16px', padding: '16px' }}>
              <div className="sc-rail-heading" style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} fill="#fbbf24" /> Draft Mode
              </div>
              <p style={{ fontSize: '11px', color: '#b45309', margin: '4px 0 12px', lineHeight: '1.4' }}>
                You are working in draft mode. Allocating this to a project will save your progress.
              </p>
              <button
                className="confirm-btn-solid"
                style={{ width: '100%', fontSize: '11px', padding: '8px', background: '#d97706' }}
                onClick={() => setShowAllocateModal(true)}
              >
                Allocate to Project
              </button>
            </div>
          )}

          {/* Customer Information Card */}
          {projectData.customerInfo && (
            <div className="sc-rail-section" style={{ borderBottom: '2px solid var(--border-blueprint)', background: 'var(--color-primary-50)', margin: '-16px -16px 16px -16px', padding: '16px' }}>
              <div className="sc-rail-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-primary-700)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} /> Customer Details
                </div>
                <button
                  onClick={handleDisconnectProject}
                  className="text-[10px] uppercase font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                  title="Disconnect from Project & Return to Draft"
                >
                  <X size={10} /> Cancel
                </button>
              </div>
              <div className="sc-customer-card">
                <div className="sc-cust-primary">{projectData.customerInfo.company}</div>
                <div className="sc-cust-contact">
                  <User size={11} /> {projectData.customerInfo.contact || 'No contact person'}
                </div>
                <div className="sc-cust-meta">
                  <div className="sc-cust-item"><Mail size={11} /> {projectData.customerInfo.email || '—'}</div>
                  <div className="sc-cust-item"><Phone size={11} /> {projectData.customerInfo.phone || '—'}</div>
                  <div className="sc-cust-item"><MapPin size={11} /> {projectData.customerInfo.city ? `${projectData.customerInfo.city}, ${projectData.customerInfo.state}` : '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats Grid (3x2) */}
          <div className="sc-rail-section">
            <div className="sc-rail-heading">Project Summary</div>
            <div className="sc-stat-grid-2">
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.stairs}</div>
                <div className="sc-mini-stat-label">Stairs</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.landings}</div>
                <div className="sc-mini-stat-label">Landings</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.guard}</div>
                <div className="sc-mini-stat-label">Guard</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.wall}</div>
                <div className="sc-mini-stat-label">Wall</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.grab}</div>
                <div className="sc-mini-stat-label">Grab</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.cane}</div>
                <div className="sc-mini-stat-label">Cane</div>
              </div>
            </div>

            <div className="sc-metrics-list">
              <div className="sc-metric-item">
                <span>Steel weight</span>
                <span className="sc-metric-val">{estimatedSteelWeight > 0 ? `${estimatedSteelWeight.toFixed(1)} lb` : '—'}</span>
              </div>
              <div className="sc-metric-item sc-metric-total">
                <span>Est. cost</span>
                <span className="sc-metric-val">${Math.round(estimatedCost).toLocaleString()}</span>
              </div>
              <div className="sc-metric-item">
                <span>Total risers</span>
                <span className="sc-metric-val">{totalRisers || '—'}</span>
              </div>
              <div className="sc-metric-item">
                <span>Price / riser</span>
                <span className="sc-metric-val">
                  {totalRisers > 0 ? `$${Math.round(estimatedCost / totalRisers)}` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="sc-rail-divider" />

          {/* Stair navigation */}
          <div className="sc-rail-section">
            <div className="sc-rail-heading">Assemblies</div>
            {stairs.map(stair => {
              const assemblyTotal = (stair.totalCost || 0) +
                (stair.rails || []).reduce((sum, r) => sum + (r.totalCost || 0), 0) +
                (stair.landings || []).reduce((sum, l) => sum + (l.totalCost || 0), 0);

              const assemblyWeight = (stair.totalWeight || 0) +
                (stair.rails || []).reduce((sum, r) => sum + (r.totalWeight || 0), 0) +
                (stair.landings || []).reduce((sum, l) => sum + (l.totalWeight || 0), 0);

              return (
                <div key={stair.id} className="sc-stair-nav-wrapper">
                  <div className={`sc-stair-nav-group ${activeId === stair.id ? 'active' : ''}`}>
                    <button
                      className="sc-stair-nav"
                      onClick={() => {
                        setActiveId(stair.id);
                        document.getElementById(`stair-${stair.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span className="sc-nav-bullet" />
                      <span className="sc-nav-name">{stair.label}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {assemblyWeight > 0 && <span className="sc-nav-weight">{Math.round(assemblyWeight)} lb</span>}
                        {assemblyTotal > 0 && <span className="sc-nav-tag">${Math.round(assemblyTotal).toLocaleString()}</span>}
                      </div>
                    </button>
                    <button className="sc-stair-copy-btn" onClick={() => duplicateStair(stair.id)} title="Duplicate Stair">
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* Micro Cost Breakdown */}
                  {activeId === stair.id && (
                    <div className="sc-cost-breakdown">
                      {stair.totalCost > 0 ? (
                        <button className="sc-breakdown-item" onClick={() => jumpTo(stair.id, `stair-${stair.id}`)}>
                          <span><span className="bc-branch">↳</span>Stringers & Pans</span>
                          <span className="bc-val">${Math.round(stair.totalCost).toLocaleString()}</span>
                        </button>
                      ) : (
                        <div style={{ padding: '4px 6px', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                          No flight geometry defined
                        </div>
                      )}
                      {(stair.landings || []).map((l, i) => (
                        <button key={l.id} className="sc-breakdown-item" onClick={() => jumpTo(stair.id, `landing-${l.id}`)}>
                          <span><span className="bc-branch">↳</span>{l.label}</span>
                          <span className="bc-val">${Math.round(l.totalCost || 0).toLocaleString()}</span>
                        </button>
                      ))}
                      {(stair.rails || []).map((r, i) => (
                        <button key={r.id} className="sc-breakdown-item" onClick={() => jumpTo(stair.id, `rail-${r.id}`)}>
                          <span><span className="bc-branch">↳</span>{r.label}</span>
                          <span className="bc-val">${Math.round(r.totalCost || 0).toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {activeId === stair.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.98 }}
                        animate={{ height: 'auto', opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="sc-quick-add-panel">
                          <div className="sc-quick-add-heading">QUICK ADD</div>

                          {/* Section 1: Major Elements (Full Width) */}
                          <div className="sc-quick-stack">
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'flight')}>+ Flight</button>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'landing')}>+ Landing</button>
                          </div>

                          {/* Section 2: Primary Rails (2-Columns) */}
                          <div className="sc-quick-add-grid" style={{ marginTop: '8px' }}>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'rail', { type: 'guardRail' })}>Guard</button>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'rail', { type: 'wallRail' })}>Wall</button>
                          </div>

                          {/* Section 3: Specialized (Variable columns) */}
                          <div className="sc-quick-stack" style={{ marginTop: '8px' }}>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'rail', { type: 'grabRail' })}>Grab</button>
                          </div>

                          <div className="sc-quick-add-grid" style={{ marginTop: '8px' }}>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'rail', { type: 'caneRail' })}>Cane</button>
                            <button className="sc-quick-add-btn" onClick={() => addSubItem(stair.id, 'rail', { type: 'kickPlate' })}>Kick plate</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            <button className="sc-add-stair" onClick={openTemplateModal} id="btn-add-stair">
              + Add Stair
            </button>
          </div>


          {/* Quick actions */}
          <div className="sc-rail-section">
            <button className="sc-rail-action-btn" onClick={calculateEstimation} disabled={calculating}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px' }}>⚡</span>
                <span>{calculating ? 'Calculating…' : 'Run estimation'}</span>
              </div>
            </button>
            {!saving && <div style={{ textAlign: 'center', fontSize: '11px', color: '#9a3412', fontWeight: '800', marginTop: '6px' }}>{isDirty ? 'Unsaved changes' : 'Saved'}</div>}
            {estimationResult && (
              <button className="sc-rail-action-btn sc-rail-outline" onClick={() => setShowReport(true)}>
                <FileText size={13} /> Generate Report
              </button>
            )}
          </div>
        </aside>

        {/* ══ RIGHT CANVAS ════════════════════════════════════════════════════ */}
        <div className="sc-canvas" style={{ padding: 0 }}>
          
          {/* NEW: Horizontal Stair Navigation */}
          <div className="stair-tabs">
            {stairs.map(s => (
              <div 
                key={s.id} 
                ref={el => stairTabRefs.current[s.id] = el}
                className={`stair-tab ${activeId === s.id ? 'active' : ''}`}
                onClick={() => setActiveId(s.id)}
              >
                <span className="tab-label">{s.label}</span>
                {s.flights?.length > 0 && (
                  <span className="tab-flight-count">{s.flights.length}</span>
                )}
              </div>
            ))}
            <div className="add-stair-pill" onClick={openTemplateModal}>
              <Plus size={14} /> Add Stair
            </div>
          </div>

          {/* Sub-navigation: Flights for Active Stair (Only if multiple flights exist) */}
          {stairs.find(s => s.id === activeId)?.flights?.length > 0 && (
            <div className="flight-tabs fade-in" style={{ position: 'relative', paddingLeft: arrowOffset + 30 }}>
              <motion.div 
                animate={{ x: arrowOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  color: '#10a37f', 
                  display: 'flex', 
                  alignItems: 'center', 
                  opacity: 0.8,
                  height: '100%' 
                }}
              >
                <CornerDownRight size={14} strokeWidth={3} />
              </motion.div>
              
              <div 
                className="flight-tab"
                onClick={() => jumpTo(activeId, `stair-${activeId}`)}
              >
                Flight 1
              </div>
              
              {stairs.find(s => s.id === activeId).flights.map((f, i) => (
                <React.Fragment key={f.id}>
                  <div className="flight-tab-sep">
                    <ArrowRight size={12} strokeWidth={3} />
                  </div>
                  <div 
                    className="flight-tab"
                    onClick={() => jumpTo(activeId, `flight-${f.id}`)}
                  >
                    {f.label}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          <div style={{ padding: '24px' }}>

          {/* Page header */}
          <div className="sc-page-header">
            <div>
              <h1 className="sc-page-title">Stair &amp; Railings — Estimation</h1>
              <div className="sc-header-meta">
                <div className="sc-meta-chip chip-project">
                  <span className="sc-meta-label" style={{ fontWeight: '600', color: '#64748B' }}>Project:</span>
                  <span className="sc-meta-val" style={{ marginLeft: '6px', fontWeight: '700', color: '#0F172A' }}>{projectData.projectName || 'New Estimation'}</span>
                </div>
                <div className="sc-meta-dot">·</div>
                <div className="sc-meta-chip chip-ref">
                  <span className="sc-meta-label" style={{ fontWeight: '600', color: '#64748B' }}>Ref:</span>
                  <span className="sc-meta-val" style={{ marginLeft: '6px', fontWeight: '700', color: '#0F172A' }}>#{projectData.projectNumber || 'DRAFT'}</span>
                </div>
              </div>

              <div className="sc-header-rates">
                <div className="sc-rate-item rate-steel">
                  Steel 
                  {isEditingRates ? (
                    <input 
                      type="number" step="0.01" className="sc-rate-input"
                      value={localConfig.steel_price_per_lb ?? configManager.get('steel_price_per_lb')}
                      onChange={(e) => updateLocalRate('steel_price_per_lb', e.target.value)}
                    />
                  ) : (
                    <b>${localConfig.steel_price_per_lb ?? configManager.get('steel_price_per_lb')}</b>
                  )}
                  <span className="sc-rate-unit">/lb</span>
                </div>
                <div className="sc-dot-sep">·</div>
                <div className="sc-rate-item rate-shop">
                  Shop 
                  {isEditingRates ? (
                    <input 
                      type="number" className="sc-rate-input"
                      value={localConfig.shop_hourly_rate ?? configManager.get('shop_hourly_rate')}
                      onChange={(e) => updateLocalRate('shop_hourly_rate', e.target.value)}
                    />
                  ) : (
                    <b>${localConfig.shop_hourly_rate ?? configManager.get('shop_hourly_rate')}</b>
                  )}
                  <span className="sc-rate-unit">/hr</span>
                </div>
                <div className="sc-dot-sep">·</div>
                <div className="sc-rate-item rate-field">
                  Field 
                  {isEditingRates ? (
                    <input 
                      type="number" className="sc-rate-input"
                      value={localConfig.field_hourly_rate ?? configManager.get('field_hourly_rate')}
                      onChange={(e) => updateLocalRate('field_hourly_rate', e.target.value)}
                    />
                  ) : (
                    <b>${localConfig.field_hourly_rate ?? configManager.get('field_hourly_rate')}</b>
                  )}
                  <span className="sc-rate-unit">/hr</span>
                </div>
                <div className="sc-dot-sep">·</div>
                <div className="sc-rate-item rate-scrap">
                  Scrap 
                  {isEditingRates ? (
                    <input 
                      type="number" className="sc-rate-input"
                      value={localConfig.scrap_factor_pct ?? configManager.get('scrap_factor_pct')}
                      onChange={(e) => updateLocalRate('scrap_factor_pct', e.target.value)}
                    />
                  ) : (
                    <b>{localConfig.scrap_factor_pct ?? configManager.get('scrap_factor_pct')}%</b>
                  )}
                </div>
                <div className="sc-dot-sep">·</div>
                <div className="sc-rate-item rate-tax">
                  Tax 
                  {isEditingRates ? (
                    <input 
                      type="number" step="0.1" className="sc-rate-input"
                      value={((localConfig.tax_rate ?? configManager.get('tax_rate')) * 100).toFixed(1)}
                      onChange={(e) => updateLocalRate('tax_rate', e.target.value)}
                    />
                  ) : (
                    <b>{((localConfig.tax_rate ?? configManager.get('tax_rate')) * 100).toFixed(1)}%</b>
                  )}
                </div>
                
                <button 
                  className={`sc-rate-edit-btn ${isEditingRates ? 'active' : ''}`}
                  onClick={() => setIsEditingRates(!isEditingRates)}
                >
                  {isEditingRates ? 'Done' : 'Edit Rates'}
                </button>
              </div>
            </div>
            <div className="sc-header-actions">
              <button
                className="header-btn header-btn-outline"
                onClick={() => navigate('/project-info?id=' + (projectData.projectId || ''))}
                title="View and edit project details (Customer, Location, GC, etc.)"
              >
                <FolderOpen size={14} /> Edit Project Info
              </button>
              <span className="info-chip chip-blue">📐 {totalStairs} Stair{totalStairs !== 1 ? 's' : ''}</span>
              <button
                className="header-btn header-btn-outline"
                onClick={() => {
                  if (!projectData.projectId) {
                    toast.error("Please save the project first before exporting BOM");
                    return;
                  }
                  const token = localStorage.getItem('steel_token');
                  window.location.href = `${API_BASE_URL}/api/v1/reports/${projectData.projectId}/bom-excel?token=${token}`;
                }}
              >
                <Table size={14} /> Excel BOM
              </button>
              {estimationResult && (
                <button className="header-btn header-btn-outline" onClick={() => setShowReport(true)}>
                  <FileText size={14} /> Generate Report
                </button>
              )}
              <button
                className={`header-btn header-btn-outline ${Object.keys(localConfig).length > 0 ? '!border-amber-400 !bg-amber-50 !text-amber-700' : ''}`}
                onClick={() => setShowPricingModal(true)}
                title="Override Pricing Modifiers locally"
              >
                <Settings size={14} /> {Object.keys(localConfig).length > 0 ? 'Custom Rates Active' : 'Rates'}
              </button>
              <button
                className="header-btn"
                style={{ background: '#10a37f', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={calculateEstimation}
                disabled={calculating}
              >
                {calculating ? '⏳ Calculating...' : '⚡ Run Estimation'}
              </button>
            </div>
          </div>

          {/* Project banner removed - moved to header chips */}

          {/* ── Estimation Result Summary (GPT-reskinned) ── */}
          {summaryData && (
            <div className="sc-summary-panel" id="calculation-summary">
              <div className="sc-summary-header">
                <div>
                  <h3 className="sc-summary-title">Calculation Summary</h3>
                  <p className="sc-summary-sub">MISC Engineering Platform</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="sc-verified-badge">✓ Verified for Fabrication</span>
                  <button
                    className="acm-trigger-btn"
                    onClick={() => setShowAdditionalCosts(true)}
                    id="btn-additional-costs"
                  >
                    + Additional Costs
                    {additionalCosts !== null && (
                      <span className="acm-trigger-badge">Applied</span>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 24px' }}>
                <table className="sc-est-table">
                  <thead>
                    <tr>
                      <th style={{ width: 200, textAlign: 'right' }}></th>
                      <th>Steel lbs</th>
                      <th>Galv Shop Hrs/LF</th>
                      <th>Galv Field Hrs/LF</th>
                      <th className="sc-col-shaded">Steel (+10% Scrap)</th>
                      <th className="sc-col-shaded">Shop Hours</th>
                      <th className="sc-col-shaded">Field Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sc-row-label">Sub Total</td>
                      <td className="sc-num-cell">{(summaryData.baseSteelWeight || 0).toFixed(3)}</td>
                      <td className="sc-num-cell sc-amber">{(summaryData.totalGalvanizeShopHours || 0).toFixed(3)}</td>
                      <td className="sc-num-cell sc-amber">{(summaryData.totalGalvanizeFieldHours || 0).toFixed(3)}</td>
                      <td className="sc-num-cell sc-col-shaded">{(summaryData.scrapWeight || 0).toFixed(3)}</td>
                      <td className="sc-num-cell sc-col-shaded">{(summaryData.totalShopHours || 0).toFixed(2)}</td>
                      <td className="sc-num-cell sc-col-shaded">{(summaryData.totalFieldHours || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="sc-row-label">Steel Price</td>
                      <td className="sc-num-cell sc-money">${(summaryData.baseSteelCost || 0).toFixed(2)}</td>
                      <td /><td />
                      <td className="sc-num-cell sc-col-shaded sc-money">${(summaryData.scrapWeightCost || 0).toFixed(2)}</td>
                      <td className="sc-num-cell sc-col-shaded sc-money">${(summaryData.shopLaborCost || 0).toFixed(2)}</td>
                      <td className="sc-num-cell sc-col-shaded sc-money">${(summaryData.fieldLaborCost || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="sc-row-label">Stair Pan Total Price</td>
                      <td className="sc-num-cell sc-money">{(summaryData.pansMaterialPrice || 0).toFixed(2)}</td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label">
                        {summaryData.gratingTotalCost > 0 && <span className="sc-yes-badge">YES</span>} Stair Grating
                      </td>
                      <td className="sc-num-cell sc-money">
                        {summaryData.gratingTotalCost > 0 ? `$${(summaryData.gratingTotalCost || 0).toFixed(2)}` : '—'}
                      </td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label"><span className="sc-yes-badge">YES</span> Galvanize</td>
                      <td className="sc-num-cell sc-money">${(summaryData.galvanizeCost || 0).toFixed(2)}</td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label">Anchor Bolts</td>
                      <td className="sc-num-cell sc-money">${(summaryData.anchorBoltsCost || 0).toFixed(2)}</td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label">POR ROK ANCHORS</td>
                      <td className="sc-num-cell sc-money">${(summaryData.porRokAnchorsCost || 0).toFixed(2)}</td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label">
                        {(summaryData.mountingCharges > 0) ? 'Mounting (Add-ons)' : 'Mounting Cost'}
                      </td>
                      <td className="sc-num-cell sc-money">${(summaryData.mountingCharges || 0).toFixed(2)}</td>
                      <td colSpan={5} />
                    </tr>
                    <tr>
                      <td className="sc-row-label" style={{ fontWeight: 700, color: 'var(--gpt-text-primary)' }}>Total Material Price</td>
                      <td className="sc-num-cell sc-money sc-total-num">
                        ${(
                          (summaryData.baseSteelCost || 0) +
                          (summaryData.pansMaterialPrice || 0) +
                          (summaryData.gratingTotalCost || 0) +
                          (summaryData.galvanizeCost || 0) +
                          (summaryData.mountingCharges || 0)
                        ).toFixed(2)}
                      </td>
                      <td colSpan={5} />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="sc-totals-box">
                <div className="sc-total-row">
                  <span>Sub Total Without Tax</span>
                  <span>${(summaryData.subtotalWithoutTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="sc-total-row">
                  <span>Sales Tax (6%)</span>
                  <span>${(summaryData.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="sc-total-row sc-grand-total">
                  <span>Total Estimate</span>
                  <span className="pulsing-total">${(summaryData.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {additionalCosts?.total !== undefined && additionalCosts?.total !== null && (
                  <div className="sc-total-row sc-adj-total-row">
                    <span>With Adjustments</span>
                    <span className="sc-adj-total-val">${additionalCosts.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Additional Costs Modal ── */}
          {showAdditionalCosts && summaryData && (
            <AdditionalCostsModal
              baseTotal={summaryData.grandTotal || 0}
              estimationBreakdown={estimationResult?.breakdown}
              initialData={additionalCosts}
              onApply={(data) => {
                setAdditionalCosts(data);
                setShowAdditionalCosts(false);
                // Trigger an auto-save if we have data
                setIsDirty(true);
              }}
              onClose={() => setShowAdditionalCosts(false)}
            />
          )}

          {/* ── Formula Trace ── */}
          {estimationResult?.formulaTrace && (
            <div className="sc-trace-panel">
              <div className="sc-trace-header">
                <span>🔍 Formula Trace (Blueprint Audit)</span>
                <span className="sc-trace-badge">ENGINE v1.02</span>
              </div>
              <div className="sc-trace-body">
                {estimationResult.formulaTrace.map((t, i) => (
                  <div key={i} className="sc-trace-row">
                    <span className="sc-trace-comp">[{t.component}]</span>{' '}
                    {t.formula} ➔ <span className="sc-trace-out">{Number(t.output || 0).toFixed(4)}</span>
                    <div className="sc-trace-params">Params: {JSON.stringify(t.input)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stair Sections (Showing only active for fast switching) ── */}
          {stairs.filter(s => s.id === activeId).map(stair => (
            <div key={stair.id} id={`stair-${stair.id}`}>
              <StairItem
                stair={stair}
                activeId={activeId}
                onFocusContext={setActiveId}
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
                onMoveSubItem={(type, id, direction) => moveSubItem(stair.id, type, id, direction)}
                onReorderSubItems={(type, newItems) => reorderSubItems(stair.id, type, newItems)}
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

          {/* Redundant Add Stair button removed */}
          
          {/* NEW: Floating Navigation Helpers */}
          <div className="floating-dock">
            <button 
              className="dock-btn" 
              onClick={() => {
                const topElement = document.querySelector('.stair-page') || document.body;
                topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }} 
              data-tooltip="Scroll to beginning of stair configuration"
            >
              <ArrowUp size={18} />
            </button>
            <button 
              className="dock-btn" 
              onClick={() => {
                const bottomElement = document.querySelector('#calculation-summary') || document.querySelector('.sc-canvas');
                if (bottomElement) bottomElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }} 
              data-tooltip="Scroll to summary and totals"
            >
              <ArrowDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ══ TEMPLATE MODAL ══════════════════════════════════════════════════ */}
        {templateModal.isOpen && (
          <div className="sc-modal-backdrop">
            <motion.div
              className="sc-modal-panel"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="sc-modal-header">
                <h2 className="sc-modal-title">Select Stair Template</h2>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setTemplateModal(prev => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>
              <p className="sc-modal-sub">
                Choose a starting template for <strong>{templateModal.nextLabel}</strong>. All values can be refined after creation.
              </p>
              <div className="sc-template-grid">
                {[
                  { key: 'commercial', icon: '🏢', title: 'Commercial Stair', desc: 'Standard width, pan concrete treads, office / public use.' },
                  { key: 'industrial', icon: '🏭', title: 'Industrial Stair', desc: 'Grating treads, heavier duty geometry for plants.' },
                  { key: 'custom', icon: '✏️', title: 'Custom Stair', desc: 'Start with a minimal configuration and define everything.' },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    className="sc-template-card"
                    onClick={() => { addStair(t.key); setTemplateModal(prev => ({ ...prev, isOpen: false })); }}
                  >
                    <div className="sc-template-icon">{t.icon}</div>
                    <div className="sc-template-title">{t.title}</div>
                    <div className="sc-template-desc">{t.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Pricing Settings Modal ── */}
        <PricingOverridesModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          globalConfig={configManager.config || {}}
          onApply={calculateEstimation}
        />

        {/* ══ CLASSIC CONFIRMATION MODAL ═══════════════════════════════════ */}
        {confirmModal.isOpen && (
          <div className="sc-modal-backdrop" style={{ zIndex: 1200 }}>
            <motion.div
              className="sc-confirm-modal"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sc-confirm-header">
                <div className="sc-confirm-icon">⚠️</div>
                <h3 className="sc-confirm-title">{confirmModal.title}</h3>
              </div>
              <div className="sc-confirm-body">{confirmModal.message}</div>
              <div className="sc-confirm-actions">
                <button
                  className="confirm-btn-outline"
                  onClick={() => { confirmModal.resolve(false); setConfirmModal(prev => ({ ...prev, isOpen: false })) }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn-solid"
                  onClick={() => { confirmModal.resolve(true); setConfirmModal(prev => ({ ...prev, isOpen: false })) }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AllocateProjectModal
          isOpen={showAllocateModal}
          onClose={() => setShowAllocateModal(false)}
          onAllocate={handleAllocated}
          initialData={{
            projectName: projectData.projectName,
            stairs: stairsRef.current,
            estimationResult: projectData.estimationResult,
            localConfig
          }}
        />

      </div>
    </>
  );
}

