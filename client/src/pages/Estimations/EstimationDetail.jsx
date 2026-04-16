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
import { motion } from 'framer-motion';
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
  const { fetchEstimationDetail, updateEstimationStatus, saveEstimationData, createEstimation, loading } = useEstimation();
  
  const [form, setForm] = useState(() => ({
    ...initialData,
    // By default for new projects, instantly show the logged-in user as the assigned engineer
    assigned_engineer_name: user?.full_name || user?.email || '',
    assigned_engineer_id: user?.id || null
  }));
  
  const [saved, setSaved] = useState(false);
  const [goingToEstimation, setGoingToEstimation] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

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
        assigned_engineer_id: user?.id || null
      });
    }
    fetchCustomers();
  }, [projectId, user]);

  const loadProject = useCallback(async (id) => {
    const data = await fetchEstimationDetail(id);
    if (data) {
      setForm({
        ...initialData,
        ...data,
        aiscCertified: data.aiscCertified || 'Y',
        units: data.units || 'Imperial',
      });
    }
  }, [fetchEstimationDetail]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.get(`${API_BASE_URL}/api/customers?status=active`, {
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

      // Write project info to localStorage for the estimation module
      localStorage.setItem('steelProjectInfo', JSON.stringify({
        id: resolvedId,
        projectName: form.projectName,
        projectNumber: form.projectNumber,
        customerName: form.customer_name || '',
        customerId: form.customer_id || null,
        projectLocation: form.projectLocation || ''
      }));
      navigate('/estimate/stair-railings');
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

  const onStatusAction = async (action) => {
    if (!projectId) return;
    try {
      if (action === 'assign') {
        const engId = prompt('Enter Engineer ID:');
        if (engId) await updateEstimationStatus(projectId, 'assign', { engineerId: engId });
      } else {
        await updateEstimationStatus(projectId, action);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading && !form.projectName) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <span>Loading estimation…</span>
      </div>
    );
  }

  const st = getStatus(form.status);
  const stageIndex = STAGE_ORDER.indexOf(form.status?.toUpperCase());
  const daysLeft = form.dueDate ? differenceInDays(new Date(form.dueDate), new Date()) : null;

  return (
    <div className="ed-root fade-in">

      {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
      <div className="ed-page-header">
        <div className="ed-header-left">
          <div className="ed-breadcrumb">
            <button className="ed-breadcrumb-btn" onClick={() => navigate('/projects')}>Projects</button>
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
                  <input className="ed-input" value={form.projectName || ''} onChange={e => set('projectName', e.target.value)} placeholder="e.g. Westside Industrial" />
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
                  <input className="ed-input" value={form.projectNumber || ''} onChange={e => set('projectNumber', e.target.value)} placeholder="e.g. PRJ-1024" />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Project Location</label>
                  <input className="ed-input" value={form.projectLocation || ''} onChange={e => set('projectLocation', e.target.value)} placeholder="e.g. Dallas, TX" />
                </div>
              </div>

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
                  <input className="ed-input" value={form.assigned_engineer_name || form.assigned_engineer_email || form.assignedEngineer || form.engineerId || ''} onChange={e => set('assigned_engineer_name', e.target.value)} placeholder="Engineer Name" />
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
