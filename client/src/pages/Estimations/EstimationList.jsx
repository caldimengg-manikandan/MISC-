import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, SlidersHorizontal, ArrowUpRight,
  Clock, FolderOpen, AlertCircle,
  Loader2, ChevronRight, Grid3x3, List, Trash2, X, AlertTriangle,
  CheckSquare, Square, MinusSquare
} from 'lucide-react';
import { useEstimation } from '../../contexts/EstimationContext';
import ProjectContextMenu from '../../components/ProjectContextMenu';
import WorkflowStatusBadge from '../../components/workflow/WorkflowStatusBadge';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './EstimationList.css';

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  NEW:         { label: 'New',         color: '#6366f1', bg: 'rgba(99,102,241,0.08)'   },
  ASSIGNED:    { label: 'Assigned',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)'   },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'   },
  REVIEW:      { label: 'Review',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'   },
  SUBMITTED:   { label: 'Submitted',   color: '#10a37f', bg: 'rgba(16,163,127,0.08)'   },
  OVERDUE:     { label: 'Overdue',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)'    },
};

const getStatus = (s) => STATUS_CFG[s?.toUpperCase()] || { label: s || '—', color: '#6e6e80', bg: '#f4f4f4' };

/* ─── Days-left badge ───────────────────────────────────────────── */
function DaysLeftBadge({ dueDate }) {
  if (!dueDate) return <span className="el-days-na">—</span>;
  const diff = differenceInDays(new Date(dueDate), new Date());
  if (diff < 0)  return <span className="el-days overdue"><AlertCircle size={11} /> {Math.abs(diff)}d overdue</span>;
  if (diff <= 2) return <span className="el-days urgent"><Clock size={11} /> {diff}d left</span>;
  return <span className="el-days ok"><Clock size={11} /> {diff}d left</span>;
}

/* ─── Delete Confirmation Modal ─────────────────────────────────── */
/* ─── Delete Confirmation Modal ─────────────────────────────────── */
function DeleteConfirmModal({ project, projects = [], onConfirm, onCancel, deleting }) {
  const isBulk = projects.length > 0;
  
  const content = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: '420px',
          overflow: 'hidden', border: '1px solid #e2e8f0'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f1 100%)',
          padding: '24px 24px 20px',
          borderBottom: '1px solid #fee2e2',
          display: 'flex', alignItems: 'flex-start', gap: '16px'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: '#fee2e2', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px' }}>
              {isBulk ? `Delete ${projects.length} Projects?` : 'Delete Project?'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              This action cannot be undone.
            </p>
          </div>
          <button onClick={onCancel} disabled={deleting} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', padding: '4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {isBulk ? (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
              maxHeight: '120px', overflowY: 'auto'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Projects to be deleted
              </div>
              {projects.map(p => (
                <div key={p.id} style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  {p.projectName}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                Project to delete
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                {project.projectName}
              </div>
              {project.customer_name && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {project.customer_name}
                </div>
              )}
            </div>
          )}
          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
            {isBulk 
              ? `All data associated with these ${projects.length} projects will be permanently removed.`
              : 'All estimation data, stairs, railings, and notes associated with this project will be permanently removed.'
            }
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', gap: '10px', justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer', border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', transition: 'all 0.15s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
              border: 'none', background: deleting ? '#fca5a5' : '#ef4444',
              color: '#fff', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
              boxShadow: deleting ? 'none' : '0 4px 12px rgba(239,68,68,0.3)'
            }}
          >
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function EstimationList() {
  const navigate = useNavigate();
  const { estimations, listLoading: loading, fetchDashboardStats, fetchEstimations, deleteEstimation, bulkDeleteEstimations } = useEstimation();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [deleteModal, setDeleteModal] = useState(null); // { project: null, projects: [] }
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);


  // Removed redundant fetchEstimations here as it is handled globally in MainLayout
  // useEffect(() => { fetchEstimations(); }, []);

  const filtered = estimations.filter(p =>
    p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.customer_name && p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setDeleteModal({ project });
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    const projects = estimations.filter(p => selectedIds.includes(p.id));
    setDeleteModal({ projects });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    
    const isBulk = deleteModal.projects?.length > 0;
    const label = isBulk ? `${deleteModal.projects.length} projects` : `"${deleteModal.project.projectName}"`;
    const toastId = toast.loading(`Deleting ${label}…`);
    
    try {
      if (isBulk) {
        await bulkDeleteEstimations(selectedIds);
        setSelectedIds([]);
      } else {
        await deleteEstimation(deleteModal.project.id);
        setSelectedIds(prev => prev.filter(id => id !== deleteModal.project.id));
      }
      toast.success('Deleted successfully.', { id: toastId });
      setDeleteModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete.', { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="el-root fade-in">

      {/* ══ DELETE CONFIRMATION MODAL ══════════════════════════════ */}
      <AnimatePresence>
        {deleteModal && (
          <DeleteConfirmModal
            project={deleteModal.project}
            projects={deleteModal.projects}
            deleting={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => !deleting && setDeleteModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ PAGE HEADER ═══════════════════════════════════════════ */}
      <div className="el-page-header">
        <div>
          <h1 className="el-page-title">Projects</h1>
          <p className="el-page-sub">Manage and track your fabrication estimations</p>
        </div>
        <button className="el-btn-new" id="btn-new-estimation" onClick={() => navigate('/project-info')}>
          <Plus size={15} /> New Estimation
        </button>
      </div>

      {/* ══ CONTROLS BAR ══════════════════════════════════════════ */}
      <div className="el-controls">
        <div className="el-search">
          <Search size={15} className="el-search-icon" />
          <input
            type="text"
            className="el-search-input"
            placeholder="Search by project name or customer…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            id="projects-search"
          />
          {searchTerm && (
            <button className="el-search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="el-controls-right">
          <button className="el-btn-outline" id="btn-filters">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <div className="el-view-toggle">
            <button className={`el-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
              <List size={15} />
            </button>
            <button className={`el-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
              <Grid3x3 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ══ COUNT LINE ════════════════════════════════════════════ */}
      {!loading && (
        <div className="el-count-line">
          <span>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
          {searchTerm && <span className="el-count-query">matching "{searchTerm}"</span>}
        </div>
      )}

      {/* ══ CONTENT ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" className="el-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 size={22} className="el-spinner" />
            <span>Loading projects…</span>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" className="el-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <FolderOpen size={40} className="el-empty-icon" />
            <div className="el-empty-title">No projects found</div>
            <div className="el-empty-sub">
              {searchTerm ? `No results for "${searchTerm}". Try a different search.` : 'Create your first estimation to get started.'}
            </div>
            {!searchTerm && (
              <button className="el-btn-new" style={{ marginTop: 16 }} onClick={() => navigate('/project-info')}>
                <Plus size={15} /> New Estimation
              </button>
            )}
          </motion.div>
        ) : viewMode === 'table' ? (
          /* ── TABLE VIEW ─────────────────────────────────────── */
          <motion.div key="table" className="el-table-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <table className="el-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <button className="el-selection-btn" onClick={toggleSelectAll}>
                      {selectedIds.length === filtered.length && filtered.length > 0 
                        ? <CheckSquare size={16} color="var(--gpt-accent)" /> 
                        : selectedIds.length > 0 ? <MinusSquare size={16} color="var(--gpt-accent)" /> : <Square size={16} />
                      }
                    </button>
                  </th>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Project Name</th>
                  <th>Customer</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th>Engineer</th>
                  <th style={{ width: 120 }}>Due Date</th>
                  <th style={{ width: 120 }}>Timeline</th>
                  <th style={{ width: 96 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st = getStatus(p.status);
                  return (
                    <motion.tr
                      key={p.id}
                      className={`el-table-row ${selectedIds.includes(p.id) ? 'selected' : ''}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate('/project-info?id=' + p.id)}
                    >
                      <td onClick={e => toggleSelect(e, p.id)}>
                        <button className="el-selection-btn">
                          {selectedIds.includes(p.id) ? <CheckSquare size={16} color="var(--gpt-accent)" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td><span className="el-id-chip">#{p.id.toString().slice(-6).toUpperCase()}</span></td>
                      <td className="el-td-name">{p.projectName}</td>
                      <td className="el-td-muted">{p.customer_name || '—'}</td>
                      <td>
                        {p.workflow_status ? (
                          <WorkflowStatusBadge status={p.workflow_status} size="sm" />
                        ) : (
                          <span className="el-status-pill" style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}>
                            {st.label}
                          </span>
                        )}
                      </td>
                      <td className="el-td-muted">{p.engineerId || '—'}</td>
                      <td className="el-td-date">{p.dueDate ? format(new Date(p.dueDate), 'dd MMM yyyy') : '—'}</td>
                      <td><DaysLeftBadge dueDate={p.dueDate} /></td>
                      <td>
                        <div className="el-row-actions" onClick={e => e.stopPropagation()}>
                          <ProjectContextMenu project={p} isPinned={p.isPinned} onRenameStart={() => {}} />
                          <button
                            className="el-row-delete"
                            id={`btn-delete-${p.id}`}
                            title="Delete project"
                            onClick={(e) => handleDeleteClick(e, p)}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button className="el-row-cta" id={`btn-open-${p.id}`} onClick={() => navigate('/project-info?id=' + p.id)}>
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          /* ── GRID VIEW ──────────────────────────────────────── */
          <motion.div key="grid" className="el-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.map((p, i) => {
              const st = getStatus(p.status);
              const daysLeft = p.dueDate ? differenceInDays(new Date(p.dueDate), new Date()) : null;
              return (
                <motion.div
                  key={p.id}
                  className={`el-grid-card ${selectedIds.includes(p.id) ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate('/project-info?id=' + p.id)}
                >
                  <div className={`el-grid-selection ${selectedIds.includes(p.id) ? 'active' : ''}`} onClick={e => toggleSelect(e, p.id)}>
                    {selectedIds.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div className="el-grid-top">
                    <span className="el-id-chip">#{p.id.toString().slice(-6).toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <button className="el-row-delete" id={`btn-grid-delete-${p.id}`} title="Delete project" onClick={(e) => handleDeleteClick(e, p)}>
                        <Trash2 size={13} />
                      </button>
                      <ProjectContextMenu project={p} isPinned={p.isPinned} onRenameStart={() => {}} />
                      {p.workflow_status ? (
                        <WorkflowStatusBadge status={p.workflow_status} size="sm" />
                      ) : (
                        <span className="el-status-pill" style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}>
                          {st.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="el-grid-name">{p.projectName}</div>
                  <div className="el-grid-customer">{p.customer_name || 'No customer assigned'}</div>
                  <div className="el-grid-footer">
                    <span className="el-grid-eng">{p.engineerId || 'Unassigned'}</span>
                    {daysLeft !== null && <DaysLeftBadge dueDate={p.dueDate} />}
                  </div>
                  <button className="el-grid-open" id={`btn-grid-open-${p.id}`}><ArrowUpRight size={14} /></button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ══ BULK ACTIONS BAR ═══════════════════════════════════════ */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            className="el-bulk-bar"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="el-bulk-info">
              <span className="el-bulk-count">{selectedIds.length}</span>
              <span className="el-bulk-text">item{selectedIds.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="el-bulk-actions">
              <button className="el-bulk-btn cancel" onClick={() => setSelectedIds([])}>
                Clear
              </button>
              <button className="el-bulk-btn delete" onClick={handleBulkDeleteClick}>
                <Trash2 size={15} /> Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

