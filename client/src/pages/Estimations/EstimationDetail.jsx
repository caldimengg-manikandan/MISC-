// src/pages/Estimations/EstimationDetail.jsx
// GPT-style Project Detail — complete redesign
// All handlers (handleSave, onStatusAction, fetchEstimationDetail) unchanged.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEstimation } from '../../contexts/EstimationContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Play, UserPlus, Send, Save, ArrowUpRight,
  Scale, DollarSign, Calendar, Clock, User, Building2,
  ChevronRight, Zap, FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import SearchableSelect from '../../components/common/SearchableSelect';
import QuickAddCustomerModal from '../../components/project/QuickAddCustomerModal';
import WorkflowActionBar from '../../components/workflow/WorkflowActionBar';
import WorkflowStatusBadge from '../../components/workflow/WorkflowStatusBadge';
import './EstimationDetail.css';

/* ─── Lifecycle stages ──────────────────────────────────────────── */
const STAGES = [
  { key: 'NEW',         label: 'New',         icon: FileText,    color: '#6e6e80' },
  { key: 'ASSIGNED',    label: 'Assigned',    icon: User,        color: '#0ea5e9' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Zap,         color: '#f59e0b' },
  { key: 'REVIEW',      label: 'Review',      icon: CheckCircle2,color: '#8b5cf6' },
  { key: 'SUBMITTED',   label: 'Submitted',   icon: Send,        color: '#10a37f' },
];
const STAGE_ORDER = STAGES.map(s => s.key);

const STATUS_CFG = {
  NEW:         { label: 'New',         color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
  ASSIGNED:    { label: 'Assigned',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)'  },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  REVIEW:      { label: 'Review',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
  SUBMITTED:   { label: 'Submitted',   color: '#10a37f', bg: 'rgba(16,163,127,0.08)'  },
  OVERDUE:     { label: 'Overdue',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
};

const getStatus = (s) => STATUS_CFG[s?.toUpperCase()] || { label: s || 'Draft', color: '#6e6e80', bg: '#f4f4f4' };

const initialData = { 
  customer_name: '', projectName: '', dueDate: '', status: 'NEW',
  projectNumber: '', projectLocation: '', architect: '', eor: '', gcName: '', 
  detailer: '', vendorName: '', aiscCertified: 'Y', units: 'Imperial'
};

/* ─── Component ─────────────────────────────────────────────────── */
export default function EstimationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    createEstimation, 
    fetchEstimationDetail, 
    saveEstimationData, 
    detailLoading, // Use detailLoading instead of shared loading state
    error 
  } = useEstimation();
  
  const [form, setForm] = useState(() => ({
    ...initialData,
    // By default for new projects, instantly show the logged-in user as the assigned engineer
    assigned_engineer_name: user?.full_name || user?.email || '',
    assignedEngineerId: user?.id || null, // consistently use one variation
    engineerId: user?.id || null
  }));
  
  const [saved, setSaved] = useState(false);
  const [goingToEstimation, setGoingToEstimation] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [projectHistory, setProjectHistory] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [latestMatch, setLatestMatch] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('id');

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else {
      // Reset form to completely empty state when navigating to "New Estimation" from an existing one
      setForm({
        ...initialData,
        assigned_engineer_name: user?.full_name || user?.email || '',
        assigned_engineer_id: user?.id || null,
        engineerId: user?.id || null
      });
    }
    fetchCustomers();
  }, [projectId, user]);

  const loadProject = useCallback(async (id) => {
    const data = await fetchEstimationDetail(id);
    if (data) {
      // Extract estimation summary if available in estimationResult
      const er = typeof data.estimationResult === 'string' ? JSON.parse(data.estimationResult) : data.estimationResult;
      const summarySource = er?.summary || er?.standardSummary || {};
      
      setForm({
        ...initialData,
        ...data,
        // Map potential snake_case from DB or nested data from estimationResult
        // 🔄 FIX: Use || instead of ?? because DB column may be 0 (initialized/default), 
        // which would otherwise prevent the fallback to the JSON-stored calculation result.
        totalWeight: data.totalWeight || data.total_weight || summarySource.totalSteelWeight || summarySource.total_weight || 0,
        totalCost: data.totalCost || data.total_cost || summarySource.grandTotal || summarySource.totalCost || summarySource.total_cost || 0,
        
        // Ensure core identifiers and metadata are mapped
        projectName: data.projectName || data.project_name || '',
        projectNumber: data.projectNumber || data.project_number || '',
        customer_name: data.LinkedCustomerName || data.customer_name || data.customerName || '',
        customer_id: data.customer_id || data.customerId || null,
        projectLocation: data.projectLocation || data.project_location || '',
        architect: data.architect || '',
        eor: data.eor || '',
        gcName: data.gcName || data.gc_name || '',
        detailer: data.detailer || '',
        vendorName: data.vendorName || data.vendor_name || '',
        aiscCertified: data.aiscCertified || data.aisc_certified || 'Y',
        units: data.units || 'Imperial',
        
        // Timestamps (Handle multiple DB field names created_at, created_At, createdAt)
        createdAt: data.createdAt || data.created_at || data.created_At || data.updatedAt || null,
        updatedAt: data.updatedAt || data.updated_at || data.updated_At || null,
        
        // Engineer details
        assigned_engineer_name: data.assigned_engineer_name || data.assignedEngineer || '',
        engineerId: data.engineerId || data.assigned_engineer_id || null
      });
    }
  }, [fetchEstimationDetail]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.get(`${API_BASE_URL}/api/v1/customers?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const checkDuplicateProject = useCallback(async (name, number) => {
    if (!name && !number) {
      setProjectHistory([]);
      setDuplicateWarning('');
      setLatestMatch(null);
      return;
    }

    if (projectId) return; // ONLY for new projects
    
    setCheckingDuplicate(true);
    try {
      const token = localStorage.getItem('steel_token');
      const url = `${API_BASE_URL}/api/v1/projects/check-duplicate?projectName=${encodeURIComponent(name || '')}&projectNumber=${encodeURIComponent(number || '')}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { exists, history, exactMatch, numberCollision, latestProject } = res.data;
      
      if (exists || numberCollision) {
        setProjectHistory(history || []);
        setLatestMatch(latestProject);
        
        if (exactMatch) {
          setDuplicateWarning('EXISTING_COLLISION');
        } else if (numberCollision) {
          setDuplicateWarning('NUMBER_TAKEN');
        } else {
          setDuplicateWarning('NAME_HISTORY');
        }
      } else {
        setProjectHistory([]);
        setDuplicateWarning('');
        setLatestMatch(null);
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
    } finally {
      setCheckingDuplicate(false);
    }
  }, [projectId]);

  const autoFillFromMatch = (matchToUse = latestMatch) => {
    if (!matchToUse) return;
    setForm(f => ({
      ...f,
      projectName: matchToUse.projectName || matchToUse.project_name || f.projectName,
      projectNumber: matchToUse.projectNumber || matchToUse.project_number || f.projectNumber,
      customer_id: matchToUse.customerId || matchToUse.customer_id || f.customer_id,
      customer_name: matchToUse.customerName || matchToUse.customer_name || f.customer_name,
      projectLocation: matchToUse.projectLocation || matchToUse.project_location || f.projectLocation,
      architect: matchToUse.architect || f.architect,
      eor: matchToUse.eor || f.eor,
      gcName: matchToUse.gcName || matchToUse.gc_name || f.gcName,
      detailer: matchToUse.detailer || f.detailer,
      vendorName: matchToUse.vendorName || matchToUse.vendor_name || f.vendorName,
      aiscCertified: matchToUse.aiscCertified || matchToUse.aisc_certified || f.aiscCertified,
      units: matchToUse.units || f.units,
      dueDate: matchToUse.dueDate || matchToUse.due_date || f.dueDate,
      status: matchToUse.status || f.status,
      // Also fill assigned engineer if it matches current user or is empty
      assigned_engineer_name: matchToUse.assigned_engineer_name || f.assigned_engineer_name,
      engineerId: matchToUse.engineerId || matchToUse.engineer_id || f.engineerId
    }));
    toast.success('All project details auto-filled from history.');
  };

  // Auto-trigger duplicate check when name/number changes
  useEffect(() => {
    // Only run if we actually have input to check
    if (!form.projectName && !form.projectNumber) {
      setProjectHistory([]);
      setDuplicateWarning('');
      return;
    }

    const timer = setTimeout(() => {
      checkDuplicateProject(form.projectName, form.projectNumber);
    }, 600); 
    
    return () => clearTimeout(timer);
  }, [form.projectName, form.projectNumber, checkDuplicateProject, projectId]);

  const handleSave = useCallback(async () => {
    // Basic validation
    if (!form.projectName?.trim()) {
      toast.error('Project Name is required.');
      return null; // Return null to signal failure
    }

    const toastId = toast.loading('Saving project details...');
    try {
      if (!projectId) {
        // Creating a new project
        const newId = await createEstimation(form);
        toast.success('Project created successfully!', { id: toastId });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Replace URL so we are now on the detail page for this specific new project
        navigate(`/project-info?id=${newId}`, { replace: true });
        return newId; // Return the new ID for callers
      }

      // Updating an existing project
      await saveEstimationData(projectId, form);
      toast.success('Project saved successfully!', { id: toastId });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return projectId; // Return existing ID for callers
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed. Please try again.', { id: toastId });
      return null; // Return null to signal failure
    }
  }, [form, projectId, createEstimation, saveEstimationData, navigate]);

  // Listen for global Save from the header button
  useEffect(() => {
    const onGlobalSave = () => handleSave();
    window.addEventListener('app:save', onGlobalSave);
    return () => window.removeEventListener('app:save', onGlobalSave);
  }, [handleSave]);

  // ── Go to Estimation — auto-save first if needed ────────────────
  const goToEstimation = async () => {
    if (!form.projectName?.trim()) {
      toast.error('Project Name is required before entering the estimation module.');
      return;
    }
    setGoingToEstimation(true);
    try {
      // Always save/create before navigating so the estimation module gets a valid projectId
      let resolvedId = projectId;
      if (!projectId) {
        // New project — create it first
        const toastId = toast.loading('Saving project before entering estimation...');
        try {
          resolvedId = await createEstimation(form);
          toast.success('Project saved ✓', { id: toastId });
          // Update the URL so browser history is consistent
          navigate(`/project-info?id=${resolvedId}`, { replace: true });
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Could not save project. Please try again.', { id: toastId });
          return;
        }
      } else {
        // Existing project — save any unsaved changes silently
        try {
          await saveEstimationData(projectId, form);
        } catch (_) {
          // Non-blocking: still navigate even if update fails
        }
      }

      // Write project info to localStorage for the estimation module fallback
      const modulePath = `/project/${resolvedId}/estimate/stair-railings`;
      navigate(modulePath);
    } finally {
      setGoingToEstimation(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) {
      setForm(f => ({ ...f, customer_id: null, customer_name: '' }));
    } else {
      setForm(f => ({ 
        ...f, 
        customer_id: customer.id, 
        customer_name: customer.companyName,
        // Auto-fill location if project location is empty
        projectLocation: f.projectLocation ? f.projectLocation : (customer.city ? `${customer.city}, ${customer.state}` : f.projectLocation)
      }));
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));



  if (detailLoading && !form.projectName) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <span>Loading estimation…</span>
      </div>
    );
  }

  const st = getStatus(form.workflow_status || form.status);
  const currentStageStatus = (form.workflow_status || form.status || 'NEW').toUpperCase();
  const stageIndex = STAGE_ORDER.indexOf(currentStageStatus);
  const daysLeft = form.dueDate ? differenceInDays(new Date(form.dueDate), new Date()) : null;

  return (
    <div className="ed-root fade-in">

      {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
      <div className="ed-page-header">
        <div className="ed-header-left">
          <div className="ed-breadcrumb">
            <button className="ed-breadcrumb-btn" onClick={() => navigate('/estimations')}>Projects</button>
            <ChevronRight size={13} className="ed-breadcrumb-sep" />
            <span>{form.projectName || 'New Estimation'}</span>
          </div>
          <h1 className="ed-page-title">{form.projectName || 'New Estimation'}</h1>
          <div className="ed-page-meta">
            {/* Workflow status badge — uses workflow_status field from API */}
            {form.workflow_status ? (
              <WorkflowStatusBadge status={form.workflow_status} />
            ) : (
              <span
                className="ed-status-badge"
                style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}
              >
                {st.label}
              </span>
            )}
            {projectId && (
              <span className="ed-project-id">#{projectId.toString().slice(-6).toUpperCase()}</span>
            )}
            {daysLeft !== null && (
              <span className={`ed-deadline ${daysLeft < 0 ? 'overdue' : daysLeft <= 2 ? 'urgent' : ''}`}>
                <Clock size={12} />
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d to deadline`}
              </span>
            )}
          </div>
        </div>
        <div className="ed-header-actions">
        </div>
      </div>

      {/* ══ LIFECYCLE PROGRESS BAR ═══════════════════════════════ */}
      <div className="ed-lifecycle">
        {STAGES.map((stage, i) => {
          const isActive = i === stageIndex;
          const isPast   = i < stageIndex;
          return (
            <React.Fragment key={stage.key}>
              <div className={`ed-stage ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                <div className="ed-stage-icon" style={{ background: isActive || isPast ? stage.color : undefined }}>
                  <stage.icon size={13} />
                </div>
                <span className="ed-stage-label">{stage.label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`ed-stage-line ${isPast ? 'filled' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ══ WORKFLOW ACTION BAR ═══════════════════════════════════ */}
      <div className="ed-workflow-bar">
        <WorkflowActionBar
          project={form}
          onStatusChange={projectId ? () => loadProject(projectId) : undefined}
          onEngineerChange={(email) => set('assigned_engineer_name', email)}
        />
      </div>

      {/* ══ BODY GRID ════════════════════════════════════════════ */}
      <div className="ed-body">

        {/* ── Left: Project Details Form ─────────────────────── */}
        <div className="ed-main-col">
          <motion.div
            className="ed-card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="ed-card-header">
              <span className="ed-card-title">Project Details</span>
            </div>
            <div className="ed-card-body">
              {/* CORE INFO */}
              <div className="ed-section-title">Core Information</div>
              <div className="ed-form-grid">
                <div className="ed-field">
                  <label className="ed-label">Project Name <span style={{color: '#ef4444'}}>*</span></label>
                  <div className="relative">
                    <input 
                      className={`ed-input ${duplicateWarning === 'EXISTING_COLLISION' ? 'border-red-500 bg-red-50' : duplicateWarning === 'NAME_HISTORY' ? 'border-amber-400 bg-amber-50' : ''}`}
                      value={form.projectName || ''} 
                      onChange={e => { set('projectName', e.target.value); setDuplicateWarning(''); }} 
                      placeholder="e.g. Westside Industrial" 
                    />
                    {checkingDuplicate && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Checking...</div>}
                  </div>
                </div>
                <div className="ed-field">
                  <label className="ed-label">Customer Master <span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SearchableSelect 
                      options={customers}
                      valueKey="id"
                      displayKey="companyName"
                      placeholder="Select a customer..."
                      value={form.customer_id}
                      onSelect={handleCustomerSelect}
                      loading={customersLoading}
                      className="ed-customer-select"
                    />
                    <button 
                      className="ed-action-btn" 
                      style={{ padding: '0 12px', height: '38px', marginTop: 0 }}
                      onClick={() => setShowAddCustomer(true)}
                      type="button"
                    >
                      <UserPlus size={14} />
                    </button>
                  </div>
                  {form.customer_name && !form.customer_id && (
                    <div className="ed-legacy-alert">
                      ⚠️ Legacy Customer: <strong>{form.customer_name}</strong>. 
                      Link this project to a record for better tracking.
                    </div>
                  )}
                </div>
                <div className="ed-field">
                  <label className="ed-label">Project Number</label>
                  <input 
                    className={`ed-input ${(duplicateWarning === 'EXISTING_COLLISION' || duplicateWarning === 'NUMBER_TAKEN') ? 'border-red-500 bg-red-50 font-bold text-red-700' : ''}`}
                    value={form.projectNumber || ''} 
                    onChange={e => { set('projectNumber', e.target.value); setDuplicateWarning(''); }} 
                    placeholder="e.g. PRJ-1024" 
                  />
                  {duplicateWarning === 'EXISTING_COLLISION' && (
                    <div className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-tight leading-tight">
                      Project name & number already exist. Please use a new number.
                    </div>
                  )}
                  {duplicateWarning === 'NUMBER_TAKEN' && (
                    <div className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-tight leading-tight">
                      This Project Number is already assigned to another project.
                    </div>
                  )}
                </div>
                <div className="ed-field">
                  <label className="ed-label">Project Location</label>
                  <input className="ed-input" value={form.projectLocation || ''} onChange={e => set('projectLocation', e.target.value)} placeholder="e.g. Dallas, TX" />
                </div>
              </div>

              {/* Duplicate History Callout */}
              <AnimatePresence>
                {projectHistory.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner"
                  >
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <Clock size={12} /> Matching Projects & History
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{projectHistory.length} match{projectHistory.length !== 1 ? 'es' : ''} found</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {projectHistory.map(prj => (
                        <div key={prj.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg text-xs hover:border-slate-300 transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{prj.projectName}</span>
                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">#{prj.projectNumber || '—'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <Building2 size={10} /> {prj.customerName || 'No Customer'}
                                <span className="text-slate-300">|</span>
                                <Calendar size={10} /> {prj.updatedAt ? format(new Date(prj.updatedAt), 'dd MMM yyyy') : ''}
                            </div>
                          </div>
                           <div className="flex items-center gap-2">
                             <WorkflowStatusBadge status={prj.status} small />
                             {!projectId && (
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => autoFillFromMatch(prj)}
                                    className="text-[10px] text-[#10a37f] hover:bg-[#10a37f]/10 px-3 py-1.5 rounded-lg font-bold border border-[#10a37f] transition-all whitespace-nowrap"
                                    title="Use these details as a template"
                                  >
                                    Use Details
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/project/${prj.id}/estimate/stair-railings`)}
                                    className="text-[10px] bg-[#10a37f] text-white hover:bg-[#0d8a6b] px-3 py-1.5 rounded-lg font-black transition-all whitespace-nowrap shadow-sm"
                                    title="Open existing project and calculations"
                                  >
                                    Open Project
                                  </button>
                               </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="ed-divider" />

              {/* STAKEHOLDERS */}
              <div className="ed-section-title">Stakeholders</div>
              <div className="ed-form-grid">
                <div className="ed-field">
                  <label className="ed-label">Architect</label>
                  <input className="ed-input" value={form.architect || ''} onChange={e => set('architect', e.target.value)} placeholder="Architect Name" />
                </div>
                <div className="ed-field">
                  <label className="ed-label">EOR (Engineer of Record)</label>
                  <input className="ed-input" value={form.eor || ''} onChange={e => set('eor', e.target.value)} placeholder="EOR Name" />
                </div>
                <div className="ed-field">
                  <label className="ed-label">G.C. Name</label>
                  <input className="ed-input" value={form.gcName || ''} onChange={e => set('gcName', e.target.value)} placeholder="General Contractor" />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Detailer</label>
                  <input className="ed-input" value={form.detailer || ''} onChange={e => set('detailer', e.target.value)} placeholder="Detailer Name" />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Vendor Name</label>
                  <input className="ed-input" value={form.vendorName || ''} onChange={e => set('vendorName', e.target.value)} placeholder="Vendor Co." />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Assigned Engineer (Name or Email)</label>
                  <input className="ed-input" value={form.assigned_engineer_name || ''} onChange={e => set('assigned_engineer_name', e.target.value)} placeholder="Engineer Name" />
                </div>
              </div>

              <div className="ed-divider" />

              {/* COMPLIANCE & CONFIG */}
              <div className="ed-section-title">Compliance & Config</div>
              <div className="ed-form-grid">
                <div className="ed-field">
                  <label className="ed-label">Submission Deadline</label>
                  <input type="date" className="ed-input" value={form.dueDate ? form.dueDate.split('T')[0] : ''} onChange={e => set('dueDate', e.target.value)} />
                </div>
                
                <div className="ed-field">
                  <label className="ed-label">AISC Certified <span style={{color: '#ef4444'}}>*</span></label>
                  <div className="ed-segmented-control">
                    <button 
                      className={`ed-seg-btn ${form.aiscCertified === 'Y' ? 'active' : ''}`}
                      onClick={() => set('aiscCertified', 'Y')}
                    >Y</button>
                    <button 
                      className={`ed-seg-btn ${form.aiscCertified === 'N' ? 'active' : ''}`}
                      onClick={() => set('aiscCertified', 'N')}
                    >N</button>
                  </div>
                </div>

                <div className="ed-field">
                  <label className="ed-label">Units <span style={{color: '#ef4444'}}>*</span></label>
                  <div className="ed-segmented-control">
                    <button 
                      className={`ed-seg-btn ${form.units === 'Imperial' ? 'active' : ''}`}
                      onClick={() => set('units', 'Imperial')}
                    >Imperial</button>
                    <button 
                      className={`ed-seg-btn ${form.units === 'Metric' ? 'active' : ''}`}
                      onClick={() => set('units', 'Metric')}
                    >Metric</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Go to Estimation Module CTA */}
          <motion.button
            className="ed-cta-btn"
            id="btn-go-estimation"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={goToEstimation}
            disabled={goingToEstimation}
            style={{ opacity: goingToEstimation ? 0.7 : 1, cursor: goingToEstimation ? 'wait' : 'pointer' }}
          >
            <div className="ed-cta-left">
              <div className="ed-cta-icon">
                {goingToEstimation ? (
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 18 }}>⏳</span>
                ) : (
                  <Zap size={20} />
                )}
              </div>
              <div>
                <div className="ed-cta-title">
                  {goingToEstimation ? 'Saving & Opening…' : 'Go to Estimation Module'}
                </div>
                <div className="ed-cta-sub">
                  {goingToEstimation
                    ? 'Saving project details before entering…'
                    : 'Configure stairs, railings, landings, and run the estimation engine'}
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="ed-cta-arrow" />
          </motion.button>
        </div>

        {/* ── Right: Summary Sidebar ─────────────────────────── */}
        <div className="ed-side-col">
          <motion.div
            className="ed-card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="ed-card-header">
              <span className="ed-card-title">Estimation Summary</span>
            </div>
            <div className="ed-card-body">
              <div className="ed-kpi-tile">
                <div className="ed-kpi-icon" style={{ background: 'rgba(16,163,127,0.08)', color: '#10a37f' }}>
                  <Scale size={16} />
                </div>
                <div>
                  <div className="ed-kpi-label">Total Steel Weight</div>
                  <div className="ed-kpi-value">{form.totalWeight?.toFixed(2) || '0.00'} lbs</div>
                </div>
              </div>
              <div className="ed-kpi-tile ed-kpi-accent">
                <div className="ed-kpi-icon" style={{ background: 'rgba(16,163,127,0.1)', color: '#10a37f' }}>
                  <DollarSign size={16} />
                </div>
                <div>
                  <div className="ed-kpi-label">Total Estimated Cost</div>
                  <div className="ed-kpi-value ed-kpi-green">
                    ${form.totalCost?.toLocaleString() || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="ed-card-divider" />

            <div className="ed-card-body">
              <div className="ed-meta-row">
                <span>Date Created</span>
                <span>{form.createdAt ? format(new Date(form.createdAt), 'dd MMM yyyy') : '—'}</span>
              </div>
              <div className="ed-meta-row">
                <span>Last Updated</span>
                <span>{form.updatedAt ? format(new Date(form.updatedAt), 'dd MMM, HH:mm') : '—'}</span>
              </div>
              <div className="ed-meta-row">
                <span>Status</span>
                <span
                  className="ed-status-badge"
                  style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}
                >
                  {st.label}
                </span>
              </div>
              {form.dueDate && (
                <div className="ed-meta-row">
                  <span>Deadline</span>
                  <span>{format(new Date(form.dueDate), 'dd MMM yyyy')}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <QuickAddCustomerModal 
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={(newCust) => {
          setCustomers(prev => [...prev, newCust]);
          handleCustomerSelect(newCust);
        }}
      />
    </div>
  );
}

