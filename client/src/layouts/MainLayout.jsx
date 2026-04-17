// client/src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEstimation } from '../contexts/EstimationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, ChevronRight, BarChart3,
  PanelLeftOpen, PanelLeftClose, PenLine, Search,
  Box, Database, ArrowUpDown, ChevronDown, Settings,
  HelpCircle, Share2, Save, Pin, DollarSign,
  Zap, Users, Printer, FileSpreadsheet
} from 'lucide-react';
import ProjectContextMenu from '../components/ProjectContextMenu';
import ProfileContextMenu from '../components/ProfileContextMenu';
import ToolsDock from '../modules/Stair/components/ToolsDock';
import StickyNote from '../modules/Stair/components/StickyNote';
import NotificationBell from '../components/notifications/NotificationBell';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

// ── Navigation definition ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} />,
    path: '/dashboard',
  },
  {
    id: 'estimations',
    label: 'Projects',
    icon: <FolderOpen size={16} />,
    path: '/estimations',
  },
  {
    id: 'estimate',
    label: 'New Estimation',
    icon: <PenLine size={16} />,
    path: '/project-info',
    children: [
      { id: 'stair-railings', label: 'Stair & Railings', icon: <Box size={13} />, path: '/estimate/stair-railings' },
      { id: 'railings', label: 'Railings', icon: <Database size={13} />, path: '/estimate/railings' },
      { id: 'ladders', label: 'Ladders', icon: <ArrowUpDown size={13} />, path: '/estimate/ladders' },
      { id: 'bollards', label: 'Bollards & Gates', icon: <Box size={13} />, path: '/estimate/bollards' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={16} />,
    path: '/reports',
  },

  {
    id: 'settings',
    label: 'Config & Settings',
    icon: <Settings size={16} />,
    path: null,
    adminOnly: false, // filtered per-child below
    children: [
      { id: 'pricing', label: 'Pricing Rates', icon: <DollarSign size={13} />, path: '/settings/pricing', adminOnly: true },
      { id: 'customers', label: 'Customer Master', icon: <Users size={13} />, path: '/settings/customers', adminOnly: true },
      { id: 'system', label: 'System Admin', icon: <Database size={13} />, path: '/settings/system', adminOnly: true },
      { id: 'personalization', label: 'Personalization', icon: <Zap size={13} />, path: '/settings/personalization', adminOnly: false },
    ]
  },
];

// ── SubMenu ───────────────────────────────────────────────────────────────────
const SubMenu = ({ items, activePath, onNavigate }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.18, ease: 'easeInOut' }}
    style={{ overflow: 'hidden' }}
    className="sidebar-submenu"
  >
    {items.map(item => (
      <button
        key={item.path}
        className={`sidebar-item sidebar-sub-item ${activePath === item.path ? 'active' : ''}`}
        onClick={() => onNavigate(item.path)}
      >
        <span className="sidebar-item-icon">{item.icon}</span>
        <span className="sidebar-item-label">{item.label}</span>
      </button>
    ))}
  </motion.div>
);

// ── Sidebar Project Item Renderer ─────────────────────────────────────────────
const SidebarProjectRenderer = ({ p, navigate, isRecent = false, useEstimation }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(p.projectName || '');
  const { saveEstimationData } = useEstimation();

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameValue.trim() || renameValue === p.projectName) {
      setIsRenaming(false);
      return;
    }
    const renameToast = toast.loading('Renaming...');
    try {
      await saveEstimationData(p.id, { projectName: renameValue });
      toast.success('Project renamed!', { id: renameToast });
      setIsRenaming(false);
    } catch (err) {
      toast.error('Failed to rename project', { id: renameToast });
    }
  };

  return (
    <div
      className={isRecent ? "sidebar-recent-item" : "sidebar-project-item"}
      onClick={() => { if (!isRenaming) navigate('/project-info?id=' + p.id); }}
      title={p.projectName}
    >
      {!isRecent && <span className="sidebar-project-dot" />}

      {isRenaming ? (
        <form onSubmit={handleRenameSubmit} style={{ flex: 1, marginRight: 8 }} onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            className="px-1 py-0.5 text-xs text-white bg-[#40414f] border border-[#10a37f] rounded"
            style={{ width: '100%', outline: 'none' }}
          />
        </form>
      ) : (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {p.projectName || `Project ${String(p.id).slice(-4)}`}
          {p.isPinned && <Pin size={10} style={{ opacity: 0.6, flexShrink: 0 }} />}
        </span>
      )}

      {/* The floating action dropdown */}
      <ProjectContextMenu
        project={p}
        isPinned={p.isPinned}
        onRenameStart={() => setIsRenaming(true)}
      />
    </div>
  );
};

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { estimations, fetchEstimations, notes, fetchNotes, selectedEstimation, setSelectedEstimation, activeContext } = useEstimation();

  const [collapsed, setCollapsed] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(
    location.pathname.startsWith('/estimate')
  );
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const API = API_BASE_URL;
  const getToken = () => localStorage.getItem('steel_token');

  const currentProjectId = selectedEstimation?.id;

  const handleExcelExport = async () => {
    if (!currentProjectId) { toast.error('No project loaded — open a project first.'); return; }
    setExportMenuOpen(false);
    setExporting(true);
    const t = toast.loading('Generating BOM Excel…');
    try {
      const resp = await fetch(`${API}/api/reports/${currentProjectId}/bom-excel`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `BOM_${currentProjectId}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('BOM Excel downloaded!', { id: t });
    } catch (e) {
      toast.error('Export failed: ' + e.message, { id: t });
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!currentProjectId) { toast.error('No project loaded — open a project first.'); return; }
    setExportMenuOpen(false);
    const t = toast.loading('Preparing print preview…');
    try {
      const resp = await fetch(`${API}/api/reports/${currentProjectId}/live`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);
      openPrintWindow(data);
      toast.success('Print preview ready!', { id: t });
    } catch (e) {
      toast.error('Print failed: ' + e.message, { id: t });
    }
  };

  const openPrintWindow = (data) => {
    const { project, rates, summary, stairs, rails, platforms } = data;
    const f = (v) => (typeof v === 'number' && v !== 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : (v ?? '—'));
    const n = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '—');
    const tableRow = (cells, isHeader = false) => {
      const tag = isHeader ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag} style="padding:4px 8px;border:1px solid #d1d5db;font-size:9px;white-space:nowrap">${c ?? '—'}</${tag}>`).join('')}</tr>`;
    };
    const stairRows = (stairs || []).map(st => tableRow([
      st.label, st.stairType, st.width, st.risers, st.connection, st.stringerSize,
      n(st.stringerLFTotal), n(st.panAreaSqFt), n(st.stringerLbs), n(st.scrapLbs),
      f(st.steelCost), f(st.pansCost), f(st.finishCost), f(st.scrapCost),
      f(st.porRokCost), f(st.anchorBoltsCost), n(st.shopHrsTotal,3), n(st.fieldHrsTotal,3),
      f(st.shopLaborCost), f(st.fieldLaborCost), f(st.subTotalWithoutTax), f(st.taxAmount),
      `<strong>${f(st.total)}</strong>`, f(st.pricePerRiser)
    ])).join('');
    const railRows = (rails || []).map(r => tableRow([
      r.index, r.label, r.stairRef, r.mountingType, n(r.length), r.postQty,
      f(r.steelCost), f(r.scrapCost), f(r.finishCost), f(r.porRokCost), f(r.anchorBoltsCost),
      n(r.shopHrsTotal,3), n(r.fieldHrsTotal,3), f(r.shopLaborCost), f(r.fieldLaborCost),
      f(r.subTotalWithoutTax), f(r.taxAmount), `<strong>${f(r.total)}</strong>`
    ])).join('');
    const platRows = (platforms || []).map(p => tableRow([
      p.index, p.label, p.stairRef, n(p.area), p.finish,
      f(p.steelCost), f(p.finishCost), f(p.mountingCost),
      n(p.shopHrsTotal,3), n(p.fieldHrsTotal,3), f(p.shopLaborCost), f(p.fieldLaborCost),
      f(p.subTotalWithoutTax), f(p.taxAmount), `<strong>${f(p.total)}</strong>`
    ])).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Estimate — ${project?.projectNumber || 'Report'}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 10px; color: #111; background: #fff; padding: 20px 24px; }
  h1 { font-size: 18px; color: #1a1a2e; margin-bottom: 4px; }
  h2 { font-size: 11px; font-weight: 700; color: #10a37f; margin: 18px 0 6px;
       border-bottom: 1.5px solid #10a37f; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  /* Project hero */
  .hero { display: flex; justify-content: space-between; align-items: flex-start; margin: 8px 0 16px;
          padding-bottom: 12px; border-bottom: 2px solid #1a1a2e; }
  .hero-left .pname { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .hero-left .pnum  { font-family: monospace; color: #10a37f; font-size: 11px; margin-top: 2px; }
  .hero-left .pcust { color: #64748b; font-size: 10px; margin-top: 3px; }
  .hero-right { text-align: right; font-size: 9px; color: #64748b; line-height: 1.8; }
  /* Meta grid */
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; margin-bottom: 4px; }
  .meta-row { display: flex; gap: 8px; padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
  .ml { color: #64748b; font-size: 9px; width: 130px; flex-shrink: 0; }
  .mv { font-size: 9px; font-weight: 600; color: #1e293b; }
  /* Rate pills */
  .rate-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 5px; }
  .rate-pill { background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 5px; padding: 5px 8px; }
  .rate-label { font-size: 8px; color: #64748b; }
  .rate-val   { font-weight: 700; font-size: 10px; color: #065f46; }
  /* Tables */
  table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
  th { background: #10a37f; color: #fff; font-size: 8.5px; font-weight: 700;
       padding: 5px 8px; text-align: left; white-space: nowrap; }
  td { font-size: 8.5px; padding: 4px 8px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  tr:nth-child(even) td { background: #f8fafc; }
  .grand td { background: #ecfdf5 !important; font-weight: 700; color: #065f46; }
  /* Print */
  @media print {
    @page { margin: 12mm 15mm; }
    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h2 { break-after: avoid; page-break-after: avoid; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; break-inside: auto; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .page-section { 
      display: inline-block; 
      width: 100%;
      break-inside: avoid-page !important; 
      page-break-inside: avoid !important;
      margin-bottom: 30px; 
      position: relative;
    }
  }
  /* Print button (screen-only) */
  .print-btn {
    position: fixed; top: 16px; right: 16px;
    background: #10a37f; color: white; border: none; border-radius: 8px;
    padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 12px rgba(16,163,127,0.3); z-index: 999;
  }
  .print-btn:hover { background: #0e8f6e; }
  @media print { .print-btn { display: none !important; } }
</style>
</head><body>
<button class="print-btn" onclick="window.print()">&#128438; Print / Save PDF</button>
<h1>MISC Engineering — Structural Estimate</h1>
<div class="hero">
  <div class="hero-left">
    <div class="pname">${project?.projectName || '—'}</div>
    <div class="pnum">${project?.projectNumber || '—'}</div>
    <div class="pcust">${project?.customerName || '—'}</div>
  </div>
  <div class="hero-right">
    <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
    <div><strong>AISC:</strong> ${project?.aiscCertified || '—'}</div>
    <div><strong>Units:</strong> ${project?.units || 'Imperial'}</div>
    <div><strong>Engineer:</strong> ${project?.assignedEngineer || '—'}</div>
  </div>
</div>
<div class="page-section">
  <h2>1 — Project Header</h2>
  <div class="meta-grid">
    ${[['Project Number', project?.projectNumber], ['Location', project?.projectLocation],
       ['Customer', project?.customerName],       ['Architect', project?.architect],
       ['EOR', project?.eor],                      ['GC', project?.gcName],
       ['Detailer', project?.detailer],            ['Vendor', project?.vendorName],
       ['Enquiry Date', project?.enquiryDate ? new Date(project.enquiryDate).toLocaleDateString() : '—'],
       ['Submission Deadline', project?.submissionDeadline ? new Date(project.submissionDeadline).toLocaleDateString() : '—']]
      .map(([l,v]) => `<div class="meta-row"><span class="ml">${l}</span><span class="mv">${v || '—'}</span></div>`).join('')}
  </div>
</div>
<div class="page-section">
  <h2>2 — Rates Snapshot</h2>
  <div class="rate-grid">
    ${[['Steel $/lb','$'+n(rates?.steelPerLb,4)], ['Shop $/hr','$'+n(rates?.shopPerHr,2)],
       ['Field $/hr','$'+n(rates?.fieldPerHr,2)], ['Galvanize $/lb','$'+n(rates?.galvanizePerLb,4)],
       ['Powder Coat $/lb','$'+n(rates?.powderCoatPerLb,4)], ['Scrap %',n(rates?.scrapPct,1)+'%'],
       ['Tax %',n(rates?.taxPct,2)+'%'], ['Anchor Bolt','$'+n(rates?.anchorBoltRate,4)],
       ['Embedded Rate','$'+n(rates?.embeddedRate,2)], ['Anchored Rate','$'+n(rates?.anchoredRate,2)]]
      .map(([l,v]) => `<div class="rate-pill"><div class="rate-label">${l}</div><div class="rate-val">${v}</div></div>`).join('')}
  </div>
</div>
<div class="page-section">
  <h2>3 — Project Summary</h2>
  <table><thead>${tableRow(['Line Item','Stair','Rail','Platform','Total'],true)}</thead><tbody>
  ${[['Steel lbs (base)', n(summary?.stairSteelLbs,0), n(summary?.railSteelLbs,0), n(summary?.platSteelLbs,0), n(summary?.stairSteelLbs + summary?.railSteelLbs + summary?.platSteelLbs,0)],
     ['Scrap lbs', '—', '—', '—', n(summary?.totalScrapLbs,0)],
     ['Steel Cost', '—', '—', '—', f(summary?.baseSteelCost)],
     ['Scrap Cost', '—', '—', '—', f(summary?.scrapCost)],
     ['Pans / Grating cost', f(summary?.pansCost + summary?.gratingCost), '—', '—', f(summary?.pansCost + summary?.gratingCost)],
     ['Finish Cost', '—', '—', '—', f(summary?.finishCost)],
     ['POR ROK', '—', '—', '—', f(summary?.porRokCost)],
     ['Anchor Bolts', '—', '—', '—', f(summary?.anchorBoltsCost)],
     ['Shop Labor', '—', '—', '—', f(summary?.shopLaborCost)],
     ['Field Labor', '—', '—', '—', f(summary?.fieldLaborCost)],
     ['Module sub-total', f(summary?.stairTotal), f(summary?.railTotal), f(summary?.platTotal), f((summary?.stairTotal||0)+(summary?.railTotal||0)+(summary?.platTotal||0))],
     ['Sub-total w/o Tax', '—', '—', '—', f(summary?.subtotalWithoutTax)],
     ['Tax', '—', '—', '—', f(summary?.taxAmount)],
     ['GRAND TOTAL', '—', '—', '—', f(summary?.grandTotal)],
     ['Total Risers', summary?.totalRisers, '—', '—', summary?.totalRisers],
     ['Price / Riser', '—', '—', '—', f(summary?.pricePerRiser)]]
    .map((r, i) => i === 13
      ? `<tr class="grand">${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`
      : tableRow(r)
    ).join('')}
  </tbody></table>
</div>
${stairs?.length ? `<h2>4 — Stair Detail</h2>
<table><thead>${tableRow(['Stair','Type','Width','Risers','Connection','Stringer','Str.LF','Pan sqft','Steel lbs','Scrap lbs','Steel $','Pans $','Finish $','Scrap $','POR ROK','Anchor $','Shop Hrs','Field Hrs','Shop Labor $','Field Labor $','w/o Tax','Tax','Total','$/Riser'],true)}</thead><tbody>${stairRows}</tbody></table>` : ''}
${rails?.length ? `<h2>5 — Rail Detail</h2>
<table><thead>${tableRow(['#','Rail Type','Stair','Mounting','Length ft','Posts','Steel $','Scrap $','Finish $','POR ROK','Anchor $','Shop Hrs','Field Hrs','Shop Labor $','Field Labor $','w/o Tax','Tax','Total'],true)}</thead><tbody>${railRows}</tbody></table>` : ''}
${platforms?.length ? `<h2>6 — Platform Detail</h2>
<table><thead>${tableRow(['#','Type','Stair','Area sqft','Finish','Steel $','Finish $','Mounting $','Shop Hrs','Field Hrs','Shop Labor $','Field Labor $','w/o Tax','Tax','Total'],true)}</thead><tbody>${platRows}</tbody></table>` : ''}
</body></html>`;

    // Use Blob URL — opens as a real tab (never popup-blocked) and prints only its own content
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const tab  = window.open(url, '_blank');
    // Safety: if browser blocks even this, fall back to a data URI
    if (!tab) {
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      window.open(dataUrl, '_blank');
    }
    // Revoke after a delay so the tab has time to load it
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };



  const activePath = location.pathname;

  // Fetch projects for sidebar list (limit to 15 most recent)
  useEffect(() => {
    fetchEstimations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Project detection for Notes & Tools
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlId = queryParams.get('id');

    // 1. If we have an ID in URL, sync it
    if (urlId) {
      const urlIdNum = Number(urlId);
      if (Number(selectedEstimation?.id) !== urlIdNum) {
        fetchNotes(urlId);
        // We don't have the full object yet, so we just set the ID
        setSelectedEstimation(prev => (Number(prev?.id) === urlIdNum ? prev : { id: urlIdNum }));
      }
    }
    // 2. Fallback to localStorage if we are in estimation module
    else if (location.pathname.startsWith('/estimate')) {
      const savedInfo = localStorage.getItem('steelProjectInfo');
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          if (parsed.id) {
            if (Number(selectedEstimation?.id) !== Number(parsed.id)) {
              fetchNotes(parsed.id);
              setSelectedEstimation({ id: Number(parsed.id), ...parsed });
            }
            return; // Found context
          }
        } catch (e) { }
      }
    }
    // 3. NO PROJECT CONTEXT: Clear it (Dashboard, generic Reports, etc.)
    else if (selectedEstimation !== null) {
      setSelectedEstimation(null);
    }
  }, [location.pathname, location.search, selectedEstimation?.id, fetchNotes, setSelectedEstimation]);

  // Split estimations into structural segments avoiding archived ones safely
  const pinnedProjects = estimations.filter(p => p.isPinned && !p.isArchived);
  const recentProjects = estimations.filter(p => !p.isPinned && !p.isArchived).slice(0, 15);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const userName = user?.name || user?.email || 'User';

  // Breadcrumb derivation
  const crumbs = buildCrumbs(activePath);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

        {/* Top: brand + collapse toggle */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">M</div>
            <span className="sidebar-brand-name">MISC Pro</span>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="sidebar-quick-actions">
          <button
            className="sidebar-quick-btn"
            onClick={() => navigate('/project-info')}
          >
            <PenLine size={15} />
            New Estimation
          </button>
          <button
            className="sidebar-quick-btn"
            onClick={() => navigate('/estimations')}
          >
            <Search size={15} />
            Search Projects
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="sidebar-nav">

          {/* ── Main Nav ── */}
          <div className="sidebar-section-title">Navigation</div>

          {NAV_ITEMS.map(item => {
            if (item.children) {
              const isChildActive = item.children.some(c => activePath === c.path);
              return (
                <div key={item.id}>
                  <button
                    className={`sidebar-item ${isChildActive ? 'active' : ''}`}
                    onClick={() => {
                      setEstimateOpen(o => !o);
                      if (item.path) navigate(item.path);
                    }}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                    <ChevronRight
                      size={14}
                      className={`sidebar-item-chevron ${estimateOpen ? 'open' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {estimateOpen && (
                      <SubMenu
                        items={item.children.filter(c => !c.adminOnly || user?.role === 'admin')}
                        activePath={activePath}
                        onNavigate={navigate}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                className={`sidebar-item ${activePath === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </button>
            );
          })}

          {/* ── Pinned Projects ── */}
          <div className="sidebar-section-title" style={{ marginTop: 8 }}>Projects</div>

          {pinnedProjects.length === 0 ? (
            <div className="sidebar-recent-item" style={{ cursor: 'default', fontStyle: 'italic', opacity: 0.5 }}>
              No pinned projects
            </div>
          ) : (
            pinnedProjects.map(p => (
              <SidebarProjectRenderer
                key={p.id}
                p={p}
                navigate={navigate}
                isRecent={false}
                useEstimation={useEstimation}
              />
            ))
          )}

          {/* ── Recent Estimations ── */}
          <div className="sidebar-section-title" style={{ marginTop: 12 }}>Recent Estimations</div>

          {recentProjects.length === 0 ? (
            <div className="sidebar-recent-item" style={{ cursor: 'default', fontStyle: 'italic', opacity: 0.5 }}>
              No history yet
            </div>
          ) : (
            recentProjects.map(p => (
              <SidebarProjectRenderer
                key={`r-${p.id}`}
                p={p}
                navigate={navigate}
                isRecent={true}
                useEstimation={useEstimation}
              />
            ))
          )}

          {/* Nav End */}
        </nav>

        {/* Footer: user info & context menu */}
        <ProfileContextMenu user={user} handleLogout={handleLogout} />

      </aside>

      {/* ── Open button when sidebar is collapsed ──────────────────────────── */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            className="sidebar-open-btn"
            onClick={() => setCollapsed(false)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            title="Open sidebar"
          >
            <PanelLeftOpen size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="main-content">

        {/* Top header */}
        <header className="top-header" style={{ paddingLeft: collapsed ? 60 : 20 }}>
          <button className="header-title-btn">
            <span>MISC Pro</span>
            <ChevronDown size={14} />
          </button>

          <nav className="header-breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="header-breadcrumb-sep">›</span>}
                <span className={`header-breadcrumb-item ${i === crumbs.length - 1 ? 'current' : ''}`}>
                  {c}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="header-actions">
            <button className="header-btn header-btn-outline" title="Help">
              <HelpCircle size={15} /> Help
            </button>

            {/* ── Export Dropdown ───────────────────────────────────────────── */}
            <div style={{ position: 'relative' }}>
              <button
                className={`header-btn header-btn-outline ${!currentProjectId ? '' : ''}`}
                title={currentProjectId ? 'Export project' : 'Open a project to export'}
                onClick={() => setExportMenuOpen(o => !o)}
                id="header-export-btn"
              >
                <Share2 size={15} /> Export
                <ChevronDown size={11} style={{ marginLeft: 2, opacity: 0.6, transform: exportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              <AnimatePresence>
                {exportMenuOpen && (
                  <>
                    {/* click-away */}
                    <div style={{ position:'fixed',inset:0,zIndex:9998 }} onClick={() => setExportMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity:0, y:-6, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:-4, scale:0.97 }}
                      transition={{ duration:0.13 }}
                      style={{
                        position:'absolute', top:'calc(100% + 6px)', right:0,
                        background:'var(--gpt-surface)', border:'1px solid var(--gpt-border)',
                        borderRadius:10, boxShadow:'0 8px 30px rgba(0,0,0,0.16)',
                        minWidth:200, zIndex:9999, overflow:'hidden', padding:'4px 0'
                      }}
                    >
                      {!currentProjectId && (
                        <div style={{ padding:'10px 14px', fontSize:11, color:'var(--gpt-text-muted)', fontStyle:'italic' }}>
                          No project loaded
                        </div>
                      )}
                      <button
                        id="header-export-print"
                        disabled={!currentProjectId}
                        onClick={handlePrintPDF}
                        style={{
                          display:'flex', alignItems:'center', gap:9,
                          width:'100%', padding:'9px 14px', background:'transparent',
                          border:'none', cursor: currentProjectId ? 'pointer':'not-allowed',
                          fontSize:13, color: currentProjectId ? 'var(--gpt-text-primary)':'var(--gpt-text-muted)',
                          fontFamily:'inherit', transition:'background 0.12s'
                        }}
                        onMouseEnter={e => { if(currentProjectId) e.currentTarget.style.background='var(--gpt-body-bg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                      >
                        <Printer size={14} style={{ color:'#6366f1', flexShrink:0 }} />
                        Print PDF Report
                      </button>
                      <button
                        id="header-export-excel"
                        disabled={!currentProjectId || exporting}
                        onClick={handleExcelExport}
                        style={{
                          display:'flex', alignItems:'center', gap:9,
                          width:'100%', padding:'9px 14px', background:'transparent',
                          border:'none', cursor: currentProjectId ? 'pointer':'not-allowed',
                          fontSize:13, color: currentProjectId ? 'var(--gpt-text-primary)':'var(--gpt-text-muted)',
                          fontFamily:'inherit', transition:'background 0.12s'
                        }}
                        onMouseEnter={e => { if(currentProjectId) e.currentTarget.style.background='var(--gpt-body-bg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                      >
                        <FileSpreadsheet size={14} style={{ color:'#10a37f', flexShrink:0 }} />
                        {exporting ? 'Generating…' : 'BOM Excel (4 sheets)'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>



            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </header>

        {/* Page workspace */}
        <main className="workspace" style={{ position: 'relative' }}>
          {children}

          {/* Global Sticky Notes Overlay (Document Layer) */}
          {selectedEstimation?.id && (
            <div className="sc-notes-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1100, overflow: 'visible' }}>
              {notes.filter(note => {
                if (note.context_type === 'global' || !note.context_type) return true;
                if (note.context_type === activeContext.type && note.context_id === activeContext.id) return true;
                return false;
              }).map(note => (
                <StickyNote key={note.id} note={note} />
              ))}
            </div>
          )}
        </main>

        {/* Global Tools Dock (Fixed Right) */}
        {selectedEstimation?.id && <ToolsDock />}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCrumbs(path) {
  const map = {
    '/dashboard': ['Dashboard'],
    '/estimations': ['Projects'],
    '/project-info': ['Projects', 'Detail'],
    '/estimate/stair-railings': ['New Estimation', 'Stair & Railings'],
    '/estimate/railings': ['New Estimation', 'Railings'],
    '/estimate/ladders': ['New Estimation', 'Ladders'],
    '/estimate/bollards': ['New Estimation', 'Bollards & Gates'],
    '/estimate/gates': ['New Estimation', 'Gates'],
    '/settings/pricing': ['Settings', 'Pricing'],
    '/settings/customers': ['Settings', 'Customer Master'],
    '/settings/system': ['Settings', 'System Admin'],
    '/settings/personalization': ['Settings', 'Personalization'],
    '/reports': ['Reports'],

  };
  return map[path] || ['MISC Pro'];
}
