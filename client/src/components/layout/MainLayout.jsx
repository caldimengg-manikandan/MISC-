import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderOpen, ClipboardCheck, ArrowUpDown, BarChart3, Settings, 
  LogOut, ChevronRight, HelpCircle, Save, Share2, Menu, X,
  LayoutDashboard, Database, Box, DollarSign, Info, History, ClipboardList,
  Calculator, Construction, Spline, ArrowUpRight, Square, DoorOpen, Plus,
  Hash, Briefcase, ChevronDown, Ruler, Shield, Layers, Wrench, Weight, DollarSign as Dollar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../../contexts/ProjectContext';

// ── Nav Config ──────────────────────────────────────────────────────────────
const NAV = [
  {
    id: 'project-info',
    label: 'Project Info',
    icon: <ClipboardList size={18} />,
    path: '/project-info',
  },
  {
    id: 'project-history',
    label: 'Project History',
    icon: <History size={18} />,
    path: '/project-history',
  },
  {
    id: 'estimate',
    label: 'Estimate',
    icon: <Calculator size={18} />,
    path: null,
    children: [
      { id: 'stair-railings', label: 'Stair & Railings', icon: <Construction size={16} />, path: '/estimate/stair-railings' },
      { id: 'railings',       label: 'Railings',         icon: <Spline size={16} />,       path: '/estimate/railings' },
      { id: 'ladders',        label: 'Ladders',           icon: <ArrowUpRight size={16} />,  path: '/estimate/ladders' },
      { id: 'bollards',       label: 'Bollards',          icon: <Square size={16} />,        path: '/estimate/bollards' },
      { id: 'gates',          label: 'Gates',             icon: <DoorOpen size={16} />,      path: '/estimate/gates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={18} />,
    path: '/reports',
  },
];

const SubMenu = ({ items, activePath, onNavigate }) => (
  <motion.div 
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="sidebar-submenu"
    style={{ overflow: 'hidden' }}
  >
    {items.map(item => (
      <div
        key={item.path}
        className={`sidebar-item sidebar-sub-item ${activePath === item.path ? 'active' : ''}`}
        onClick={() => onNavigate(item.path)}
      >
        <span className="sidebar-item-icon">
          {item.icon}
        </span>
        {item.label}
      </div>
    ))}
  </motion.div>
);

// ── Main Layout ─────────────────────────────────────────────────────────────
export default function MainLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { projectInfo, stairs, estimationResult, requestAddStair, triggerSave, triggerCalc } = useProject();

  // ── Compute KPI Totals ──────────────────────────────
  const totalStairs = stairs.length;
  const totalGuardRails = stairs.reduce((sum, s) => sum + (s.rails?.filter(r => r.type === 'guardRail')?.length || 0), 0);
  const totalLandings = stairs.reduce((sum, s) => sum + (s.landings?.length || 0), 0);
  const totalRails = stairs.reduce((sum, s) => sum + (s.rails?.length || 0), 0);
  const estimatedSteelWeight = estimationResult?.totalSteel ?? stairs.reduce((sum, s) => sum + (s.estimatedSteelWeight || 0), 0);
  const estimatedCost = estimationResult?.totalEstimatedCost ?? stairs.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

  const [estimateOpen, setEstimateOpen] = useState(
    location.pathname.startsWith('/estimate')
  );

  const activePath = location.pathname;

  const isActive = (path) => activePath === path;
  const isEstimateActive = location.pathname.startsWith('/estimate');

  // Breadcrumb
  const crumbs = buildCrumbs(activePath);

  const handleLogout = () => {
    logout();
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">SteelSpec</span>
            <span className="sidebar-logo-sub">Engineering</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav"> 
          <div className="sidebar-section-label">Navigation</div>

          {NAV.map(item => {
            if (item.children) {
              const estimateIsActive = item.children.some(c => activePath === c.path);
              return (
                <div key={item.id}>
                  <div
                    className={`sidebar-item has-children ${estimateIsActive ? 'active' : ''}`}
                    onClick={() => setEstimateOpen(o => !o)}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                    <ChevronRight 
                      className={`sidebar-expand-icon ${estimateOpen ? 'open' : ''}`} 
                      size={14} 
                    />
                  </div>
                  <AnimatePresence>
                    {estimateOpen && (
                      <SubMenu
                        items={item.children}
                        activePath={activePath}
                        onNavigate={navigate}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <nav className="header-breadcrumb">
              <span 
                className="header-breadcrumb-item" 
                onClick={() => navigate('/estimate/stair-railings')}
                style={{ cursor: 'pointer' }}
              >
                SteelSpec
              </span>
              {crumbs.map((c, i) => {
                const itemPath = crumbsToPath(crumbs.slice(0, i + 1));
                const isLast = i === crumbs.length - 1;
                return (
                  <React.Fragment key={i}>
                    <span className="header-breadcrumb-sep">›</span>
                    <span 
                      className={`header-breadcrumb-item ${isLast ? 'current' : ''}`}
                      onClick={() => !isLast && itemPath && navigate(itemPath)}
                      style={{ cursor: !isLast && itemPath ? 'pointer' : 'default' }}
                    >
                      {c}
                    </span>
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Project Info in Header */}
            {(projectInfo.projectName || projectInfo.projectNumber) && (
              <div className="header-project-info">
                <div className="header-project-divider" />
                <div className="header-project-details">
                  <div className="header-project-item">
                    <span className="header-project-label">Project Name:</span>
                    <span className="header-project-value">{projectInfo.projectName || 'Unnamed Project'}</span>
                  </div>
                  {projectInfo.projectNumber && (
                    <div className="header-project-item">
                      <span className="header-project-label">Project No:</span>
                      <span className="header-project-value">{projectInfo.projectNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="header-actions">
            <button className="header-btn header-btn-outline" id="header-help">
              <HelpCircle size={16} /> Help
            </button>
            <div className="header-profile" id="user-profile">
              {userInitials}
              <div className="header-profile-tooltip">
                <span className="tooltip-name">{user?.name || 'User'}</span>
                <span className="tooltip-email">{user?.email || 'No email provided'}</span>
                <div className="tooltip-divider" />
                <button className="tooltip-logout" onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Sub-Header for Stair Navigation */}
        {location.pathname === '/estimate/stair-railings' && (
          <div className="sticky-sub-header">
            <div className="sub-header-content">
              <div className="stair-nav-group">
                <span className="stair-nav-label">Quick Nav:</span>
                <div className="stair-nav-chips">
                  {stairs.map(stair => (
                    <button
                      key={stair.id}
                      className="stair-nav-chip"
                      onClick={() => {
                        const el = document.getElementById(`stair-${stair.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {stair.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Compact KPIs */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { icon: <Ruler size={14}/>, label: 'Stairs', value: totalStairs },
                    { icon: <Shield size={14}/>, label: 'Guard Rails', value: totalGuardRails },
                    { icon: <Layers size={14}/>, label: 'Landings', value: totalLandings },
                    { icon: <Wrench size={14}/>, label: 'Rails', value: totalRails },
                    { icon: <Weight size={14}/>, label: 'Weight', value: estimatedSteelWeight > 0 ? `${estimatedSteelWeight.toFixed(0)} lb` : '—' },
                    { icon: <Dollar size={14}/>, label: 'Cost', value: estimatedCost > 0 ? `$${estimatedCost.toLocaleString()}` : '$0' },
                  ].map((s, idx) => (
                     <div key={idx} style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '8px',
                       paddingRight: idx !== 5 ? '16px' : '0',
                       borderRight: idx !== 5 ? '1px solid var(--border-color)' : 'none'
                     }}>
                       <span style={{ color: 'var(--text-muted)' }}>{s.icon}</span>
                       <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                         <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</span>
                         <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</span>
                       </div>
                     </div>
                  ))}
                </div>
              </div>

              <div className="sub-header-actions">
                <button 
                  className="header-btn header-btn-outline"
                  onClick={triggerCalc}
                >
                  <Calculator size={14} /> Calculate
                </button>
                <button 
                  className="header-btn header-btn-accent"
                  onClick={triggerSave}
                  style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                >
                  <Save size={14} /> Save
                </button>
                <div className="sub-header-sep" />
                <button 
                  className="add-stair-btn"
                  onClick={requestAddStair}
                >
                  <Plus size={16} /> Add Stair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Workspace */}
        <main className="workspace">
          {children}
        </main>

        {/* Fixed Footer */}
        <footer className="app-footer-fixed">
          Developed by Caldim
        </footer>
      </div>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
function buildCrumbs(path) {
  const map = {
    '/project-info':           ['Project Info'],
    '/project-history':        ['Project History'],
    '/estimate/stair-railings':['Estimate', 'Stair & Railings'],
    '/estimate/railings':      ['Estimate', 'Railings'],
    '/estimate/ladders':       ['Estimate', 'Ladders'],
    '/estimate/bollards':      ['Estimate', 'Bollards'],
    '/estimate/gates':         ['Estimate', 'Gates'],
    '/reports':                ['Reports'],
  };
  return map[path] || ['Dashboard'];
}

function crumbsToPath(partialCrumbs) {
  const s = partialCrumbs.join(' > ');
  if (s === 'Project Info') return '/project-info';
  if (s === 'Project History') return '/project-history';
  if (s === 'Estimate') return '/estimate/stair-railings'; // Default for Estimate parent
  if (s === 'Estimate > Stair & Railings') return '/estimate/stair-railings';
  if (s === 'Estimate > Railings') return '/estimate/railings';
  if (s === 'Estimate > Ladders') return '/estimate/ladders';
  if (s === 'Estimate > Bollards') return '/estimate/bollards';
  if (s === 'Estimate > Gates') return '/estimate/gates';
  if (s === 'Reports') return '/reports';
  return null;
}
