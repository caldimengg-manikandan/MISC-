// src/pages/Reports/Reports.jsx
// GPT-style Reports Hub — complete redesign
// Logic is standalone; no estimation engine is touched.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Printer, BarChart2, Package,
  Factory, Database, DollarSign, Folder, Lock,
  ChevronRight, ExternalLink, CheckCircle, Clock,
  TrendingUp, Layers, Ruler, Hash
} from 'lucide-react';
import './Reports.css';

/* ─── Data ─────────────────────────────────────────────────────────── */
const REPORT_TYPES = [
  {
    id: 'estimate-summary',
    Icon: BarChart2,
    title: 'Estimate Summary',
    desc: 'High-level summary of all estimation modules',
    status: 'available',
    color: '#10a37f',
  },
  {
    id: 'material-takeoff',
    Icon: Package,
    title: 'Material Takeoff',
    desc: 'Complete bill of materials for all configured items',
    status: 'available',
    color: '#6366f1',
  },
  {
    id: 'fabrication',
    Icon: Factory,
    title: 'Fabrication Report',
    desc: 'Detailed fabrication specifications and cut lists',
    status: 'soon',
    color: '#f59e0b',
  },
  {
    id: 'structural-db',
    Icon: Database,
    title: 'Structural Database',
    desc: 'Shape and section property reference report',
    status: 'soon',
    color: '#0ea5e9',
  },
  {
    id: 'cost-estimate',
    Icon: DollarSign,
    title: 'Cost Estimate',
    desc: 'Pricing breakdown by assembly and component',
    status: 'soon',
    color: '#ec4899',
  },
  {
    id: 'submittal',
    Icon: Folder,
    title: 'Submittal Package',
    desc: 'Complete project submittal documentation',
    status: 'soon',
    color: '#8b5cf6',
  },
];

const SAMPLE_ROWS = [
  { module: 'Stair & Railings', item: 'Stair 1',    count: 1, lf: '22.5', area: '—',    notes: 'Pan plate, welded, primer',          type: 'stair' },
  { module: 'Stair & Railings', item: 'Guard Rail', count: 2, lf: '45.0', area: '—',    notes: 'Bolted to stringer, galvanized',     type: 'rail' },
  { module: 'Stair & Railings', item: 'Landing',    count: 1, lf: '—',    area: '48 ft²', notes: 'Pan platform ≤ 8 ft',              type: 'landing' },
];

const SUMMARY_STATS = [
  { Icon: Hash,      label: 'Total Stairs',    value: '1',    sub: 'assemblies' },
  { Icon: Ruler,     label: 'Linear Ft',       value: '67.5', sub: 'total railing' },
  { Icon: Layers,    label: 'Platform Area',   value: '48',   sub: 'sq ft' },
  { Icon: TrendingUp,label: 'Components',      value: '5',    sub: 'total items' },
];

const ROADMAP = [
  { Icon: Factory,   title: 'Fabrication Report',   eta: 'v2.1', desc: 'Shop drawings, cut lists, and weld specifications aligned to fabricator workflow.' },
  { Icon: Database,  title: 'Structural Database',  eta: 'v2.1', desc: 'Full AISC shape reference with weight, moment, and section modulus lookup.' },
  { Icon: DollarSign,title: 'Cost Estimate',        eta: 'v2.2', desc: 'Line-item pricing by assembly, subcontractor breakdown, and bid cover sheet.' },
  { Icon: Folder,    title: 'Submittal Package',    eta: 'v2.3', desc: 'Auto-compiled O&M documentation, approval stamp page, and revision tracking.' },
];

const TYPE_BADGE = { stair: 'Stair', rail: 'Rail', landing: 'Landing' };
const TYPE_COLOR = { stair: '#10a37f', rail: '#6366f1', landing: '#f59e0b' };

/* ─── Component ─────────────────────────────────────────────────────── */
export default function Reports() {
  const [selected, setSelected] = useState('estimate-summary');
  const selectedReport = REPORT_TYPES.find(r => r.id === selected);
  const isAvailable = selectedReport?.status === 'available';

  return (
    <div className="rp-root fade-in">

      {/* ══ PAGE HEADER ═════════════════════════════════════════════ */}
      <div className="rp-page-header">
        <div>
          <h1 className="rp-page-title">Reports &amp; Export</h1>
          <p className="rp-page-sub">
            Generate, preview and export project estimates, material takeoffs, and fabrication documents
          </p>
        </div>
        <div className="rp-header-actions">
          <button className="rp-btn rp-btn-outline" id="rp-print">
            <Printer size={14} /> Print
          </button>
          <button className="rp-btn rp-btn-outline" id="rp-export-pdf">
            <FileText size={14} /> Export PDF
          </button>
          <button className="rp-btn rp-btn-dark" id="rp-export-excel">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* ══ BODY: LEFT RAIL + RIGHT CANVAS ══════════════════════════ */}
      <div className="rp-body">

        {/* ── Left Rail ──────────────────────────────────────────── */}
        <aside className="rp-rail">
          <div className="rp-rail-heading">Report Types</div>
          {REPORT_TYPES.map(r => {
            const active = selected === r.id;
            return (
              <button
                key={r.id}
                id={`rp-type-${r.id}`}
                className={`rp-rail-item ${active ? 'active' : ''} ${r.status === 'soon' ? 'rp-rail-item-soon' : ''}`}
                onClick={() => setSelected(r.id)}
                style={{ '--item-color': r.color }}
              >
                <span className="rp-rail-icon" style={{ background: `${r.color}15`, color: r.color }}>
                  <r.Icon size={14} />
                </span>
                <span className="rp-rail-info">
                  <span className="rp-rail-title">{r.title}</span>
                  <span className="rp-rail-desc">{r.desc}</span>
                </span>
                {r.status === 'available'
                  ? <span className="rp-badge rp-badge-green">Available</span>
                  : <span className="rp-badge rp-badge-gray"><Lock size={9} /> Soon</span>
                }
              </button>
            );
          })}
        </aside>

        {/* ── Right Canvas ───────────────────────────────────────── */}
        <div className="rp-canvas">
          <AnimatePresence mode="wait">
            {isAvailable ? (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >

                {/* ── Report Header Card ────────────────────────── */}
                <div className="rp-report-card">

                  {/* Dark Hero Banner */}
                  <div className="rp-hero-banner">
                    <div className="rp-hero-left">
                      <div className="rp-hero-tag">
                        <CheckCircle size={11} /> MISC Engineering Platform
                      </div>
                      <div className="rp-hero-title">Structural Estimate Report</div>
                      <div className="rp-hero-sub">Sample Project — PRJ-2024-001</div>
                    </div>
                    <div className="rp-hero-right">
                      <div className="rp-hero-meta-row">
                        <span>Generated</span>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="rp-hero-meta-row">
                        <span>Units</span>
                        <span>Imperial</span>
                      </div>
                      <div className="rp-hero-meta-row">
                        <span>AISC Certified</span>
                        <span className="rp-hero-yes">Yes ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Stat Strip */}
                  <div className="rp-stat-strip">
                    {SUMMARY_STATS.map((s, i) => (
                      <motion.div
                        key={s.label}
                        className="rp-stat-tile"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <div className="rp-stat-icon"><s.Icon size={15} /></div>
                        <div className="rp-stat-value">{s.value}</div>
                        <div className="rp-stat-label">{s.label}</div>
                        <div className="rp-stat-sub">{s.sub}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ── Data Table ───────────────────────────────── */}
                <div className="rp-report-card" style={{ marginTop: 16 }}>
                  <div className="rp-section-header">
                    <span className="rp-section-title">Material Schedule</span>
                    <span className="rp-section-count">{SAMPLE_ROWS.length} items</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="rp-table">
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Item</th>
                          <th>Count</th>
                          <th>Linear Ft</th>
                          <th>Area</th>
                          <th>Notes</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {SAMPLE_ROWS.map((r, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.06 + 0.2 }}
                          >
                            <td>
                              <span
                                className="rp-module-tag"
                                style={{
                                  background: `${TYPE_COLOR[r.type]}12`,
                                  color: TYPE_COLOR[r.type],
                                  borderColor: `${TYPE_COLOR[r.type]}30`,
                                }}
                              >
                                {r.module}
                              </span>
                            </td>
                            <td className="rp-td-bold">{r.item}</td>
                            <td className="rp-td-num">{r.count}</td>
                            <td className="rp-td-num">{r.lf}</td>
                            <td className="rp-td-num">{r.area}</td>
                            <td className="rp-td-muted">{r.notes}</td>
                            <td>
                              <button className="rp-row-btn">
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── 3D Viz Placeholder ───────────────────────── */}
                <div className="rp-report-card rp-viz-card" style={{ marginTop: 16 }}>
                  <div className="rp-section-header">
                    <span className="rp-section-title">3D Structural Model</span>
                    <span className="rp-badge rp-badge-amber">v2.0</span>
                  </div>
                  <div className="rp-viz-area">
                    <div className="rp-viz-grid" />
                    <div className="rp-viz-content">
                      <span className="rp-viz-icon">🏗</span>
                      <div className="rp-viz-title">3D Visualization — Coming in v2.0</div>
                      <div className="rp-viz-sub">
                        Interactive structural model review and material takeoff
                      </div>
                      <button className="rp-btn rp-btn-ghost" id="rp-notify">
                        <Clock size={13} /> Notify me when ready
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              /* ── Coming Soon Panel ─────────────────────────── */
              <motion.div
                key={selected + '-soon'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <div className="rp-report-card rp-soon-panel">
                  <div className="rp-soon-lock">
                    <Lock size={28} />
                  </div>
                  <h2 className="rp-soon-title">{selectedReport?.title}</h2>
                  <p className="rp-soon-desc">{selectedReport?.desc}</p>
                  <div className="rp-soon-eta">
                    <Clock size={12} /> Planned for a future release
                  </div>
                  <button className="rp-btn rp-btn-outline" id={`rp-${selected}-notify`} style={{ marginTop: 20 }}>
                    Notify me when available
                  </button>
                </div>

                {/* Roadmap */}
                <div style={{ marginTop: 20 }}>
                  <div className="rp-roadmap-heading">What's Coming</div>
                  <div className="rp-roadmap-grid">
                    {ROADMAP.map((r, i) => (
                      <motion.div
                        key={r.title}
                        className="rp-roadmap-card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div className="rp-roadmap-icon">
                          <r.Icon size={16} />
                        </div>
                        <div className="rp-roadmap-body">
                          <div className="rp-roadmap-title">{r.title}</div>
                          <div className="rp-roadmap-desc">{r.desc}</div>
                        </div>
                        <span className="rp-badge rp-badge-gray">{r.eta}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ FLOATING EXPORT BAR ═════════════════════════════════════ */}
      {isAvailable && (
        <motion.div
          className="rp-fab"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 24 }}
        >
          <div className="rp-fab-info">
            <span className="rp-fab-label">Ready to export</span>
            <span className="rp-fab-name">{selectedReport?.title}</span>
          </div>
          <button className="rp-fab-btn rp-fab-print" id="rp-fab-print">
            <Printer size={14} /> Print
          </button>
          <button className="rp-fab-btn rp-fab-pdf" id="rp-fab-pdf">
            <FileText size={14} /> PDF
          </button>
          <button className="rp-fab-btn rp-fab-excel" id="rp-fab-excel">
            <Download size={14} /> Excel
          </button>
          <button className="rp-fab-btn rp-fab-share" id="rp-fab-share">
            <ExternalLink size={14} /> Share
          </button>
        </motion.div>
      )}
    </div>
  );
}
