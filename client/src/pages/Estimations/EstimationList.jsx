// src/pages/Estimations/EstimationList.jsx
// GPT-style Projects hub — complete redesign
// All logic (fetchEstimations, navigate) unchanged.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, SlidersHorizontal, ArrowUpRight,
  Clock, FolderOpen, AlertCircle, CheckCircle2,
  Loader2, ChevronRight, Grid3x3, List
} from 'lucide-react';
import { useEstimation } from '../../contexts/EstimationContext';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ─── Component ─────────────────────────────────────────────────── */
export default function EstimationList() {
  const navigate = useNavigate();
  const { estimations, loading, fetchEstimations } = useEstimation();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  useEffect(() => { fetchEstimations(); }, []);

  const filtered = estimations.filter(p =>
    p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.customer_name && p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="el-root fade-in">

      {/* ══ PAGE HEADER ═══════════════════════════════════════════ */}
      <div className="el-page-header">
        <div>
          <h1 className="el-page-title">Projects</h1>
          <p className="el-page-sub">
            Manage and track your fabrication estimations
          </p>
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
            <button
              className={`el-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List size={15} />
            </button>
            <button
              className={`el-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
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
              {searchTerm
                ? `No results for "${searchTerm}". Try a different search.`
                : 'Create your first estimation to get started.'}
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
                  <th style={{ width: 90 }}>ID</th>
                  <th>Project Name</th>
                  <th>Customer</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th>Engineer</th>
                  <th style={{ width: 120 }}>Due Date</th>
                  <th style={{ width: 120 }}>Timeline</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st = getStatus(p.status);
                  return (
                    <motion.tr
                      key={p.id}
                      className="el-table-row"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate('/project-info?id=' + p.id)}
                    >
                      <td>
                        <span className="el-id-chip">
                          #{p.id.toString().slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="el-td-name">{p.projectName}</td>
                      <td className="el-td-muted">{p.customer_name || '—'}</td>
                      <td>
                        <span
                          className="el-status-pill"
                          style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="el-td-muted">{p.engineerId || '—'}</td>
                      <td className="el-td-date">
                        {p.dueDate ? format(new Date(p.dueDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td><DaysLeftBadge dueDate={p.dueDate} /></td>
                      <td>
                        <button
                          className="el-row-cta"
                          id={`btn-open-${p.id}`}
                          onClick={e => { e.stopPropagation(); navigate('/project-info?id=' + p.id); }}
                        >
                          <ChevronRight size={15} />
                        </button>
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
                  className="el-grid-card"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate('/project-info?id=' + p.id)}
                >
                  <div className="el-grid-top">
                    <span className="el-id-chip">#{p.id.toString().slice(-6).toUpperCase()}</span>
                    <span
                      className="el-status-pill"
                      style={{ color: st.color, background: st.bg, borderColor: `${st.color}25` }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="el-grid-name">{p.projectName}</div>
                  <div className="el-grid-customer">{p.customer_name || 'No customer assigned'}</div>
                  <div className="el-grid-footer">
                    <span className="el-grid-eng">{p.engineerId || 'Unassigned'}</span>
                    {daysLeft !== null && (
                      <DaysLeftBadge dueDate={p.dueDate} />
                    )}
                  </div>
                  <button className="el-grid-open" id={`btn-grid-open-${p.id}`}>
                    <ArrowUpRight size={14} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
