// client/src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEstimation } from '../contexts/EstimationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, ChevronRight, BarChart3,
  LogOut, PanelLeftOpen, PanelLeftClose, PenLine, Search,
  Box, Database, ArrowUpDown, ChevronDown, Settings,
  MoreHorizontal, HelpCircle, Share2, Save, Pin
} from 'lucide-react';
import ProjectContextMenu from '../components/ProjectContextMenu';
import ProfileContextMenu from '../components/ProfileContextMenu';
import toast from 'react-hot-toast';

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
    path: null,
    children: [
      { id: 'stair-railings', label: 'Stair & Railings', icon: <Box size={13} />,        path: '/estimate/stair-railings' },
      { id: 'railings',       label: 'Railings',         icon: <Database size={13} />,    path: '/estimate/railings' },
      { id: 'ladders',        label: 'Ladders',           icon: <ArrowUpDown size={13} />, path: '/estimate/ladders' },
      { id: 'bollards',       label: 'Bollards & Gates',  icon: <Box size={13} />,        path: '/estimate/bollards' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={16} />,
    path: '/reports',
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
    } catch(err) {
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
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useAuth();
  const { estimations, fetchEstimations } = useEstimation();

  const [collapsed,     setCollapsed]     = useState(false);
  const [estimateOpen,  setEstimateOpen]  = useState(
    location.pathname.startsWith('/estimate')
  );

  const activePath = location.pathname;

  // Fetch projects for sidebar list (limit to 5 most recent)
  useEffect(() => {
    fetchEstimations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onClick={() => navigate('/estimate/stair-railings')}
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
                    onClick={() => setEstimateOpen(o => !o)}
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
            <button className="header-btn header-btn-outline" title="Export">
              <Share2 size={15} /> Export
            </button>
            <button 
              className="header-btn header-btn-primary" 
              title="Save"
              onClick={() => window.dispatchEvent(new CustomEvent('app:save'))}
            >
              <Save size={15} /> Save
            </button>
          </div>
        </header>

        {/* Page workspace */}
        <main className="workspace">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCrumbs(path) {
  const map = {
    '/dashboard':               ['Dashboard'],
    '/estimations':             ['Projects'],
    '/project-info':            ['Projects', 'Detail'],
    '/estimate/stair-railings': ['New Estimation', 'Stair & Railings'],
    '/estimate/railings':       ['New Estimation', 'Railings'],
    '/estimate/ladders':        ['New Estimation', 'Ladders'],
    '/estimate/bollards':       ['New Estimation', 'Bollards & Gates'],
    '/estimate/gates':          ['New Estimation', 'Gates'],
    '/reports':                 ['Reports'],
  };
  return map[path] || ['MISC Pro'];
}
