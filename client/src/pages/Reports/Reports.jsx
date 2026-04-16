// src/pages/Reports/Reports.jsx
// Live Report & BOM Excel — Full implementation
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Printer, ChevronDown, RefreshCw,
  Building2, User, MapPin, Calendar, Layers, DollarSign,
  Wrench, Package, BarChart2, AlertCircle, CheckCircle,
  ArrowRight, Hash, Ruler, TrendingUp, Clock, ChevronRight,
  Table, Zap, Shield
} from 'lucide-react';
import './Reports.css';

import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem('steel_token');

const apiFetch = (url, opts = {}) =>
  fetch(`${API_URL}${url}`, {
    ...opts,
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDollar = (v) =>
  typeof v === 'number' && v !== 0
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
    : '—';

const fmtNum = (v, d = 2) =>
  typeof v === 'number' && v !== 0 ? v.toFixed(d) : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Safety: flatten any {value,unit} object that slips through from the backend
const safe = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object' && 'value' in v) {
    const u = v.unit ? ` ${v.unit}` : '';
    return v.value !== '' && v.value !== null ? `${v.value}${u}` : '—';
  }
  return String(v);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, count, color = '#10a37f' }) {
  return (
    <div className="rpr-section-heading">
      <span className="rpr-section-icon" style={{ background: `${color}18`, color }}>
        <Icon size={14} />
      </span>
      <span className="rpr-section-title">{title}</span>
      {count !== undefined && <span className="rpr-section-count">{count} items</span>}
    </div>
  );
}

function MetaRow({ label, value, highlight }) {
  return (
    <div className="rpr-meta-row">
      <span className="rpr-meta-label">{label}</span>
      <span className={`rpr-meta-value ${highlight ? 'rpr-meta-highlight' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function StatTile({ label, value, sub, color = '#10a37f' }) {
  return (
    <div className="rpr-stat-tile">
      <div className="rpr-stat-value" style={{ color }}>{value}</div>
      <div className="rpr-stat-label">{label}</div>
      {sub && <div className="rpr-stat-sub">{sub}</div>}
    </div>
  );
}

function RatePill({ label, value }) {
  return (
    <div className="rpr-rate-pill">
      <span className="rpr-rate-label">{label}</span>
      <span className="rpr-rate-value">{value}</span>
    </div>
  );
}

// ─── Detail tables ────────────────────────────────────────────────────────────
function StairTable({ stairs }) {
  if (!stairs || stairs.length === 0) {
    return <div className="rpr-empty">No stair data found in this project.</div>;
  }
  return (
    <div className="rpr-table-wrap">
      <table className="rpr-table">
        <thead>
          <tr>
            <th>Stair</th>
            <th>Type</th>
            <th>Width</th>
            <th>Risers</th>
            <th>Connection</th>
            <th>Stringer</th>
            <th>Str. LF</th>
            <th>Pan (sqft)</th>
            <th>Steel lbs</th>
            <th>Scrap lbs</th>
            <th>Steel $</th>
            <th>Pans $</th>
            <th>Finish $</th>
            <th>Scrap $</th>
            <th>POR ROK</th>
            <th>Anchor $</th>
            <th>Shop Hrs</th>
            <th>Field Hrs</th>
            <th>Shop Labor $</th>
            <th>Field Labor $</th>
            <th>Sub-Mat $</th>
            <th>w/o Tax $</th>
            <th>Tax $</th>
            <th className="rpr-col-total">Total $</th>
            <th>$/Riser</th>
          </tr>
        </thead>
        <tbody>
          {stairs.map((st, i) => (
            <tr key={i} className={i % 2 === 0 ? 'rpr-row-alt' : ''}>
              <td className="rpr-td-bold">{safe(st.label)}</td>
              <td>{safe(st.stairType)}</td>
              <td>{safe(st.width)}</td>
              <td className="rpr-td-num">{st.risers}</td>
              <td>{safe(st.connection)}</td>
              <td className="rpr-td-muted rpr-text-sm">{safe(st.stringerSize)}</td>
              <td className="rpr-td-num">{fmtNum(st.stringerLFTotal)}</td>
              <td className="rpr-td-num">{fmtNum(st.panAreaSqFt)}</td>
              <td className="rpr-td-num">{fmtNum(st.stringerLbs)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtNum(st.scrapLbs)}</td>
              <td className="rpr-td-num">{fmtDollar(st.steelCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.pansCost || st.gratingCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.finishCost)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(st.scrapCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.porRokCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.anchorBoltsCost)}</td>
              <td className="rpr-td-num">{fmtNum(st.shopHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtNum(st.fieldHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtDollar(st.shopLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.fieldLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(st.subTotalMaterial)}</td>
              <td className="rpr-td-num">{fmtDollar(st.subTotalWithoutTax)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(st.taxAmount)}</td>
              <td className="rpr-td-num rpr-col-total rpr-td-bold">{fmtDollar(st.total)}</td>
              <td className="rpr-td-num rpr-col-accent">{fmtDollar(st.pricePerRiser)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RailTable({ rails }) {
  if (!rails || rails.length === 0) {
    return <div className="rpr-empty">No rail data found in this project.</div>;
  }
  return (
    <div className="rpr-table-wrap">
      <table className="rpr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Rail Type</th>
            <th>Stair Ref</th>
            <th>Mounting</th>
            <th>Length ft</th>
            <th>Posts</th>
            <th>Spacing</th>
            <th>Finish</th>
            <th>lbs/LF</th>
            <th>Steel lbs</th>
            <th>Scrap lbs</th>
            <th>Steel $</th>
            <th>Scrap $</th>
            <th>Finish $</th>
            <th>POR ROK</th>
            <th>Anchor $</th>
            <th>Shop Hrs</th>
            <th>Field Hrs</th>
            <th>Shop Labor $</th>
            <th>Field Labor $</th>
            <th>Sub-Mat $</th>
            <th>w/o Tax $</th>
            <th>Tax $</th>
            <th className="rpr-col-total">Total $</th>
          </tr>
        </thead>
        <tbody>
          {rails.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'rpr-row-alt rpr-row-rail' : 'rpr-row-rail'}>
              <td className="rpr-td-num rpr-td-muted">{r.index}</td>
              <td className="rpr-td-bold rpr-text-sm">{r.label}</td>
              <td className="rpr-td-muted">{r.stairRef}</td>
              <td>
                <span className={`rpr-mounting-badge rpr-mount-${(r.mountingType || '').toLowerCase().replace(/\s+/g,'')}`}>
                  {r.mountingType || '—'}
                </span>
              </td>
              <td className="rpr-td-num">{fmtNum(r.length)}</td>
              <td className="rpr-td-num">{r.postQty || '—'}</td>
              <td className="rpr-td-num rpr-td-muted">{fmtNum(r.postSpacing)}</td>
              <td className="rpr-td-muted rpr-text-sm">{r.finish}</td>
              <td className="rpr-td-num">{fmtNum(r.steelLbsPerLF, 3)}</td>
              <td className="rpr-td-num">{fmtNum(r.weight)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtNum(r.scrapLbs)}</td>
              <td className="rpr-td-num">{fmtDollar(r.steelCost)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(r.scrapCost)}</td>
              <td className="rpr-td-num">{fmtDollar(r.finishCost)}</td>
              <td className="rpr-td-num">{fmtDollar(r.porRokCost)}</td>
              <td className="rpr-td-num">{fmtDollar(r.anchorBoltsCost)}</td>
              <td className="rpr-td-num">{fmtNum(r.shopHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtNum(r.fieldHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtDollar(r.shopLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(r.fieldLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(r.subTotalMaterial)}</td>
              <td className="rpr-td-num">{fmtDollar(r.subTotalWithoutTax)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(r.taxAmount)}</td>
              <td className="rpr-td-num rpr-col-total rpr-td-bold">{fmtDollar(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlatformTable({ platforms }) {
  if (!platforms || platforms.length === 0) {
    return <div className="rpr-empty">No platform / landing data configured for this project.</div>;
  }
  return (
    <div className="rpr-table-wrap">
      <table className="rpr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Platform Type</th>
            <th>Stair Ref</th>
            <th>L × W (ft)</th>
            <th>Area (sqft)</th>
            <th>Finish</th>
            <th>lbs/SF</th>
            <th>Steel lbs</th>
            <th>Scrap lbs</th>
            <th>Steel $</th>
            <th>Scrap $</th>
            <th>Finish $</th>
            <th>Mounting $</th>
            <th>Shop Hrs</th>
            <th>Field Hrs</th>
            <th>Shop Labor $</th>
            <th>Field Labor $</th>
            <th>Sub-Mat $</th>
            <th>w/o Tax $</th>
            <th>Tax $</th>
            <th className="rpr-col-total">Total $</th>
          </tr>
        </thead>
        <tbody>
          {platforms.map((p, i) => (
            <tr key={i} className={i % 2 === 0 ? 'rpr-row-alt rpr-row-plat' : 'rpr-row-plat'}>
              <td className="rpr-td-muted">{p.index}</td>
              <td className="rpr-td-bold">{p.label}</td>
              <td className="rpr-td-muted">{p.stairRef}</td>
              <td className="rpr-td-num">{`${fmtNum(p.length)} × ${fmtNum(p.width)}`}</td>
              <td className="rpr-td-num">{fmtNum(p.area)}</td>
              <td className="rpr-td-muted rpr-text-sm">{p.finish}</td>
              <td className="rpr-td-num">{fmtNum(p.steelLbsPerSF, 3)}</td>
              <td className="rpr-td-num">{fmtNum(p.steelLbsTotal)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtNum(p.scrapLbs)}</td>
              <td className="rpr-td-num">{fmtDollar(p.steelCost)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(p.scrapCost)}</td>
              <td className="rpr-td-num">{fmtDollar(p.finishCost)}</td>
              <td className="rpr-td-num">{fmtDollar(p.mountingCost)}</td>
              <td className="rpr-td-num">{fmtNum(p.shopHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtNum(p.fieldHrsTotal, 3)}</td>
              <td className="rpr-td-num">{fmtDollar(p.shopLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(p.fieldLaborCost)}</td>
              <td className="rpr-td-num">{fmtDollar(p.subTotalMaterial)}</td>
              <td className="rpr-td-num">{fmtDollar(p.subTotalWithoutTax)}</td>
              <td className="rpr-td-num rpr-col-warn">{fmtDollar(p.taxAmount)}</td>
              <td className="rpr-td-num rpr-col-total rpr-td-bold">{fmtDollar(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [projects, setProjects]         = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [reportData, setReportData]     = useState(null);
  const [loading, setLoading]           = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError]               = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  const [exporting, setExporting]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load project list on mount
  useEffect(() => {
    setLoadingProjects(true);
    apiFetch('/api/reports/projects')
      .then(r => r.json())
      .then(d => {
        if (d.success) setProjects(d.projects || []);
        else setError('Failed to load projects');
      })
      .catch(() => setError('Network error — check server connection'))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Load live report when project selected
  const loadReport = useCallback((id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setReportData(null);
    apiFetch(`/api/reports/${id}/live`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setReportData(d);
        else setError(d.message || 'Failed to load report data');
      })
      .catch(() => setError('Failed to fetch report — server may be restarting'))
      .finally(() => setLoading(false));
  }, []);

  const handleProjectChange = (id) => {
    setSelectedId(id);
    setDropdownOpen(false);
    loadReport(id);
  };

  // Excel download
  const handleExcelExport = async () => {
    if (!selectedId) return;
    setExporting(true);
    try {
      const resp = await apiFetch(`/api/reports/${selectedId}/bom-excel`);
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM_${reportData?.project?.projectNumber || selectedId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Excel export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Print
  const handlePrint = () => window.print();

  const selectedProject = projects.find(p => String(p.id) === String(selectedId));
  const { project, rates, summary, stairs, rails, platforms } = reportData || {};

  const SECTIONS = [
    { id: 'summary',   label: 'Summary',   icon: BarChart2 },
    { id: 'stairs',    label: `Stairs (${stairs?.length || 0})`,   icon: Layers },
    { id: 'rails',     label: `Rails (${rails?.length || 0})`,     icon: Ruler },
    { id: 'platforms', label: `Platforms (${platforms?.length || 0})`, icon: Package },
  ];

  return (
    <div className="rpr-root">

      {/* ══ PAGE HEADER ═══════════════════════════════════════════════════════ */}
      <div className="rpr-page-header print-hide">
        <div className="rpr-page-header-left">
          <h1 className="rpr-page-title">Reports & Export</h1>
          <p className="rpr-page-sub">Live structural estimate report and BOM Excel generation</p>
        </div>

        {/* Project Selector */}
        <div className="rpr-selector-wrap">
          {loadingProjects ? (
            <div className="rpr-selector-loading">
              <RefreshCw size={13} className="spin" /> Loading projects…
            </div>
          ) : (
            <div className="rpr-selector-dropdown" id="rpr-project-selector">
              <button
                className="rpr-selector-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
              >
                <Building2 size={14} />
                <span>{selectedProject ? `${selectedProject.projectNumber} — ${selectedProject.projectName}` : 'Select a project…'}</span>
                <ChevronDown size={13} className={`rpr-chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.ul
                    className="rpr-dropdown-list"
                    initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                    transition={{ duration: 0.14 }}
                    style={{ originY: 'top' }}
                  >
                    {projects.length === 0 && (
                      <li className="rpr-dd-empty">No projects found</li>
                    )}
                    {projects.map(p => (
                      <li
                        key={p.id}
                        className={`rpr-dd-item ${String(p.id) === String(selectedId) ? 'active' : ''}`}
                        onClick={() => handleProjectChange(String(p.id))}
                        id={`rpr-project-${p.id}`}
                      >
                        <span className="rpr-dd-num">{p.projectNumber}</span>
                        <span className="rpr-dd-name">{p.projectName}</span>
                        <span className="rpr-dd-customer">{p.customer_name}</span>
                        <span className={`rpr-dd-status rpr-status-${(p.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="rpr-header-actions">
          <button className="rpr-btn rpr-btn-ghost" onClick={handlePrint} id="rpr-print" disabled={!reportData}>
            <Printer size={13} /> Print
          </button>
          <button
            className={`rpr-btn rpr-btn-excel ${exporting ? 'loading' : ''}`}
            onClick={handleExcelExport}
            id="rpr-export-excel"
            disabled={!reportData || exporting}
          >
            {exporting ? <RefreshCw size={13} className="spin" /> : <Download size={13} />}
            {exporting ? 'Generating…' : 'Export BOM Excel'}
          </button>
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="rpr-body">

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="rpr-error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ───────────────────────────────────────────────── */}
        {!selectedId && !loading && (
          <motion.div
            className="rpr-empty-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rpr-empty-icon"><BarChart2 size={40} /></div>
            <div className="rpr-empty-title">Select a project to generate the live report</div>
            <div className="rpr-empty-sub">
              Choose a project from the selector above. All stair, rail, and platform
              systemCalc values will be aggregated and displayed here.
            </div>
            <div className="rpr-empty-features">
              {['Live cost breakdown', '4-sheet BOM Excel', 'Print-ready layout', 'Rates snapshot'].map(f => (
                <span key={f} className="rpr-feature-pill"><CheckCircle size={11} /> {f}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Loading Skeleton ──────────────────────────────────────────── */}
        {loading && (
          <div className="rpr-skeleton-wrap">
            {[1, 2, 3].map(i => (
              <div key={i} className="rpr-skeleton-card">
                <div className="rpr-skeleton-line rpr-ske-title" />
                <div className="rpr-skeleton-line rpr-ske-body" />
                <div className="rpr-skeleton-line rpr-ske-body rpr-ske-short" />
              </div>
            ))}
          </div>
        )}

        {/* ── Report Content ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {reportData && !loading && (
            <motion.div
              key={selectedId}
              className="rpr-report-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >

              {/* ══ HERO BANNER ═══════════════════════════════════════════ */}
              <div className="rpr-hero">
                <div className="rpr-hero-left">
                  <div className="rpr-hero-tag">
                    <CheckCircle size={10} /> MISC Engineering Platform
                  </div>
                  <h2 className="rpr-hero-name">{project?.projectName}</h2>
                  <div className="rpr-hero-num">{project?.projectNumber}</div>
                  <div className="rpr-hero-customer">
                    <User size={11} /> {project?.customerName}
                  </div>
                </div>
                <div className="rpr-hero-right">
                  <div className="rpr-hero-metablock">
                    {[
                      ['Generated', fmtDate(new Date())],
                      ['Units', project?.units],
                      ['AISC Certified', project?.aiscCertified],
                      ['Location', project?.projectLocation],
                    ].map(([k, v]) => (
                      <div className="rpr-hero-metarow" key={k}>
                        <span>{k}</span>
                        <span className={k === 'AISC Certified' && v === 'Yes' ? 'rpr-hero-yes' : ''}>{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ══ STAT STRIP ════════════════════════════════════════════ */}
              <div className="rpr-stat-strip">
                <StatTile label="Grand Total"    value={fmtDollar(summary?.grandTotal)} color="#10a37f" />
                <StatTile label="Total Risers"   value={summary?.totalRisers || '—'} sub="across all stairs" />
                <StatTile label="Price / Riser"  value={fmtDollar(summary?.pricePerRiser)} color="#6366f1" />
                <StatTile label="Total Steel lbs" value={fmtNum(summary?.totalSteelLbs, 0)} sub="incl. scrap" />
                <StatTile label="Shop Hours"     value={fmtNum(summary?.shopHrsTotal, 1)} sub="total MH" color="#f59e0b" />
                <StatTile label="Field Hours"    value={fmtNum(summary?.fieldHrsTotal, 1)} sub="total MH" color="#ec4899" />
              </div>

              {/* ══ TWO-COL: HEADER + RATES ════════════════════════════════ */}
              <div className="rpr-two-col">
                {/* Section 1: Header / Project Metadata */}
                <div className="rpr-card">
                  <SectionHeading icon={Building2} title="1 — Report Header" color="#10a37f" />
                  <div className="rpr-meta-grid">
                    <MetaRow label="Project Number"   value={project?.projectNumber} />
                    <MetaRow label="Project Name"     value={project?.projectName} />
                    <MetaRow label="Customer"         value={project?.customerName} />
                    <MetaRow label="Project Location" value={project?.projectLocation} />
                    <MetaRow label="Architect"        value={project?.architect} />
                    <MetaRow label="EOR"              value={project?.eor} />
                    <MetaRow label="GC"               value={project?.gcName} />
                    <MetaRow label="Detailer / Vendor" value={`${project?.detailer || '—'} / ${project?.vendorName || '—'}`} />
                    <MetaRow label="Assigned Engineer" value={project?.assignedEngineer} />
                    <MetaRow label="Enquiry Date"     value={fmtDate(project?.enquiryDate)} />
                    <MetaRow label="Submission Deadline" value={fmtDate(project?.submissionDeadline)} />
                    <MetaRow label="AISC Certified"   value={project?.aiscCertified} highlight />
                    <MetaRow label="Units"            value={project?.units} />
                    {project?.notes && <MetaRow label="Notes" value={project.notes} />}
                  </div>
                </div>

                {/* Section 2: Rates Snapshot */}
                <div className="rpr-card">
                  <SectionHeading icon={DollarSign} title="2 — Rates Used" color="#6366f1" />
                  <p className="rpr-card-sub">Configuration active at time of estimate generation</p>
                  <div className="rpr-rates-grid">
                    <RatePill label="Steel $/lb"       value={`$${fmtNum(rates?.steelPerLb, 4)}`} />
                    <RatePill label="Shop $/hr"        value={`$${fmtNum(rates?.shopPerHr, 2)}`} />
                    <RatePill label="Field $/hr"       value={`$${fmtNum(rates?.fieldPerHr, 2)}`} />
                    <RatePill label="Galvanize $/lb"   value={`$${fmtNum(rates?.galvanizePerLb, 4)}`} />
                    <RatePill label="Powder Coat $/lb" value={`$${fmtNum(rates?.powderCoatPerLb, 4)}`} />
                    <RatePill label="Scrap %"          value={`${fmtNum(rates?.scrapPct, 1)}%`} />
                    <RatePill label="Tax %"            value={`${fmtNum(rates?.taxPct, 2)}%`} />
                    <RatePill label="Anchor Bolt Rate" value={`$${fmtNum(rates?.anchorBoltRate, 4)}/lb`} />
                    <RatePill label="Embedded Rate"    value={`$${fmtNum(rates?.embeddedRate, 2)}/post`} />
                    <RatePill label="Anchored Rate"    value={`$${fmtNum(rates?.anchoredRate, 2)}/post`} />
                  </div>
                </div>
              </div>

              {/* ══ SECTION 3: PROJECT SUMMARY TABLE ══════════════════════ */}
              <div className="rpr-card">
                <SectionHeading icon={BarChart2} title="3 — Project Summary" color="#10a37f" />
                <div className="rpr-table-wrap">
                  <table className="rpr-table rpr-summary-table">
                    <thead>
                      <tr>
                        <th>Line Item</th>
                        <th className="rpr-col-stair">Stair</th>
                        <th className="rpr-col-rail">Rail</th>
                        <th className="rpr-col-plat">Platform</th>
                        <th className="rpr-col-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Steel lbs (base)',       fmtNum(summary?.stairSteelLbs, 0), fmtNum(summary?.railSteelLbs, 0), fmtNum(summary?.platSteelLbs, 0), fmtNum(summary?.stairSteelLbs + summary?.railSteelLbs + summary?.platSteelLbs, 0)],
                        ['Scrap lbs',             '—','—','—', fmtNum(summary?.totalScrapLbs, 0)],
                        ['Steel cost',            '—','—','—', fmtDollar(summary?.baseSteelCost)],
                        ['Scrap cost',            '—','—','—', fmtDollar(summary?.scrapCost)],
                        ['Pans / Grating cost',   fmtDollar(summary?.pansCost + summary?.gratingCost), '—','—', fmtDollar(summary?.pansCost + summary?.gratingCost)],
                        ['Finish cost',           '—','—','—', fmtDollar(summary?.finishCost)],
                        ['POR ROK cost',          '—','—','—', fmtDollar(summary?.porRokCost)],
                        ['Anchor bolts cost',     '—','—','—', fmtDollar(summary?.anchorBoltsCost)],
                        ['Shop labor cost',       '—','—','—', fmtDollar(summary?.shopLaborCost)],
                        ['Field labor cost',      '—','—','—', fmtDollar(summary?.fieldLaborCost)],
                        ['Module sub-total',      fmtDollar(summary?.stairTotal), fmtDollar(summary?.railTotal), fmtDollar(summary?.platTotal), fmtDollar(summary?.stairTotal + summary?.railTotal + summary?.platTotal), 'bold'],
                        ['Sub-total w/o tax',     '—','—','—', fmtDollar(summary?.subtotalWithoutTax)],
                        ['Tax',                   '—','—','—', fmtDollar(summary?.taxAmount), 'warn'],
                        ['Grand Total',           '—','—','—', fmtDollar(summary?.grandTotal), 'grand'],
                        ['Total Risers',          String(summary?.totalRisers || '—'),'—','—', String(summary?.totalRisers || '—')],
                        ['Price / Riser',         '—','—','—', fmtDollar(summary?.pricePerRiser), 'accent'],
                      ].map(([label, stair, rail, plat, total, style], i) => (
                        <tr key={i} className={`
                          ${i % 2 === 0 ? 'rpr-row-alt' : ''}
                          ${style === 'grand' ? 'rpr-row-grand' : ''}
                          ${style === 'bold' ? 'rpr-row-bold' : ''}
                        `}>
                          <td className="rpr-td-label">{label}</td>
                          <td className="rpr-td-num rpr-col-stair">{stair}</td>
                          <td className="rpr-td-num rpr-col-rail">{rail}</td>
                          <td className="rpr-td-num rpr-col-plat">{plat}</td>
                          <td className={`rpr-td-num rpr-col-total ${style === 'warn' ? 'rpr-col-warn' : ''} ${style === 'accent' ? 'rpr-col-accent' : ''}`}>
                            {total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ══ SECTION TABS: Stair / Rail / Platform ════════════════ */}
              <div className="rpr-card rpr-detail-card">
                <div className="rpr-tabs print-hide">
                  {SECTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`rpr-tab ${activeSection === s.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(s.id)}
                      id={`rpr-tab-${s.id}`}
                    >
                      <s.icon size={12} /> {s.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.14 }}
                  >
                    {/* Hidden section labels for print */}
                    <div className="print-show rpr-print-section-label">
                      {activeSection === 'stairs' && '4 — Stair Sub-assemblies'}
                      {activeSection === 'rails' && '5 — Railing Sub-assemblies'}
                      {activeSection === 'platforms' && '6 — Platform / Landing Sub-assemblies'}
                    </div>

                    {activeSection === 'summary' && (
                      <div className="rpr-summary-features">
                        <div className="rpr-sf-item">
                          <Layers size={16} style={{ color: '#10a37f' }} />
                          <span><strong>{stairs?.length || 0}</strong> stair assemblies</span>
                        </div>
                        <div className="rpr-sf-item">
                          <Ruler size={16} style={{ color: '#6366f1' }} />
                          <span><strong>{rails?.length || 0}</strong> rail sections (guard, wall, grab, cane, kick)</span>
                        </div>
                        <div className="rpr-sf-item">
                          <Package size={16} style={{ color: '#f59e0b' }} />
                          <span><strong>{platforms?.length || 0}</strong> platform / landing assemblies</span>
                        </div>
                        <div className="rpr-sf-item">
                          <Zap size={16} style={{ color: '#ec4899' }} />
                          <span>Click a tab above to drill into sub-assembly details</span>
                        </div>
                      </div>
                    )}
                    {activeSection === 'stairs'    && <StairTable stairs={stairs} />}
                    {activeSection === 'rails'     && <RailTable rails={rails} />}
                    {activeSection === 'platforms' && <PlatformTable platforms={platforms} />}
                  </motion.div>
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ FLOATING ACTION BAR ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {reportData && (
          <motion.div
            className="rpr-fab print-hide"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
          >
            <div className="rpr-fab-info">
              <span className="rpr-fab-label">Ready to export</span>
              <span className="rpr-fab-name">{project?.projectNumber} — {project?.projectName}</span>
            </div>
            <button className="rpr-fab-btn rpr-fab-print" onClick={handlePrint} id="rpr-fab-print">
              <Printer size={13} /> Print
            </button>
            <button
              className={`rpr-fab-btn rpr-fab-excel ${exporting ? 'loading' : ''}`}
              onClick={handleExcelExport}
              id="rpr-fab-excel"
              disabled={exporting}
            >
              {exporting ? <RefreshCw size={13} className="spin" /> : <Download size={13} />}
              {exporting ? 'Generating…' : 'BOM Excel'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
