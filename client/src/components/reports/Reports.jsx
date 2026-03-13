// src/components/reports/Reports.jsx
import React, { useState } from 'react';

const REPORT_TYPES = [
  { id: 'material-takeoff', icon: '📦', title: 'Material Takeoff', desc: 'Complete bill of materials for all configured items', status: 'Available' },
  { id: 'estimate-summary', icon: '📐', title: 'Estimate Summary', desc: 'High-level summary of all estimation modules', status: 'Available' },
  { id: 'fabrication',      icon: '🏭', title: 'Fabrication Report', desc: 'Detailed fabrication specifications and cut lists', status: 'Coming Soon' },
  { id: 'structural-db',    icon: '🗄', title: 'Structural Database', desc: 'Shape and section property reference report', status: 'Coming Soon' },
  { id: 'cost-estimate',    icon: '💰', title: 'Cost Estimate', desc: 'Pricing breakdown by assembly and component', status: 'Coming Soon' },
  { id: 'submittal',        icon: '📋', title: 'Submittal Package', desc: 'Complete project submittal documentation', status: 'Coming Soon' },
];

const SAMPLE_ROWS = [
  { module: 'Stair & Railings', items: 'Stair 1', count: 1, lf: '22.5', area: '—',   notes: 'Pan plate, welded, primer' },
  { module: 'Stair & Railings', items: 'Guard Rail', count: 2, lf: '45.0', area: '—', notes: 'Bolted to stringer, galvanized' },
  { module: 'Stair & Railings', items: 'Landing',    count: 1, lf: '—',    area: '48 ft²', notes: 'Pan platform ≤ 8 ft' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('estimate-summary');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">📊 Reports &amp; Export</h1>
            <p className="page-subtitle">Generate and export project estimates, material takeoffs, and fabrication documents</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="header-btn header-btn-outline" id="export-pdf">📄 Export PDF</button>
            <button className="header-btn header-btn-accent"  id="export-excel">📊 Export Excel</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>

        {/* ── Report List ──────────────────────────────────────────── */}
        <div className="eng-card" style={{ height: 'fit-content' }}>
          <div className="eng-card-header">
            <span className="eng-card-title">Report Types</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {REPORT_TYPES.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                id={`report-${r.id}`}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedReport === r.id ? 'var(--color-primary-50)' : 'transparent',
                  borderLeft: `3px solid ${selectedReport === r.id ? 'var(--color-primary-500)' : 'transparent'}`,
                  transition: 'all var(--transition)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: selectedReport === r.id ? 'var(--color-primary-700)' : 'var(--text-primary)' }}>
                    {r.icon} {r.title}
                  </span>
                  <span className={`info-chip ${r.status === 'Available' ? 'chip-green' : 'chip-gray'}`}
                        style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Report Preview ───────────────────────────────────────── */}
        <div>
          <div className="eng-card">
            <div className="eng-card-header">
              <span className="eng-card-title">📐 Estimate Summary — Preview</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="header-btn header-btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>🖨 Print</button>
                <button className="header-btn header-btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>📤 Export</button>
              </div>
            </div>

            {/* Report Header */}
            <div className="eng-card-body">
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                marginBottom: '20px',
                color: 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      SteelSpec Engineering Platform
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>Structural Estimate Report</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Sample Project — PRJ-2024-001</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                    <div>Generated: {new Date().toLocaleDateString()}</div>
                    <div style={{ marginTop: '4px' }}>Units: Imperial</div>
                    <div style={{ marginTop: '4px' }}>AISC Certified: Yes</div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { label: 'Total Stairs', value: '1',    sub: 'assemblies' },
                  { label: 'Linear Ft',    value: '67.5', sub: 'total railing' },
                  { label: 'Platform Area',value: '48',   sub: 'sq ft' },
                  { label: 'Components',   value: '5',    sub: 'total items' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="eng-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Item</th>
                      <th>Count</th>
                      <th>Linear Ft</th>
                      <th>Area</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ROWS.map((r, i) => (
                      <tr key={i}>
                        <td><span className="info-chip chip-blue" style={{ fontSize: '11px' }}>{r.module}</span></td>
                        <td style={{ fontWeight: 500 }}>{r.items}</td>
                        <td>{r.count}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.lf}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.area}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3D Viewer Placeholder */}
          <div className="eng-card" style={{ marginTop: '16px' }}>
            <div className="eng-card-header">
              <span className="eng-card-title">🎯 3D Structural Model</span>
              <span className="info-chip chip-amber">v2.0</span>
            </div>
            <div style={{
              height: '180px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '10px',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            }}>
              <span style={{ fontSize: '40px', opacity: 0.25 }}>🏗</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>3D Visualization — Coming in v2.0</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  Interactive structural model review and material takeoff
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
