// client/src/components/library/AuditLogViewer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditLog } from '../../api/libraryApi';
import {
  Clock, RefreshCw, AlertCircle, FileSpreadsheet,
  Edit2, Trash2, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';

const ACTION_CONFIG = {
  MANUAL_EDIT: { label: 'Edited',   icon: <Edit2 size={11} />,           color: '#10a37f',  bg: 'rgba(16,163,127,0.1)'  },
  DELETE:      { label: 'Deleted',  icon: <Trash2 size={11} />,          color: '#ef4444',  bg: 'rgba(239,68,68,0.1)'   },
  IMPORT:      { label: 'Imported', icon: <FileSpreadsheet size={11} />, color: '#6366f1',  bg: 'rgba(99,102,241,0.1)'  },
  DOWNLOAD:    { label: 'Download', icon: <Download size={11} />,        color: '#f59e0b',  bg: 'rgba(245,158,11,0.1)'  },
};

const CATEGORY_LABELS = {
  finish_option: 'Finish Options', stringer_size: 'Stringer Sizes',
  guard_rail_type: 'Guard Rail', wall_rail_type: 'Wall Rail',
  grab_rail_type: 'Grab Rail', cane_rail_type: 'Cane Rail',
  stair_type: 'Stair Types', grating_type: 'Grating & Tread',
  mounting_type: 'Mounting', connection_type: 'Connections',
  steel_grade_stair: 'Steel Grades (Stair)', steel_grade_rail: 'Steel Grades (Rail)',
};

const PAGE_SIZE = 15;

export default function AuditLogViewer({ filterModule }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState('');
  const [expanded, setExpanded] = useState(null); // audit_id

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLog({
        module: filterModule || '',
        action: filterAction,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterAction, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [filterModule, filterAction]);

  const formatDate = (dt) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dt; }
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      {/* Filter Bar */}
      <div className="lib-filter-bar">
        <select
          style={{ padding: '6px 10px', background: 'var(--lib-surface)', border: '1px solid var(--lib-border)', borderRadius: 6, color: 'var(--lib-text)', fontSize: 12, outline: 'none' }}
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <span className="lib-filter-info">{total} log entries</span>

        <button
          className="lib-btn lib-btn-ghost"
          onClick={load}
          style={{ marginLeft: 'auto' }}
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="lib-error-banner" style={{ margin: '12px 20px' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Log Table */}
      <div className="lib-table-wrap">
        <table className="lib-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}></th>
              <th>Category</th>
              <th>Action</th>
              <th>File / Notes</th>
              <th>Rows</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="lib-skeleton-row">
                  {Array.from({ length: 7 }, (__, j) => (
                    <td key={j}><div className="lib-skeleton-cell" style={{ width: `${50 + (j * 10) % 40}%` }} /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="lib-empty">
                    <div className="lib-empty-icon"><Clock size={22} /></div>
                    <div className="lib-empty-title">No audit logs yet</div>
                    <div className="lib-empty-desc">Activity in the Library Hub will appear here.</div>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const action = ACTION_CONFIG[log.action] || { label: log.action, icon: null, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                const isExpanded = expanded === log.audit_id;
                return (
                  <React.Fragment key={log.audit_id}>
                    <tr
                      onClick={() => toggleExpand(log.audit_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--lib-text-muted)', fontSize: 10 }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>
                          {CATEGORY_LABELS[log.module_name] || log.module_name}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                          color: action.color, background: action.bg, textTransform: 'uppercase', letterSpacing: 0.4,
                        }}>
                          {action.icon} {action.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--lib-text-dim)', fontSize: 11 }}>
                        {log.imported_filename || '—'}
                      </td>
                      <td>
                        {log.rows_affected > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            {log.rows_added > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(16,163,127,0.1)', color: '#10a37f' }}>+{log.rows_added}</span>}
                            {log.rows_updated > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>~{log.rows_updated}</span>}
                            {log.rows_skipped > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>✕{log.rows_skipped}</span>}
                          </div>
                        ) : <span style={{ color: 'var(--lib-text-muted)', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--lib-text-dim)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.created_by}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--lib-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(log.created_at)}
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && log.details && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 12px 12px 44px', background: 'rgba(255,255,255,0.015)' }}>
                          <pre style={{
                            fontSize: 11, color: '#94a3b8', margin: 0,
                            background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '8px 12px',
                            overflowX: 'auto', maxHeight: 160, fontFamily: 'Cascadia Code, monospace',
                          }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
          borderTop: '1px solid var(--lib-border)', flexShrink: 0,
          fontSize: 12, color: 'var(--lib-text-muted)',
        }}>
          <button
            className="lib-btn lib-btn-ghost lib-btn-icon"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={14} />
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            className="lib-btn lib-btn-ghost lib-btn-icon"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight size={14} />
          </button>
          <span style={{ marginLeft: 'auto' }}>{total} total entries</span>
        </div>
      )}

      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
