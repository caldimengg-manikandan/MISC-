// src/modules/Rail/RailingsConfig.jsx
// Standalone Railings Estimation Page
// Uses the same calculation pipeline as StairConfig (Stair & Railings)
// but omits all stair/flight/landing logic.
// Rail types: Wall Rail, Guard Rail, Grab Rail, Cane Rail, Kick Plate

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Table, Settings, Copy, Building2, User, Mail, Phone, MapPin, Zap, X } from 'lucide-react';
import RailConfig from './RailConfig';
import KickPlateConfig from '../KickPlate/KickPlateConfig';
import PricingOverridesModal from '../Stair/PricingOverridesModal';
import AllocateProjectModal from '../Stair/components/AllocateProjectModal';
import { parseArchitecturalInput, normalizeToFeet, parseToFeet } from '../../utils/mathUtils.js';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import '../Stair/StairConfig.css';
import { useEstimation } from '../../contexts/EstimationContext';
import configManager from '../../services/configManager';

let uid = 5000; // Different range from StairConfig (starts at 100)
const makeId = () => uid++;

const RAIL_TYPES = [
  { key: 'wallRail',   label: 'Wall Rail',   badge: 'WALL',  icon: '🔘' },
  { key: 'guardRail',  label: 'Guard Rail',  badge: 'GUARD', icon: '🛡' },
  { key: 'grabRail',   label: 'Grab Rail',   badge: 'GRAB',  icon: '✊' },
  { key: 'caneRail',   label: 'Cane Rail',   badge: 'CANE',  icon: '🦯' },
  { key: 'kickPlate',  label: 'Kick Plate',  badge: 'KICK',  icon: '📐' },
];

// ── Restore rail items from saved data ───────────────────────────────
const restoreRails = (savedRails) => {
  if (!Array.isArray(savedRails)) return [];
  return savedRails.map((r, ri) => {
    const meta = RAIL_TYPES.find(t => t.key === r.type);
    const toObj = (val, defaultUnit) => {
      if (val && typeof val === 'object' && 'unit' in val) return val;
      const displayVal = (val !== null && val !== undefined) ? val : '';
      return { value: displayVal, unit: defaultUnit };
    };
    const rawRailLen = (r.railLength && typeof r.railLength === 'object') ? r.railLength
                     : (r.railLength !== undefined && r.railLength !== null) ? r.railLength
                     : (r.length !== undefined && r.length !== null) ? r.length : '';
    return {
      ...r,
      id:             r.id ?? makeId(),
      label:          r.label || (meta ? `${meta.label} ${ri + 1}` : `Rail ${ri + 1}`),
      railLength:     toObj(rawRailLen, 'FT'),
      postSpacing:    toObj(r.postSpacing, 'FT'),
      toeplateLength: toObj(r.toeplateLength, 'FT'),
      widthIn:        r.type === 'kickPlate' ? (r.widthIn ?? 4) : undefined,
    };
  });
};

// ── Collapsible Wrapper (from StairConfig) ────────────────────────────
function CollapsibleSection({ badge, title, subtitle, onDelete, onDuplicate, children, defaultOpen = true, headerClass = '', onFocus, className = '', id }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      layout
      id={id}
      className={`collapsible-section ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onPointerDown={() => { if (onFocus) onFocus(); }}
    >
      <div className={`collapsible-header ${headerClass}`} onClick={() => setOpen(o => !o)}>
        <div className="collapsible-header-left">
          <span className="collapsible-type-badge">{badge}</span>
          <div>
            <div className="collapsible-title" style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>{title}</div>
            {subtitle && <div className="collapsible-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="collapsible-header-right" onClick={e => e.stopPropagation()}>
          <div className="collapsible-actions">
            {onDuplicate && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="icon-btn" title="Duplicate" onClick={onDuplicate}>
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
            <div className="collapsible-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function RailingsConfig() {
  const initialId = makeId();
  const [activeId, setActiveId] = useState(null);
  const [rails, setRails] = useState([]);
  const [projectData, setProjectData] = useState({
    projectName: '',
    projectNumber: '',
    customerName: '',
    customerId: null,
    customerInfo: null,
    projectId: null
  });

  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimationResult, setEstimationResult] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [localConfig, setLocalConfig] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [overallHistory, setOverallHistory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', resolve: null });

  const summaryData = estimationResult?.sfeSummary || estimationResult?.summary;
  const navigate = useNavigate();

  const { fetchNotes, notes, setSelectedEstimation } = useEstimation();
  const railsRef = useRef(rails);
  railsRef.current = rails;

  // Helper to get module-specific context key
  const getContextKey = () => `steelProjectInfo_${window.location.pathname.split('?')[0]}`;

  const requestConfirmation = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({ isOpen: true, title, message, resolve });
    });
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

  // ── Load project info + rail data from DB on mount ────────────────
  useEffect(() => {
    const savedInfo = localStorage.getItem(getContextKey());
    if (!savedInfo) return;
    try {
      const parsed = JSON.parse(savedInfo);
      setProjectData(prev => ({
        ...prev,
        projectName:   parsed.projectName   || 'New Estimation',
        projectNumber: parsed.projectNumber || 'Draft',
        customerName:  parsed.customerName  || parsed.clientName || 'Internal',
        customerId:    parsed.customerId    || null,
        projectId:     parsed.id            || null,
      }));

      const projectId = parsed.id;
      if (!projectId) {
        // 🚀 DRAFT MODE: Try loading local draft if it exists
        const draft = localStorage.getItem('railings_draft_global');
        if (draft) {
          const restored = restoreRails(JSON.parse(draft));
          isUpdatingFromCalc.current = true;
          setRails(restored);
          if (restored.length > 0) setActiveId(restored[0].id);
        }
        return;
      }

      setSelectedEstimation({ id: projectId, ...parsed });
      fetchNotes(projectId);

      const token = localStorage.getItem('steel_token');
      if (!token) return;

      fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.project) {
          const proj = data.project;

          setProjectData(prev => ({
            ...prev,
            customerName: proj.LinkedCustomerName || proj.customer_name || 'Internal',
            customerId: proj.customer_id,
            customerInfo: proj.customer_id ? {
              company: proj.LinkedCustomerName,
              contact: proj.contactPerson,
              email:   proj.CustomerEmail,
              phone:   proj.CustomerPhone,
              city:    proj.CustomerCity,
              state:   proj.CustomerState
            } : null
          }));

          if (proj.estimationResult) {
            setEstimationResult(proj.estimationResult);
          }
          if (proj.localConfig) {
            setLocalConfig(proj.localConfig);
          }

          // Restore rails from DB — stored under railings_data column or guardRails
          const rawRailings = proj.railings_data || proj.guardRails;
          const tryParse = (val) => {
            if (!val) return null;
            if (typeof val === 'object') return val;
            try { return JSON.parse(val); } catch { return null; }
          };
          const savedRailings = tryParse(rawRailings);
          if (Array.isArray(savedRailings) && savedRailings.length > 0) {
            const restored = restoreRails(savedRailings);
            isUpdatingFromCalc.current = true;
            setRails(restored);
            if (restored.length > 0) setActiveId(restored[0].id);
            toast.success(`Loaded ${restored.length} rail(s) from database`);
            setIsDirty(false);
          }
        }
      })
      .catch(err => console.error('Failed to load railings data:', err));
    } catch (e) {
      console.error('Failed to parse project info:', e);
    }
  }, [fetchNotes, setSelectedEstimation]);

  // ── Save to DB ────────────────────────────────────────────────────
  const saveChanges = useCallback(async () => {
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

      // Save rails under guardRails column (reusing existing schema column) 
      const railsToSave = railsRef.current.map(({ ...r }) => r);

      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          guardRails: railsToSave,
          customerName: projectData.customerName,
          customerId: projectData.customerId,
          localConfig
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Railings saved ✓');
        setIsDirty(false);
      } else {
        toast.error(data.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [projectData.projectId, projectData.customerName, projectData.customerId, localConfig]);

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

    // Write to localStorage
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

  // ── Full Estimation via backend ───────────────────────────────────
  const calculateEstimation = useCallback(async () => {
    if (isDirty && projectData.projectId) {
      try { await saveChanges(); } catch (_) {}
    }
    setCalculating(true);
    try {
      const token = localStorage.getItem('steel_token');

      const toFeetFull = (field) => {
        if (!field && field !== 0) return 0;
        if (typeof field === 'number') return field;
        if (typeof field === 'object' && 'value' in field) {
          const parsed = parseArchitecturalInput(field.value, field.unit);
          return normalizeToFeet(parsed.value, parsed.unit);
        }
        return parseFloat(field) || 0;
      };

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

      const railPayload = [];
      railsRef.current.forEach(r => {
        const rLen = toFeetFull(r.railLength);
        const rType = r.railType || r.rail_type_id || (r.type === 'kickPlate' ? 'Kick Plate' : '');
        if (!rLen || !rType) return;
        railPayload.push({
          id:                r.id,
          railType:          rType,
          typeCode:          getTypeCode(rType),
          length:            rLen,
          railLength:        rLen,
          maxSpacing:        toFeetFull(r.postSpacing),
          postSpacing:       toFeetFull(r.postSpacing),
          mountingType:      r.mountingType || '',
          finish:            r.finish || 'Primer',
          intermediateRails: parseInt(r.intermediateRails) || 0,
          toeplateRequired:  r.toeplateRequired || 'No',
          toeWidth:          toFeetFull(r.toeWidth),
          widthIn:           r.type === 'kickPlate' ? (r.width || r.widthIn || 4) : undefined,
        });
      });

      const payload = {
        rails:    railPayload,
        platforms: [],
        stairs:   [],
        config:   localConfig,
        estimateId: projectData.projectId
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

        // Auto-save calculation summary
        if (projectData.projectId && token) {
          fetch(`${API_BASE_URL}/api/projects/${projectData.projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              estimationResult: data,
              totalWeight: data.totalWeight || data.summary?.totalSteelWeight,
              totalCost:   data.totalCost   || data.summary?.grandTotal
            })
          }).catch(err => console.error('Failed to auto-save estimation result:', err));
        }

        setTimeout(() => {
          document.getElementById('railings-calculation-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }, [projectData.projectId, isDirty, localConfig, saveChanges]);

  // ── Live per-change calculation (debounced 400ms) ─────────────────
  const liveCalcTimer = useRef(null);
  const isUpdatingFromCalc = useRef(false);

  const triggerLiveCalc = useCallback((latestRails) => {
    clearTimeout(liveCalcTimer.current);
    liveCalcTimer.current = setTimeout(async () => {
      const toFeet = (field) => parseToFeet(field);

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

      const railPayload = [];
      latestRails.forEach(r => {
        const rLen = toFeet(r.railLength);
        const rType = r.railType || r.rail_type_id || (r.type === 'kickPlate' ? 'Kick Plate' : '');
        if (rLen && rType) {
          railPayload.push({
            id:                r.id,
            railType:          rType,
            typeCode:          getTypeCode(rType),
            length:            rLen,
            maxSpacing:        toFeet(r.postSpacing),
            mountingType:      r.mountingType || '',
            finish:            r.finish || 'Primer',
            intermediateRails: parseInt(r.intermediateRails) || 0,
            toeplateRequired:  r.toeplateRequired || 'No',
            toeWidth:          toFeet(r.toeWidth),
            widthIn:           r.type === 'kickPlate' ? (r.width || r.widthIn || 4) : undefined,
          });
        }
      });

      if (railPayload.length === 0) return;

      const { calculateFull } = await import('../../services/estimationService');
      const result = await calculateFull({ rails: railPayload, platforms: [], stairs: [], config: localConfig });

      console.log('📤 Railings Payload:', railPayload);
      console.log('📥 Railings Response:', result);

      if (!result.success) return;

      isUpdatingFromCalc.current = true;
      let railIdx = 0;
      setRails(prev => prev.map(r => {
        const rLen = toFeet(r.railLength);
        const rType = r.railType || r.rail_type_id || (r.type === 'kickPlate' ? 'Kick Plate' : '');
        if (rLen && rType) {
          const rCalcRaw = result.breakdown?.rails?.[railIdx++] || {};
          const { length: _l, maxSpacing: _ms, ...rCalc } = rCalcRaw;
          return { ...r, ...rCalc, systemCalc: rCalc.systemCalc || {} };
        }
        return { ...r, totalCost: 0, systemCalc: null };
      }));
    }, 400);
  }, [localConfig]);

  // Trigger live calc on rails change
  useEffect(() => {
    if (isUpdatingFromCalc.current) {
      isUpdatingFromCalc.current = false;
      return;
    }
    setIsDirty(true);
    triggerLiveCalc(rails);
  }, [rails, triggerLiveCalc]);

  // 💾 Auto-Save Draft (to localStorage)
  useEffect(() => {
    if (isDirty && rails.length > 0) {
      const timer = setTimeout(() => {
        const draftKey = projectData.projectId ? `railings_draft_${projectData.projectId}` : 'railings_draft_global';
        localStorage.setItem(draftKey, JSON.stringify(rails));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rails, isDirty, projectData.projectId]);

  // ── CRUD helpers ──────────────────────────────────────────────────
  const addRail = (type) => {
    const meta = RAIL_TYPES.find(t => t.key === type);
    const sameType = rails.filter(r => r.type === type);
    const nextNum = sameType.length > 0
      ? Math.max(...sameType.map(r => { const m = r.label.match(/\d+/); return m ? parseInt(m[0]) : 0; })) + 1
      : 1;
    const newRail = {
      id:    makeId(),
      type,
      label: `${meta.label} ${nextNum}`,
      railLength:  { value: '', unit: 'FT' },
      postSpacing: { value: '4', unit: 'FT' },
      finish: 'Primer',
      toeplateRequired: 'No',
    };
    setRails(r => [...r, newRail]);
    setActiveId(newRail.id);
  };

  const duplicateRail = (id) => {
    const target = rails.find(r => r.id === id);
    if (!target) return;
    const meta = RAIL_TYPES.find(t => t.key === target.type);
    const sameType = rails.filter(r => r.type === target.type);
    const nextNum = Math.max(...sameType.map(r => { const m = r.label.match(/\d+/); return m ? parseInt(m[0]) : 0; })) + 1;
    const newRail = { ...target, id: makeId(), label: `${meta.label} ${nextNum}` };
    setRails(r => [...r, newRail]);
    setActiveId(newRail.id);
  };

  const deleteRail = (id) => {
    const deleted = rails.find(r => r.id === id);
    setOverallHistory({ type: 'rail', data: deleted });
    setRails(r => r.filter(x => x.id !== id));
    if (activeId === id) setActiveId(rails.find(r => r.id !== id)?.id || null);
  };

  const updateRail = (id, data) => {
    setRails(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const undoDelete = () => {
    if (!overallHistory) return;
    setRails(prev => [...prev, overallHistory.data]);
    setOverallHistory(null);
    toast.success('Rail restored ✓');
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const getRailCount = (type) => rails.filter(r => r.type === type).length;
  const counts = {
    wall:  getRailCount('wallRail'),
    guard: getRailCount('guardRail'),
    grab:  getRailCount('grabRail'),
    cane:  getRailCount('caneRail'),
    kick:  getRailCount('kickPlate'),
  };

  const estimatedSteelWeight = estimationResult?.summary?.totalSteelWeight
    ?? estimationResult?.sfeSummary?.totalSteelWeight
    ?? rails.reduce((sum, r) => sum + (r.totalWeight || 0), 0);

  const estimatedCost = estimationResult?.summary?.grandTotal
    ?? estimationResult?.sfeSummary?.grandTotal
    ?? estimationResult?.totalEstimatedCost
    ?? rails.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const railMeta = (r) => RAIL_TYPES.find(t => t.key === r.type) || { badge: 'RAIL', label: 'Rail' };

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
    .collapsible-body .form-section { margin-bottom: 12px !important; }
    .collapsible-body .form-section:last-child { margin-bottom: 0 !important; }
    .summary-card.card-glow-blue { border-top-color: #10a37f !important; }
    .summary-card.card-glow-purple { border-top-color: #6366f1 !important; }
    .field-auto { border-color: rgba(16,163,127,0.3) !important; }

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
    .sc-cost-breakdown {
      margin: 2px 0 8px 32px;
      padding: 6px 12px;
      border-left: 1.5px solid var(--sf-border);
      font-family: 'DM Sans', sans-serif;
    }
    .sc-breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: var(--sf-muted);
      margin-bottom: 4px;
      font-weight: 500;
      background: transparent;
      border: none;
      width: 100%;
      padding: 2px 4px;
      cursor: pointer;
      text-align: left;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .sc-breakdown-item:hover {
      background: rgba(16, 163, 127, 0.05);
      color: #10a37f;
    }
    .bc-val {
      color: var(--sf-text);
      font-weight: 700;
      font-family: 'Geist Mono', monospace;
    }
    .sc-header-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    .sc-meta-dot { color: #CBD5E1; font-weight: 900; }
    .sc-header-rates {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0,0,0,0.05);
      font-size: 11px;
      color: #64748B;
    }
    .sc-rate-item { display: flex; align-items: center; gap: 6px; }
    .sc-rate-item b { color: #0F172A; font-weight: 700; font-family: 'Geist Mono', monospace; }
    .sc-rate-dot { color: #CBD5E1; font-weight: 900; }

    /* Confirm modal */
    .sc-confirm-modal {
      width: 420px; max-width: 90%;
      background: #ffffff; border-radius: 14px;
      overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.12);
      border: 1px solid #e5e7eb; margin: auto;
    }
    .sc-confirm-header { padding: 24px 28px 12px; display: flex; align-items: center; gap: 14px; }
    .sc-confirm-icon { width: 36px; height: 36px; background: #fffbeb; border: 1px solid #fef3c7; color: #d97706; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .sc-confirm-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
    .sc-confirm-body { padding: 4px 28px 24px; font-size: 14px; color: #71717a; line-height: 1.55; }
    .sc-confirm-actions { padding: 16px 20px; background: #fafafa; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #f0f0f0; }
    .confirm-btn-outline { padding: 9px 18px; border-radius: 9px; border: 1px solid #e5e7eb; background: white; color: #6b7280; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .confirm-btn-outline:hover { background: #f9fafb; color: #111827; border-color: #d1d5db; }
    .confirm-btn-solid { padding: 9px 18px; border-radius: 9px; background: #111827; color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .confirm-btn-solid:hover { background: #000000; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  `;

  return (
    <>
      <style>{GPT_OVERRIDE_STYLE}</style>
      <div className="stair-page">

        {/* ══ LEFT RAIL ══════════════════════════════════════════════ */}
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

          {/* Customer Information Card Scaling fix */}
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
                <div className="sc-cust-contact"><User size={11} /> {projectData.customerInfo.contact || 'No contact person'}</div>
                <div className="sc-cust-meta">
                  <div className="sc-cust-item"><Mail size={11} /> {projectData.customerInfo.email || '—'}</div>
                  <div className="sc-cust-item"><Phone size={11} /> {projectData.customerInfo.phone || '—'}</div>
                  <div className="sc-cust-item"><MapPin size={11} /> {projectData.customerInfo.city ? `${projectData.customerInfo.city}, ${projectData.customerInfo.state}` : '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="sc-rail-section">
            <div className="sc-rail-heading">Rail Summary</div>
            <div className="sc-stat-grid-2">
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.wall}</div>
                <div className="sc-mini-stat-label">Wall</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.guard}</div>
                <div className="sc-mini-stat-label">Guard</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.grab}</div>
                <div className="sc-mini-stat-label">Grab</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.cane}</div>
                <div className="sc-mini-stat-label">Cane</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{counts.kick}</div>
                <div className="sc-mini-stat-label">Kick</div>
              </div>
              <div className="sc-mini-stat">
                <div className="sc-mini-stat-val">{rails.length}</div>
                <div className="sc-mini-stat-label">Total</div>
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
            </div>
          </div>

          <div className="sc-rail-divider" />

          {/* Rail navigation list */}
          <div className="sc-rail-section">
            <div className="sc-rail-heading">Rails</div>
            {rails.map(r => {
              const meta = railMeta(r);
              return (
                <div key={r.id} className="sc-stair-nav-wrapper">
                  <div className={`sc-stair-nav-group ${activeId === r.id ? 'active' : ''}`}>
                    <button
                      className="sc-stair-nav"
                      onClick={() => {
                        setActiveId(r.id);
                        document.getElementById(`rail-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span className="sc-nav-bullet" />
                      <span className="sc-nav-name">{r.label}</span>
                      {r.totalCost > 0 && <span className="sc-nav-tag">${Math.round(r.totalCost).toLocaleString()}</span>}
                    </button>
                    <button className="sc-stair-copy-btn" onClick={() => duplicateRail(r.id)} title="Duplicate Rail">
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* Cost breakdown drill-down */}
                  {activeId === r.id && r.totalCost > 0 && (
                    <div className="sc-cost-breakdown">
                      <button className="sc-breakdown-item" onClick={() => document.getElementById(`rail-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                        {r.label} <span className="bc-val">${Math.round(r.totalCost || 0).toLocaleString()}</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Add Panel */}
                  <AnimatePresence>
                    {activeId === r.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.98 }}
                        animate={{ height: 'auto', opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="sc-quick-add-panel">
                          <div className="sc-quick-add-heading">ADD RAIL</div>
                          <div className="sc-quick-add-grid">
                            <button className="sc-quick-add-btn" onClick={() => addRail('wallRail')}>+ Wall</button>
                            <button className="sc-quick-add-btn" onClick={() => addRail('guardRail')}>+ Guard</button>
                          </div>
                          <div className="sc-quick-add-grid" style={{ marginTop: '8px' }}>
                            <button className="sc-quick-add-btn" onClick={() => addRail('grabRail')}>+ Grab</button>
                            <button className="sc-quick-add-btn" onClick={() => addRail('caneRail')}>+ Cane</button>
                          </div>
                          <div className="sc-quick-stack" style={{ marginTop: '8px' }}>
                            <button className="sc-quick-add-btn" onClick={() => addRail('kickPlate')}>+ Kick Plate</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Add Rail buttons (always visible) */}
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button className="sc-quick-add-btn" onClick={() => addRail('wallRail')}>+ Wall Rail</button>
                <button className="sc-quick-add-btn" onClick={() => addRail('guardRail')}>+ Guard Rail</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button className="sc-quick-add-btn" onClick={() => addRail('grabRail')}>+ Grab Rail</button>
                <button className="sc-quick-add-btn" onClick={() => addRail('caneRail')}>+ Cane Rail</button>
              </div>
              <button className="sc-quick-add-btn" onClick={() => addRail('kickPlate')}>+ Kick Plate</button>
            </div>
          </div>

          {/* Undo banner */}
          {overallHistory && (
            <div className="sc-rail-section">
              <button
                className="sc-overall-undo"
                onClick={undoDelete}
                style={{
                  background: 'var(--sf-accent)', color: 'white', padding: '8px 16px',
                  borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', marginTop: '0', border: 'none',
                  transition: 'all 0.2s ease', boxShadow: '0 4px 12px var(--sf-accent-dim)', width: '100%'
                }}
              >
                ↩ Undo Delete
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="sc-rail-section">
            <button className="sc-rail-action-btn" onClick={calculateEstimation} disabled={calculating}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px' }}>⚡</span>
                <span>{calculating ? 'Calculating…' : 'Run estimation'}</span>
              </div>
            </button>
            {!saving && (
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#9a3412', fontWeight: '800', marginTop: '6px' }}>
                {isDirty ? 'Unsaved changes' : 'Saved'}
              </div>
            )}
          </div>
        </aside>

        {/* ══ RIGHT CANVAS ══════════════════════════════════════════ */}
        <div className="sc-canvas">

          {/* Page header */}
          <div className="sc-page-header">
            <div>
              <h1 className="sc-page-title">Railings — Estimation</h1>
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
                <div className={`sc-rate-item ${localConfig.steel_price_per_lb ? 'text-blue-600 font-bold' : ''}`}>
                  Steel <b>${localConfig.steel_price_per_lb ?? configManager.get('steel_price_per_lb')}/lb</b>
                </div>
                <div className="sc-rate-dot">·</div>
                <div className={`sc-rate-item ${localConfig.shop_hourly_rate ? 'text-blue-600 font-bold' : ''}`}>
                  Shop <b>${localConfig.shop_hourly_rate ?? configManager.get('shop_hourly_rate')}/hr</b>
                </div>
                <div className="sc-rate-dot">·</div>
                <div className={`sc-rate-item ${localConfig.field_hourly_rate ? 'text-blue-600 font-bold' : ''}`}>
                  Field <b>${localConfig.field_hourly_rate ?? configManager.get('field_hourly_rate')}/hr</b>
                </div>
                <div className="sc-rate-dot">·</div>
                <div className={`sc-rate-item ${localConfig.scrap_factor_pct ? 'text-blue-600 font-bold' : ''}`}>
                  Scrap <b>{localConfig.scrap_factor_pct ?? configManager.get('scrap_factor_pct')}%</b>
                </div>
                <div className="sc-rate-dot">·</div>
                <div className={`sc-rate-item ${localConfig.tax_rate ? 'text-blue-600 font-bold' : ''}`}>
                  Tax <b>{((localConfig.tax_rate ?? configManager.get('tax_rate')) * 100).toFixed(1)}%</b>
                </div>
              </div>
            </div>
            <div className="sc-header-actions">
              <span className="info-chip chip-blue">🔩 {rails.length} Rail{rails.length !== 1 ? 's' : ''}</span>
              <button
                className="header-btn header-btn-outline"
                onClick={() => {
                  if (!projectData.projectId) { toast.error('Please save the project first before exporting BOM'); return; }
                  const token = localStorage.getItem('steel_token');
                  window.location.href = `${API_BASE_URL}/api/reports/${projectData.projectId}/bom-excel?token=${token}`;
                }}
              >
                <Table size={14} /> Excel BOM
              </button>
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

          {/* ── Estimation Result Summary ── */}
          {summaryData && (
            <div className="sc-summary-panel" id="railings-calculation-summary">
              <div className="sc-summary-header">
                <div>
                  <h3 className="sc-summary-title">Calculation Summary</h3>
                  <p className="sc-summary-sub">MISC Engineering Platform — Railings</p>
                </div>
                <span className="sc-verified-badge">Verified for Fabrication</span>
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
                      <td className="sc-row-label" style={{ fontWeight: 700 }}>Total Material Price</td>
                      <td className="sc-num-cell sc-money sc-total-num">
                        ${(
                          (summaryData.baseSteelCost || 0) +
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
              </div>
            </div>
          )}

          {/* ── Rail Sections ── */}
          {rails.map(r => {
            const meta = railMeta(r);
            return (
              <div key={r.id} id={`rail-${r.id}`}>
                <CollapsibleSection
                  badge={meta.badge}
                  title={r.label}
                  subtitle={`${meta.label} configuration`}
                  onDelete={() => deleteRail(r.id)}
                  onDuplicate={() => duplicateRail(r.id)}
                  defaultOpen={true}
                  headerClass={`header-${r.type.replace('Rail', '').toLowerCase()}`}
                  onFocus={() => setActiveId(r.id)}
                  className={activeId === r.id ? 'active' : ''}
                >
                  {r.type === 'kickPlate' ? (
                    <KickPlateConfig
                      data={r}
                      onChange={(changes) => updateRail(r.id, changes)}
                      onFocus={() => setActiveId(r.id)}
                    />
                  ) : (
                    <RailConfig
                      type={r.type}
                      data={r}
                      onChange={(changes) => updateRail(r.id, changes)}
                      onFocus={() => setActiveId(r.id)}
                    />
                  )}
                </CollapsibleSection>
              </div>
            );
          })}

          {/* Empty state */}
          {rails.length === 0 && (
            <div className="eng-card">
              <div className="empty-state">
                <div className="empty-state-icon">🔩</div>
                <div className="empty-state-title">No Rails Added</div>
                <div className="empty-state-sub">Use the buttons in the left panel to add Wall Rail, Guard Rail, Grab Rail, Cane Rail, or Kick Plate.</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                  {RAIL_TYPES.map(rt => (
                    <button
                      key={rt.key}
                      className="header-btn header-btn-outline"
                      onClick={() => addRail(rt.key)}
                    >
                      {rt.icon} {rt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Pricing Settings Modal ── */}
        <PricingOverridesModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          globalConfig={configManager.config || {}}
          onApply={calculateEstimation}
        />

        <AllocateProjectModal
          isOpen={showAllocateModal}
          onClose={() => setShowAllocateModal(false)}
          onAllocate={handleAllocated}
          initialData={{ projectName: projectData.projectName }}
        />

        {/* ── Classic Confirmation Modal ── */}
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
                <button className="confirm-btn-outline" onClick={() => { confirmModal.resolve(false); setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>Cancel</button>
                <button className="confirm-btn-solid" onClick={() => { confirmModal.resolve(true); setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>Continue</button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </>
  );
}
